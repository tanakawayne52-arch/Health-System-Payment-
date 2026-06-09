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
    $province = isset($_GET['province']) ? $_GET['province'] : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;

    $query = "SELECT * FROM payment_batches";
    $params = [];
    if ($province) {
        $query .= " WHERE province = ?";
        $params[] = $province;
    }
    $query .= " ORDER BY created_at DESC LIMIT $limit";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = [
        "data" => array_map(function($b) {
            return [
                "id" => $b['id'],
                "cycle_id" => $b['cycle_id'],
                "name" => $b['name'],
                "province" => $b['province'],
                "district" => $b['district'],
                "status" => $b['status'],
                "total_beneficiaries" => (int)$b['total_beneficiaries'],
                "total_amount" => (float)$b['total_amount'],
                "executed_at" => $b['executed_at'],
                "created_at" => $b['created_at']
            ];
        }, $results),
        "pagination" => [
            "total" => count($results),
            "limit" => $limit
        ]
    ];

    sendResponse(true, $data);
} else {
    sendResponse(false, null, "Method not allowed", 405);
}
?>
