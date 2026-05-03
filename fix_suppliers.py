import os
import re

content = open('frontend/src/pages/SuppliersPage.tsx', 'r', encoding='utf-8').read()

content = re.sub(
    r"const \[search, setSearch\] = useState\(''\);",
    r"const [search, setSearch] = useState('');\n  const [sortBy, setSortBy] = useState('name');\n  const [sortDir, setSortDir] = useState('asc');",
    content
)

content = re.sub(
    r"queryKey: \['suppliers', page, debouncedSearch\]",
    r"queryKey: ['suppliers', page, debouncedSearch, sortBy, sortDir]",
    content
)

content = re.sub(
    r"(const params: Record<string, string \| number> = \{ page, per_page: 10 \};)",
    r"\1\n      params.sort_by = sortBy;\n      params.sort_dir = sortDir;",
    content
)

old_ui = '''              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث عن مورد..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pr-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
              </div>'''

new_ui = '''              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
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
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="بحث عن مورد..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pr-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
                </div>
              </div>'''

content = content.replace(old_ui, new_ui)

with open('frontend/src/pages/SuppliersPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
