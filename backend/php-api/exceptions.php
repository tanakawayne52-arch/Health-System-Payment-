<?php
require_once __DIR__ . '/config.php';

$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$body = getRequestBody();

if (($parts[0] ?? '') !== 'exceptions') {
    sendResponse(false, null, 'Route not found', 404);
}

$id = $parts[1] ?? null;
$action = $parts[2] ?? null;

function mapException(array $row): array {
    return [
        'id' => $row['id'],
        'type' => $row['type'],
        'province' => $row['province'],
        'requestedBy' => $row['requested_by'],
        'requesterName' => $row['requester_name'],
        'reason' => $row['reason'],
        'entityType' => $row['entity_type'] ?? null,
        'entityId' => $row['entity_id'] ?? null,
        'status' => $row['status'],
        'reviewedBy' => $row['reviewed_by'],
        'reviewedAt' => $row['reviewed_at'],
        'rejectionReason' => $row['rejection_reason'],
        'createdAt' => $row['created_at'],
    ];
}

// GET /exceptions
if ($method === 'GET' && !$id) {
    requireRole($user, ['national_admin', 'finance_officer', 'provincial_officer']);

    $params = $_GET;
    $query = 'SELECT * FROM exception_requests WHERE 1=1';
    $bindings = [];

    if ($user['role'] === 'provincial_officer' && !empty($user['province'])) {
        $query .= ' AND province = ?';
        $bindings[] = $user['province'];
    } elseif (!empty($params['province'])) {
        $query .= ' AND province = ?';
        $bindings[] = $params['province'];
    }
    if (!empty($params['status'])) {
        $query .= ' AND status = ?';
        $bindings[] = $params['status'];
    }
    if (!empty($params['type'])) {
        $query .= ' AND type = ?';
        $bindings[] = $params['type'];
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

    sendResponse(true, array_map('mapException', $stmt->fetchAll(PDO::FETCH_ASSOC)), '', 200, [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'totalPages' => (int)ceil($total / max(1, $limit)),
    ]);
}

// POST /exceptions/:id/approve
if ($method === 'POST' && $id && $action === 'approve') {
    requireRole($user, ['national_admin']);

    $stmt = $conn->prepare('SELECT * FROM exception_requests WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $exc = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$exc) {
        sendResponse(false, null, 'Exception not found', 404);
    }
    if ($exc['status'] !== 'pending') {
        sendResponse(false, null, 'Exception already processed', 400);
    }

    $conn->beginTransaction();
    try {
        $conn->prepare(
            'UPDATE exception_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?'
        )->execute(['approved', $user['id'], $id]);

        if ($exc['type'] === 'unlock_certified' && $exc['entity_type'] === 'PaymentList' && !empty($exc['entity_id'])) {
            $conn->prepare("UPDATE payment_lists SET status = 'rejected', certification_notes = CONCAT(COALESCE(certification_notes,''), ' [Unlocked by admin: ', ?, ']') WHERE id = ?")
                ->execute([$exc['reason'], $exc['entity_id']]);
        }

        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Approval failed: ' . $e->getMessage(), 500);
    }

    logAudit($conn, $user, 'APPROVE_EXCEPTION', 'ExceptionRequest', $id, ['status' => 'pending'], ['status' => 'approved'], $exc['reason']);
    sendResponse(true, null, 'Exception approved');
}

// POST /exceptions/:id/reject
if ($method === 'POST' && $id && $action === 'reject') {
    requireRole($user, ['national_admin']);

    $reason = trim($body['reason'] ?? '');
    if ($reason === '') {
        sendResponse(false, null, 'Rejection reason is required', 400);
    }

    $stmt = $conn->prepare('SELECT * FROM exception_requests WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $exc = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$exc || $exc['status'] !== 'pending') {
        sendResponse(false, null, 'Exception not found or already processed', 404);
    }

    $conn->prepare(
        'UPDATE exception_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ? WHERE id = ?'
    )->execute(['rejected', $user['id'], $reason, $id]);

    logAudit($conn, $user, 'REJECT_EXCEPTION', 'ExceptionRequest', $id, ['status' => 'pending'], ['status' => 'rejected'], $reason);
    sendResponse(true, null, 'Exception rejected');
}

sendResponse(false, null, 'Route not found', 404);
