// This component is no longer used and can be removed in a future cleanup step.
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import type { ProfitSummary } from "@/lib/types"

const chartConfig = {
  grossProfit: {
    label: "Gross Profit",
    color: "hsl(var(--chart-2))",
  },
  operatingProfit: {
    label: "Operating Profit",
    color: "hsl(var(--chart-3))",
  },
  netProfit: {
    label: "Net Profit",
    color: "hsl(var(--chart-4))",
  },
  cogs: {
    label: "COGS",
    color: "hsl(var(--chart-1))",
  },
  opex: {
    label: "Operating Expenses",
    color: "hsl(var(--chart-5))",
  },
  tax: {
    label: "Tax",
    color: "hsl(var(--chart-6))",
  },
} satisfies ChartConfig

interface ProfitLayersChartProps {
  data: ProfitSummary;
  totalRevenue: number;
  currency: string;
}

export function ProfitLayersChart({ data, totalRevenue, currency }: ProfitLayersChartProps) {
  const chartData = React.useMemo(() => {
    const cogs = totalRevenue - data.totalGrossProfit;
    const opex = data.totalGrossProfit - data.totalOperatingProfit;
    const tax = data.totalOperatingProfit - data.totalNetProfit;

    return [
      {
        name: "Profit Layers",
        totalRevenue: data.totalNetProfit,
        grossProfit: data.totalOperatingProfit - data.totalNetProfit,
        operatingProfit: data.totalGrossProfit - data.totalOperatingProfit,
        netProfit: totalRevenue - data.totalGrossProfit,
      },
    ]
  }, [data, totalRevenue]);

  return (
    <ChartContainer config={chartConfig} className="w-full h-[200px]">
      <BarChart
        accessibilityLayer
        layout="vertical"
        data={chartData}
        margin={{
          left: -20,
        }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" dataKey="totalRevenue" hide />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          hide
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar
          dataKey="totalRevenue"
          stackId="a"
          radius={[5, 5, 5, 5]}
          fill={"hsl(var(--chart-4))"}
        >
          <LabelList
            position="insideLeft"
            offset={8}
            className="fill-white font-bold"
            fontSize={12}
            formatter={(value: number) => `Net Profit: ${formatCurrency(value, currency)}`}
          />
        </Bar>
         <Bar
          dataKey="grossProfit"
          stackId="a"
          fill={"hsl(var(--chart-5))"}
        >
          <LabelList
            position="insideLeft"
            offset={8}
            className="fill-white font-bold"
            fontSize={12}
            formatter={(value: number) => `Taxes: ${formatCurrency(value, currency)}`}
          />
        </Bar>
        <Bar
          dataKey="operatingProfit"
          stackId="a"
          fill={"hsl(var(--chart-1))"}
        >
          <LabelList
            position="insideLeft"
            offset={8}
            className="fill-white font-bold"
            fontSize={12}
             formatter={(value: number) => `OpEx: ${formatCurrency(value, currency)}`}
          />
        </Bar>
         <Bar
          dataKey="netProfit"
          stackId="a"
          fill={"hsl(var(--muted-foreground))"}
        >
          <LabelList
            position="insideLeft"
            offset={8}
            className="fill-white font-bold"
            fontSize={12}
            formatter={(value: number) => `COGS: ${formatCurrency(value, currency)}`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
