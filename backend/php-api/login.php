<?php
require_once "config.php";

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $email = $data->email;
    $password = $data->password;

    $query = "SELECT * FROM users WHERE email = ? LIMIT 0,1";
    $stmt = $conn->prepare($query);
    $stmt->execute([$email]);

    $stmt->execute([$email]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {

        if ($user['is_active'] == 0) {
            sendResponse(false, null, "Account is inactive", 401);
        }

        // Validate password (plain text as per backend/routes/auth.js logic for testing)
        $isValid = false;
        if ($user['password_hash'] === $password) {
            $isValid = true;
        } else if (password_verify($password, $user['password_hash'])) {
            $isValid = true;
        }

        if ($isValid) {
            // Update last login
            $updateQuery = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->execute([$user['id']]);

            // Simple JWT Implementation (for demo purposes)
            function base64UrlEncode($data) {
                return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
            }

            $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
            $payload = base64UrlEncode(json_encode([
                'id' => $user['id'],
                'role' => $user['role'],
                'email' => $user['email'],
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60)
            ]));
            
            $secret = "supersecretjwtkey123"; // From backend/.env
            $signature = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));
            $accessToken = "$header.$payload.$signature";
            
            $refreshToken = "php_refresh_token_" . bin2hex(random_bytes(16));

            $mappedUser = [
                "id" => $user['id'],
                "email" => $user['email'],
                "fullName" => $user['full_name'],
                "role" => $user['role'],
                "province" => $user['province'],
                "district" => $user['district'],
                "isActive" => (bool)$user['is_active'],
                "lastLogin" => date(DATE_ISO8601),
                "createdAt" => $user['created_at']
            ];

            sendResponse(true, [
                "user" => $mappedUser,
                "accessToken" => $accessToken,
                "refreshToken" => $refreshToken
            ], "Login successful");
        } else {
            sendResponse(false, null, "Invalid credentials", 401);
        }
    } else {
        sendResponse(false, null, "Invalid credentials", 401);
    }
} else {
    sendResponse(false, null, "Email and password are required", 400);
}
?>
