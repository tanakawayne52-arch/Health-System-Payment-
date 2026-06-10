<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];

// Only national admin and finance officers can view audit logs
requireRole($user, ['national_admin', 'finance_officer']);

if ($method === 'GET') {
    $params = $_GET;
    $query = 'SELECT * FROM audit_logs WHERE 1=1';
    $bindings = [];

    if (!empty($params['action'])) {
        $query .= ' AND action = ?';
        $bindings[] = $params['action'];
    }
    if (!empty($params['entityType'])) {
        $query .= ' AND entity_type = ?';
        $bindings[] = $params['entityType'];
    }
    if (!empty($params['search'])) {
        $query .= ' AND (user_name LIKE ? OR entity_id LIKE ? OR reason LIKE ?)';
        $search = '%' . $params['search'] . '%';
        $bindings[] = $search;
        $bindings[] = $search;
        $bindings[] = $search;
    }

    $limit = isset($params['limit']) ? max(1, min(MAX_API_QUERY_LIMIT, (int)$params['limit'])) : 15;
    $page = isset($params['page']) ? max(1, (int)$params['page']) : 1;
    $offset = ($page - 1) * $limit;

    $countStmt = $conn->prepare(str_replace('SELECT *', 'SELECT COUNT(*)', $query));
    $countStmt->execute($bindings);
    $total = (int)$countStmt->fetchColumn();

    $query .= ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    $bindings[] = $limit;
    $bindings[] = $offset;

    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, $results, "", 200, [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'totalPages' => (int)ceil($total / $limit),
    ]);
}

sendResponse(false, null, 'Method not allowed', 405);
