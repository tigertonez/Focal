
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {} satisfies ChartConfig;

const getColorForProduct = (index: number) => {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
  ];
  return colors[index % colors.length];
};

interface OperatingProfitPieChartProps {
    productData: any[];
    currency: string;
}

export function OperatingProfitPieChart({ productData, currency }: OperatingProfitPieChartProps) {
    const chartData = React.useMemo(() => {
        return productData.map((p, index) => ({
            name: p.productName,
            value: p.operatingProfit,
            fill: getColorForProduct(index),
        })).filter(p => p.value > 0); // Only include products with positive operating profit
    }, [productData]);

    const totalOperatingProfit = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    }, [chartData]);
    
    if (totalOperatingProfit <= 0) {
        return (
             <div className="h-[250px] flex flex-col justify-center items-center text-center">
                <div className="text-muted-foreground">
                    No positive operating profit to display.
                </div>
             </div>
        )
    }

    return (
        <div className="w-full">
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                                hideLabel 
                                formatter={(value, name) => {
                                const percentage = totalOperatingProfit > 0 ? ((Number(value) / totalOperatingProfit) * 100).toFixed(1) : 0;
                                return (
                                    <div className="flex flex-col text-left">
                                        <span className="font-semibold">{name}</span>
                                        <span>{formatCurrency(Number(value), currency)}</span>
                                        <span className="text-xs text-muted-foreground">{percentage}% of total</span>
                                    </div>
                                )}}
                            />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={80}
                            strokeWidth={2}
                        >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
            
            <div className="mt-4 space-y-2 px-4 text-sm">
                {chartData.map(item => {
                    const percentage = totalOperatingProfit > 0 ? (item.value / totalOperatingProfit * 100).toFixed(1) : 0;
                    return (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span>{item.name}</span>
                            </div>
                            <span className="font-semibold">{percentage}%</span>
                        </div>
                    )
                })}
            </div>
        </div>
  )
}
