<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ExpenseType;
use App\Models\Category;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'dashboard.view' => 'عرض لوحة التحكم',
            'customers.view' => 'عرض العملاء',
            'customers.create' => 'إضافة عميل',
            'customers.edit' => 'تعديل عميل',
            'customers.delete' => 'حذف عميل',
            'suppliers.view' => 'عرض الموردين',
            'suppliers.create' => 'إضافة مورد',
            'suppliers.edit' => 'تعديل مورد',
            'suppliers.delete' => 'حذف مورد',
            'suppliers.payment' => 'دفع للمورد',
            'products.view' => 'عرض المنتجات',
            'products.create' => 'إضافة منتج',
            'products.edit' => 'تعديل منتج',
            'products.delete' => 'حذف منتج',
            'invoices.view' => 'عرض الفواتير',
            'invoices.create' => 'إنشاء فاتورة',
            'invoices.edit' => 'تعديل فاتورة',
            'invoices.delete' => 'حذف فاتورة',
            'invoices.payment' => 'استلام دفعة',
            'expenses.view' => 'عرض المصروفات',
            'expenses.create' => 'إضافة مصروف',
            'expenses.delete' => 'حذف مصروف',
            'withdrawals.view' => 'عرض السحوبات',
            'withdrawals.create' => 'إضافة سحب',
            'cash.view' => 'عرض الخزنة',
            'cash.transfer' => 'تحويل بين الصناديق',
            'cash.adjust' => 'تسوية الرصيد',
            'inventory.view' => 'عرض المخزون',
            'inventory.manage' => 'إدارة المخزون',
            'debts.view' => 'عرض الديون',
            'debts.manage' => 'إدارة الديون',
            'reports.view' => 'عرض التقارير',
            'users.view' => 'عرض المستخدمين',
            'users.manage' => 'إدارة المستخدمين',
            'activity.view' => 'عرض سجل النشاط',
        ];

        foreach ($permissions as $name => $description) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Create roles (idempotent)
        $ownerRole = Role::firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        $employeeRole = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);

        // Owner gets all permissions
        $ownerRole->givePermissionTo(Permission::all());

        // Employee gets basic permissions
        $employeeRole->givePermissionTo([
            'dashboard.view',
            'customers.view',
            'customers.create',
            'invoices.view',
            'invoices.create',
            'invoices.payment',
            'products.view',
        ]);

        // Create or update default admin user
        $admin = User::updateOrCreate(
            ['email' => 'admin@printshop.com'],
            [
                'name' => 'admin',
                'password' => bcrypt('password'),
                'full_name' => 'مدير النظام',
                'role' => 'owner',
            ]
        );
        if (! $admin->hasRole('owner')) {
            $admin->assignRole('owner');
        }

        // Create expense types
        $expenseTypes = [
            'إيجار',
            'كهرباء',
            'ماء',
            'إنترنت',
            'صيانة',
            'رواتب',
            'مستلزمات مكتبية',
            'وقود ومواصلات',
            'أخرى',
        ];

        foreach ($expenseTypes as $type) {
            ExpenseType::firstOrCreate(['name' => $type]);
        }

        // Create categories
        $categories = [
            'طباعة' => 'خدمات الطباعة المختلفة',
            'تصميم' => 'خدمات التصميم الجرافيكي',
            'لوحات' => 'لوحات إعلانية ودعائية',
            'استيكرات' => 'ملصقات ولاصقات',
            'كروت' => 'كروت شخصية وعمل',
            'مطبوعات تجارية' => 'فواتير وأوراق رسمية',
        ];

        foreach ($categories as $name => $description) {
            Category::firstOrCreate([
                'name' => $name,
            ], [
                'description' => $description,
            ]);
        }
    }
}
