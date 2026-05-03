import re

with open('backend/app/Http/Controllers/Api/CustomerController.php', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');

        $query->withSum('invoices', 'remaining_amount');

        if ($sortBy === 'balance') {
            $query->orderBy('invoices_sum_remaining_amount', $sortDir);
        } else {
            $query->orderBy('name', $sortDir);
        }

        if ($request->boolean('all')) {
            $customers = $query->get();
            return response()->json($customers);
        }

        $customers = $query->withCount('invoices')
            ->paginate($request->per_page ?? 10);

        return response()->json($customers);"""

# find `if ($request->boolean('all')) {`
content = re.sub(r"        if \(\$request->boolean\('all'\)\) \{.*?return response\(\)->json\(\$customers\);", replacement, content, flags=re.DOTALL)

with open('backend/app/Http/Controllers/Api/CustomerController.php', 'w', encoding='utf-8') as f:
    f.write(content)
