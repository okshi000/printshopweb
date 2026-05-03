import re

with open('backend/app/Http/Controllers/Api/CustomerController.php', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''         = ->input('sort_by', 'name');
         = ->input('sort_dir', 'asc');

        ->withSum('invoices', 'remaining_amount');

        if ( === 'balance') {
            ->orderBy('invoices_sum_remaining_amount', );
        } else {
            ->orderBy('name', );
        }

        if (->boolean('all')) {
             = ->get();
            return response()->json();
        }

         = ->withCount('invoices')
            ->paginate(->per_page ?? 10);

        return response()->json();'''

content = re.sub(r"        if \(\->boolean\('all'\)\) \{.*?return response\(\)->json\(\\);", replacement, content, flags=re.DOTALL)

with open('backend/app/Http/Controllers/Api/CustomerController.php', 'w', encoding='utf-8') as f:
    f.write(content)
