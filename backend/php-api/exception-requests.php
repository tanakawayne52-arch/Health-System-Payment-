<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$body = getRequestBody();

if ($parts[0] !== 'exception-requests') {
    sendResponse(false, null, 'Route not found', 404);
}

$id = $parts[1] ?? null;

if ($method === 'GET' && !$id) {
    $params = $_GET;
    $query = 'SELECT * FROM exception_requests WHERE 1=1';
    $bindings = [];

    if (!empty($params['province'])) {
        $query .= ' AND province = ?';
        $bindings[] = $params['province'];
    }
    if (!empty($params['status'])) {
        $query .= ' AND status = ?';
        $bindings[] = $params['status'];
    }

    $stmt = $conn->prepare($query . ' ORDER BY created_at DESC');
    $stmt->execute($bindings);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(true, $results);
}

if ($method === 'POST' && !$id) {
    // Anyone can request an exception (usually provincial officers)
    $type = $body['type'] ?? null;
    $reason = $body['reason'] ?? null;
    $province = $body['province'] ?? $user['province'];

    if (!$type || !$reason || !$province) {
        sendResponse(false, null, 'type, reason, and province are required', 400);
    }

    $requestId = uniqid('req_');
    $stmt = $conn->prepare('INSERT INTO exception_requests (id, type, province, requested_by, requester_name, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    $stmt->execute([
        $requestId,
        $type,
        $province,
        $user['id'],
        $user['full_name'],
        $reason,
        'pending'
    ]);

    logAudit($conn, $user, 'CREATE_EXCEPTION_REQUEST', 'ExceptionRequest', $requestId, null, $body, 'Exception requested: ' . $type);
    sendResponse(true, ['id' => $requestId], 'Exception request submitted', 201);
}

if ($id && $method === 'POST' && ($parts[2] ?? '') === 'approve') {
    requireRole($user, ['national_admin']); // Only national admin can approve exceptions

    $stmt = $conn->prepare('SELECT * FROM exception_requests WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $exc = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$exc) sendResponse(false, null, 'Exception request not found', 404);

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare('UPDATE exception_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute(['approved', $user['id'], $id]);

        // If it's an unlock request, actually unlock the target entity
        if (($exc['type'] === 'unlock_certified' || $exc['type'] === 'unlock_record') && $exc['entity_type'] === 'PaymentList' && $exc['entity_id']) {
            $unlockStmt = $conn->prepare("UPDATE payment_lists SET status = 'draft', reviewed_by = NULL, reviewed_at = NULL WHERE id = ?");
            $unlockStmt->execute([$exc['entity_id']]);
            
            // Also clear certified status from beneficiary_payment_status for this list's beneficiaries
            $clearBps = $conn->prepare("
                DELETE FROM beneficiary_payment_status 
                WHERE cycle_id = (SELECT cycle_id FROM payment_lists WHERE id = ?) 
                AND beneficiary_id IN (SELECT beneficiary_id FROM payment_list_beneficiaries WHERE list_id = ?)
                AND payment_status = 'certified'
            ");
            $clearBps->execute([$exc['entity_id'], $exc['entity_id']]);
        }

        logAudit($conn, $user, 'APPROVE_EXCEPTION', 'ExceptionRequest', $id, ['status' => 'pending'], ['status' => 'approved'], 'Exception request approved and action applied');
        $conn->commit();
        sendResponse(true, null, 'Exception request approved and record unlocked');
    } catch (Throwable $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Approval failed: ' . $e->getMessage(), 500);
    }
}

if ($id && $method === 'POST' && ($parts[2] ?? '') === 'reject') {
    requireRole($user, ['national_admin']);

    $rejectionReason = $body['reason'] ?? 'No reason provided';
    $stmt = $conn->prepare('UPDATE exception_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ? WHERE id = ?');
    $stmt->execute(['rejected', $user['id'], $rejectionReason, $id]);

    logAudit($conn, $user, 'REJECT_EXCEPTION', 'ExceptionRequest', $id, ['status' => 'pending'], ['status' => 'rejected'], 'Exception request rejected: ' . $rejectionReason);
    sendResponse(true, null, 'Exception request rejected');
}

sendResponse(false, null, 'Method not allowed', 405);
