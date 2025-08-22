
'use client';

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
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import type { EngineInput } from '@/lib/types';

interface MonthlyUnitsSoldChartProps {
  data: any[];
  isPrint?: boolean;
  seriesKeys: string[];
  inputs: EngineInput;
  seriesHexColors?: Record<string, string>;
  legendFontPx?: number;
}

export function MonthlyUnitsSoldChart({
  data,
  isPrint = false,
  seriesKeys,
  inputs,
  seriesHexColors = {},
  legendFontPx = 12,
}: MonthlyUnitsSoldChartProps) {
  const chartData = React.useMemo(
    () =>
      data.map(monthData => ({
        ...monthData,
        month: `M${monthData.month}`,
      })),
    [data]
  );
  
  const products = inputs.products || [];

  const legendPayload = React.useMemo(() => {
    return seriesKeys
      .map(key => {
        const product = products.find(p => p.id === key);
        if (!product) return null;
        
        return {
          value: product.productName,
          type: 'square',
          id: key,
          color: isPrint ? seriesHexColors[key] : product.color,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [seriesKeys, products, isPrint, seriesHexColors]);

  const valueFormatter = (value: number) => {
    return formatNumber(value);
  };
  
  const tooltipFormatter = (value: number, name: string) => {
    const product = products.find(p => p.id === name);
    const productName = product?.productName || name;
    const color = isPrint ? seriesHexColors[name] : product?.color;

    const formattedValue = formatNumber(value);
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
  
  const chartHeight = isPrint ? 380 : 320;
  const chartKey = isPrint ? 'print' : 'live';

  return (
    <div data-revenue-chart="units-sold" style={{height: chartHeight, width: '100%', overflow: 'visible'}}>
        <ResponsiveContainer width="100%" height={chartHeight} key={chartKey}>
        <BarChart
            data={chartData}
            margin={{ top: 8, right: 16, bottom: isPrint ? 20 : 5, left: 8 }}
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
            <Tooltip 
              contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
              }}
              formatter={tooltipFormatter}
              isAnimationActive={!isPrint}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="square"
              iconSize={10}
              wrapperStyle={{ width: '100%', textAlign: 'center', fontSize: legendFontPx, marginTop: 4, position: 'relative' }}
            />
            
            {seriesKeys.map(key => {
                const product = products.find(p => p.id === key);
                if (!product) return null;
                const color = isPrint ? seriesHexColors[key] : product.color;

                return (
                    <Bar
                        key={isPrint ? `print-${key}` : key}
                        dataKey={key}
                        name={product.productName}
                        stackId="a"
                        fill={color}
                        isAnimationActive={!isPrint}
                    />
                )
            })}
        </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
