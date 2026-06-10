<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$body = getRequestBody();

if (($parts[0] ?? '') !== 'payment-lists') {
    sendResponse(false, null, 'Route not found', 404);
}

const LIST_CREATE_ROLES = ['provincial_officer'];
const LIST_CERTIFY_ROLES = ['finance_officer', 'national_admin'];
const LIST_READ_ROLES = ['provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin'];

$id = $parts[1] ?? null;
$action = $parts[2] ?? null;

function mapPaymentListRow(array $row): array {
    return [
        'id' => $row['id'],
        'cycleId' => $row['cycle_id'],
        'province' => $row['province'],
        'district' => $row['district'],
        'name' => $row['name'],
        'status' => $row['status'],
        'submittedBy' => $row['submitted_by'],
        'submittedAt' => $row['submitted_at'],
        'reviewedBy' => $row['reviewed_by'],
        'reviewedAt' => $row['reviewed_at'],
        'certificationNotes' => $row['certification_notes'],
        'evidenceNotes' => $row['evidence_notes'] ?? null,
        'beneficiaryCount' => (int)$row['beneficiary_count'],
        'totalAmount' => (float)$row['total_amount'],
        'createdAt' => $row['created_at'],
        'cycleName' => $row['cycle_name'] ?? null,
    ];
}

function isListEditable(string $status): bool {
    return in_array($status, ['draft', 'rejected'], true);
}

function isNationalUser(array $user): bool {
    return $user['role'] === 'national_admin' || ($user['role'] === 'finance_officer' && empty($user['province']));
}

/**
 * Validate beneficiaries for inclusion in a payment list.
 * Returns [validIds, flagged, errors].
 */
