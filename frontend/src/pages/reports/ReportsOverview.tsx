import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  FileText,
  BarChart3,
  PieChart,
  Users,
} from 'lucide-react';

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  reports: {
    id: string;
    name: string;
  }[];
}

export const ReportsOverview: React.FC = () => {
  const navigate = useNavigate();

  const reportCategories: ReportCategory[] = [
    {
      id: 'financial',
      title: 'التقارير المالية',
      description: 'تقارير شاملة عن الإيرادات والمصروفات والأرباح',
      icon: <DollarSign className="h-8 w-8" />,
      color: 'bg-green-500',
      path: '/reports/financial',
      reports: [
        { id: 'summary', name: 'الملخص المالي' },
        { id: 'income', name: 'قائمة الدخل' },
        { id: 'expenses', name: 'تفصيل المصروفات' },
        { id: 'profit-loss', name: 'الأرباح والخسائر' },
      ],
    },
    {
      id: 'sales',
      title: 'تقارير المبيعات',
      description: 'تحليل المبيعات حسب المنتجات والعملاء',
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'bg-blue-500',
      path: '/reports/sales',
      reports: [
        { id: 'sales-summary', name: 'ملخص المبيعات' },
        { id: 'by-product', name: 'المبيعات حسب المنتج' },
        { id: 'by-customer', name: 'المبيعات حسب العميل' },
        { id: 'top-products', name: 'الأكثر مبيعاً' },
      ],
    },
    {
      id: 'inventory',
      title: 'تقارير المخزون',
      description: 'متابعة المخزون والحركات والتقييم',
      icon: <Package className="h-8 w-8" />,
      color: 'bg-purple-500',
      path: '/reports/inventory',
      reports: [
        { id: 'inventory-summary', name: 'ملخص المخزون' },
        { id: 'stock-details', name: 'تفاصيل المخزون' },
        { id: 'movements', name: 'حركات المخزون' },
        { id: 'valuation', name: 'تقييم المخزون' },
      ],
    },
  ];

  const quickStats = [
    {
      title: 'إجمالي التقارير المتاحة',
      value: reportCategories.reduce((acc, cat) => acc + cat.reports.length, 0),
      icon: <FileText className="h-6 w-6" />,
      color: 'text-blue-600',
    },
    {
      title: 'فئات التقارير',
      value: reportCategories.length,
      icon: <PieChart className="h-6 w-6" />,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مركز التقارير</h1>
          <p className="text-gray-600 mt-2">
            تقارير شاملة وتفصيلية عن جميع جوانب النشاط التجاري
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={stat.color}>{stat.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((category) => (
          <Card
            key={category.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div
                  className={`${category.color} text-white p-3 rounded-lg`}
                >
                  {category.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {category.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {category.reports.map((report) => (
                  <div key={report.id} className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{report.name}</span>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full"
                onClick={() => navigate(category.path)}
              >
                عرض التقارير
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>مميزات نظام التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">رسوم بيانية تفاعلية</h4>
                <p className="text-sm text-gray-600">
                  عرض البيانات بطرق مرئية متنوعة
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">تقارير تفصيلية</h4>
                <p className="text-sm text-gray-600">
                  بيانات دقيقة وشاملة
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold">تحليل الاتجاهات</h4>
                <p className="text-sm text-gray-600">
                  مقارنات زمنية وتحليل النمو
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold">فلاتر متقدمة</h4>
                <p className="text-sm text-gray-600">
                  تخصيص التقارير حسب الفترة والمعايير
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
