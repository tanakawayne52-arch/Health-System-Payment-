<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
requireRole($user, ['national_admin']);

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/users/', '', $requestUri), '/');
$parts = explode('/', $path);

if ($method === 'GET' && empty($parts[0])) {
    $stmt = $conn->prepare("SELECT id, name, username, email, role, province, is_active as isActive, created_at as createdAt FROM users ORDER BY created_at DESC");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(true, $users);
}

if ($method === 'POST' && empty($parts[0])) {
    $body = json_decode(file_get_contents('php://input'), true);
    $id = uniqid('u');
    $stmt = $conn->prepare("INSERT INTO users (id, name, username, email, role, province, password, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())");
    $stmt->execute([
        $id,
        $body['name'],
        $body['username'],
        $body['email'],
        $body['role'],
        $body['province'] ?? null,
        password_hash($body['password'], PASSWORD_DEFAULT)
    ]);
    logAudit($conn, $user, 'CREATE', 'User', $id, null, $body, 'Created new user: ' . $body['username']);
    sendResponse(true, ['id' => $id], 'User created successfully');
}

if ($method === 'PATCH' && !empty($parts[0])) {
    $userId = $parts[0];
    $body = json_decode(file_get_contents('php://input'), true);
    
    $fields = [];
    $params = [];
    foreach ($body as $key => $value) {
        if ($key === 'isActive') $key = 'is_active';
        if ($key === 'password') $value = password_hash($value, PASSWORD_DEFAULT);
        $fields[] = "$key = ?";
        $params[] = $value;
    }
    $params[] = $userId;
    
    $stmt = $conn->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);
    logAudit($conn, $user, 'UPDATE', 'User', $userId, null, $body, 'Updated user: ' . $userId);
    sendResponse(true, null, 'User updated successfully');
}

sendResponse(false, null, 'Route not found', 404);
