<?php
require_once __DIR__ . '/config.php';

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$method = $_SERVER['REQUEST_METHOD'];
$body = getRequestBody();

if ($parts[0] !== 'auth') {
    sendResponse(false, null, 'Route not found', 404);
}

$action = $parts[1] ?? '';

if ($action === 'login' && $method === 'POST') {
    $email = trim($body['email'] ?? '');
    $password = trim($body['password'] ?? '');

    if ($email === '' || $password === '') {
        sendResponse(false, null, 'Email and password are required', 400);
    }

    $stmt = $conn->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendResponse(false, null, 'Invalid credentials', 401);
    }

    if (!$user['is_active']) {
        sendResponse(false, null, 'Account is inactive', 401);
    }

    if (!verifyPassword($password, $user['password_hash'])) {
        logAudit($conn, null, 'LOGIN_FAILED', 'User', $email, null, null, 'Invalid password attempt');
        sendResponse(false, null, 'Invalid credentials', 401);
    }

    // Upgrade legacy plaintext / outdated hashes to bcrypt.
    if (!password_verify($password, $user['password_hash']) || password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT)) {
        $rehash = password_hash($password, PASSWORD_BCRYPT);
        $upgrade = $conn->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $upgrade->execute([$rehash, $user['id']]);
    }

    $stmt = $conn->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$user['id']]);

    logAudit($conn, $user, 'LOGIN', 'User', $user['id'], null, null, 'User signed in');

    $accessToken = createJwt($user);
    $refreshToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 30 * 24 * 60 * 60);

    $stmt = $conn->prepare('INSERT INTO refresh_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
    $stmt->execute([$refreshToken, $user['id'], $expiresAt]);

    $mappedUser = [
        'id' => $user['id'],
        'email' => $user['email'],
        'fullName' => $user['full_name'],
        'role' => $user['role'],
        'province' => $user['province'],
        'district' => $user['district'],
        'isActive' => (bool)$user['is_active'],
        'lastLogin' => $user['last_login'],
        'createdAt' => $user['created_at'],
    ];

    sendResponse(true, [
        'user' => $mappedUser,
        'accessToken' => $accessToken,
        'refreshToken' => $refreshToken,
    ], 'Login successful');
}

if ($action === 'me' && $method === 'GET') {
    $user = requireAuth($conn);
    $mappedUser = [
        'id' => $user['id'],
        'email' => $user['email'],
        'fullName' => $user['full_name'],
        'role' => $user['role'],
        'province' => $user['province'],
        'district' => $user['district'],
        'isActive' => (bool)$user['is_active'],
        'lastLogin' => $user['last_login'],
        'createdAt' => $user['created_at'],
    ];
    sendResponse(true, $mappedUser);
}

if ($action === 'logout' && $method === 'POST') {
    $refreshToken = trim($body['refreshToken'] ?? '');
    if ($refreshToken !== '') {
        $stmt = $conn->prepare('DELETE FROM refresh_tokens WHERE token = ?');
        $stmt->execute([$refreshToken]);
    }
    $authUser = null;
    $token = parseBearerToken();
    if ($token && ($payload = verifyJwt($token)) && !empty($payload['id'])) {
        $lookup = $conn->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $lookup->execute([$payload['id']]);
        $authUser = $lookup->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    if ($authUser) {
        logAudit($conn, $authUser, 'LOGOUT', 'User', $authUser['id'], null, null, 'User signed out');
    }
    sendResponse(true, null, 'Logged out');
}

if ($action === 'refresh' && $method === 'POST') {
    $refreshToken = trim($body['refreshToken'] ?? '');
    if ($refreshToken === '') {
        sendResponse(false, null, 'Refresh token is required', 400);
    }

    $stmt = $conn->prepare('SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1');
    $stmt->execute([$refreshToken]);
    $tokenRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow || strtotime($tokenRow['expires_at']) < time()) {
        sendResponse(false, null, 'Invalid refresh token', 401);
    }

    $stmt = $conn->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$tokenRow['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        sendResponse(false, null, 'Invalid refresh token user', 401);
    }

    $newAccessToken = createJwt($user);
    $newRefreshToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 30 * 24 * 60 * 60);

    $stmt = $conn->prepare('UPDATE refresh_tokens SET token = ?, expires_at = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$newRefreshToken, $expiresAt, $tokenRow['id']]);

    sendResponse(true, [
        'accessToken' => $newAccessToken,
        'refreshToken' => $newRefreshToken,
    ]);
}

if ($action === 'change-password' && $method === 'POST') {
    $user = requireAuth($conn);
    $currentPassword = trim($body['currentPassword'] ?? '');
    $newPassword = trim($body['newPassword'] ?? '');

    if ($currentPassword === '' || $newPassword === '') {
        sendResponse(false, null, 'Both current and new passwords are required', 400);
    }

    if (!verifyPassword($currentPassword, $user['password_hash'])) {
        sendResponse(false, null, 'Current password is invalid', 401);
    }

    $policyError = validatePasswordPolicy($newPassword);
    if ($policyError !== null) {
        sendResponse(false, null, $policyError, 400);
    }

    if ($newPassword === $currentPassword) {
        sendResponse(false, null, 'New password must differ from the current password', 400);
    }

    $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $conn->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $stmt->execute([$hashed, $user['id']]);

    logAudit($conn, $user, 'CHANGE_PASSWORD', 'User', $user['id'], null, null, 'Password updated by user');
    sendResponse(true, null, 'Password changed successfully');
}

sendResponse(false, null, 'Route not found', 404);
