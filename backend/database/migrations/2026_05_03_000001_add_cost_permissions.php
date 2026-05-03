<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // إضافة الصلاحيات الجديدة
        $permissions = [
            'invoices.view_costs' => 'عرض تكاليف وأرباح الفواتير',
            'invoices.manage_costs' => 'إضافة وتعديل تكاليف الفواتير',
        ];

        foreach ($permissions as $name => $description) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // إعطاء هذه الصلاحيات للمالك (Owner) تلقائياً
        $ownerRole = Role::where('name', 'owner')->first();
        if ($ownerRole) {
            $ownerRole->givePermissionTo(['invoices.view_costs', 'invoices.manage_costs']);
        }
    }

    public function down(): void
    {
        Permission::whereIn('name', ['invoices.view_costs', 'invoices.manage_costs'])->delete();
    }
};
