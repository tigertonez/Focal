
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
import { formatCurrency, formatNumber, getProductColor } from '@/lib/utils';
import type { EngineInput, Product } from '@/lib/types';
import { useForecast } from '@/context/ForecastContext';

interface MonthlyUnitsSoldChartProps {
  data: any[];
  isAnimationActive?: boolean;
  isPrint?: boolean;
  seriesKeys: string[];
  inputs: EngineInput;
  seriesColors?: Record<string, string>;
}

export function MonthlyUnitsSoldChart({
  data,
  isAnimationActive = true,
  isPrint = false,
  seriesKeys,
  inputs,
  seriesColors = {},
}: MonthlyUnitsSoldChartProps) {
  const { t } = useForecast();

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
          color: isPrint ? seriesColors[product.productName] : getProductColor(product),
        };
      })
      .filter(Boolean);
  }, [seriesKeys, products, isPrint, seriesColors]);

  const valueFormatter = (value: number) => {
    return formatNumber(value);
  };
  
  const tooltipFormatter = (value: number, name: string) => {
    const product = products.find(p => p.id === name);
    const productName = product?.productName || name;
    const color = isPrint ? seriesColors[productName] : getProductColor(product || {id: name});

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

  return (
    <div data-revenue-chart="bars" data-chart-key="units-sold" style={{height: chartHeight, overflow: isPrint ? 'visible' : 'hidden'}}>
        <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: isPrint ? 20 : 5 }}
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
              payload={legendPayload as any[]}
              {...(isPrint && { layout: "horizontal", align: "center", verticalAlign: "bottom", wrapperStyle: { width: '100%', textAlign: 'center', bottom: 0 } })}
            />
            
            {seriesKeys.map(key => {
                const product = products.find(p => p.id === key);
                if (!product) return null;
                const color = getProductColor(product);

                return (
                    <Bar
                        key={isPrint ? `print-${key}` : key}
                        dataKey={key}
                        name={product.productName}
                        aria-label={product.productName}
                        stackId="a"
                        fill={isPrint ? seriesColors[product.productName] : color}
                        isAnimationActive={!isPrint}
                        {...(isPrint && { 'data-color-locked': '1' })}
                    />
                )
            })}

        </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
