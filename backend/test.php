<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Customer::where('is_active', false)->first();
if(!$c) {
    echo 'No inactive customer.' . PHP_EOL;
    exit;
}

$data = $c->toArray();
$data['is_active'] = true;
$rules = [
    'name' => 'required|string|max:100|unique:customers,name,' . $c->id,
    'phone' => 'nullable|string|max:20',
    'phone2' => 'nullable|string|max:20',
    'address' => 'nullable|string',
    'notes' => 'nullable|string',
    'is_active' => 'boolean',
];

$validator = \Illuminate\Support\Facades\Validator::make($data, $rules);
if ($validator->fails()) {
    print_r($validator->errors()->toArray());
} else {
    echo 'Validation passed for ID ' . $c->id . PHP_EOL;
}
