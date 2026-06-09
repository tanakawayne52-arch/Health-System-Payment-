<?php
require_once 'config.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));
$path = trim($path, '/');

try {
    global $conn;
    
    if (strpos($path, 'dashboard/overview') === 0) {
        $province = isset($_GET['province']) && $_GET['province'] !== 'null' ? $_GET['province'] : null;
        
        $whereClause = $province ? "WHERE province = :province" : "";
        $whereClauseBatches = $province ? "WHERE b.province = :province" : "";
        $whereClauseTx = $province ? "WHERE beneficiary_id IN (SELECT id FROM beneficiaries WHERE province = :province)" : "";

        // Total Beneficiaries
        $stmt = $conn->prepare("SELECT COUNT(*) as totalBeneficiaries FROM beneficiaries $whereClause");
        if ($province) $stmt->bindParam(':province', $province);
        $stmt->execute();
        $totalBeneficiaries = $stmt->fetch(PDO::FETCH_ASSOC)['totalBeneficiaries'];
        
        // Active Beneficiaries
        $activeWhere = $province ? "WHERE status = 'active' AND province = :province" : "WHERE status = 'active'";
        $stmt = $conn->prepare("SELECT COUNT(*) as activeBeneficiaries FROM beneficiaries $activeWhere");
        if ($province) $stmt->bindParam(':province', $province);
        $stmt->execute();
        $activeBeneficiaries = $stmt->fetch(PDO::FETCH_ASSOC)['activeBeneficiaries'];

        // Total Disbursed
        $successWhere = $province ? "WHERE status = 'success' AND beneficiary_id IN (SELECT id FROM beneficiaries WHERE province = :province)" : "WHERE status = 'success'";
        $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as totalDisbursed FROM payment_transactions $successWhere");
        if ($province) $stmt->bindParam(':province', $province);
        $stmt->execute();
        $totalDisbursed = $stmt->fetch(PDO::FETCH_ASSOC)['totalDisbursed'];

        $monthlyStats = [
            ["month" => "Jan", "disbursed" => 15000, "beneficiaries" => 1200, "successRate" => 98],
            ["month" => "Feb", "disbursed" => 18000, "beneficiaries" => 1250, "successRate" => 95],
            ["month" => "Mar", "disbursed" => 20000, "beneficiaries" => 1300, "successRate" => 99]
        ];

        echo json_encode([
            "success" => true,
            "data" => [
                "totalBeneficiaries" => (int)$totalBeneficiaries,
                "activeBeneficiaries" => (int)$activeBeneficiaries,
                "totalDisbursed" => (float)$totalDisbursed,
                "pendingPayments" => 0,
                "successRate" => 95.5,
                "monthlyStats" => $monthlyStats,
                "provinceStats" => [],
                "recentBatches" => [],
                "recentTransactions" => []
            ]
        ]);
        exit;
    }
    
    if (strpos($path, 'dashboard/analytics/transactions') === 0) {
        echo json_encode(["success" => true, "data" => []]);
        exit;
    }

    if (strpos($path, 'dashboard/analytics/failures') === 0) {
        echo json_encode(["success" => true, "data" => ["failureCodes" => [], "failuresByProvince" => []]]);
        exit;
    }

    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Dashboard route not found"]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>
