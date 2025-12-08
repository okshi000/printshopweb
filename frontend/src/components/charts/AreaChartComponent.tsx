import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AreaChartComponentProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; name: string; color: string }[];
  height?: number;
  title?: string;
  formatValue?: (value: number) => string;
}

export const AreaChartComponent: React.FC<AreaChartComponentProps> = ({
  data,
  xKey,
  yKeys,
  height = 300,
  title,
  formatValue = (value) => value.toLocaleString(),
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-right">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {yKeys.map((item, index) => (
              <linearGradient
                key={index}
                id={`color${item.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={item.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={item.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
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
            <Area
              key={index}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={item.color}
              fillOpacity={1}
              fill={`url(#color${item.key})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
