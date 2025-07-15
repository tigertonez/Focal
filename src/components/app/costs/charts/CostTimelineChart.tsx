
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Rectangle } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { type FixedCostItem } from "@/lib/types"

const HSL_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

interface CostTimelineChartProps {
  data: any[];
  currency: string;
  fixedCostDefs: FixedCostItem[];
}

// Custom shape for the bar to handle rounding only the top-most bar in a stack
const CustomBar = (props: any) => {
  const { x, y, width, height, fill, background } = props;
  const dataKey = props.dataKey;
  const payload = props.payload;
  
  // Calculate total for the current stack
  let total = 0;
  Object.keys(payload).forEach(key => {
    if (typeof payload[key] === 'number' && key !== 'month' && key !== 'total' && key !== 'name') {
      total += payload[key];
    }
  });

  // Calculate the value up to the current bar
  let cumulative = 0;
  const keys = Object.keys(payload).filter(k => typeof payload[k] === 'number' && k !== 'month' && k !== 'total' && k !== 'name');
  for (const key of keys) {
    cumulative += payload[key];
    if (key === dataKey) break;
  }
  
  // Check if this is the top-most bar with a non-zero value
  const isTop = cumulative === total;
  const radius = isTop ? [4, 4, 0, 0] : [0, 0, 0, 0];
  
  return <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={radius} />;
};


export function CostTimelineChart({ data, currency, fixedCostDefs }: CostTimelineChartProps) {
  const { chartData, chartConfig, costKeys } = React.useMemo(() => {
    const monthlyData = data.map(month => ({
      ...month,
      name: `M${month.month}`,
    }));

    const allCostKeys = new Set<string>();
    monthlyData.forEach(month => {
      Object.keys(month).forEach(key => {
        if (key !== 'month' && key !== 'name' && key !== 'total' && month[key] > 0) {
          allCostKeys.add(key);
        }
      });
    });

    const sortedCostKeys = Array.from(allCostKeys).sort((a, b) => {
        if (a === 'deposits') return -1;
        if (b === 'deposits') return 1;
        if (a === 'finalPayments') return -1;
        if (b === 'finalPayments') return 1;
        return a.localeCompare(b);
    });
    
    const config: ChartConfig = {};
    const fixedCostMap = new Map(fixedCostDefs.map(fc => [fc.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(), fc]));

    sortedCostKeys.forEach((key, index) => {
      let label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      if (key === 'deposits') label = 'Deposits';
      if (key === 'finalPayments') label = 'Final Payments';

      const fixedCostDef = fixedCostMap.get(key);
      if (fixedCostDef) {
        label = `${fixedCostDef.name}`;
      }
      
      config[key] = {
        label,
        color: HSL_COLORS[index % HSL_COLORS.length],
      };
    });

    return { chartData: monthlyData, chartConfig: config, costKeys: sortedCostKeys };
  }, [data, fixedCostDefs]);

  if (chartData.length === 0 || costKeys.length === 0) {
    return (
        <div className="flex h-[250px] w-full items-center justify-center rounded-lg bg-muted/50 p-4 text-center text-muted-foreground">
            <p>No cost data to display. Please add costs on the Inputs page.</p>
        </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 10,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(Number(value), currency).slice(0, -3)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `Month ${label.substring(1)}`}
              formatter={(value, name) => (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span>{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                    <span className="font-bold">{formatCurrency(Number(value), currency)}</span>
                  </div>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {costKeys.map((key) => (
            <Bar 
                key={key} 
                dataKey={key} 
                stackId="a" 
                fill={`var(--color-${key})`} 
                shape={<CustomBar />}
            />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
