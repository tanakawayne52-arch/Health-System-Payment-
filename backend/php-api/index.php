<?php
// Simple Router for PHP API
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';

// Strip base path and query string
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));
$path = trim($path, '/');

// Get the first segment of the path for routing
$route = explode('/', $path)[0];

switch ($route) {
    case 'auth':
        if ($path === 'auth/login') {
            require __DIR__ . '/login.php';
        } else if ($path === 'auth/me') {
            require __DIR__ . '/me.php';
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Auth Route not found: " . $path]);
        }
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
    case 'dashboard':
        require __DIR__ . '/dashboard.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Route not found: " . $path]);
        break;
}
?>
