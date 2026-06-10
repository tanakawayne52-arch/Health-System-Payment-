<?php
require_once __DIR__ . '/config.php';
$user = requireAuth($conn);
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim(str_replace('/api/', '', $requestUri), '/');
$parts = explode('/', $path);
$body = getRequestBody();

// Roles permitted to mutate beneficiary master data (HR custodians own this;
// national admins may act as oversight). Finance & provincial officers are read-only.
const BENEFICIARY_WRITE_ROLES = ['hr_custodian', 'national_admin'];

if ($parts[0] !== 'beneficiaries') {
    sendResponse(false, null, 'Route not found', 404);
}

if ($method === 'POST' && isset($parts[1]) && $parts[1] === 'check-duplicate') {
    $nationalId = $body['nationalId'] ?? null;
    $ecocashNumber = $body['ecocashNumber'] ?? null;
    $excludeId = $body['excludeId'] ?? null;
    $conditions = [];
    $bindings = [];
    if ($nationalId) {
        $conditions[] = 'national_id = ?';
        $bindings[] = $nationalId;
    }
    if ($ecocashNumber) {
        $conditions[] = 'ecocash_number = ?';
        $bindings[] = $ecocashNumber;
    }
    if (empty($conditions)) {
        sendResponse(false, null, 'Missing identifier for duplicate check', 400);
    }
    $query = 'SELECT id, full_name, national_id, ecocash_number FROM beneficiaries WHERE ' . implode(' OR ', $conditions);
    if ($excludeId) {
        $query .= ' AND id != ?';
        $bindings[] = $excludeId;
    }
    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $duplicates = array_map(function ($row) use ($nationalId) {
        return [
            'field' => ($nationalId && $row['national_id'] === $nationalId) ? 'nationalId' : 'ecocashNumber',
            'id' => $row['id'],
            'name' => $row['full_name'],
        ];
    }, $rows);
    sendResponse(true, [
        'hasDuplicates' => count($duplicates) > 0,
        'duplicates' => $duplicates,
    ]);
}

