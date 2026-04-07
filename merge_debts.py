import re

with open('frontend/src/pages/DebtsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = re.sub(r"import \{ debtsApi, debtAccountsApi \} from '\.\./api'", "import { debtsApi, debtAccountsApi, withdrawalsApi } from '../api'", content)
content = re.sub(r"import type \{ Debt, DebtAccount \} from '\.\./types'", "import type { Debt, DebtAccount, Withdrawal } from '../types'", content)

# 2. Schema
withdrawal_schema = '''
const withdrawalSchema = z.object({
  withdrawn_by: z.string().min(1, 'من قام بالسحب مطلوب'),
  amount: z.coerce.number().min(1, 'المبلغ يجب أن يكون أكبر من صفر'),
  payment_method: z.enum(['cash', 'bank']),
  withdrawal_date: z.date(),
  notes: z.string().optional(),
})
'''
content = content.replace("const accountSchema", withdrawal_schema + "\nconst accountSchema")

# 3. State variables
state_vars = '''  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)'''
content = content.replace("const [debtsPage, setDebtsPage] = useState(1)", "const [debtsPage, setDebtsPage] = useState(1)\n" + state_vars)

# 4. Queries
queries = '''
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['withdrawals', withdrawalsPage],
    queryFn: async () => {
      const res = await withdrawalsApi.list({ page: withdrawalsPage, per_page: 10 })
      return res.data
    },
  })
  const withdrawals = withdrawalsData?.data || []
'''
content = content.replace("const debts = debtsData?.data || []", "const debts = debtsData?.data || []\n" + queries)

# 5. Form
form_code = '''
  const withdrawalForm = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { withdrawn_by: '', amount: 0, payment_method: 'cash', withdrawal_date: new Date(), notes: '' },
  })
'''
content = content.replace("const repayForm = useForm({", form_code + "\n  const repayForm = useForm({")

# 6. Mutations
mutations_code = '''
  const createWithdrawalMutation = useMutation({
    mutationFn: (data: z.infer<typeof withdrawalSchema>) => withdrawalsApi.create({
      withdrawn_by: data.withdrawn_by,
      amount: data.amount,
      payment_method: data.payment_method,
      withdrawal_date: format(data.withdrawal_date, 'yyyy-MM-dd'),
      notes: data.notes || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setWithdrawalModalOpen(false)
      withdrawalForm.reset()
      toast.success('تم تسجيل السحب بنجاح')
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'فشل تسجيل السحب'),
  })

  const deleteWithdrawalMutation = useMutation({
    mutationFn: (id: number) => withdrawalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      toast.success('تم حذف السحب بنجاح')
    },
    onError: () => toast.error('فشل حذف السحب'),
  })

  const handleDeleteWithdrawal = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا السحب؟')) {
      deleteWithdrawalMutation.mutate(id)
    }
  }
'''
content = content.replace("const handleEditAccount", mutations_code + "\n  const handleEditAccount")

# 7. Loading condition
content = content.replace("if (accountsLoading || debtsLoading)", "if (accountsLoading || debtsLoading || withdrawalsLoading)")

# 8. Title update
content = content.replace("الديون والسلف", "الديون والسلف والسحوبات")

# 9. TabsList trigger update
tab_trigger = '''<TabsTrigger value="debts" className="gap-2">
              <Banknote className="h-4 w-4" /> كل الديون
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <Wallet className="h-4 w-4" /> السحوبات
            </TabsTrigger>'''
content = content.replace('''<TabsTrigger value="debts" className="gap-2">
              <Banknote className="h-4 w-4" /> كل الديون
            </TabsTrigger>''', tab_trigger)

content = content.replace('''<TabsList className="grid w-full grid-cols-2 max-w-md">''', '''<TabsList className="grid w-full grid-cols-3 max-w-xl">''')

# 10. Withdrawals Tab Content
withdrawals_tab_content = '''
          <TabsContent value="withdrawals">
            <motion.div variants={staggerContainer}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">قائمة السحوبات</CardTitle>
                  {hasPermission('create withdrawals') && (
                    <Button onClick={() => { withdrawalForm.reset(); setWithdrawalModalOpen(true) }} className="gap-2">
                      <Plus className="h-4 w-4" /> سحب جديد
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>المصدر</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>بواسطة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {withdrawals?.map((withdrawal: Withdrawal, index: number) => (
                          <motion.tr
                            key={withdrawal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">{formatDate(withdrawal.withdrawal_date || withdrawal.created_at || new Date().toISOString())}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-red-600">{formatCurrency(parseFloat(String(withdrawal.amount)))}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={(withdrawal.source || withdrawal.payment_method || 'cash') === 'cash' ? 'default' : 'secondary'} className={cn(
                                (withdrawal.source || withdrawal.payment_method || 'cash') === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              )}>
                                {(withdrawal.source || withdrawal.payment_method || 'cash') === 'bank' ? 'البنك' : 'الخزينة'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{withdrawal.notes || '-'}</TableCell>
                            <TableCell>{withdrawal.withdrawn_by || withdrawal.user?.name || '-'}</TableCell>
                            <TableCell>
                              {hasPermission('delete withdrawals') && (
                                <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteWithdrawal(withdrawal.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                  {withdrawalsData && withdrawalsData.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawalsPage(p => Math.max(1, p - 1))}
                        disabled={withdrawalsPage === 1}
                      >
                        السابق
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحة {withdrawalsData.current_page} من {withdrawalsData.last_page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawalsPage(p => Math.min(withdrawalsData.last_page, p + 1))}
                        disabled={withdrawalsPage === withdrawalsData.last_page}
                      >
                        التالي
                      </Button>
                    </div>
                  )}
                  {withdrawals?.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">لا توجد سحوبات</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
'''
content = content.replace('''        </Tabs>
      )}''', withdrawals_tab_content + "\n        </Tabs>\n      )}")

# 11. Withdrawal dialog
withdrawal_dialog = '''

      {/* Withdrawal Modal */}
      <Dialog open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>سحب جديد</DialogTitle></DialogHeader>
          <form onSubmit={withdrawalForm.handleSubmit((data) => createWithdrawalMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>من قام بالسحب *</Label>
              <Input {...withdrawalForm.register('withdrawn_by')} placeholder="اسم الشخص" />
              {withdrawalForm.formState.errors.withdrawn_by && (
                <p className="text-sm text-destructive">{withdrawalForm.formState.errors.withdrawn_by.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input type="number" min={0} step="0.01" {...withdrawalForm.register('amount')} />
              {withdrawalForm.formState.errors.amount && (
                <p className="text-sm text-destructive">{withdrawalForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع *</Label>
              <Select value={withdrawalForm.watch('payment_method')} onValueChange={(v) => withdrawalForm.setValue('payment_method', v as 'cash' | 'bank')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي (الخزينة)</SelectItem>
                  <SelectItem value="bank">بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal">
                    {withdrawalForm.watch('withdrawal_date') ? format(withdrawalForm.watch('withdrawal_date'), 'PPP', { locale: ar }) : 'اختر تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={withdrawalForm.watch('withdrawal_date')}
                    onSelect={(date) => withdrawalForm.setValue('withdrawal_date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...withdrawalForm.register('notes')} placeholder="ملاحظات إضافية" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setWithdrawalModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createWithdrawalMutation.isPending}>
                {createWithdrawalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تسجيل
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
'''
content = content.replace('''<Dialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>''', withdrawal_dialog + "\n      <Dialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>")

with open('frontend/src/pages/DebtsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
