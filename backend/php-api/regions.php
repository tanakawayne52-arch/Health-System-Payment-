<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/regions', '', $requestUri), '/');
$parts = explode('/', $path);

if ($method === 'GET' && ($parts[0] === '' || $parts[0] === null)) {
    // Return mapping of provinces -> districts
    $stmt = $conn->prepare('SELECT province, district FROM vhw_master_list WHERE province IS NOT NULL');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $map = [];
    foreach ($rows as $r) {
        $prov = $r['province'] ?? 'Unknown';
        $dist = $r['district'] ?? 'Unknown';
        if (!isset($map[$prov])) $map[$prov] = [];
        if ($dist && !in_array($dist, $map[$prov], true)) $map[$prov][] = $dist;
    }
    // Sort provinces and districts
    ksort($map, SORT_STRING);
    foreach ($map as &$dlist) sort($dlist, SORT_STRING);
    sendResponse(true, $map);
}

if ($method === 'GET' && $parts[0] === 'provinces') {
    $stmt = $conn->prepare('SELECT DISTINCT province FROM vhw_master_list WHERE province IS NOT NULL ORDER BY province');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $provs = array_map(fn($r) => $r['province'], $rows);
    sendResponse(true, $provs);
}

if ($method === 'GET' && $parts[0] === 'districts') {
    $province = $_GET['province'] ?? null;
    if (!$province) {
        sendResponse(false, null, 'province is required', 400);
    }
    $stmt = $conn->prepare('SELECT DISTINCT district FROM vhw_master_list WHERE province = :province AND district IS NOT NULL ORDER BY district');
    $stmt->bindParam(':province', $province);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $dists = array_map(fn($r) => $r['district'], $rows);
    sendResponse(true, $dists);
}

sendResponse(false, null, 'Route not found', 404);
