# أمثلة على استخدام نظام التقارير

## مثال 1: استخدام مكونات الرسوم البيانية

### Line Chart - مخطط خطي
```typescript
import { LineChartComponent } from '@/components/charts';

const data = [
  { month: 'يناير', sales: 4000, expenses: 2400 },
  { month: 'فبراير', sales: 3000, expenses: 1398 },
  { month: 'مارس', sales: 2000, expenses: 9800 },
];

<LineChartComponent
  data={data}
  xKey="month"
  yKeys={[
    { key: 'sales', name: 'المبيعات', color: '#10b981' },
    { key: 'expenses', name: 'المصروفات', color: '#ef4444' }
  ]}
  height={400}
  title="المبيعات والمصروفات الشهرية"
  formatValue={(value) => `${value.toLocaleString()} جنيه`}
/>
```

### Bar Chart - مخطط شريطي
```typescript
import { BarChartComponent } from '@/components/charts';

const data = [
  { product: 'منتج أ', revenue: 4000 },
  { product: 'منتج ب', revenue: 3000 },
  { product: 'منتج ج', revenue: 2000 },
];

<BarChartComponent
  data={data}
  xKey="product"
  yKeys={[
    { key: 'revenue', name: 'الإيرادات', color: '#3b82f6' }
  ]}
  height={400}
  title="الإيرادات حسب المنتج"
  layout="vertical"
/>
```

### Pie Chart - مخطط دائري
```typescript
import { PieChartComponent } from '@/components/charts';

const data = [
  { category: 'فئة أ', amount: 4000, percentage: 40 },
  { category: 'فئة ب', amount: 3000, percentage: 30 },
  { category: 'فئة ج', amount: 3000, percentage: 30 },
];

<PieChartComponent
  data={data}
  dataKey="amount"
  nameKey="category"
  height={400}
  title="توزيع المصروفات"
  showPercentage={true}
/>
```

### Area Chart - مخطط مساحي
```typescript
import { AreaChartComponent } from '@/components/charts';

const data = [
  { date: '2024-01', revenue: 4000, profit: 2400 },
  { date: '2024-02', revenue: 3000, profit: 1398 },
  { date: '2024-03', revenue: 2000, profit: 9800 },
];

<AreaChartComponent
  data={data}
  xKey="date"
  yKeys={[
    { key: 'revenue', name: 'الإيرادات', color: '#10b981' },
    { key: 'profit', name: 'الأرباح', color: '#3b82f6' }
  ]}
  height={400}
  title="نمو الإيرادات"
/>
```

## مثال 2: استخدام API التقارير

### جلب الملخص المالي
```typescript
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';

function FinancialSummaryComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => reportsApi.financial.getSummary({
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    }),
  });

  if (isLoading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ</div>;

  return (
    <div>
      <h2>الملخص المالي</h2>
      <p>الإيرادات: {data?.data.total_revenue}</p>
      <p>المصروفات: {data?.data.total_expenses}</p>
      <p>صافي الربح: {data?.data.net_profit}</p>
    </div>
  );
}
```

### جلب تقرير المبيعات
```typescript
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';

function SalesReportComponent() {
  const { data } = useQuery({
    queryKey: ['sales-by-product'],
    queryFn: () => reportsApi.sales.getByProduct({
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    }),
  });

  return (
    <table>
      <thead>
        <tr>
          <th>المنتج</th>
          <th>الكمية المباعة</th>
          <th>الإيرادات</th>
        </tr>
      </thead>
      <tbody>
        {data?.data.map((item) => (
          <tr key={item.product_id}>
            <td>{item.product_name}</td>
            <td>{item.quantity_sold}</td>
            <td>{item.total_revenue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## مثال 3: استخدام Utility Functions

### تنسيق العملة
```typescript
import { formatCurrency } from '@/lib/reportUtils';

