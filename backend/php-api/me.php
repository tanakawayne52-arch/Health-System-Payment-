<?php
require_once "config.php";

$user = requireAuth($conn);

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
?>
