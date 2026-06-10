<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$body = getRequestBody();

// Define roles for batch operations
const BATCH_CREATE_ROLES = ['finance_officer', 'national_admin'];
const BATCH_VALIDATE_ROLES = ['finance_officer', 'national_admin'];
const BATCH_EXECUTE_ROLES = ['finance_officer', 'national_admin'];

if ($parts[0] !== 'batches') {
    sendResponse(false, null, 'Route not found', 404);
}

$id = $parts[1] ?? null;
action:
if ($method === 'GET' && !$id) {
    $params = $_GET;
    $query = 'SELECT * FROM payment_batches WHERE 1=1';
    $bindings = [];
    if (!empty($params['province'])) {
        $query .= ' AND province = ?';
        $bindings[] = $params['province'];
    }
    if (!empty($params['status'])) {
        $query .= ' AND status = ?';
        $bindings[] = $params['status'];
    }
    if (!empty($params['cycleId'])) {
        $query .= ' AND cycle_id = ?';
        $bindings[] = $params['cycleId'];
    }

    $limit = isset($params['limit']) ? max(1, min(MAX_API_QUERY_LIMIT, (int)$params['limit'])) : 15;
    $page = isset($params['page']) ? max(1, (int)$params['page']) : 1;
    $offset = ($page - 1) * $limit;

    $countStmt = $conn->prepare(str_replace('SELECT *', 'SELECT COUNT(*)', $query));
    $countStmt->execute($bindings);
    $total = (int)$countStmt->fetchColumn();

    $query .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    $bindings[] = $limit;
    $bindings[] = $offset;

    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pagination = [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'totalPages' => ceil($total / $limit),
    ];
    sendResponse(true, $results, "", 200, $pagination);
}

if ($method === 'POST' && !$id) {
    requireRole($user, BATCH_CREATE_ROLES);

    $required = ['cycleId', 'name', 'province'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            sendResponse(false, null, "$field is required", 400);
        }
    }

    // Provincial officers can only create batches for their own province.
    if ($user['role'] === 'provincial_officer' && $body['province'] !== $user['province']) {
        sendResponse(false, null, 'Forbidden: you can only create batches for your own province', 403);
    }

    $batchId = $body['id'] ?? ('batch_' . bin2hex(random_bytes(6)));
    $listIds = $body['listIds'] ?? [];
    $totalAmount = isset($body['totalAmount']) ? (float)$body['totalAmount'] : 0.0;
    $status = $body['status'] ?? 'pending';

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare('INSERT INTO payment_batches (id, cycle_id, name, province, district, status, total_beneficiaries, total_amount, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $stmt->execute([
            $batchId,
            $body['cycleId'],
            $body['name'],
            $body['province'],
            $body['district'] ?? null,
            $status,
            0, // Updated later
            $totalAmount,
            $user['id'],
        ]);

        if (!empty($listIds)) {
            $linkStmt = $conn->prepare('INSERT INTO payment_batch_lists (batch_id, list_id) VALUES (?, ?)');
            foreach ($listIds as $lid) {
                $linkStmt->execute([$batchId, $lid]);
            }

            // Sync beneficiaries from lists into transactions
            $syncStmt = $conn->prepare('
                INSERT INTO payment_transactions (id, batch_id, beneficiary_id, amount, status, created_at)
                SELECT ?, ?, beneficiary_id, amount, "pending", CURRENT_TIMESTAMP
                FROM payment_list_beneficiaries 
                WHERE list_id IN (' . implode(',', array_fill(0, count($listIds), '?')) . ')
                AND status = "included"
            ');
            
            $bindings = [];
            // Generate unique IDs for each transaction would be better but for bulk insert we might need a loop
            // For now, let's just count and update the batch totals
            $totalBen = 0;
            $totalAmt = 0;
            $getBens = $conn->prepare('SELECT beneficiary_id, amount FROM payment_list_beneficiaries WHERE list_id = ? AND status = "included"');
            $insTxn = $conn->prepare('INSERT INTO payment_transactions (id, batch_id, beneficiary_id, amount, status, created_at) VALUES (?, ?, ?, ?, "pending", CURRENT_TIMESTAMP)');
            
            foreach ($listIds as $lid) {
                $getBens->execute([$lid]);
                while ($ben = $getBens->fetch(PDO::FETCH_ASSOC)) {
                    $totalBen++;
                    $totalAmt += $ben['amount'];
                    $insTxn->execute(['txn_' . bin2hex(random_bytes(6)), $batchId, $ben['beneficiary_id'], $ben['amount']]);
                }
            }

            $updateBatch = $conn->prepare('UPDATE payment_batches SET total_beneficiaries = ?, total_amount = ? WHERE id = ?');
            $updateBatch->execute([$totalBen, $totalAmt, $batchId]);
        }

        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Failed to create batch: ' . $e->getMessage(), 500);
    }

    logAudit($conn, $user, 'CREATE', 'Batch', $batchId, null, $body, 'Batch created from lists');
    sendResponse(true, ['id' => $batchId], 'Batch created', 201);
}

