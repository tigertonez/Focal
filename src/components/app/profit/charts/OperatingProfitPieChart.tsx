
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
        >
        <PieChart>
            <ChartTooltip
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
                strokeWidth={2}
            >
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            </Pie>
            <ChartLegend
                content={<ChartLegendContent 
                    nameKey="name" 
                    className="text-xs" 
                    formatter={(value, entry) => {
                        const item = entry.payload as any;
                        const percentage = totalOperatingProfit > 0 ? ((item.payload.value / totalOperatingProfit) * 100).toFixed(0) : 0;
                        return (
                             <div className="flex w-full justify-between gap-4">
                                <span>{item.payload.name}</span>
                                <span className="font-semibold">{percentage}%</span>
                            </div>
                        )
                    }}
                />}
                verticalAlign="bottom"
                wrapperStyle={{ paddingLeft: '1rem', paddingRight: '1rem' }}
                payload={chartData.map(item => ({
                    value: item.name,
                    color: item.fill,
                    type: 'square',
                    payload: item,
                }))}
            />
        </PieChart>
        </ChartContainer>
  )
}
