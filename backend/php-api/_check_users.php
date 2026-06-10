<?php
$c = new PDO('mysql:host=127.0.0.1;port=3306;dbname=fepms_db', 'root', '');
$c->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$rows = $c->query('SELECT email, role, is_active, password_hash FROM users LIMIT 50');
foreach ($rows as $r) {
    echo $r['email'] . ' | ' . $r['role'] . ' | active=' . $r['is_active'] . ' | hash=' . substr($r['password_hash'], 0, 40) . PHP_EOL;
}
