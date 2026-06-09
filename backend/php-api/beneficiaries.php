<?php
require_once "config.php";

// Simple auth check
$headers = getallheaders();
$authHeader = '';
foreach ($headers as $key => $value) {
    if (strtolower($key) === 'authorization') {
        $authHeader = $value;
        break;
    }
}

if (!preg_match('/Bearer\s(\S+)/', $authHeader)) {
    sendResponse(false, null, "Unauthorized: " . $authHeader, 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $province = isset($_GET['province']) ? $_GET['province'] : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $query = "SELECT * FROM beneficiaries";
    $params = [];

    if ($province) {
        $query .= " WHERE province = ?";
        $params[] = $province;
    }

    $query .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total count
    $countQuery = "SELECT COUNT(*) FROM beneficiaries";
    if ($province) $countQuery .= " WHERE province = ?";
    $countStmt = $conn->prepare($countQuery);
    $countStmt->execute($province ? [$province] : []);
    $total = $countStmt->fetchColumn();

    $data = [
        "data" => array_map(function($b) {
            return [
                "id" => $b['id'],
                "full_name" => $b['full_name'],
                "national_id" => $b['national_id'],
                "ecocash_number" => $b['ecocash_number'],
                "province" => $b['province'],
                "district" => $b['district'],
                "ward" => $b['ward'],
                "village" => $b['village'],
                "facility" => $b['facility'],
                "status" => isset($b['status']) ? $b['status'] : 'active',
                "exit_date" => isset($b['exit_date']) ? $b['exit_date'] : null,
                "exit_reason" => isset($b['exit_reason']) ? $b['exit_reason'] : null,
                "date_joined" => $b['date_joined'],
                "created_at" => $b['created_at']
            ];
        }, $results),
        "pagination" => [
            "total" => (int)$total,
            "limit" => $limit,
            "page" => floor($offset / $limit) + 1,
            "totalPages" => ceil($total / $limit)
        ]
    ];

    sendResponse(true, $data);
} else {
    sendResponse(false, null, "Method not allowed", 405);
}
?>
