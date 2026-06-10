<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$body = getRequestBody();

// HR custodians own master/cycle data; national admins may also manage cycles.
const CYCLE_WRITE_ROLES = ['hr_custodian', 'national_admin'];

$id = $parts[1] ?? null;

if ($method === 'GET') {
    $query = 'SELECT id, name, period_start, period_end, status, created_at FROM payment_cycles ORDER BY period_start DESC';
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = array_map(function ($c) {
        return [
            'id' => $c['id'],
            'name' => $c['name'],
            'periodStart' => $c['period_start'],
            'periodEnd' => $c['period_end'],
            'status' => $c['status'],
            'createdAt' => $c['created_at'],
        ];
    }, $results);

    sendResponse(true, $data);
}

if ($method === 'POST' && !$id) {
    requireRole($user, CYCLE_WRITE_ROLES);

    $name = trim($body['name'] ?? '');
    $periodStart = $body['periodStart'] ?? null;
    $periodEnd = $body['periodEnd'] ?? null;
    $status = $body['status'] ?? 'open';

    if ($name === '' || !$periodStart || !$periodEnd) {
        sendResponse(false, null, 'Cycle name, period start and period end are required', 400);
    }
    if (!in_array($status, ['open', 'locked', 'closed'], true)) {
        sendResponse(false, null, 'Invalid cycle status', 400);
    }

    // FR-06: cycle identifiers must be unique per quarter/period.
    $dupStmt = $conn->prepare('SELECT id FROM payment_cycles WHERE name = ? LIMIT 1');
    $dupStmt->execute([$name]);
    if ($dupStmt->fetchColumn()) {
        sendResponse(false, null, 'A payment cycle with this name already exists', 409);
    }

    $cycleId = $body['id'] ?? ('cycle_' . bin2hex(random_bytes(6)));
    $stmt = $conn->prepare('INSERT INTO payment_cycles (id, name, period_start, period_end, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    $stmt->execute([$cycleId, $name, $periodStart, $periodEnd, $status, $user['id']]);

    logAudit($conn, $user, 'CREATE', 'PaymentCycle', $cycleId, null, [
        'name' => $name,
        'period_start' => $periodStart,
        'period_end' => $periodEnd,
        'status' => $status,
    ], 'Payment cycle created');

    sendResponse(true, ['id' => $cycleId], 'Payment cycle created', 201);
}

if ($method === 'PATCH' && $id) {
    requireRole($user, CYCLE_WRITE_ROLES);

    $existingStmt = $conn->prepare('SELECT * FROM payment_cycles WHERE id = ? LIMIT 1');
    $existingStmt->execute([$id]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        sendResponse(false, null, 'Cycle not found', 404);
    }

    $status = $body['status'] ?? null;
    if (!$status || !in_array($status, ['open', 'locked', 'closed'], true)) {
        sendResponse(false, null, 'A valid status is required', 400);
    }

    $stmt = $conn->prepare('UPDATE payment_cycles SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);

    logAudit($conn, $user, 'UPDATE', 'PaymentCycle', $id, ['status' => $existing['status']], ['status' => $status], 'Cycle status updated');
    sendResponse(true, null, 'Cycle updated');
}

sendResponse(false, null, 'Method not allowed', 405);
