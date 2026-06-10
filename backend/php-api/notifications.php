<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$method = $_SERVER['REQUEST_METHOD'];

if ($parts[0] !== 'notifications') {
    sendResponse(false, null, 'Route not found', 404);
}

if ($method === 'GET' && count($parts) === 1) {
    $query = 'SELECT * FROM notifications WHERE user_id = ?';
    $params = [$user['id']];
    if (!empty($_GET['unreadOnly']) && $_GET['unreadOnly'] === 'true') {
        $query .= ' AND is_read = 0';
    }
    $query .= ' ORDER BY created_at DESC';
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
    $query .= ' LIMIT ? OFFSET ?';
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countStmt = $conn->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
    $countStmt->execute([$user['id']]);
    $unreadCount = (int)$countStmt->fetchColumn();

    sendResponse(true, [
        'notifications' => $notifications,
        'unreadCount' => $unreadCount,
    ]);
}

$id = $parts[1] ?? null;

if ($method === 'PATCH' && $id && isset($parts[2]) && $parts[2] === 'read') {
    $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    sendResponse(true, null, 'Notification marked as read');
}

if ($method === 'POST' && isset($parts[1]) && $parts[1] === 'read-all') {
    $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    sendResponse(true, null, 'All notifications marked as read');
}

if ($method === 'DELETE' && $id) {
    $stmt = $conn->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    sendResponse(true, null, 'Notification deleted');
}

sendResponse(false, null, 'Route not found', 404);
