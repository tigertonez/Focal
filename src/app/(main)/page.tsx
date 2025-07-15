
"use client";

import { KpiCard } from "@/components/app/KpiCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { ChartWrapper } from "@/components/app/ChartWrapper";
import { PlaceholderChart } from "@/components/app/PlaceholderChart";
import { useForecast } from "@/context/ForecastContext";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, BarChart, Percent, Calendar } from "lucide-react";

export default function SummaryPage() {
  const { output, loading } = useForecast();

  if (loading || !output) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
  const formatPercentage = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100);

  const totalRevenue = output.revenue.reduce((a, b) => a + b, 0);
  const totalNetProfit = output.profit.net.reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto">
      <SectionHeader
        title="Financial Summary"
        description={`A high-level overview of your ${output.kpis.breakEvenMonth ? '24-month' : ''} forecast.`}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
        <KpiCard
          label="Net Profit"
          value={formatCurrency(totalNetProfit)}
          icon={<BarChart className="h-5 w-5 text-muted-foreground" />}
        />
        <KpiCard
          label="Gross Margin"
          value={formatPercentage(output.kpis.grossMargin)}
          icon={<Percent className="h-5 w-5 text-muted-foreground" />}
        />
        <KpiCard
          label="Breakeven"
          value={output.kpis.breakEvenMonth ? `Month ${output.kpis.breakEvenMonth}`: "N/A"}
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <ChartWrapper
        title="Revenue vs. Profit"
        description="Monthly revenue and net profit over the forecast period."
      >
        <PlaceholderChart />
      </ChartWrapper>
    </div>
  );
}
