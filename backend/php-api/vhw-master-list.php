<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $province = $_GET['province'] ?? null;
    $district = $_GET['district'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;

    $query = "SELECT
        id,
        province,
        district,
        health_centre AS healthCentre,
        village,
        ward,
        first_name AS firstName,
        last_name AS lastName,
        id_number AS idNumber,
        dob_reformat AS dobReformat,
        sex,
        phone_number AS phoneNumber,
        active_q1 AS activeQ1,
        active_q2 AS activeQ2,
        active_q3 AS activeQ3,
        active_q4 AS activeQ4,
        payment_q1 AS paymentQ1,
        payment_q2 AS paymentQ2,
        payment_q3 AS paymentQ3,
        payment_q4 AS paymentQ4,
        payment_amt_q1_q2 AS paymentAmtQ1Q2,
        payment_category AS paymentCategory,
        payment_difference AS paymentDifference,
        duplicate_records AS duplicateRecords,
        duplicate_status AS duplicateStatus,
        date4_calc AS date4Calc,
        age,
        health_check AS healthCheck,
        id_check AS idCheck,
        age_check AS ageCheck,
        sex_check AS sexCheck,
        phone_check AS phoneCheck,
        village_check AS villageCheck,
        ward_check AS wardCheck,
        data_quality AS dataQuality,
        index_column AS `index`
    FROM vhw_master_list";

    $conditions = [];
    $bindings = [];

    if ($province) {
        $conditions[] = 'province = ?';
        $bindings[] = $province;
    }
    if ($district) {
        $conditions[] = 'district = ?';
        $bindings[] = $district;
    }

    if (!empty($conditions)) {
        $query .= ' WHERE ' . implode(' AND ', $conditions);
    }

    if ($limit !== null && $limit > 0) {
        $query .= ' LIMIT ' . $limit;
    }

    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, $results);
}

sendResponse(false, null, 'Method not supported', 405);
