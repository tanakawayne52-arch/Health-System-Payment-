<?php
require_once __DIR__ . '/config.php';

$health = [
    'service' => 'FEPMS PHP API',
    'status' => 'healthy',
    'timestamp' => date('c'),
];

try {
    $ping = $conn->query('SELECT 1')->fetchColumn();
    if ($ping !== '1' && $ping !== 1) {
        throw new RuntimeException('Unexpected database ping result');
    }
    $health['database'] = [
        'status' => 'healthy',
        'name' => getenv('DB_NAME') ?: 'fepms_db',
    ];
}
catch (Throwable $e) {
    $health['status'] = 'degraded';
    $health['database'] = [
        'status' => 'unhealthy',
        'message' => $e->getMessage(),
    ];
    sendResponse(false, $health, 'API degraded: database connectivity issue', 503);
}

sendResponse(true, $health, 'OK', 200);
