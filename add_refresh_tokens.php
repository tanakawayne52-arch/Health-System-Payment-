<?php
require_once "backend/php-api/config.php";

$query = "
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
";

try {
    $conn->exec($query);
    echo "refresh_tokens table created successfully.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
