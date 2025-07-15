
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
  totalProductionCost: {
    label: "Total Production Cost",
  },
} satisfies ChartConfig

const COLORS = [
  "#2563eb", // Blue
  "#0d9488", // Teal
  "#9333ea", // Purple
  "#f97316", // Orange
  "#ec4899", // Pink
];

interface VariableCostPieChartProps {
    data: any[];
    currency: string;
}

export function VariableCostPieChart({ data, currency }: VariableCostPieChartProps) {
    const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.totalProductionCost, 0), [data]);
    const activeData = data.filter(d => d.totalProductionCost > 0);
    
    if (activeData.length === 0) {
        return (
             <div className="h-full flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold font-headline">
                    {formatCurrency(0, currency)}
                </div>
                <div className="text-muted-foreground">
                    Total Variable Cost
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
                dataKey="totalProductionCost"
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
                        {formatCurrency(total, currency).slice(0,-3)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 20}
                        className="fill-muted-foreground text-sm"
                      >
                        Total
                      </tspan>
                    </text>
                  )
                }
                }}
            />
            {activeData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
