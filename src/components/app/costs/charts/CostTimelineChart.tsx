
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  deposits: {
    label: "Deposits",
    color: "#2563eb", // Blue
  },
  finalPayments: {
    label: "Final Payments",
    color: "#0d9488", // Teal
  },
  fixed: {
    label: "Fixed Costs",
    color: "#64748b", // Slate
  },
} satisfies ChartConfig

interface CostTimelineChartProps {
    data: any[];
    currency: string;
    preOrder: boolean;
}

export function CostTimelineChart({ data, currency, preOrder }: CostTimelineChartProps) {
  const chartData = data.map(month => ({
    ...month,
    name: `M${preOrder ? month.month : month.month + 1}`
  }))

  return (
    <ChartContainer config={chartConfig} className="min-h-[180px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={15}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(Number(value), currency).slice(0, -3)}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value, name) => (
                <div className="flex flex-col">
                    <span className="capitalize">{chartConfig[name as keyof typeof chartConfig].label}</span>
                    <span className="font-bold">{formatCurrency(Number(value), currency)}</span>
                </div>
            )}
           />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="deposits" stackId="a" fill="var(--color-deposits)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="finalPayments" stackId="a" fill="var(--color-finalPayments)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="fixed" stackId="a" fill="var(--color-fixed)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
