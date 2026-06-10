<?php
require_once "config.php";
$user = requireAuth($conn);

$method = $_SERVER['REQUEST_METHOD'];

// Roles permitted to manage facility data
const FACILITY_WRITE_ROLES = ['national_admin'];

if ($method === 'GET') {
    $province_id = isset($_GET['province_id']) ? (int)$_GET['province_id'] : null;
    $type_id = isset($_GET['facility_type_id']) ? (int)$_GET['facility_type_id'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $query = "SELECT f.*, t.name as type_name FROM physical_facilities f 
              LEFT JOIN facility_types t ON f.facility_type_id = t.id WHERE 1=1";
    $params = [];

    if ($province_id) {
        $query .= " AND f.province_id = ?";
        $params[] = $province_id;
    }
    if ($type_id) {
        $query .= " AND f.facility_type_id = ?";
        $params[] = $type_id;
    }
    if ($search) {
        $query .= " AND (f.facility_name LIKE ? OR f.facility_code LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $query .= " ORDER BY f.facility_name ASC LIMIT $limit OFFSET $offset";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total count
    $countQuery = "SELECT COUNT(*) FROM physical_facilities WHERE 1=1";
    $countParams = [];
    if ($province_id) {
        $countQuery .= " AND province_id = ?";
        $countParams[] = $province_id;
    }
    if ($type_id) {
        $countQuery .= " AND facility_type_id = ?";
        $countParams[] = $type_id;
    }
    if ($search) {
        $countQuery .= " AND (facility_name LIKE ? OR facility_code LIKE ?)";
        $countParams[] = "%$search%";
        $countParams[] = "%$search%";
    }
    
    $countStmt = $conn->prepare($countQuery);
    $countStmt->execute($countParams);
    $total = $countStmt->fetchColumn();

    sendResponse(true, [
        "results" => $results,
        "total" => (int)$total,
        "limit" => $limit,
        "offset" => $offset
    ]);
} else if ($method === 'POST') {
    requireRole($user, FACILITY_WRITE_ROLES);
    $data = getRequestBody();
    
    if (empty($data['facility_name']) || empty($data['facility_code']) || empty($data['facility_type_id'])) {
        sendResponse(false, null, "Missing required fields", 400);
    }

    $query = "INSERT INTO physical_facilities (facility_name, facility_code, facility_type, province_id, district_id, facility_type_id, description, address, is_active) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([
        $data['facility_name'],
        $data['facility_code'],
        $data['facility_type'] ?? null,
        $data['province_id'] ?? null,
        $data['district_id'] ?? null,
        $data['facility_type_id'],
        $data['description'] ?? null,
        $data['address'] ?? null,
        $data['is_active'] ?? 1
    ]);
    
    $newId = $conn->lastInsertId();
    logAudit($conn, $user, 'CREATE', 'Facility', $newId, null, $data, 'Facility created');
    sendResponse(true, ["id" => $newId], "Facility created successfully");
} else {
    sendResponse(false, null, "Method not allowed", 405);
}
?>