const price = 1500.50;
console.log(formatCurrency(price)); // "١٬٥٠٠٫٥٠ ج.م.‏"
```

### حساب النمو
```typescript
import { calculateGrowth } from '@/lib/reportUtils';

const currentSales = 5000;
const previousSales = 4000;
const growth = calculateGrowth(currentSales, previousSales);
console.log(growth); // 25
```

### فلاتر التاريخ المحددة مسبقاً
```typescript
import { getPresetDateRange } from '@/lib/reportUtils';

const { startDate, endDate } = getPresetDateRange('thisMonth');
console.log(startDate, endDate);
```

### تصدير إلى CSV
```typescript
import { exportToCSV } from '@/lib/reportUtils';

const data = [
  { product: 'منتج أ', sales: 1000 },
  { product: 'منتج ب', sales: 2000 },
];

exportToCSV(data, 'sales-report');
```

## مثال 4: استخدام مكونات التقارير

### بطاقة الإحصائيات
```typescript
import { StatsCard } from '@/components/reports';
import { DollarSign } from 'lucide-react';

<StatsCard
  title="إجمالي المبيعات"
  value="150,000 جنيه"
  subtitle="هذا الشهر"
  icon={DollarSign}
  iconColor="text-green-600"
  trend={{
    value: 12.5,
    label: "مقارنة بالشهر الماضي"
  }}
/>
```

### فلتر نطاق التاريخ
```typescript
import { DateRangeFilter } from '@/components/reports';
import { useState } from 'react';

function MyComponent() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <DateRangeFilter
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      label="اختر الفترة"
    />
  );
}
```

### محدد الفترات
```typescript
import { PeriodSelector } from '@/components/reports';

<PeriodSelector
  onSelect={(startDate, endDate) => {
    console.log('Selected period:', startDate, endDate);
  }}
/>
```

## مثال 5: تقرير مخصص كامل

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangeFilter, StatsCard } from '@/components/reports';
import { LineChartComponent } from '@/components/charts';
import { reportsApi } from '@/api/reports';
import { formatCurrency } from '@/lib/reportUtils';
import { format } from 'date-fns';

export const CustomReport: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const filters = {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  };

  // جلب البيانات
  const { data: revenue } = useQuery({
    queryKey: ['revenue', filters],
    queryFn: () => reportsApi.financial.getRevenueByPeriod(filters),
  });

  const { data: summary } = useQuery({
    queryKey: ['summary', filters],
    queryFn: () => reportsApi.financial.getSummary(filters),
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">تقرير مخصص</h1>

      {/* الفلاتر */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </CardContent>
      </Card>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="الإيرادات"
          value={formatCurrency(summary?.data.total_revenue || 0)}
        />
        <StatsCard
          title="المصروفات"
          value={formatCurrency(summary?.data.total_expenses || 0)}
        />
        <StatsCard
          title="صافي الربح"
          value={formatCurrency(summary?.data.net_profit || 0)}
        />
      </div>

      {/* الرسم البياني */}
      <Card>
        <CardHeader>
          <CardTitle>الإيرادات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChartComponent
            data={revenue?.data || []}
            xKey="period"
            yKeys={[
              { key: 'revenue', name: 'الإيرادات', color: '#10b981' }
            ]}
            height={400}
            formatValue={formatCurrency}
          />
        </CardContent>
      </Card>
    </div>
  );
};
```

## نصائح للاستخدام

1. **استخدم React Query للـ Caching**: جميع استدعاءات API يجب أن تستخدم React Query للحصول على أداء أفضل
2. **قم بتنسيق البيانات**: استخدم utility functions للتنسيق المتسق
3. **التعامل مع الحالات**: تأكد من معالجة حالات التحميل والأخطاء
4. **الـ Responsive Design**: جميع المكونات مصممة لتكون responsive
5. **استخدم TypeScript**: للحصول على type safety والـ autocomplete

## الموارد الإضافية

- [Recharts Documentation](https://recharts.org/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [date-fns Documentation](https://date-fns.org/)
