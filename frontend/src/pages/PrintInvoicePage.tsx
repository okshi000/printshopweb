'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { invoicesApi } from '../api'

// ==================== Types ====================
interface ItemCost {
  id: number
  supplier_id?: number
  supplier_name?: string
  cost_type: string
  amount: number
  notes?: string
}

interface InvoiceItem {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  total: number
  total_price?: number
  total_cost?: number
  profit?: number
  description?: string
  notes?: string
  costs?: ItemCost[]
}

interface InvoicePayment {
  id: number
  amount: number
  payment_method: string
  payment_date?: string
  created_at?: string
  notes?: string
}

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  customer_phone?: string
  customer_address?: string
  phone?: string
  status: string
  subtotal: number
  discount: number
  total: number
  total_amount: number
  total_cost?: number
  profit?: number
  paid_amount: number
  remaining_amount: number
  delivery_date?: string
  notes?: string
  created_at: string
  invoice_date?: string
  items: InvoiceItem[]
  payments?: InvoicePayment[]
}

// ==================== Constants ====================
const COMPANY_PHONE = '0910275552'
const COMPANY_ADDRESS = 'طرابلس، ليبيا'

// ==================== Helpers ====================
const formatDate = (date: string | null | undefined, formatStr: string, options?: any) => {
  if (!date) return '-'
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return '-'
    return format(dateObj, formatStr, options)
  } catch {
    return '-'
  }
}

const getPaymentMethodName = (method: string): string => {
  const methods: Record<string, string> = {
    'cash': 'نقدي',
    'bank_transfer': 'تحويل بنكي',
    'check': 'شيك',
    'credit_card': 'بطاقة ائتمان',
  }
  return methods[method] || method
}

// ==================== Logo Component ====================
// SVG مضمن مباشرة في الكود لضمان ظهوره في الطباعة
const Logo = () => (
  <svg 
    width="120" 
    height="120" 
    viewBox="0 0 283.46 283.46" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fill="#f58220" d="M209.81,114.33c1.25-3.08,3.98-4.37,6.75-5.59,4.9-2.16,10.17-3.27,15.16-5.17,1.7-.65,3.4-1.29,4.69-2.67.58-.63.99-1.31,1.03-2.23-.77-.04-1.66.78-2.23-.29-.41-.78-.09-1.5.32-2.18.43-.72,1.03-1.25,1.9-.91.8.31,1.11,1.05,1.02,1.9-.33,3.34-2.27,5.54-5.13,7.02-3.5,1.8-7.33,2.69-11.04,3.91-3.19,1.05-6.39,2.04-9.33,3.72-1.19.68-2.25,1.47-3.15,2.49Z"/>
    <path fill="#f58220" d="M244.65,147.6c-9.66.84-18.63-1.47-23.85-12.01-1.37-2.77-2.2-8.18-.87-9.87,1.85-2.33,6.57-3.99,9.01-2.89,4.34,1.96,7.89,6.21,11.99,9.69,3.18-8.21,1.38-16.19-5.6-19.52-6.77-3.23-12.95.81-16.72,10.66-3.93,10.24-5.58,20.16,3.72,29.97-5.25.49-8.99.99-12.75,1.17-6.34.3-13.83,3.38-15.55,3.49-11.03.74-14.52-3.09-14.38-12.13.19-12.16-.19-24.34-.05-36.5.08-6.59-1.55-13.48,2.66-19.59-6.72,6.16-12.89,12.48-12.66,22.53.25,10.95.23,21.91.39,32.86.06,4.15-.91,7.42-5.58,8.43-1.71.37-3.32,1.22-5.02,1.7-11.26,3.16-39.08,2.45-50.45.72-13.26-2.02-26.24-5.66-39.67-6.71-9.31-.73-18.51-.44-27.43,2.59-9.22,3.13-15.86,9.26-20.05,18.03-.42.88-1,1.79-.07,2.87,4.16,4.85,8.46,9.52,14.41,12.26,8.07,3.72,16.72,4.48,25.4,4.98,11.17.64,22.14-1.06,33.08-3.05,9.57-1.74,18.65-1.09,26.29,6.08-.71-2.21-2.27-3.85-3.72-5.52-4.79-5.53-9.91-10.61-17.44-12.28-5.97-1.33-11.88-.54-17.73.59-12.24,2.37-24.53,3.5-36.97,2.1-6.32-.71-12.61-1.63-18.36-4.63-1.54-.8-3.76-1.6-3.68-3.39.08-1.75,1.98-3,3.64-3.91.07-.04.14-.07.21-.11,6.86-3.84,14.36-5.01,22.07-5.31,11.93-.47,23.53,1.83,35.12,4.17,12.62,2.55,25.23,5.18,38.23,4.06,7.62-.66,31.35-2.46,38.07-6.26,3.41-1.93,6.42-4.39,9.63-7.51,0,1.88-.02,3.14,0,4.41.11,6.16,2.55,8.97,8.58,9.95,5.41.88,10.62-.25,15.67-1.87,6.32-2.03,4.46-2.14,10.89-2.99,16.53-.26,33.06-3.86,49.62-9.69,4.99-1.76,7.29-4.93,7.47-11.12-6.21,1.29-11.86,3.02-17.59,3.52Z"/>
    <polygon fill="#f58220" points="72.33 135.5 64.25 127.42 57.19 134.49 50.12 127.42 42.05 135.5 50.12 143.57 57.19 136.5 64.25 143.57 72.33 135.5"/>
    <rect fill="#f58220" x="139.7" y="175.76" width="11.41" height="11.41" transform="translate(-85.73 155.97) rotate(-45)"/>
  </svg>
)

