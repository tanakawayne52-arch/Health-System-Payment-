<?php
$db_file = __DIR__ . '/fepms_db.sqlite';

if (file_exists($db_file)) {
    unlink($db_file);
}

try {
    $conn = new PDO("sqlite:" . $db_file);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Read schema
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    
    // Clean schema for SQLite
    $schema = preg_replace('/CREATE DATABASE IF NOT EXISTS.*?;/i', '', $schema);
    $schema = preg_replace('/USE fepms_db;/i', '', $schema);
    $schema = preg_replace('/ENGINE=InnoDB/i', '', $schema);
    $schema = preg_replace('/ENUM\([^)]+\)/i', 'VARCHAR(255)', $schema);
    $schema = preg_replace('/UNIQUE KEY\s+\w+\s*\(/i', 'UNIQUE (', $schema);
    $schema = str_replace('transfer_id VARCHAR(100) NOT NULL UNIQUE', 'transfer_id VARCHAR(100) NOT NULL', $schema);
    
    // SQLite doesn't support NOW() without tweaking, but we will leave it or replace it
    // Wait, SQLite supports CURRENT_TIMESTAMP instead of NOW()
    $schema = str_ireplace('DEFAULT NOW()', 'DEFAULT CURRENT_TIMESTAMP', $schema);
    
    $statements = array_filter(array_map('trim', explode(';', $schema)));
    foreach ($statements as $stmt) {
        if (!empty($stmt)) {
            $conn->exec($stmt);
        }
    }
    
    echo "Schema created.\n";
    
    // Read data
    $data = file_get_contents(__DIR__ . '/data.sql');
    $data = preg_replace('/USE fepms_db;/i', '', $data);
    $data = str_ireplace('NOW()', "CURRENT_TIMESTAMP", $data);
    
    $statements = array_filter(array_map('trim', explode(';', $data)));
    foreach ($statements as $stmt) {
        if (!empty($stmt)) {
            $conn->exec($stmt);
        }
    }
    
    echo "Data inserted.\n";
    
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
