
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
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface VariableCostPieChartProps {
    data: any[];
    currency: string;
}

export function VariableCostPieChart({ data, currency }: VariableCostPieChartProps) {
    const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.totalProductionCost, 0), [data]);
    const activeData = data.filter(d => d.totalProductionCost > 0);

    return (
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
        >
        <PieChart>
            <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
            />
            <Pie
                data={activeData}
                dataKey="totalProductionCost"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
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
                        className="fill-foreground text-3xl font-bold"
                      >
                        {formatCurrency(total, currency)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
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