// ==================== Printable Invoice Component ====================
interface PrintableInvoiceProps {
  invoice: Invoice
}

const PrintableInvoice = ({ invoice }: PrintableInvoiceProps) => {
  const totalAmount = invoice.total || invoice.total_amount || 0
  const subtotal = invoice.subtotal || totalAmount
  const customerPhone = invoice.customer_phone || invoice.phone
  const payments = invoice.payments || []

  // Inline styles للتأكد من ظهورها في الطباعة
  const styles = {
    container: {
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      direction: 'rtl' as const,
      background: 'white',
      color: '#333',
      maxWidth: '210mm',
      margin: '0 auto',
      padding: '20px',
    },
    header: {
      textAlign: 'center' as const,
      paddingBottom: '20px',
      borderBottom: '3px solid #f58220',
      marginBottom: '25px',
    },
    companyInfo: {
      fontSize: '14px',
      color: '#666',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '30px',
    },
    infoBox: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      background: '#fafafa',
    },
    infoBoxTitle: {
      fontSize: '16px',
      fontWeight: 'bold' as const,
      color: '#f58220',
      marginBottom: '10px',
      paddingBottom: '8px',
      borderBottom: '1px solid #eee',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold' as const,
      color: '#333',
      margin: '25px 0 15px',
      paddingBottom: '8px',
      borderBottom: '2px solid #f58220',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '25px',
    },
    tableHeader: {
      background: '#f58220',
      color: 'white',
      padding: '12px 10px',
      textAlign: 'right' as const,
      fontWeight: 'bold' as const,
      fontSize: '14px',
    },
    tableCell: {
      padding: '10px',
      textAlign: 'right' as const,
      borderBottom: '1px solid #ddd',
      fontSize: '14px',
    },
    paymentsTableHeader: {
      background: '#4caf50',
      color: 'white',
      padding: '10px',
      textAlign: 'right' as const,
      fontWeight: 'bold' as const,
    },
    totalsSection: {
      marginRight: 'auto',
      width: '320px',
      marginTop: '20px',
    },
    grandTotal: {
      fontSize: '18px',
      fontWeight: 'bold' as const,
      color: '#f58220',
      background: '#fff8e1',
      borderTop: '2px solid #f58220',
    },
    paymentSummary: {
      background: '#e3f2fd',
      border: '1px solid #90caf9',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '25px',
      textAlign: 'center' as const,
    },
    footer: {
      textAlign: 'center' as const,
      marginTop: '40px',
      paddingTop: '20px',
      borderTop: '1px solid #ddd',
      color: '#666',
      fontSize: '13px',
    },
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Logo />
        <div style={styles.companyInfo}>
          <p>الهاتف: {COMPANY_PHONE}</p>
          <p>العنوان: {COMPANY_ADDRESS}</p>
        </div>
      </div>

      {/* Invoice & Customer Info */}
      <div style={styles.infoGrid}>
        <div style={styles.infoBox}>
          <h3 style={styles.infoBoxTitle}>بيانات العميل</h3>
          <p><strong>الاسم:</strong> {invoice.customer_name}</p>
          {customerPhone && <p><strong>الهاتف:</strong> {customerPhone}</p>}
          {invoice.customer_address && <p><strong>العنوان:</strong> {invoice.customer_address}</p>}
        </div>

        <div style={styles.infoBox}>
          <h3 style={styles.infoBoxTitle}>بيانات الفاتورة</h3>
          <p><strong>رقم الفاتورة:</strong> {invoice.invoice_number}</p>
          <p><strong>التاريخ:</strong> {formatDate(invoice.invoice_date || invoice.created_at, 'dd MMMM yyyy', { locale: ar })}</p>
          {invoice.delivery_date && (
            <p><strong>تاريخ التسليم:</strong> {formatDate(invoice.delivery_date, 'dd MMMM yyyy', { locale: ar })}</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <h3 style={styles.sectionTitle}>بنود الفاتورة</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>#</th>
            <th style={styles.tableHeader}>المنتج/الخدمة</th>
            <th style={styles.tableHeader}>الكمية</th>
            <th style={styles.tableHeader}>سعر الوحدة</th>
            <th style={styles.tableHeader}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} style={{ background: index % 2 === 1 ? '#f9f9f9' : 'white' }}>
              <td style={styles.tableCell}>{index + 1}</td>
              <td style={styles.tableCell}>
                {item.product_name}
                {item.description && <div style={{ fontSize: '12px', color: '#666' }}>{item.description}</div>}
              </td>
              <td style={styles.tableCell}>{item.quantity}</td>
              <td style={styles.tableCell}>{formatCurrency(item.unit_price)}</td>
              <td style={styles.tableCell}>{formatCurrency(item.total || item.total_price || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={styles.totalsSection}>
        <table style={{ width: '100%', fontSize: '15px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>الإجمالي الفرعي:</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formatCurrency(subtotal)}</td>
            </tr>
            {invoice.discount > 0 && (
              <tr style={{ color: '#d32f2f' }}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>الخصم:</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>- {formatCurrency(invoice.discount)}</td>
              </tr>
            )}
            <tr>
              <td style={{ ...styles.grandTotal, padding: '8px' }}>الإجمالي الكلي:</td>
              <td style={{ ...styles.grandTotal, padding: '8px' }}>{formatCurrency(totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payments */}
      {payments.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>سجل الدفعات</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.paymentsTableHeader}>التاريخ</th>
                <th style={styles.paymentsTableHeader}>طريقة الدفع</th>
                <th style={styles.paymentsTableHeader}>المبلغ</th>
                <th style={styles.paymentsTableHeader}>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={styles.tableCell}>{formatDate(payment.payment_date || payment.created_at, 'dd/MM/yyyy', { locale: ar })}</td>
                  <td style={styles.tableCell}>{getPaymentMethodName(payment.payment_method)}</td>
                  <td style={styles.tableCell}>{formatCurrency(payment.amount)}</td>
                  <td style={styles.tableCell}>{payment.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Payment Summary */}
      <div style={styles.paymentSummary}>
        <p style={{ margin: '5px 0', fontSize: '15px' }}><strong>المبلغ المدفوع:</strong> {formatCurrency(invoice.paid_amount)}</p>
        <p style={{ margin: '5px 0', fontSize: '15px' }}><strong>المتبقي:</strong> {formatCurrency(invoice.remaining_amount)}</p>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#fff8e1', borderRadius: '8px' }}>
          <strong>ملاحظات:</strong> {invoice.notes}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p>شكراً لتعاملكم معنا</p>
        <p style={{ fontSize: '11px', marginTop: '5px' }}>
          تم الطباعة في: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}
        </p>
      </div>
    </div>
  )
}

// ==================== Main Component ====================
export default function PrintInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch invoice data
  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await invoicesApi.getById(Number(id))
      return res.data.data || res.data
    },
    enabled: !!id,
  })

  // Print handler using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice ? `فاتورة-${invoice.invoice_number}` : 'فاتورة',
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-96 w-full max-w-3xl" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">الفاتورة غير موجودة</h2>
          <p className="text-gray-600 mb-4">عذراً، لم نتمكن من العثور على الفاتورة المطلوبة</p>
          <Button onClick={() => navigate('/invoices')}>العودة للفواتير</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="no-print bg-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/invoices/${id}`)}>
            <ArrowLeft className="h-5 w-5 ml-2" />
            العودة للفاتورة
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={() => handlePrint()} 
              className="gap-2"
              style={{ background: '#f58220' }}
            >
              <Printer className="h-4 w-4" />
              طباعة الفاتورة
            </Button>
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef}>
        <PrintableInvoice invoice={invoice} />
      </div>
    </>
  )
}
