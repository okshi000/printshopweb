import re

with open('frontend/src/pages/customers/CustomersPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports -> adding Select
select_import = "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\n"
content = re.sub(r"import \{ Switch \} from '@\/components\/ui\/switch';", 
                 r"import { Switch } from '@/components/ui/switch';\n" + select_import, content)

# 2. State
sort_state = '''    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');'''
content = content.replace("const [search, setSearch] = useState('');", 
                          "const [search, setSearch] = useState('');\n" + sort_state)

# 3. QueryKey & Params
query_old = '''    const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Customer>>({
      queryKey: ['customers', page, search],
      queryFn: async () => {
        const res = await customersApi.list({ page, search, per_page: 10 });
'''
query_new = '''    const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Customer>>({
      queryKey: ['customers', page, search, sortBy, sortDir],
      queryFn: async () => {
        const res = await customersApi.list({ page, search, per_page: 10, sort_by: sortBy, sort_dir: sortDir });
'''
content = content.replace(query_old, query_new)

# 4. UI 
ui_old = '''              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث عن عميل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardHeader>'''
ui_new = '''              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
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
                    <SelectItem value="balance-desc">الأكثر مديونية (مالاً)</SelectItem>
                    <SelectItem value="balance-asc">الأقل مديونية</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث عن عميل..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>'''
content = content.replace(ui_old, ui_new)

with open('frontend/src/pages/customers/CustomersPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
