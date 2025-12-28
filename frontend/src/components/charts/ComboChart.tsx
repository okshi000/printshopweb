// مكون الرسم البياني المركب (أعمدة + خطوط)

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataSeries {
  key: string;
  name: string;
  color: string;
  type: 'line' | 'bar' | 'area';
  yAxisId?: 'left' | 'right';
}

interface ComboChartProps<T = Record<string, unknown>> {
  data: T[];
  xKey: string;
  series: DataSeries[];
  height?: number;
  title?: string;
  subtitle?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  formatXAxis?: (value: string) => string;
  formatLeftAxis?: (value: number) => string;
  formatRightAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
  className?: string;
}

export function ComboChart<T>({
  data,
  xKey,
  series,
  height = 350,
  title,
  subtitle,
  showGrid = true,
  showLegend = true,
  formatXAxis,
  formatLeftAxis = (value) => value.toLocaleString('ar-LY'),
  formatRightAxis = (value) => value.toLocaleString('ar-LY'),
  formatTooltip,
  className = '',
}: ComboChartProps<T>) {
  const hasRightAxis = series.some(s => s.yAxisId === 'right');

  const renderSeries = (item: DataSeries, index: number) => {
    const commonProps = {
      dataKey: item.key,
      name: item.name,
      yAxisId: item.yAxisId || 'left',
    };

    switch (item.type) {
      case 'bar':
        return (
          <Bar
            key={index}
            {...commonProps}
            fill={item.color}
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        );
      case 'area':
        return (
          <Area
            key={index}
            {...commonProps}
            type="monotone"
            stroke={item.color}
            fill={item.color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        );
      case 'line':
      default:
        return (
          <Line
            key={index}
            {...commonProps}
            type="monotone"
            stroke={item.color}
            strokeWidth={2}
            dot={{ fill: item.color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        );
    }
  };

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: hasRightAxis ? 60 : 30, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        )}
        
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          tickFormatter={formatXAxis}
        />
        
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12 }}
          tickLine={false}
          tickFormatter={formatLeftAxis}
        />
        
        {hasRightAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={formatRightAxis}
          />
        )}
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          formatter={formatTooltip}
        />
        
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        )}
        
        {series.map(renderSeries)}
      </ComposedChart>
    </ResponsiveContainer>
  );

  if (title) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
};

export default ComboChart;
