
"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  totalRevenue: {
    label: "Total Revenue",
  },
} satisfies ChartConfig

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

interface RevenuePieChartProps {
    data: { name: string; totalRevenue: number }[];
    currency: string;
}

export function RevenuePieChart({ data, currency }: RevenuePieChartProps) {
    const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.totalRevenue, 0), [data]);
    const activeData = data.filter(d => d.totalRevenue > 0);
    
    if (activeData.length === 0) {
        return (
             <div className="h-full flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold font-headline">
                    {formatCurrency(0, currency)}
                </div>
                <div className="text-muted-foreground">
                    Total Revenue
                </div>
             </div>
        )
    }

    return (
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
        >
        <PieChart>
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    hideLabel 
                    formatter={(value, name) => (
                        <div className="flex flex-col">
                            <span className="capitalize">{name}</span>
                            <span className="font-bold">{formatCurrency(Number(value), currency)}</span>
                        </div>
                    )}
                />}
            />
            <Pie
                data={activeData}
                dataKey="totalRevenue"
                nameKey="name"
                innerRadius={70}
                outerRadius={90}
                strokeWidth={5}
                paddingAngle={activeData.length > 1 ? 2 : 0}
            >
             <Label
                content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold font-headline"
                      >
                        {formatCurrency(total, currency).replace(/\.00$/, '')}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground text-sm"
                      >
                        Total Revenue
                      </tspan>
                    </text>
                  )
                }
                }}
            />
            {activeData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
            </Pie>
            <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="[&_.recharts-legend-item]:w-full [&_.recharts-legend-item>svg]:mr-2"
            />
        </PieChart>
        </ChartContainer>
  )
}
