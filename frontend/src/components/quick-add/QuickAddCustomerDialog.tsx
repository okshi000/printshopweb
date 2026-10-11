import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { customersApi } from '@/api'

const customerSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  whatsapp_name: z.string().optional(),
  whatsapp_phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
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
      whatsapp_name: '',
      whatsapp_phone: '',
      address: '',
      notes: '',
      is_active: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customersApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['customers-all'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('تم إضافة العميل بنجاح')

      const newId = res.data.data?.id || res.data.id || ''
      if (newId) {
        onSuccess(newId.toString())
      }

      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'حدث خطأ أثناء إضافة العميل'
      toast.error(message)
    },
  })

  const onSubmit = (values: CustomerFormData) => {
    createMutation.mutate(values)
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose()
      else onOpenChange(true)
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات العميل الجديد لإضافته للنظام
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-customer-name">اسم العميل *</Label>
            <Input
              id="quick-customer-name"
              placeholder="أدخل اسم العميل"
              {...form.register('name')}
              className={form.formState.errors.name ? 'border-destructive' : ''}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-customer-phone">رقم الهاتف</Label>
              <Input
                id="quick-customer-phone"
                placeholder="05xxxxxxxx"
                {...form.register('phone')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-customer-phone2">رقم هاتف إضافي</Label>
              <Input
                id="quick-customer-phone2"
                placeholder="05xxxxxxxx"
                {...form.register('phone2')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="space-y-2">
              <Label htmlFor="quick-customer-whatsapp-name" className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                اسم العميل على واتساب
              </Label>
              <Input
                id="quick-customer-whatsapp-name"
                placeholder="مثال: أبو أحمد"
                {...form.register('whatsapp_name')}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-customer-whatsapp-phone" className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                رقم العميل على واتساب
              </Label>
              <Input
                id="quick-customer-whatsapp-phone"
                placeholder="09xxxxxxxx أو 218xxxxxxxx"
                dir="ltr"
                {...form.register('whatsapp_phone')}
                className="bg-background font-mono text-left"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-customer-address">العنوان</Label>
            <Textarea
              id="quick-customer-address"
              placeholder="عنوان العميل"
              {...form.register('address')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-customer-notes">ملاحظات</Label>
            <Textarea
              id="quick-customer-notes"
              placeholder="ملاحظات إضافية"
              {...form.register('notes')}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              )}
              إضافة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
