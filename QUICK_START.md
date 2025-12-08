# 🚀 دليل البدء السريع - نظام التقارير

## التشغيل

### 1. Backend
```bash
cd backend
php artisan serve
```

### 2. Frontend
```bash
cd frontend
npm run dev
```

### 3. افتح المتصفح
```
http://localhost:5173/reports
```

## الروابط المتاحة

- **الصفحة الرئيسية**: `/reports`
- **التقارير المالية**: `/reports/financial`
- **تقارير المبيعات**: `/reports/sales`
- **تقارير المخزون**: `/reports/inventory`

## API Endpoints

جميع endpoints تبدأ بـ: `/api/reports-v2/`

### أمثلة:
```bash
GET /api/reports-v2/financial/summary?start_date=2024-01-01&end_date=2024-12-31
GET /api/reports-v2/sales/by-product?start_date=2024-01-01&end_date=2024-12-31
GET /api/reports-v2/inventory/summary
```

## مكونات الرسوم البيانية

```typescript
// Line Chart
<LineChartComponent
  data={data}
  xKey="date"
  yKeys={[{ key: 'revenue', name: 'الإيرادات', color: '#10b981' }]}
/>

// Bar Chart
<BarChartComponent
  data={data}
  xKey="product"
  yKeys={[{ key: 'sales', name: 'المبيعات', color: '#3b82f6' }]}
/>

// Pie Chart
<PieChartComponent
  data={data}
  dataKey="amount"
  nameKey="category"
/>

// Area Chart
<AreaChartComponent
  data={data}
  xKey="month"
  yKeys={[{ key: 'profit', name: 'الربح', color: '#10b981' }]}
/>
```

## Utility Functions

```typescript
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  calculateGrowth,
  exportToCSV,
} from '@/lib/reportUtils';

// تنسيق العملة
formatCurrency(1500); // "١٬٥٠٠ ج.م.‏"

// حساب النمو
calculateGrowth(5000, 4000); // 25

// تصدير CSV
exportToCSV(data, 'report-name');
```

## المكتبات المستخدمة

- **Recharts** - الرسوم البيانية
- **React Query** - إدارة البيانات
- **date-fns** - التواريخ
- **Tailwind CSS** - التنسيق

## المميزات

✅ 20+ تقرير مختلف
✅ 4 أنواع رسوم بيانية
✅ فلاتر متقدمة
✅ تصدير CSV
✅ RTL Support
✅ Responsive Design
✅ TypeScript
✅ Documentation

## الدعم

راجع:
- `REPORTS_DOCUMENTATION.md` - توثيق شامل
- `REPORTS_EXAMPLES.md` - أمثلة الاستخدام
- `REPORTS_SUMMARY_AR.md` - الملخص بالعربية

---
✨ جاهز للاستخدام!
