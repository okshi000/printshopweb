<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiPermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($this->isOwner($user)) {
            return $next($request);
        }

        $permission = $this->resolvePermission($request);

        if ($permission !== null && ! $user->hasPermissionTo($permission)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }

    private function isOwner($user): bool
    {
        return ($user->role ?? null) === 'owner' || $user->hasRole('owner');
    }

    private function resolvePermission(Request $request): ?string
    {
        $path = trim($request->path(), '/');
        $segments = $path === '' ? [] : explode('/', $path);

        if (isset($segments[0]) && $segments[0] === 'api') {
            array_shift($segments);
        }

        $root = $segments[0] ?? '';
        $method = strtoupper($request->method());

        if ($root === '' || $root === 'logout' || $root === 'me') {
            return null;
        }

        if ($root === 'dashboard') {
            return 'dashboard.view';
        }

        if ($root === 'reports' || $root === 'reports-v2' || $root === 'accountant') {
            return 'reports.view';
        }

        if ($root === 'activity-logs') {
            return 'activity.view';
        }

        if ($root === 'roles' || $root === 'permissions') {
            return 'users.manage';
        }

        if ($root === 'users') {
            return $this->crudPermission($method, 'users.view', 'users.manage', 'users.manage', 'users.manage');
        }

        if ($root === 'customers') {
            return $this->crudPermission($method, 'customers.view', 'customers.create', 'customers.edit', 'customers.delete');
        }

        if ($root === 'suppliers') {
            if (in_array('payments', $segments, true)) {
                return 'suppliers.payment';
            }

            return $this->crudPermission($method, 'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete');
        }

        if ($root === 'categories') {
            return $this->crudPermission($method, 'products.view', 'products.create', 'products.edit', 'products.delete');
        }

        if ($root === 'products') {
            return $this->crudPermission($method, 'products.view', 'products.create', 'products.edit', 'products.delete');
        }

        if ($root === 'invoices') {
            if (in_array('payments', $segments, true)) {
                return 'invoices.payment';
            }

            if (in_array('status', $segments, true)) {
                return 'invoices.edit';
            }

            return $this->crudPermission($method, 'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete');
        }

        if ($root === 'invoices-statistics') {
            return 'invoices.view';
        }

        if ($root === 'expenses') {
            return $this->crudPermission($method, 'expenses.view', 'expenses.create', 'expenses.create', 'expenses.delete');
        }

        if ($root === 'expense-types') {
            return $this->crudPermission($method, 'expenses.view', 'expenses.create', 'expenses.create', 'expenses.delete');
        }

        if ($root === 'withdrawals') {
            return $this->crudPermission($method, 'withdrawals.view', 'withdrawals.create', 'withdrawals.create', 'withdrawals.create');
        }

        if ($root === 'cash') {
            $action = $segments[1] ?? '';

            if ($action === 'balance' || $action === 'movements') {
                return 'cash.view';
            }

            if ($action === 'transfer') {
                return 'cash.transfer';
            }

            if ($action === 'adjust' || $action === 'set-initial') {
                return 'cash.adjust';
            }

            return 'cash.view';
        }

        if ($root === 'inventory') {
            if (in_array('add-stock', $segments, true) || in_array('remove-stock', $segments, true)) {
                return 'inventory.manage';
            }

            return $method === 'GET' ? 'inventory.view' : 'inventory.manage';
        }

        if ($root === 'inventory-movements') {
            return $method === 'GET' ? 'inventory.view' : 'inventory.manage';
        }

        if ($root === 'debts') {
            if (in_array('repay', $segments, true)) {
                return 'debts.manage';
            }

            return $method === 'GET' ? 'debts.view' : 'debts.manage';
        }

        if ($root === 'debt-accounts' || $root === 'debt-accounts-all') {
            return $method === 'GET' ? 'debts.view' : 'debts.manage';
        }

        return null;
    }

    private function crudPermission(string $method, string $view, string $create, string $edit, string $delete): ?string
    {
        return match ($method) {
            'GET' => $view,
            'POST' => $create,
            'PUT', 'PATCH' => $edit,
            'DELETE' => $delete,
            default => null,
        };
    }
}