if ($id && $method === 'GET' && !isset($parts[2])) {
    $stmt = $conn->prepare('SELECT * FROM payment_batches WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $batch = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$batch) {
        sendResponse(false, null, 'Batch not found', 404);
    }

    // Scope check for provincial officers
    if ($user['role'] === 'provincial_officer' && $batch['province'] !== $user['province']) {
        sendResponse(false, null, 'Forbidden: batch is outside your province', 403);
    }

    $txnStmt = $conn->prepare('SELECT * FROM payment_transactions WHERE batch_id = ? ORDER BY created_at DESC');
    $txnStmt->execute([$id]);
    $transactions = $txnStmt->fetchAll(PDO::FETCH_ASSOC);
    $batch['transactions'] = $transactions;
    sendResponse(true, $batch);
}

if ($id && $method === 'POST' && ($parts[2] ?? '') === 'validate') {
    requireRole($user, BATCH_VALIDATE_ROLES);

    // Fetch batch details
    $stmt = $conn->prepare('SELECT * FROM payment_batches WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $batch = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$batch) {
        sendResponse(false, null, 'Batch not found', 404);
    }

    // Perform real validation
    $errors = [];

    // 0. Ensure all included payment lists are certified
    $listStmt = $conn->prepare('
        SELECT pl.id, pl.name, pl.status FROM payment_lists pl
        JOIN payment_batch_lists pbl ON pbl.list_id = pl.id
        WHERE pbl.batch_id = ? AND pl.status != "certified"
    ');
    $listStmt->execute([$id]);
    $uncertified = $listStmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($uncertified)) {
        foreach ($uncertified as $l) {
            $errors[] = "Payment list '{$l['name']}' ({$l['id']}) is {$l['status']}, not certified.";
        }
    }

    // 1. Check for inactive beneficiaries
    $stmt = $conn->prepare('
        SELECT b.id, b.full_name, b.status 
        FROM payment_transactions pt
        JOIN beneficiaries b ON pt.beneficiary_id = b.id
        WHERE pt.batch_id = ? AND b.status != "active"
    ');
    $stmt->execute([$id]);
    $inactive = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($inactive)) {
        foreach ($inactive as $b) {
            $errors[] = "Beneficiary {$b['full_name']} ({$b['id']}) is {$b['status']}, not active.";
        }
    }

    // 2. Check for duplicate payments in the SAME cycle (FR-07, FR-08)
    $stmt = $conn->prepare('
        SELECT b.full_name, pt.beneficiary_id, pb.name as other_batch_name
        FROM payment_transactions pt
        JOIN payment_batches pb ON pt.batch_id = pb.id
        JOIN beneficiaries b ON pt.beneficiary_id = b.id
        WHERE pb.cycle_id = ? 
          AND pt.batch_id != ? 
          AND pt.beneficiary_id IN (SELECT beneficiary_id FROM payment_transactions WHERE batch_id = ?)
          AND pb.status IN ("validated", "processing", "completed")
    ');
    $stmt->execute([$batch['cycle_id'], $id, $id]);
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($duplicates)) {
        foreach ($duplicates as $d) {
            $errors[] = "Beneficiary {$d['full_name']} ({$d['beneficiary_id']}) is already included in batch '{$d['other_batch_name']}' for this cycle.";
        }
    }

    if (!empty($errors)) {
        $stmt = $conn->prepare('UPDATE payment_batches SET status = ?, failure_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute(['failed', implode("\n", $errors), $id]);
        
        logAudit($conn, $user, 'VALIDATE_FAILED', 'Batch', $id, null, ['errors' => $errors], 'Batch validation failed');
        sendResponse(false, ['errors' => $errors], 'Batch validation failed', 422);
    }

    $stmt = $conn->prepare('UPDATE payment_batches SET status = ?, validated_by = ?, validated_at = CURRENT_TIMESTAMP, failure_reason = NULL WHERE id = ?');
    $stmt->execute(['validated', $user['id'], $id]);

    logAudit($conn, $user, 'VALIDATE', 'Batch', $id, ['status' => 'pending'], ['status' => 'validated'], 'Batch validated successfully');
    sendResponse(true, null, 'Batch validated successfully');
}

if ($id && $method === 'POST' && ($parts[2] ?? '') === 'execute') {
    requireRole($user, BATCH_EXECUTE_ROLES);

    // Fetch batch
    $stmt = $conn->prepare('SELECT status FROM payment_batches WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $status = $stmt->fetchColumn();
    
    if (!$status) sendResponse(false, null, 'Batch not found', 404);
    if ($status !== 'validated') {
        sendResponse(false, null, 'Only validated batches can be executed', 400);
    }

    $conn->beginTransaction();
    try {
        // Update batch status
        $stmt = $conn->prepare('UPDATE payment_batches SET status = ?, executed_by = ?, executed_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute(['completed', $user['id'], $id]);

        // Simulate EcoCash instruction generation and transaction success
        // In a real system, this would call an external API or generate a CSV/ISO8583 message.
        $stmt = $conn->prepare('
            UPDATE payment_transactions 
            SET status = "success", 
                reference_code = ?, 
                processed_at = CURRENT_TIMESTAMP 
            WHERE batch_id = ? AND status = "pending"
        ');
        $stmt->execute(['REF' . strtoupper(bin2hex(random_bytes(4))), $id]);

        logAudit($conn, $user, 'EXECUTE', 'Batch', $id, ['status' => 'validated'], ['status' => 'completed'], 'Batch executed and transactions processed');
        
        $conn->commit();
        sendResponse(true, null, 'Batch executed and transactions processed');
    } catch (Exception $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Execution failed: ' . $e->getMessage(), 500);
    }
}

if ($id && $method === 'GET' && ($parts[2] ?? '') === 'status') {
    $stmt = $conn->prepare('SELECT status FROM payment_batches WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $status = $stmt->fetchColumn();
    if ($status === false) {
        sendResponse(false, null, 'Batch not found', 404);
    }
    sendResponse(true, ['status' => $status]);
}

if ($id && $method === 'POST' && ($parts[2] ?? '') === 'retry') {
    $stmt = $conn->prepare('UPDATE payment_batches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute(['processing', $id]);
    sendResponse(true, null, 'Batch retry started');
}

if ($id && $method === 'GET' && ($parts[2] ?? '') === 'transactions') {
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 15;
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $offset = ($page - 1) * $limit;
    $query = 'SELECT * FROM payment_transactions WHERE batch_id = ?';
    $bindings = [$id];
    if (!empty($_GET['status'])) {
        $query .= ' AND status = ?';
        $bindings[] = $_GET['status'];
    }

    $countQuery = 'SELECT COUNT(*) FROM payment_transactions WHERE batch_id = ?';
    if (!empty($_GET['status'])) {
        $countQuery .= ' AND status = ?';
    }
    $countStmt = $conn->prepare($countQuery);
    $countStmt->execute($bindings);
    $total = (int)$countStmt->fetchColumn();

    $query .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    $bindings[] = $limit;
    $bindings[] = $offset;
    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pagination = [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'totalPages' => ceil($total / $limit),
    ];
    sendResponse(true, $transactions, "", 200, $pagination);
}

sendResponse(false, null, 'Route not found', 404);

