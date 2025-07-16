
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { formatCurrency, formatNumber } from "@/lib/utils"

const chartColorVars = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

// Semantic color mapping rule
const colorMap: Record<string, string> = {
    "Salaries": "hsl(var(--chart-1))", // Blue
    "Marketing": "hsl(var(--chart-4))", // Green
    "Deposits": "hsl(var(--chart-2))", // Orange
    "Final Payments": "hsl(var(--chart-5))", // Violet
    "Legal": "hsl(var(--chart-3))", // Pink
    "Software": "hsl(var(--chart-6))", // Cyan
    "Buffer": "hsl(var(--muted-foreground))", // Gray for buffer
};

const getColorForKey = (key: string) => {
    const lowerKey = key.toLowerCase();
    for (const mapKey in colorMap) {
        if (lowerKey.includes(mapKey.toLowerCase())) {
            return colorMap[mapKey];
        }
    }
    // Fallback for unknown keys
    const index = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `hsl(${chartColorVars[index % chartColorVars.length]})`;
};


interface CostTimelineChartProps {
  data: any[];
  currency?: string;
  configOverrides?: Record<string, { label: string }>;
  formatAs?: 'currency' | 'number';
}

export function CostTimelineChart({ data, currency, configOverrides, formatAs = 'currency' }: CostTimelineChartProps) {
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});
  const [costKeys, setCostKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (data && data.length > 0) {
      const allKeys = Object.keys(data[0]).filter(key => key !== 'month');
      const newConfig: ChartConfig = {};
      
      allKeys.forEach((key) => {
        const override = configOverrides ? configOverrides[key] : null;
        newConfig[key] = {
          label: override?.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          color: getColorForKey(key),
        };
      });
      setChartConfig(newConfig);
      setCostKeys(allKeys);
    }
  }, [data, configOverrides]);
  
  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data to display.</div>
  }
  
  const valueFormatter = (value: number) => {
    if (formatAs === 'number') {
      return formatNumber(value);
    }
    return formatCurrency(Number(value), currency || 'USD').replace(/\.00$/, '');
  };
  
  const tooltipFormatter = (value: number) => {
    if (formatAs === 'number') {
        return formatNumber(value);
    }
    return formatCurrency(Number(value), currency || 'USD');
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart 
        accessibilityLayer 
        data={data}
        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        stackOffset="sign"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => `M${value}`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => valueFormatter(Number(value))}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            labelFormatter={(label) => `Month ${label}`}
            formatter={(value, name, props) => {
               const itemConfig = chartConfig[props.dataKey as string];
               return (
                <div className="flex items-center">
                    <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemConfig?.color }}/>
                    <div className="flex flex-1 justify-between">
                        <span>{itemConfig?.label}</span>
                        <span className="ml-4 font-bold">{tooltipFormatter(Number(value))}</span>
                    </div>
                </div>
              )
            }}
        />}
        />
        <ChartLegend content={<ChartLegendContent payload={Object.keys(chartConfig).map(key => ({
            value: chartConfig[key]?.label,
            color: chartConfig[key]?.color,
            dataKey: key
        }))} />} />
        
        {costKeys.map((key, index) => (
           <Bar
              key={key}
              dataKey={key}
              fill={chartConfig[key]?.color}
              stackId="a"
              radius={index === costKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
        ))}

      </BarChart>
    </ChartContainer>
  )
}
