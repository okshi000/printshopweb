<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = \Illuminate\Http\Request::create('/api/customers/14', 'PUT', [
    'name' => '???? ????????',
    'phone' => '055555555',
    'phone2' => '',
    'address' => '',
    'notes' => '',
    'is_active' => true
]);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n" . $response->getContent() . "\n";
