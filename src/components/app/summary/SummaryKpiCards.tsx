
'use client';

import { KpiCard } from "@/components/app/KpiCard";
import type { EngineInput, EngineOutput } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart, Landmark, TrendingDown, TrendingUp, HandCoins, Banknote } from "lucide-react";

export function SummaryKpiCards({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
    const { revenueSummary, profitSummary, cashFlowSummary, costSummary } = data;
    const { currency } = inputs.parameters;

    const contributionMargin = revenueSummary.totalRevenue > 0
        ? ((revenueSummary.totalRevenue - costSummary.totalVariable) / revenueSummary.totalRevenue) * 100
        : 0;

    const kpis = [
        { 
            label: "Total Revenue", 
            value: formatCurrency(revenueSummary.totalRevenue, currency), 
            icon: <TrendingUp />,
            helpTitle: "Total Revenue",
            help: "The total income generated from sales over the forecast period."
        },
        { 
            label: "Operating Profit", 
            value: formatCurrency(profitSummary.totalOperatingProfit, currency), 
            icon: <BarChart />,
            helpTitle: "Operating Profit",
            help: "Profit before interest and taxes. A key measure of core business profitability."
        },
        { 
            label: "Ending Cash", 
            value: formatCurrency(cashFlowSummary.endingCashBalance, currency), 
            icon: <Landmark />,
            helpTitle: "Ending Cash Balance",
            help: "The final cash position in your bank account at the end of the forecast."
        },
        { 
            label: "Cash Runway", 
            value: isFinite(cashFlowSummary.runway) ? `${formatNumber(cashFlowSummary.runway)} months` : 'Infinite', 
            icon: <Banknote />,
            helpTitle: "Cash Runway (Months)",
            help: "How many months your business can operate before running out of money, based on current cash and fixed costs."
        },
        {
            label: "Contrib. Margin",
            value: `${contributionMargin.toFixed(1)}%`,
            icon: <HandCoins />,
            helpTitle: "Contribution Margin",
            help: "The profitability of your products. (Total Revenue - Total Variable Costs) / Total Revenue."
        },
        { 
            label: "Peak Funding Need", 
            value: formatCurrency(cashFlowSummary.peakFundingNeed, currency), 
            icon: <TrendingDown />,
            helpTitle: "Peak Funding Need",
            help: "The minimum amount of capital required to prevent your cash balance from going below zero."
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
                <KpiCard 
                    key={kpi.label}
                    label={kpi.label} 
                    value={kpi.value} 
                    icon={kpi.icon} 
                    help={kpi.help}
                    helpTitle={kpi.helpTitle}
                    className="flex-col !items-stretch w-full h-full"
                />
            ))}
        </div>
    );
}
