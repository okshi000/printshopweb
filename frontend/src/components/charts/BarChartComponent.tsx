import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartComponentProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; name: string; color: string }[];
  height?: number;
  title?: string;
  formatValue?: (value: number) => string;
  layout?: 'horizontal' | 'vertical';
  stacked?: boolean;
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  xKey,
  yKeys,
  height = 300,
  title,
  formatValue = (value) => value.toLocaleString(),
  layout = 'horizontal',
  stacked = false,
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-right">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          {layout === 'horizontal' ? (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={formatValue}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={formatValue}
              />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fontSize: 12 }}
                tickLine={false}
                width={100}
              />
            </>
          )}
          <Tooltip
            formatter={formatValue}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          {yKeys.map((item, index) => (
            <Bar
              key={index}
              dataKey={item.key}
              name={item.name}
              fill={item.color || COLORS[index % COLORS.length]}
              stackId={stacked ? 'stack' : undefined}
              radius={[8, 8, 0, 0]}
            >
              {!stacked &&
                data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={item.color || COLORS[idx % COLORS.length]}
                  />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
