<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// This file is intended to be moved to /home/site/wwwroot/index.php
// So we point everything to the 'backend' subdirectory

$backendDir = __DIR__ . '/backend';

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $backendDir.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
if (file_exists($backendDir.'/vendor/autoload.php')) {
    require $backendDir.'/vendor/autoload.php';
} else {
    echo "Composer dependencies not found. Please run 'composer install' in the backend directory.";
    exit(1);
}

// Bootstrap Laravel and handle the request...
(require_once $backendDir.'/bootstrap/app.php')
    ->handleRequest(Request::capture());
