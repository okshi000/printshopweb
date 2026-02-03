<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    /**
     * قائمة المستخدمين
     */
    public function index()
    {
        $users = User::with('roles')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()?->name ?? 'بدون دور',
                    'permissions_count' => $user->getAllPermissions()->count(),
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });

        return response()->json(['data' => $users]);
    }

    /**
     * إضافة مستخدم جديد
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'full_name' => $request->name, // استخدام name كـ full_name
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'message' => 'تم إنشاء المستخدم بنجاح',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $request->role,
            ],
        ], 201);
    }

    /**
     * عرض مستخدم
     */
    public function show(User $user)
    {
        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name,
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * تحديث مستخدم
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'role' => ['sometimes', 'string', 'exists:roles,name'],
        ]);

        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json([
            'message' => 'تم تحديث المستخدم بنجاح',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name,
            ],
        ]);
    }

    /**
     * حذف مستخدم
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'لا يمكنك حذف نفسك'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'تم حذف المستخدم بنجاح']);
    }

    /**
     * قائمة الأدوار
     */
    public function roles()
    {
        $roles = Role::with('permissions')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name'),
                    'users_count' => $role->users()->count(),
                ];
            });

        return response()->json(['data' => $roles]);
    }

    /**
     * إنشاء دور جديد
     */
    public function createRole(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'message' => 'تم إنشاء الدور بنجاح',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ],
        ], 201);
    }

    /**
     * تحديث دور
     */
    public function updateRole(Request $request, Role $role)
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        if ($request->has('name')) {
            $role->name = $request->name;
            $role->save();
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'message' => 'تم تحديث الدور بنجاح',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ],
        ]);
    }

    /**
     * حذف دور
     */
    public function deleteRole(Role $role)
    {
        if ($role->users()->count() > 0) {
            return response()->json(['message' => 'لا يمكن حذف دور مرتبط بمستخدمين'], 403);
        }

        $role->delete();

        return response()->json(['message' => 'تم حذف الدور بنجاح']);
    }

    /**
     * قائمة الصلاحيات
     */
    public function permissions()
    {
        $permissionsMap = [
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

        $permissions = Permission::all()->map(function ($permission) use ($permissionsMap) {
            return [
                'name' => $permission->name,
                'label' => $permissionsMap[$permission->name] ?? $permission->name,
            ];
        });

        return response()->json(['data' => $permissions]);
    }
}
