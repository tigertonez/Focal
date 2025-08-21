'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { palette, normKey } from '@/lib/palette';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { EngineInput } from '@/lib/types';
import { useForecast } from '@/context/ForecastContext';

interface MonthlyTimelineChartProps {
  data: any[];
  currency?: string;
  formatAs?: 'currency' | 'number';
  isAnimationActive?: boolean;
  isPrint?: boolean;
  seriesKeys: string[];
  inputs: EngineInput;
}

export function MonthlyTimelineChart({
  data,
  currency,
  formatAs = 'currency',
  isAnimationActive = true,
  isPrint = false,
  seriesKeys,
  inputs,
}: MonthlyTimelineChartProps) {
  const { t } = useForecast();

  const chartData = useMemo(
    () =>
      data.map(monthData => ({
        ...monthData,
        month: `M${monthData.month}`,
      })),
    [data]
  );
  
  const products = inputs.products || [];

  const legendPayload = useMemo(() => {
    return seriesKeys
      .map(key => {
        const product = products.find(p => p.id === key);
        if (!product) return null;
        const normalizedName = normKey(product.productName);
        const color = (palette.revenue as any)[normalizedName];
        if (!color) return null;
        
        return {
          value: product.productName,
          type: 'square',
          id: key,
          color: color,
        };
      })
      .filter(Boolean);
  }, [seriesKeys, products]);

  const valueFormatter = (value: number) => {
    if (formatAs === 'number') {
      return formatNumber(value);
    }
    const currencySymbol = currency === 'EUR' ? '€' : '$';
    if (Math.abs(value) >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(Number(value), currency || 'USD', true);
  };
  
  const tooltipFormatter = (value: number, name: string) => {
    const product = products.find(p => p.id === name);
    const productName = product?.productName || name;
    const normalizedName = normKey(productName);
    const color = (palette.revenue as any)[normalizedName];

    const formattedValue = formatAs === 'number' ? formatNumber(value) : formatCurrency(Number(value), currency || 'USD');
    return (
        <div className="flex items-center">
            <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }}/>
            <div className="flex flex-1 justify-between">
                <span>{productName}</span>
                <span className="ml-4 font-bold">{formattedValue}</span>
            </div>
        </div>
    )
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        No data to display.
      </div>
    );
  }
  
  const chartHeight = 320;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={valueFormatter}
        />
        <Tooltip contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
        }}
        formatter={tooltipFormatter}
        />
        <Legend payload={legendPayload as any[]} />
        
        {seriesKeys.map(key => {
            const product = products.find(p => p.id === key);
            if (!product) return null;
            const normalizedName = normKey(product.productName);
            const color = (palette.revenue as any)[normalizedName];
            if (!color) return null;

            return (
                <Bar
                    key={key}
                    dataKey={key}
                    name={product.productName}
                    stackId="a"
                    fill={color}
                    isAnimationActive={!isPrint && isAnimationActive}
                    className={`series series-${normalizedName}`}
                    data-series={normalizedName}
                />
            )
        })}

      </BarChart>
    </ResponsiveContainer>
  );
}
