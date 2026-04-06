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
import { productsApi } from '@/api'

const productSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  unit: z.string().default('قطعة'),
  unit_price: z.coerce.number().min(0, 'السعر يجب أن يكون صفر أو أكثر'),
  cost_price: z.coerce.number().min(0, 'السعر يجب أن يكون صفر أو أكثر').default(0),
  description: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface QuickAddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (productId: string) => void
}

export function QuickAddProductDialog({ open, onOpenChange, onSuccess }: QuickAddProductDialogProps) {
  const queryClient = useQueryClient()
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      unit: 'قطعة',
      unit_price: 0,
      cost_price: 0,
      description: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => productsApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['products-all'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('تم إضافة المنتج بنجاح')
      
      const newId = res.data.data?.id || res.data.id || ''
      if (newId) {
        onSuccess(newId.toString())
      }
      
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة المنتج')
    },
  })

  const onSubmit = (values: ProductFormData) => {
    createMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة منتج جديد بسرعة</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المنتج *</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
               <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">الوحدة</Label>
              <Input id="unit" {...form.register('unit')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">سعر البيع *</Label>
              <Input id="unit_price" type="number" step="0.01" {...form.register('unit_price')} />
              {form.formState.errors.unit_price && (
                <p className="text-sm text-red-500">{form.formState.errors.unit_price.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2 grid grid-cols-2 gap-4">
             <div className="space-y-2 col-span-2">
              <Label htmlFor="cost_price">التكلفة المتوقعة (اختياري)</Label>
              <Input id="cost_price" type="number" step="0.01" {...form.register('cost_price')} />
            </div>
          </div>
          <div className="space-y-2">
             <Label htmlFor="description">وصف المنتج (اختياري)</Label>
             <Textarea id="description" {...form.register('description')} />
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
