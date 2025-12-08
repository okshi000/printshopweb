'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { invoicesApi } from '../api'

// Helper function to safely format dates
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

interface InvoiceItem {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  total: number
  total_price?: number
  description?: string
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
  paid_amount: number
  remaining_amount: number
  delivery_date?: string
  notes?: string
  created_at: string
  invoice_date?: string
  items: InvoiceItem[]
}

// معلومات المطبعة
const COMPANY_NAME = 'علبة'
const COMPANY_PHONE = '091-1234567'
const COMPANY_ADDRESS = 'طرابلس، ليبيا'

export default function PrintInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await invoicesApi.getById(Number(id))
      return res.data.data || res.data
    },
    enabled: !!id,
  })

  const handlePrint = () => {
    window.print()
  }

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

  const totalAmount = invoice.total || invoice.total_amount || 0
  const subtotal = invoice.subtotal || totalAmount
  const customerPhone = invoice.customer_phone || invoice.phone

  return (
    <>
      {/* Embedded Styles for Print */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .print-page {
          font-family: 'Arial', sans-serif;
          direction: rtl;
          padding: 20px;
          background: white;
          min-height: 100vh;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border: 2px solid #333;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 32px;
          color: #2196f3;
          margin-bottom: 10px;
        }
        
        .header .company-info {
          font-size: 14px;
          color: #666;
        }
        
        .header .company-info p {
          margin: 3px 0;
        }
        
        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-box {
          padding: 15px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        
        .info-box h3 {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
          border-bottom: 2px solid #2196f3;
          padding-bottom: 5px;
        }
        
        .info-box p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .notes-box {
          padding: 15px;
          background: #f0f8ff;
          border-radius: 5px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: right;
          border: 1px solid #ddd;
        }
        
        .items-table th {
          background: #2196f3;
          color: white;
          font-weight: bold;
        }
        
        .items-table tbody tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .items-table .item-desc {
          color: #666;
          font-size: 12px;
        }
        
        .totals {
          margin-top: 30px;
          margin-right: auto;
          width: 350px;
        }
        
        .totals table {
          width: 100%;
          font-size: 16px;
        }
        
        .totals td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        
        .totals .discount {
          color: #d32f2f;
        }
        
        .totals .grand-total td {
          font-size: 20px;
          font-weight: bold;
          color: #2196f3;
          border-top: 3px solid #333;
          border-bottom: 3px solid #333;
        }
        
        .payment-status {
          margin: 20px 0;
          padding: 15px;
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 5px;
          text-align: center;
        }
        
        .payment-status.paid {
          background: #d4edda;
          border-color: #28a745;
        }
        
        .payment-status .remaining {
          color: #d32f2f;
          font-size: 18px;
          margin-top: 10px;
        }
        
        .payment-status .paid-full {
          color: #28a745;
          font-size: 18px;
          margin-top: 10px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        
        .footer .print-date {
          margin-top: 10px;
          font-size: 10px;
        }
        
        .no-print {
          max-width: 800px;
          margin: 0 auto 20px;
          padding: 0 20px;
        }
        
        @media print {
          body {
            padding: 0;
            background: white;
          }
          .print-page {
            padding: 0;
          }
          .invoice-container {
            border: none;
            padding: 0;
            max-width: none;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="print-page">
        {/* Print Controls - Hidden in print */}
        <div className="no-print flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(`/invoices/${id}`)}>
            <ArrowLeft className="h-5 w-5 ml-2" />
            العودة للفاتورة
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2" style={{ background: '#2196f3' }}>
              <Printer className="h-4 w-4" />
              طباعة الفاتورة
            </Button>
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              إغلاق
            </Button>
          </div>
        </div>

        {/* Invoice Container */}
        <div className="invoice-container">
          {/* Header */}
          <div className="header">
            <h1>{COMPANY_NAME}</h1>
            <div className="company-info">
              <p>الهاتف: {COMPANY_PHONE}</p>
              <p>العنوان: {COMPANY_ADDRESS}</p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="invoice-info">
            <div className="info-box">
              <h3>بيانات العميل</h3>
              <p><strong>الاسم:</strong> {invoice.customer_name}</p>
              {customerPhone && (
                <p><strong>الهاتف:</strong> {customerPhone}</p>
              )}
              {invoice.customer_address && (
                <p><strong>العنوان:</strong> {invoice.customer_address}</p>
              )}
            </div>

            <div className="info-box">
              <h3>بيانات الفاتورة</h3>
              <p><strong>رقم الفاتورة:</strong> {invoice.invoice_number}</p>
              <p><strong>التاريخ:</strong> {formatDate(invoice.invoice_date || invoice.created_at, 'dd MMMM yyyy', { locale: ar })}</p>
              {invoice.delivery_date && (
                <p><strong>تاريخ التسليم:</strong> {formatDate(invoice.delivery_date, 'dd MMMM yyyy', { locale: ar })}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="notes-box">
              <strong>ملاحظات:</strong> {invoice.notes}
            </div>
          )}

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>المنتج/الخدمة</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.product_name}</strong>
                    {(item.description || item.notes) && (
                      <><br /><span className="item-desc">{item.description || item.notes}</span></>
                    )}
                  </td>
                  <td>{Number(item.quantity).toLocaleString('ar-LY')}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td><strong>{formatCurrency(item.total || item.total_price || 0)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            <table>
              <tbody>
                <tr>
                  <td>الإجمالي الفرعي:</td>
                  <td style={{ textAlign: 'left' }}><strong>{formatCurrency(subtotal)}</strong></td>
                </tr>
                {invoice.discount > 0 && (
                  <tr>
                    <td>الخصم:</td>
                    <td style={{ textAlign: 'left' }} className="discount">- {formatCurrency(invoice.discount)}</td>
                  </tr>
                )}
                <tr className="grand-total">
                  <td>الإجمالي الكلي:</td>
                  <td style={{ textAlign: 'left' }}>{formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status */}
          {invoice.paid_amount > 0 && (
            <div className={`payment-status ${invoice.remaining_amount <= 0 ? 'paid' : ''}`}>
              <p><strong>المبلغ المدفوع:</strong> {formatCurrency(invoice.paid_amount)}</p>
              {invoice.remaining_amount > 0 ? (
                <p className="remaining">
                  <strong>المتبقي:</strong> {formatCurrency(invoice.remaining_amount)}
                </p>
              ) : (
                <p className="paid-full">
                  <strong>✓ تم الدفع بالكامل</strong>
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <p>شكراً لتعاملكم معنا</p>
            <p className="print-date">تم الطباعة في: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          </div>
        </div>
      </div>
    </>
  )
}
