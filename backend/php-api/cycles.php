<?php
require_once "config.php";

$headers = getallheaders();
$authHeader = '';
foreach ($headers as $key => $value) {
    if (strtolower($key) === 'authorization') {
        $authHeader = $value;
        break;
    }
}
if (!$authHeader) sendResponse(false, null, "Unauthorized", 401);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT id, NAME AS name, period_start, period_end, STATUS AS status, created_at FROM payment_cycles ORDER BY period_start DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = array_map(function($c) {
        return [
            "id" => $c['id'],
            "name" => $c['name'],
            "periodStart" => $c['period_start'],
            "periodEnd" => $c['period_end'],
            "status" => $c['status'],
            "createdAt" => $c['created_at']
        ];
    }, $results);

    sendResponse(true, $data);
} else {
    sendResponse(false, null, "Method not allowed", 405);
}
?>
