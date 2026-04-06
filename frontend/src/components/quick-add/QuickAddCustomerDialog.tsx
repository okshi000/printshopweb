import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { customersApi } from '@/api'

const customerSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface QuickAddCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (customerId: string) => void
}

export function QuickAddCustomerDialog({ open, onOpenChange, onSuccess }: QuickAddCustomerDialogProps) {
  const queryClient = useQueryClient()
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      phone2: '',
      address: '',
      notes: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customersApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['customers-all'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('تم إضافة العميل بنجاح')
      
      // Attempt to get the new id (can be res.data.data?.id or res.data?.id)
      const newId = res.data.data?.id || res.data.id || ''
      if (newId) {
        onSuccess(newId.toString())
      }
      
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة العميل')
    },
  })

  const onSubmit = (values: CustomerFormData) => {
    createMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد بسرعة</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم العميل *</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" {...form.register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone2">رقم هاتف إضافي</Label>
              <Input id="phone2" {...form.register('phone2')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input id="address" {...form.register('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" {...form.register('notes')} />
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'جاري الإضافة...' : 'حفظ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