if ($method === 'POST' && isset($parts[1]) && $parts[1] === 'import') {
    requireRole($user, BENEFICIARY_WRITE_ROLES);
    
    if (!isset($_FILES['file'])) {
        sendResponse(false, null, 'No file uploaded', 400);
    }
    
    $file = $_FILES['file']['tmp_name'];
    $handle = fopen($file, 'r');
    if (!$handle) {
        sendResponse(false, null, 'Failed to open file', 500);
    }
    
    // Read header
    $header = fgetcsv($handle);
    if (!$header) {
        sendResponse(false, null, 'Empty file', 400);
    }
    
    // Map headers to field names
    $fieldMap = [
        'Full Name' => 'full_name',
        'National ID' => 'national_id',
        'EcoCash Number' => 'ecocash_number',
        'Province' => 'province',
        'District' => 'district',
        'Ward' => 'ward',
        'Village' => 'village',
        'Facility' => 'facility',
        'Status' => 'status',
        'Date Joined' => 'date_joined'
    ];
    
    $headerIndexes = [];
    foreach ($header as $index => $label) {
        $label = trim($label);
        if (isset($fieldMap[$label])) {
            $headerIndexes[$fieldMap[$label]] = $index;
        }
    }
    
    // Validate required headers
    $required = ['full_name', 'national_id', 'ecocash_number', 'province', 'district'];
    foreach ($required as $req) {
        if (!isset($headerIndexes[$req])) {
            sendResponse(false, null, "Missing required column: " . array_search($req, $fieldMap), 400);
        }
    }
    
    $imported = 0;
    $updated = 0;
    $errors = [];
    $rowNum = 1;
    
    $conn->beginTransaction();
    try {
        while (($row = fgetcsv($handle)) !== false) {
            $rowNum++;
            $data = [];
            foreach ($headerIndexes as $field => $index) {
                $data[$field] = $row[$index] ?? null;
            }
            
            if (empty($data['national_id'])) {
                $errors[] = "Row $rowNum: Missing National ID";
                continue;
            }
            
            // Check if exists
            $stmt = $conn->prepare('SELECT id FROM beneficiaries WHERE national_id = ? LIMIT 1');
            $stmt->execute([$data['national_id']]);
            $existingId = $stmt->fetchColumn();
            
            if ($existingId) {
                // Update
                $updateFields = [];
                $bindings = [];
                foreach ($data as $field => $value) {
                    if ($field !== 'national_id') {
                        $updateFields[] = "$field = ?";
                        $bindings[] = $value;
                    }
                }
                $bindings[] = $existingId;
                $stmt = $conn->prepare('UPDATE beneficiaries SET ' . implode(', ', $updateFields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?');
                $stmt->execute($bindings);
                $updated++;
            } else {
                // Insert
                $id = uniqid('b');
                $fields = array_keys($data);
                $placeholders = array_fill(0, count($fields), '?');
                $stmt = $conn->prepare('INSERT INTO beneficiaries (id, ' . implode(', ', $fields) . ', created_by, created_at, updated_at) VALUES (?, ' . implode(', ', $placeholders) . ', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                $stmt->execute([$id, ...array_values($data), $user['id']]);
                $imported++;
            }
        }
        $conn->commit();
        
        logAudit($conn, $user, 'IMPORT', 'Beneficiary', 'bulk', null, ['imported' => $imported, 'updated' => $updated], "Bulk imported beneficiaries: $imported new, $updated updated");
        sendResponse(true, ['imported' => $imported, 'updated' => $updated, 'errors' => $errors]);
    } catch (Exception $e) {
        $conn->rollBack();
        sendResponse(false, null, 'Import failed: ' . $e->getMessage(), 500);
    } finally {
        fclose($handle);
    }
}

/**
 * Detect existing beneficiaries that collide on National ID or EcoCash number.
 */
function findBeneficiaryDuplicates(PDO $conn, ?string $nationalId, ?string $ecocashNumber, ?string $excludeId): array {
    $conditions = [];
    $bindings = [];
    if ($nationalId) {
        $conditions[] = 'national_id = ?';
        $bindings[] = $nationalId;
    }
    if ($ecocashNumber) {
        $conditions[] = 'ecocash_number = ?';
        $bindings[] = $ecocashNumber;
    }
    if (empty($conditions)) {
        return [];
    }
    $query = 'SELECT id, full_name, national_id, ecocash_number FROM beneficiaries WHERE (' . implode(' OR ', $conditions) . ')';
    if ($excludeId) {
        $query .= ' AND id != ?';
        $bindings[] = $excludeId;
    }
    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$id = $parts[1] ?? null;
if ($method === 'GET' && !$id) {
    $params = $_GET;
    $query = 'SELECT * FROM beneficiaries WHERE 1=1';
    $bindings = [];

    // Provincial officers are scoped to their own province only.
    if ($user['role'] === 'provincial_officer' && !empty($user['province'])) {
        $query .= ' AND province = ?';
        $bindings[] = $user['province'];
    } elseif (!empty($params['province'])) {
        $query .= ' AND province = ?';
        $bindings[] = $params['province'];
    }
    if (!empty($params['district'])) {
        $query .= ' AND district = ?';
        $bindings[] = $params['district'];
    }
    if (!empty($params['status'])) {
        $query .= ' AND status = ?';
        $bindings[] = $params['status'];
    }
    if (!empty($params['search'])) {
        $query .= ' AND (full_name LIKE ? OR national_id LIKE ? OR ecocash_number LIKE ?)';
        $search = '%' . $params['search'] . '%';
        $bindings[] = $search;
        $bindings[] = $search;
        $bindings[] = $search;
    }

    $limit = isset($params['limit']) ? max(1, min(MAX_API_QUERY_LIMIT, (int)$params['limit'])) : 15;
    $page = isset($params['page']) ? max(1, (int)$params['page']) : 1;
    $offset = ($page - 1) * $limit;

    $countStmt = $conn->prepare(str_replace('SELECT *', 'SELECT COUNT(*)', $query));
    $countStmt->execute($bindings);
    $total = (int)$countStmt->fetchColumn();

    $query .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    $bindings[] = $limit;
    $bindings[] = $offset;

    $stmt = $conn->prepare($query);
    $stmt->execute($bindings);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pagination = [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'totalPages' => (int)ceil($total / $limit),
    ];
    sendResponse(true, $results, "", 200, $pagination);
}

if ($method === 'GET' && $id) {
    $stmt = $conn->prepare('SELECT * FROM beneficiaries WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$record) {
        sendResponse(false, null, 'Beneficiary not found', 404);
    }
    if ($user['role'] === 'provincial_officer' && !empty($user['province']) && $record['province'] !== $user['province']) {
        sendResponse(false, null, 'Forbidden: beneficiary is outside your province', 403);
    }
    sendResponse(true, $record);
}

if ($method === 'POST' && !$id) {
    requireRole($user, BENEFICIARY_WRITE_ROLES);

    $fields = [
        'id' => $body['id'] ?? uniqid('b'),
        'full_name' => $body['fullName'] ?? null,
        'national_id' => $body['nationalId'] ?? null,
        'ecocash_number' => $body['ecocashNumber'] ?? null,
        'province' => $body['province'] ?? null,
        'district' => $body['district'] ?? null,
        'ward' => $body['ward'] ?? null,
        'village' => $body['village'] ?? null,
        'facility' => $body['facility'] ?? null,
        'status' => $body['status'] ?? 'active',
        'exit_date' => $body['exitDate'] ?? null,
        'exit_reason' => $body['exitReason'] ?? null,
        'date_joined' => $body['dateJoined'] ?? null,
    ];

    if (!$fields['full_name'] || !$fields['national_id'] || !$fields['ecocash_number']) {
        sendResponse(false, null, 'Missing required beneficiary fields (full name, National ID, EcoCash number)', 400);
    }

    // FR-05: automatically reject duplicates on National ID / EcoCash number.
    $duplicates = findBeneficiaryDuplicates($conn, $fields['national_id'], $fields['ecocash_number'], null);
    if (!empty($duplicates)) {
        sendResponse(false, [
            'duplicates' => $duplicates,
        ], 'Duplicate beneficiary detected on National ID or EcoCash number', 409);
    }

    $stmt = $conn->prepare('INSERT INTO beneficiaries (id, full_name, national_id, ecocash_number, province, district, ward, village, facility, status, exit_date, exit_reason, date_joined, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
    $stmt->execute([...array_values($fields), $user['id']]);

    logAudit($conn, $user, 'CREATE', 'Beneficiary', $fields['id'], null, $fields, 'Beneficiary created');
    sendResponse(true, ['id' => $fields['id']], 'Beneficiary created', 201);
}

if ($method === 'PATCH' && $id) {
    requireRole($user, BENEFICIARY_WRITE_ROLES);

    $existingStmt = $conn->prepare('SELECT * FROM beneficiaries WHERE id = ? LIMIT 1');
    $existingStmt->execute([$id]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        sendResponse(false, null, 'Beneficiary not found', 404);
    }

    // FR-05: reject edits that would collide with another beneficiary.
    $newNationalId = $body['nationalId'] ?? null;
    $newEcocash = $body['ecocashNumber'] ?? null;

    // FR-06: avoid false-positive duplicate checks when frontend sends empty strings.
    // Only treat identifiers as present when they are non-empty after trimming.
    $newNationalId = is_string($newNationalId) ? trim($newNationalId) : $newNationalId;
    $newEcocash = is_string($newEcocash) ? trim($newEcocash) : $newEcocash;

    $nationalIdForCheck = (is_string($newNationalId) && $newNationalId !== '') ? $newNationalId : null;
    $ecocashForCheck = (is_string($newEcocash) && $newEcocash !== '') ? $newEcocash : null;

    if ($nationalIdForCheck !== null || $ecocashForCheck !== null) {
        $duplicates = findBeneficiaryDuplicates($conn, $nationalIdForCheck, $ecocashForCheck, $id);
        if (!empty($duplicates)) {
            sendResponse(false, ['duplicates' => $duplicates], 'Duplicate beneficiary detected on National ID or EcoCash number', 409);
        }
    }

    $fieldMap = [
        'fullName' => 'full_name',
        'nationalId' => 'national_id',
        'ecocashNumber' => 'ecocash_number',
        'province' => 'province',
        'district' => 'district',
        'ward' => 'ward',
        'village' => 'village',
        'facility' => 'facility',
        'status' => 'status',
        'dateJoined' => 'date_joined',
        'exitDate' => 'exit_date',
        'exitReason' => 'exit_reason',
    ];
    $updates = [];
    $bindings = [];
    $changed = [];
    foreach ($fieldMap as $bodyKey => $dbField) {
        if (array_key_exists($bodyKey, $body)) {
            $updates[] = "$dbField = ?";
            $bindings[] = $body[$bodyKey];
            $changed[$dbField] = $body[$bodyKey];
        }
    }
    if (empty($updates)) {
        sendResponse(false, null, 'No update fields provided', 400);
    }
    $updates[] = 'updated_at = CURRENT_TIMESTAMP';
    $bindings[] = $id;
    $stmt = $conn->prepare('UPDATE beneficiaries SET ' . implode(', ', $updates) . ' WHERE id = ?');
    $stmt->execute($bindings);

    $oldSnapshot = array_intersect_key($existing, $changed);
    $reason = $body['reason'] ?? 'Beneficiary details updated';
    logAudit($conn, $user, 'UPDATE', 'Beneficiary', $id, $oldSnapshot, $changed, $reason);
    sendResponse(true, null, 'Beneficiary updated');
}

if ($method === 'POST' && $id && ($parts[2] ?? '') === 'exit') {
    requireRole($user, BENEFICIARY_WRITE_ROLES);

    $exitDate = $body['exitDate'] ?? null;
    $exitReason = $body['exitReason'] ?? null;
    if (!$exitDate || !$exitReason) {
        sendResponse(false, null, 'Exit date and reason are required', 400);
    }

    $existingStmt = $conn->prepare('SELECT status, exit_date, exit_reason FROM beneficiaries WHERE id = ? LIMIT 1');
    $existingStmt->execute([$id]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        sendResponse(false, null, 'Beneficiary not found', 404);
    }

    $stmt = $conn->prepare('UPDATE beneficiaries SET status = ?, exit_date = ?, exit_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute(['exited', $exitDate, $exitReason, $id]);

    logAudit($conn, $user, 'EXIT', 'Beneficiary', $id, $existing, ['status' => 'exited', 'exit_date' => $exitDate, 'exit_reason' => $exitReason], $exitReason);
    sendResponse(true, null, 'Beneficiary exited');
}

sendResponse(false, null, 'Route not found', 404);
