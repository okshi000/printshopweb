<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = \App\Models\Supplier::first();
if(!$s) {
    echo "No supplier found.\n";
    exit;
}

$request = \Illuminate\Http\Request::create('/api/suppliers/'.$s->id, 'PUT', [
    'name' => $s->name,
    'type' => $s->type,
    'phone' => $s->phone,
    'address' => $s->address,
    'notes' => $s->notes,
    'is_active' => true
]);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n" . $response->getContent() . "\n";
