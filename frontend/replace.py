import os
import re

customers_path = 'src/pages/customers/CustomersPage.tsx'
content = open(customers_path, 'r', encoding='utf-8').read()

pattern = r'<CardContent className="p-4">\s*<div className="relative w-full sm:w-80">.*?</CardContent>'

match = re.search(pattern, content, re.DOTALL)
if match:
    new_ui = '''<CardContent className="p-4 flex flex-col sm:flex-row gap-2">
            <Select value={${sortBy}-} onValueChange={(val) => {
              const [by, dir] = val.split('-');
              setSortBy(by);
              setSortDir(dir);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">الاسم (أ-ي)</SelectItem>
                <SelectItem value="name-desc">الاسم (ي-أ)</SelectItem>
                <SelectItem value="balance-desc">الأكثر ديناً (مالاً)</SelectItem>
                <SelectItem value="balance-asc">الأقل ديناً</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث عن عميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>'''
    content = content.replace(match.group(0), new_ui)
    with open(customers_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced in CustomersPage")
else:
    print("Not found in CustomersPage")


suppliers_path = 'src/pages/SuppliersPage.tsx'
content2 = open(suppliers_path, 'r', encoding='utf-8').read()

pattern2 = r'<CardContent className="p-4">\s*<div className="relative">.*?</span>\s*</div>\s*</CardContent>'
match2 = re.search(pattern2, content2, re.DOTALL)
if match2:
    new_ui2 = '''<CardContent className="p-4 flex flex-col sm:flex-row gap-2">
            <Select value={${sortBy}-} onValueChange={(val) => {
              const [by, dir] = val.split('-');
              setSortBy(by);
              setSortDir(dir);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">الاسم (أ-ي)</SelectItem>
                <SelectItem value="name-desc">الاسم (ي-أ)</SelectItem>
                <SelectItem value="balance-desc">الأكثر ديناً (مالاً)</SelectItem>
                <SelectItem value="balance-asc">الأقل ديناً</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="بحث عن مورد..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pr-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
            </div>
          </CardContent>'''
    content2 = content2.replace(match2.group(0), new_ui2)
    with open(suppliers_path, 'w', encoding='utf-8') as f:
        f.write(content2)
    print("Replaced in SuppliersPage")
else:
    print("Not found in SuppliersPage")

