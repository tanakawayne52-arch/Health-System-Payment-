<?php
$corsOrigin = getenv('CORS_ORIGIN');
if ($corsOrigin && trim($corsOrigin) !== '') {
    header("Access-Control-Allow-Origin: $corsOrigin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, PATCH, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

define('MAX_API_EXECUTION_SECONDS', 45);
define('MAX_EXPORT_ROWS', 10000);
define('MAX_API_QUERY_LIMIT', 200);

function applyRequestGuards(): void {
    @ini_set('default_socket_timeout', '30');
    @ini_set('max_execution_time', (string) MAX_API_EXECUTION_SECONDS);
    @set_time_limit(MAX_API_EXECUTION_SECONDS);
}

applyRequestGuards();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function loadDotEnv(string $path): void {
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        [$name, $value] = array_map('trim', explode('=', $line, 2) + [1 => '']);
        if ($name !== '' && getenv($name) === false) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

loadDotEnv(__DIR__ . '/.env');

$host = "127.0.0.1";
$db_name = "fepms_db";
$username = "root";
$password = ""; // As per backend/.env
$port = 3306;

try {
    $conn = new PDO("mysql:host=$host;port=$port;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    $conn->exec("set names utf8");
} catch (PDOException $exception) {
    echo json_encode(["success" => false, "message" => "Connection error: " . $exception->getMessage()]);
    exit();
}

function sendResponse($success, $data = null, $message = "", $code = 200, $pagination = null) {
    http_response_code($code);
    $response = [
        "success" => $success,
        "data" => $data,
        "message" => $message
    ];
    if ($pagination !== null) {
        $response["pagination"] = $pagination;
    }
    echo json_encode($response);
    exit();
}

function getJwtSecret(): string {
    $secret = getenv('JWT_SECRET');
    if ($secret === false || trim($secret) === '') {
        error_log('[SECURITY] JWT_SECRET is not configured. Set JWT_SECRET in backend/php-api/.env or environment variables.');
        sendResponse(false, null, 'Server configuration error: JWT_SECRET is missing', 500);
    }
    return $secret;
}

function getRequestBody(): array {
    $body = file_get_contents('php://input');
    if (!$body) {
        return [];
    }
    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : [];
}

function getAuthorizationHeader(): ?string {
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }

    if (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (!empty($requestHeaders['Authorization'])) {
            return trim($requestHeaders['Authorization']);
        }
    }

    return null;
}

function parseBearerToken(): ?string {
    $header = getAuthorizationHeader();
    if (!$header) {
        return null;
    }
    if (preg_match('/Bearer\s+(\S+)/', $header, $matches)) {
        return $matches[1];
    }
    return null;
}

function base64UrlEncode(string $data): string {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function base64UrlDecode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
}

function createJwt(array $user): string {
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64UrlEncode(json_encode([
        'id' => $user['id'],
        'role' => $user['role'],
        'email' => $user['email'],
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60),
    ]));

    // Security: JWT secret must be configured via env var.
    $secret = getJwtSecret();

    $signature = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));
    return "$header.$payload.$signature";
}

function verifyJwt(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header64, $payload64, $signature64] = $parts;
    $header = json_decode(base64UrlDecode($header64), true);
    $payload = json_decode(base64UrlDecode($payload64), true);
    if (!$header || !$payload || empty($header['alg']) || $header['alg'] !== 'HS256') {
        return null;
    }

    $secret = getJwtSecret();
    $expectedSignature = base64UrlEncode(hash_hmac('sha256', "$header64.$payload64", $secret, true));
    if (!hash_equals($expectedSignature, $signature64)) {
        return null;
    }

    if (empty($payload['exp']) || $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

function requireAuth(PDO $conn): array {
    $token = parseBearerToken();
    if (!$token) {
        sendResponse(false, null, 'Unauthorized', 401);
    }

    $payload = verifyJwt($token);
    if (!$payload || empty($payload['id'])) {
        sendResponse(false, null, 'Unauthorized', 401);
    }

    $stmt = $conn->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        sendResponse(false, null, 'Unauthorized', 401);
    }

    if (!$user['is_active']) {
        sendResponse(false, null, 'Account is inactive', 403);
    }

    return $user;
}

/**
 * Enforce that the authenticated user has one of the allowed roles.
 * Halts the request with HTTP 403 when the role is not permitted.
 */
function requireRole(array $user, array $allowedRoles): void {
    if (!in_array($user['role'], $allowedRoles, true)) {
        sendResponse(false, null, 'Forbidden: your role is not permitted to perform this action', 403);
    }
}

/**
 * Best-effort client IP resolution for audit records.
 */
function getClientIp(): string {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Write a tamper-resistant audit record. Audit failures are logged but never
 * abort the primary operation.
 */
function logAudit(
    PDO $conn,
    ?array $user,
    string $action,
    string $entityType,
    string $entityId,
    $oldValues = null,
    $newValues = null,
    ?string $reason = null
): void {
    try {
        $stmt = $conn->prepare(
            'INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, old_values, new_values, reason, ip_address, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        );
        $stmt->execute([
            'audit_' . bin2hex(random_bytes(8)),
            $user['id'] ?? null,
            $user['full_name'] ?? 'system',
            $user['role'] ?? 'system',
            $action,
            $entityType,
            $entityId,
            $oldValues !== null ? json_encode($oldValues) : null,
            $newValues !== null ? json_encode($newValues) : null,
            $reason,
            getClientIp(),
        ]);
    } catch (Throwable $e) {
        error_log('[FEPMS] Audit log write failed: ' . $e->getMessage());
    }
}

/**
 * Validate a new password against the minimum security policy.
 * Returns an error message string when invalid, or null when acceptable.
 */
function validatePasswordPolicy(string $password): ?string {
    if (strlen($password) < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!preg_match('/[a-z]/', $password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!preg_match('/[0-9]/', $password)) {
        return 'Password must contain at least one number';
    }
    return null;
}

/**
 * Verify a supplied password against a stored hash. Supports legacy plaintext
 * values so existing seed data keeps working until upgraded on next login.
 */
function verifyPassword(string $supplied, string $stored): bool {
    if (password_verify($supplied, $stored)) {
        return true;
    }
    // Legacy plaintext fallback (constant-time compare)
    return hash_equals($stored, $supplied);
}

