<?php
$base = 'http://localhost:8001/api';
$loginData = json_encode(array('email' => 'admin@mohcc.gov.zw', 'password' => 'admin123'));

function httpRequest($method, $url, $token = null, $body = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    $headers = array('Content-Type: application/json');
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    $error = curl_error($ch);
    curl_close($ch);
    return array('response' => $response, 'info' => $info, 'error' => $error);
}

$loginResult = httpRequest('POST', $base . '/auth/login', null, $loginData);
if ($loginResult['error']) {
    echo "CURL ERROR: " . $loginResult['error'] . "\n";
    exit(1);
}
echo "LOGIN RESPONSE:\n";
echo $loginResult['response'] . "\n\n";
$login = json_decode($loginResult['response'], true);
if (!$login || empty($login['success'])) {
    echo "LOGIN FAILED\n";
    exit(1);
}
$token = $login['data']['accessToken'];
$endpoints = array('beneficiaries?limit=2', 'batches?limit=2', 'cycles', 'auth/me');
foreach ($endpoints as $endpoint) {
    $url = $base . '/' . $endpoint;
    $result = httpRequest('GET', $url, $token);
    echo strtoupper(str_replace(array('?', '/', 'auth'), array(' ', ' ', ' '), $endpoint)) . " RESPONSE:\n";
    if ($result['error']) {
        echo "CURL ERROR: " . $result['error'] . "\n";
    } else {
        echo "STATUS: " . $result['info']['http_code'] . "\n";
        echo $result['response'] . "\n\n";
    }
}
