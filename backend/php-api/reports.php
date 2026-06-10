<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'summary';
    $province = $_GET['province'] ?? null;
    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;

    if ($type === 'summary') {
        $query = "SELECT 
                    p.province, 
                    COUNT(DISTINCT p.id) as batch_count,
                    SUM(p.total_beneficiaries) as total_vhws,
                    SUM(p.total_amount) as total_amount,
                    SUM(CASE WHEN p.status = 'completed' THEN p.total_amount ELSE 0 END) as paid_amount,
                    SUM(CASE WHEN p.status != 'completed' THEN p.total_amount ELSE 0 END) as pending_amount
                  FROM payment_batches p
                  WHERE 1=1";
        $bindings = [];
        if ($province) { $query .= " AND p.province = ?"; $bindings[] = $province; }
        if ($startDate) { $query .= " AND p.created_at >= ?"; $bindings[] = $startDate; }
        if ($endDate) { $query .= " AND p.created_at <= ?"; $bindings[] = $endDate; }
        
        $query .= " GROUP BY p.province";
        $stmt = $conn->prepare($query);
        $stmt->execute($bindings);
        sendResponse(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($type === 'transactions') {
        $query = "SELECT 
                    t.id, t.batch_id, b.name as batch_name, 
                    ben.full_name, ben.national_id, ben.ecocash_number,
                    t.amount, t.status, t.reference_code, t.processed_at
                  FROM payment_transactions t
                  JOIN payment_batches b ON t.batch_id = b.id
                  JOIN beneficiaries ben ON t.beneficiary_id = ben.id
                  WHERE 1=1";
        $bindings = [];
        if ($province) { $query .= " AND b.province = ?"; $bindings[] = $province; }
        if ($startDate) { $query .= " AND t.created_at >= ?"; $bindings[] = $startDate; }
        if ($endDate) { $query .= " AND t.created_at <= ?"; $bindings[] = $endDate; }
        
        $query .= " ORDER BY t.created_at DESC LIMIT 100";
        $stmt = $conn->prepare($query);
        $stmt->execute($bindings);
        sendResponse(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

sendResponse(false, null, 'Report type not supported', 400);
