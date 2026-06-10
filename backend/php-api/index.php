<?php
require_once __DIR__ . '/config.php';

$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));
$path = trim($path, '/');
$parts = $path === '' ? [] : explode('/', $path);
$route = $parts[0] ?? '';

// NFR-02 Reliability: explicit runtime health endpoint for uptime monitors.
// GET /api/healthz -> lightweight DB connectivity check.
if ($route === 'healthz') {
    try {
        $stmt = $conn->query('SELECT 1 AS ok');
        $ok = (int)$stmt->fetchColumn() === 1;
        sendResponse(true, [
            'status' => $ok ? 'healthy' : 'degraded',
            'timestamp' => date('c'),
        ]);
    } catch (Throwable $e) {
        sendResponse(false, [
            'status' => 'degraded',
            'timestamp' => date('c'),
            'error' => $e->getMessage(),
        ], 'Health check failed', 500);
    }
}

switch ($route) {
    case 'auth':
        require __DIR__ . '/auth.php';
        break;
    case 'beneficiaries':
        require __DIR__ . '/beneficiaries.php';
        break;
    case 'batches':
        require __DIR__ . '/batches.php';
        break;
    case 'cycles':
        require __DIR__ . '/cycles.php';
        break;
    case 'users':
        require __DIR__ . '/users.php';
        break;
    case 'facilities':
        require __DIR__ . '/facilities.php';
        break;
    case 'payment-lists':
        require __DIR__ . '/payment-lists.php';
        break;
    case 'exception-requests':
        require __DIR__ . '/exception-requests.php';
        break;
    case 'audit-logs':
        require __DIR__ . '/audit-logs.php';
        break;
    case 'reports':
        require __DIR__ . '/reports.php';
        break;
    case 'dashboard':
        require __DIR__ . '/dashboard.php';
        break;
    case 'notifications':
        require __DIR__ . '/notifications.php';
        break;
    case 'exports':
        require __DIR__ . '/exports.php';
        break;
    case 'vhw-master-list':
        require __DIR__ . '/vhw-master-list.php';
        break;
    case 'payment-lists':
        require __DIR__ . '/payment-lists.php';
        break;
    case 'audit-logs':
        require __DIR__ . '/audit-logs.php';
        break;
    case 'exceptions':
        require __DIR__ . '/exceptions.php';
        break;
    case 'health':
        require __DIR__ . '/health.php';
        break;
    case '':
        sendResponse(true, ['message' => 'FEPMS PHP API is running']);
        break;
    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Route not found: " . $path]);
        break;
}
?>