function validateListBeneficiaries(PDO $conn, string $cycleId, array $beneficiaryIds, ?string $excludeListId, string $province): array {
    $errors = [];
    $validIds = [];
    $flagged = [];

    if (empty($beneficiaryIds)) {
        return [[], [], ['At least one beneficiary is required']];
    }

    $placeholders = implode(',', array_fill(0, count($beneficiaryIds), '?'));
    $stmt = $conn->prepare("SELECT * FROM beneficiaries WHERE id IN ($placeholders)");
    $stmt->execute($beneficiaryIds);
    $beneficiaries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $foundIds = array_column($beneficiaries, 'id');

    foreach ($beneficiaryIds as $bid) {
        if (!in_array($bid, $foundIds, true)) {
            $errors[] = "Beneficiary $bid not found";
        }
    }

    foreach ($beneficiaries as $ben) {
        if ($ben['status'] !== 'active') {
            $errors[] = "{$ben['full_name']} is not active (status: {$ben['status']})";
            continue;
        }
        if ($ben['province'] !== $province) {
            $errors[] = "{$ben['full_name']} is outside province $province";
            continue;
        }

        // FR-07: once per cycle — already on a certified list or paid in cycle
        $paidStmt = $conn->prepare(
            'SELECT 1 FROM beneficiary_payment_status WHERE beneficiary_id = ? AND cycle_id = ? AND payment_status = ? LIMIT 1'
        );
        $paidStmt->execute([$ben['id'], $cycleId, 'paid']);
        if ($paidStmt->fetchColumn()) {
            $errors[] = "{$ben['full_name']} already paid in this cycle";
            continue;
        }

        // FR-08: cross-list duplicate in same cycle (exclude beneficiaries already present)
        // If beneficiary is already on another list for the same cycle, flag it.
        $dupQuery = 'SELECT pl.id, pl.name, pl.province FROM payment_list_beneficiaries plb
            JOIN payment_lists pl ON pl.id = plb.list_id
            WHERE plb.beneficiary_id = ? AND pl.cycle_id = ? AND pl.status IN (\'submitted\', \'under_review\', \'certified\')';
        $dupBindings = [$ben['id'], $cycleId];
        if ($excludeListId) {
            $dupQuery .= ' AND pl.id != ?';
            $dupBindings[] = $excludeListId;
        }
        $dupQuery .= ' LIMIT 1';
        $dupStmt = $conn->prepare($dupQuery);
        $dupStmt->execute($dupBindings);
        $dupRow = $dupStmt->fetch(PDO::FETCH_ASSOC);
        if ($dupRow) {
            $flagged[] = [
                'beneficiaryId' => $ben['id'],
                'name' => $ben['full_name'],
                'reason' => "Already on list {$dupRow['name']} ({$dupRow['province']})",
            ];
            continue;
        }

        $validIds[] = $ben['id'];
    }

    // Intra-list duplicate check on national_id / ecocash
    $seenIds = [];
    $seenEcocash = [];
    foreach ($beneficiaries as $ben) {
        if (!in_array($ben['id'], $validIds, true)) {
            continue;
        }
        if (isset($seenIds[$ben['national_id']]) || isset($seenEcocash[$ben['ecocash_number']])) {
            $flagged[] = [
                'beneficiaryId' => $ben['id'],
                'name' => $ben['full_name'],
                'reason' => 'Duplicate National ID or EcoCash number in this list',
            ];
            $validIds = array_values(array_filter($validIds, fn($v) => $v !== $ben['id']));
        } else {
            $seenIds[$ben['national_id']] = true;
            $seenEcocash[$ben['ecocash_number']] = true;
        }
    }

    return [$validIds, $flagged, $errors];
}

function recalcListTotals(PDO $conn, string $listId): void {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS total FROM payment_list_beneficiaries WHERE list_id = ? AND status = 'included'"
    );
    $stmt->execute([$listId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $update = $conn->prepare('UPDATE payment_lists SET beneficiary_count = ?, total_amount = ? WHERE id = ?');
    $update->execute([(int)$row['cnt'], (float)$row['total'], $listId]);
}

function getListOr404(PDO $conn, string $listId): array {
    $stmt = $conn->prepare(
        'SELECT pl.*, pc.name AS cycle_name FROM payment_lists pl
         LEFT JOIN payment_cycles pc ON pc.id = pl.cycle_id WHERE pl.id = ? LIMIT 1'
    );
    $stmt->execute([$listId]);
    $list = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$list) {
        sendResponse(false, null, 'Payment list not found', 404);
    }
    return $list;
}

function assertProvinceAccess(array $user, array $list): void {
    if ($user['role'] === 'provincial_officer' && !empty($user['province']) && $list['province'] !== $user['province']) {
        sendResponse(false, null, 'Forbidden: list is outside your province', 403);
    }
}

// GET /payment-lists — paginated list
if ($method === 'GET' && !$id) {
    requireRole($user, LIST_READ_ROLES);

    $params = $_GET;
    $query = 'SELECT pl.*, pc.name AS cycle_name FROM payment_lists pl
              LEFT JOIN payment_cycles pc ON pc.id = pl.cycle_id WHERE 1=1';
    $bindings = [];

    if ($user['role'] === 'provincial_officer' && !empty($user['province'])) {
        $query .= ' AND pl.province = ?';
        $bindings[] = $user['province'];
    } elseif (!empty($params['province'])) {
        $query .= ' AND pl.province = ?';
        $bindings[] = $params['province'];
    }
    if (!empty($params['district'])) {
        $query .= ' AND pl.district = ?';
        $bindings[] = $params['district'];
    }
    if (!empty($params['cycleId'])) {
        $query .= ' AND pl.cycle_id = ?';
        $bindings[] = $params['cycleId'];
    }
    if (!empty($params['status'])) {
        $query .= ' AND pl.status = ?';
        $bindings[] = $params['status'];
    }
    if (!empty($params['search'])) {
        $query .= ' AND pl.name LIKE ?';
        $bindings[] = '%' . $params['search'] . '%';
    }
    if (!empty($params['pendingCertification']) && $params['pendingCertification'] === 'true') {
        $query .= " AND pl.status IN ('submitted', 'under_review')";
    }

    $limit = isset($params['limit']) ? max(1, min(MAX_API_QUERY_LIMIT, (int)$params['limit'])) : 15;
    $page = isset($params['page']) ? max(1, (int)$params['page']) : 1;
    $offset = ($page - 1) * $limit;

    $countStmt = $conn->prepare(str_replace('SELECT pl.*, pc.name AS cycle_name', 'SELECT COUNT(*)', $query));
    $countStmt->execute($bindings);
    $total = (int)$countStmt->fetchColumn();

    $query .= ' ORDER BY pl.created_at DESC LIMIT ? OFFSET ?';
    $bindings[] = $limit;
    $bindings[] = $offset;

    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, array_map('mapPaymentListRow', $rows), '', 200, [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'totalPages' => (int)ceil($total / max(1, $limit)),
    ]);
}

