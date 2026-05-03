<?php
/**
 * سكربت تنظيف قاعدة البيانات - Print Shop System
 * يتم الوصول إليه عبر: http://your-ip/clean.php?secret=Abdo_Clean_2026
 */

$secret = "Abdo_Clean_2026";

if (!isset($_GET['secret']) || $_GET['secret'] !== $secret) {
    die("Access Denied. Invalid Secret Key.");
}

// محاولة قراءة إعدادات قاعدة البيانات من ملف .env
$envFile = __DIR__ . '/../.env';
$config = [];

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $config[trim($name)] = trim($value, '"\' ');
    }
} else {
    // إعدادات افتراضية بناءً على التوثيق إذا لم يجد ملف .env
    $config = [
        'DB_HOST' => '127.0.0.1',
        'DB_DATABASE' => 'printshop',
        'DB_USERNAME' => 'printshop',
        'DB_PASSWORD' => 'A1213232a',
    ];
}

try {
    $dsn = "mysql:host={$config['DB_HOST']};dbname={$config['DB_DATABASE']};charset=utf8mb4";
    $pdo = new PDO($dsn, $config['DB_USERNAME'], $config['DB_PASSWORD']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<h2>Starting Database Cleanup...</h2>";

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    $tablesToTruncate = [
        'invoice_items', 'invoice_payments', 'invoices', 
        'item_costs', 'supplier_payments', 'expenses', 
        'withdrawals', 'cash_movements', 'inventory_movements', 
        'debt_repayments', 'debts', 'activity_log'
    ];

    foreach ($tablesToTruncate as $table) {
        $pdo->exec("TRUNCATE TABLE `$table`;");
        echo "✓ Table `$table` cleared.<br>";
    }

    // تصفير الأرصدة
    $pdo->exec("UPDATE cash_balance SET cash_balance = 0, bank_balance = 0 WHERE id = 1;");
    echo "✓ Cash balances reset to 0.<br>";

    $pdo->exec("UPDATE inventory_items SET current_quantity = 0;");
    echo "✓ Inventory quantities reset to 0.<br>";

    $pdo->exec("UPDATE suppliers SET total_debt = 0;");
    echo "✓ Supplier debts reset to 0.<br>";

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    echo "<h3 style='color: green;'>Success! Database cleaned. Core data (Users, Products, Customers, Suppliers) preserved.</h3>";
    echo "<p>Please DELETE this file (clean.php) for security.</p>";

} catch (PDOException $e) {
    echo "<h3 style='color: red;'>Error: " . $e->getMessage() . "</h3>";
}
