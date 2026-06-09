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

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $parts = explode('.', $token);
    
    if (count($parts) === 3) {
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        
        if ($payload && isset($payload['id'])) {
            $query = "SELECT * FROM users WHERE id = ? LIMIT 0,1";
            $stmt = $conn->prepare($query);
            $stmt->execute([$payload['id']]);
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                $mappedUser = [
                    "id" => $user['id'],
                    "email" => $user['email'],
                    "fullName" => $user['full_name'],
                    "role" => $user['role'],
                    "province" => $user['province'],
                    "district" => $user['district'],
                    "isActive" => (bool)$user['is_active'],
                    "lastLogin" => $user['last_login'],
                    "createdAt" => $user['created_at']
                ];
                sendResponse(true, $mappedUser);
            }
        }
    }
}

sendResponse(false, null, "Unauthorized", 401);
?>
