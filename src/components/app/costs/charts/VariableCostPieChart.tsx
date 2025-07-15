
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
import { CostRow } from "../CostRow"

const chartConfig = {
  totalProductionCost: {
    label: "Total Production Cost",
  },
} satisfies ChartConfig

// A clear, distinguishable color palette for the pie chart
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

    // If there is only one product or no products, show a summary view instead of a chart
    if (activeData.length <= 1) {
        const singleProduct = activeData.length === 1 ? activeData[0] : null;
        return (
            <div className="h-full flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold font-headline">
                    {formatCurrency(total, currency)}
                </div>
                <div className="text-muted-foreground mb-4">
                    Total Variable Cost
                </div>

                {singleProduct && (
                    <div className="w-full max-w-xs text-left space-y-2 mt-4 text-sm">
                        <h3 className="font-semibold text-center mb-2">{singleProduct.name}</h3>
                        <CostRow label="Planned Units" value={singleProduct.plannedUnits.toLocaleString()} />
                        <CostRow label="Unit Cost" value={formatCurrency(singleProduct.unitCost, currency)} />
                        <CostRow label="Total Production Cost" value={formatCurrency(singleProduct.totalProductionCost, currency)} />
                    </div>
                )}
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