// GET /payment-lists/:id
if ($method === 'GET' && $id && !$action) {
    requireRole($user, LIST_READ_ROLES);
    $list = getListOr404($conn, $id);
    assertProvinceAccess($user, $list);

    $benStmt = $conn->prepare(
        'SELECT plb.*, b.full_name, b.national_id, b.ecocash_number, b.district, b.village, b.status AS beneficiary_status
         FROM payment_list_beneficiaries plb
         JOIN beneficiaries b ON b.id = plb.beneficiary_id
         WHERE plb.list_id = ? ORDER BY b.full_name'
    );
    $benStmt->execute([$id]);
    $beneficiaries = $benStmt->fetchAll(PDO::FETCH_ASSOC);

    $mapped = mapPaymentListRow($list);
    $mapped['beneficiaries'] = array_map(function ($row) {
        return [
            'id' => $row['id'],
            'listId' => $row['list_id'],
            'beneficiaryId' => $row['beneficiary_id'],
            'fullName' => $row['full_name'],
            'nationalId' => $row['national_id'],
            'ecocashNumber' => $row['ecocash_number'],
            'district' => $row['district'],
            'village' => $row['village'],
            'beneficiaryStatus' => $row['beneficiary_status'],
            'amount' => (float)$row['amount'],
            'status' => $row['status'],
            'exclusionReason' => $row['exclusion_reason'],
        ];
    }, $beneficiaries);

    sendResponse(true, $mapped);
}

// POST /payment-lists — create draft
if ($method === 'POST' && !$id) {
    requireRole($user, LIST_CREATE_ROLES);

    $cycleId = $body['cycleId'] ?? null;
    $name = trim($body['name'] ?? '');
    $province = $body['province'] ?? $user['province'] ?? null;
    $district = $body['district'] ?? null;
    $beneficiaryIds = $body['beneficiaryIds'] ?? [];
    $amount = isset($body['amount']) ? (float)$body['amount'] : 100.0;
    $notes = $body['notes'] ?? null;
    $evidenceNotes = $body['evidenceNotes'] ?? null;

    if (!$cycleId || $name === '' || !$province) {
        sendResponse(false, null, 'cycleId, name, and province are required', 400);
    }
    if (!empty($user['province']) && $user['province'] !== $province) {
        sendResponse(false, null, 'Cannot create lists outside your province', 403);
    }

    $cycleStmt = $conn->prepare('SELECT status FROM payment_cycles WHERE id = ? LIMIT 1');
    $cycleStmt->execute([$cycleId]);
    $cycleStatus = $cycleStmt->fetchColumn();
    if (!$cycleStatus) {
        sendResponse(false, null, 'Payment cycle not found', 404);
    }
    if ($cycleStatus !== 'open') {
        sendResponse(false, null, 'Payment cycle is not open for new lists', 400);
    }

    [$validIds, $flagged, $errors] = validateListBeneficiaries($conn, $cycleId, $beneficiaryIds, null, $province);
    if (!empty($errors)) {
        sendResponse(false, ['errors' => $errors, 'flagged' => $flagged], implode('; ', $errors), 400);
    }
    if (empty($validIds)) {
        sendResponse(false, ['flagged' => $flagged], 'No valid beneficiaries to include', 400);
    }

    $listId = $body['id'] ?? ('list_' . bin2hex(random_bytes(6)));
    $totalAmount = count($validIds) * $amount;

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare(
            'INSERT INTO payment_lists (id, cycle_id, province, district, name, status, submitted_by, beneficiary_count, total_amount, certification_notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        );
        $stmt->execute([$listId, $cycleId, $province, $district, $name, 'draft', $user['id'], count($validIds), $totalAmount, $notes]);

        $insertBen = $conn->prepare(
            'INSERT INTO payment_list_beneficiaries (id, list_id, beneficiary_id, amount, status, exclusion_reason) VALUES (?, ?, ?, ?, ?, ?)'
        );
        foreach ($validIds as $benId) {
            $isFlagged = false;
            foreach ($flagged as $f) {
                if ($f['beneficiaryId'] === $benId) {
                    $isFlagged = true;
                    break;
                }
            }
            $lbId = 'lb_' . bin2hex(random_bytes(6));
            $status = $isFlagged ? 'duplicate_flagged' : 'included';
            $reason = $isFlagged ? ($flagged[0]['reason'] ?? 'Duplicate flagged') : null;
            $insertBen->execute([$lbId, $listId, $benId, $amount, $status, $reason]);
        }

        recalcListTotals($conn, $listId);
        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Failed to create payment list: ' . $e->getMessage(), 500);
    }

    logAudit($conn, $user, 'CREATE', 'PaymentList', $listId, null, [
        'name' => $name, 'province' => $province, 'beneficiaryCount' => count($validIds),
    ], $evidenceNotes);

    sendResponse(true, ['id' => $listId, 'flagged' => $flagged], 'Payment list created', 201);
}

