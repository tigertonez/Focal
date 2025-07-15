
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
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  fixed: {
    label: "Fixed Costs",
    color: "hsl(var(--chart-1))",
  },
  deposits: {
    label: "Deposits Paid",
    color: "hsl(var(--chart-2))",
  },
  finalPayments: {
    label: "Final Payments",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface CostTimelineChartProps {
  data: any[]
  currency: string
}

export function CostTimelineChart({ data, currency }: CostTimelineChartProps) {
  const chartData = data.map(month => ({
    ...month,
    name: `M${month.month}`,
  }));

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
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
                    <span className="capitalize">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                    <span className="font-bold">{formatCurrency(Number(value), currency)}</span>
                  </div>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="fixed" stackId="a" fill="var(--color-fixed)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="deposits" stackId="a" fill="var(--color-deposits)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="finalPayments" stackId="a" fill="var(--color-finalPayments)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