// PATCH /payment-lists/:id — update draft/rejected only
if ($method === 'PATCH' && $id && !$action) {
    requireRole($user, LIST_CREATE_ROLES);
    $list = getListOr404($conn, $id);
    assertProvinceAccess($user, $list);

    if (!isListEditable($list['status'])) {
        sendResponse(false, null, 'Certified or submitted lists cannot be edited. Request an unlock exception.', 403);
    }

    $beneficiaryIds = $body['beneficiaryIds'] ?? null;
    $amount = isset($body['amount']) ? (float)$body['amount'] : null;

    $conn->beginTransaction();
    try {
        if ($beneficiaryIds !== null) {
            [$validIds, $flagged, $errors] = validateListBeneficiaries($conn, $list['cycle_id'], $beneficiaryIds, $id, $list['province']);
            if (!empty($errors)) {
                $conn->rollBack();
                sendResponse(false, ['errors' => $errors], implode('; ', $errors), 400);
            }

            $conn->prepare('DELETE FROM payment_list_beneficiaries WHERE list_id = ?')->execute([$id]);
            $insertBen = $conn->prepare(
                'INSERT INTO payment_list_beneficiaries (id, list_id, beneficiary_id, amount, status, exclusion_reason) VALUES (?, ?, ?, ?, ?, ?)'
            );
            $lineAmount = $amount ?? 100.0;
            foreach ($validIds as $benId) {
                $lbId = 'lb_' . bin2hex(random_bytes(6));
                $insertBen->execute([$lbId, $id, $benId, $lineAmount, 'included', null]);
            }
            recalcListTotals($conn, $id);
        }

        $updates = [];
        $bindings = [];
        if (isset($body['name'])) {
            $updates[] = 'name = ?';
            $bindings[] = trim($body['name']);
        }
        if (array_key_exists('notes', $body)) {
            $updates[] = 'certification_notes = ?';
            $bindings[] = $body['notes'];
        }
        if (!empty($updates)) {
            $bindings[] = $id;
            $conn->prepare('UPDATE payment_lists SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($bindings);
        }

        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Update failed: ' . $e->getMessage(), 500);
    }

    logAudit($conn, $user, 'UPDATE', 'PaymentList', $id, ['status' => $list['status']], $body, 'Payment list updated');
    sendResponse(true, null, 'Payment list updated');
}

// DELETE /payment-lists/:id — draft only
if ($method === 'DELETE' && $id && !$action) {
    requireRole($user, LIST_CREATE_ROLES);
    $list = getListOr404($conn, $id);
    assertProvinceAccess($user, $list);
    if ($list['status'] !== 'draft') {
        sendResponse(false, null, 'Only draft lists can be deleted', 400);
    }
    $conn->prepare('DELETE FROM payment_lists WHERE id = ?')->execute([$id]);
    logAudit($conn, $user, 'DELETE', 'PaymentList', $id, $list, null, 'Draft list deleted');
    sendResponse(true, null, 'Payment list deleted');
}

// POST /payment-lists/:id/submit
if ($method === 'POST' && $id && $action === 'submit') {
    requireRole($user, LIST_CREATE_ROLES);
    $list = getListOr404($conn, $id);
    assertProvinceAccess($user, $list);

    if (!isListEditable($list['status'])) {
        sendResponse(false, null, 'List cannot be submitted in its current status', 400);
    }
    if ((int)$list['beneficiary_count'] < 1) {
        sendResponse(false, null, 'List must include at least one beneficiary', 400);
    }

    $evidenceNotesText = $_POST['evidenceNotes'] ?? $_POST['notes'] ?? $body['evidenceNotes'] ?? $body['notes'] ?? null;
    $evidenceNotes = $evidenceNotesText;

    $hasFileUpload = !empty($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK;
    $hasEvidenceNotes = is_string($evidenceNotesText) ? trim($evidenceNotesText) !== '' : !empty($evidenceNotesText);

    // FR-09: Provincial submit verified lists with evidence (file and/or notes)
    if ($user['role'] === 'provincial_officer') {
        if (!$hasFileUpload && !$hasEvidenceNotes) {
            sendResponse(false, null, 'Evidence is required to submit payment lists (upload a file and/or provide evidence notes)', 400);
        }
    }

    if ($hasFileUpload) {
        $uploadDir = __DIR__ . '/uploads/evidence/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $filename = uniqid('ev_') . '_' . basename($_FILES['file']['name']);
        $dest = $uploadDir . $filename;
        if (move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
            $evidenceNotes = $evidenceNotesText ? $evidenceNotesText . "\n[Attached file: " . $filename . "]" : "[Attached file: " . $filename . "]";
        }
    }

    $stmt = $conn->prepare(
        "UPDATE payment_lists SET status = 'submitted', submitted_by = ?, submitted_at = CURRENT_TIMESTAMP,
         certification_notes = COALESCE(?, certification_notes), evidence_notes = COALESCE(?, evidence_notes) WHERE id = ?"
    );
    $stmt->execute([$user['id'], $evidenceNotes, $evidenceNotes, $id]);

    logAudit($conn, $user, 'SUBMIT', 'PaymentList', $id, ['status' => $list['status']], ['status' => 'submitted'], $evidenceNotes);
    sendResponse(true, null, 'Payment list submitted for certification');
}

// POST /payment-lists/:id/review — move to under_review
if ($method === 'POST' && $id && $action === 'review') {
    requireRole($user, LIST_CERTIFY_ROLES);
    if (!isNationalUser($user) && $user['role'] !== 'finance_officer') {
        sendResponse(false, null, 'Only Head Office roles can review lists', 403);
    }
    $list = getListOr404($conn, $id);
    if ($list['status'] !== 'submitted') {
        sendResponse(false, null, 'Only submitted lists can be moved to review', 400);
    }

    $conn->prepare("UPDATE payment_lists SET status = 'under_review', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?")
        ->execute([$user['id'], $id]);

    logAudit($conn, $user, 'REVIEW', 'PaymentList', $id, ['status' => 'submitted'], ['status' => 'under_review'], $body['notes'] ?? null);
    sendResponse(true, null, 'Payment list marked under review');
}

if ($id && $method === 'POST' && ($parts[2] ?? '') === 'certify') {
    requireRole($user, LIST_CERTIFY_ROLES);

    $stmt = $conn->prepare('SELECT * FROM payment_lists WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $list = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$list) sendResponse(false, null, 'Payment list not found', 404);
    if ($list['status'] !== 'submitted' && $list['status'] !== 'under_review') {
        sendResponse(false, null, 'Only submitted or under_review lists can be certified', 400);
    }

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare('UPDATE payment_lists SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, certification_notes = ? WHERE id = ?');
        $stmt->execute(['certified', $user['id'], $body['notes'] ?? null, $id]);

        // Mark these beneficiaries as "certified" for this cycle in a global tracking table if it exists,
        // or just rely on the list status. For strict enforcement, we'll use the list status in batch validation.
        
        logAudit($conn, $user, 'CERTIFY', 'PaymentList', $id, ['status' => $list['status']], ['status' => 'certified'], 'Payment list certified');
        $conn->commit();
        sendResponse(true, null, 'Payment list certified');
    } catch (Throwable $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Certification failed: ' . $e.getMessage(), 500);
    }
}

// POST /payment-lists/:id/reject
if ($method === 'POST' && $id && $action === 'reject') {
    requireRole($user, LIST_CERTIFY_ROLES);
    $list = getListOr404($conn, $id);

    if (!in_array($list['status'], ['submitted', 'under_review'], true)) {
        sendResponse(false, null, 'Only submitted or under-review lists can be rejected', 400);
    }

    $reason = trim($body['reason'] ?? '');
    if ($reason === '') {
        sendResponse(false, null, 'Rejection reason is required', 400);
    }

    $conn->prepare(
        "UPDATE payment_lists SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, certification_notes = ? WHERE id = ?"
    )->execute([$user['id'], $reason, $id]);

    logAudit($conn, $user, 'REJECT', 'PaymentList', $id, ['status' => $list['status']], ['status' => 'rejected'], $reason);
    sendResponse(true, null, 'Payment list rejected');
}

// POST /payment-lists/:id/request-unlock — FR-12
if ($method === 'POST' && $id && $action === 'request-unlock') {
    requireRole($user, ['national_admin', 'provincial_officer']);
    $list = getListOr404($conn, $id);
    assertProvinceAccess($user, $list);

    if ($list['status'] !== 'certified') {
        sendResponse(false, null, 'Only certified lists require unlock requests', 400);
    }

    $reason = trim($body['reason'] ?? '');
    if ($reason === '') {
        sendResponse(false, null, 'Justification is required for unlock requests', 400);
    }

    $excId = 'exc_' . bin2hex(random_bytes(6));
    $stmt = $conn->prepare(
        'INSERT INTO exception_requests (id, type, province, requested_by, requester_name, reason, status, entity_type, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    $stmt->execute([
        $excId, 'unlock_certified', $list['province'], $user['id'], $user['full_name'], $reason, 'pending', 'PaymentList', $id,
    ]);

    logAudit($conn, $user, 'REQUEST_UNLOCK', 'PaymentList', $id, ['status' => 'certified'], null, $reason);
    sendResponse(true, ['exceptionId' => $excId], 'Unlock request submitted for admin approval', 201);
}

sendResponse(false, null, 'Route not found', 404);
