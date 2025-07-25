
'use client';

import type { EngineInput, EngineOutput } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, getProductColor } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import React from "react";

interface ProductProfitTableProps {
    data: EngineOutput;
    inputs: EngineInput;
    t: any;
}

const ExplanatoryHeader: React.FC<{ title: string, tooltip: string; className?: string, isAbbreviated?: boolean }> = ({ title, tooltip, className, isAbbreviated = false }) => (
    <TableHead className={className}>
        <div className="flex items-center justify-end gap-1.5">
            <span className="hidden md:inline">{title}</span>
            <span className="inline md:hidden">{isAbbreviated ? title.substring(0, 3) : title}</span>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                        <div className="space-y-1 text-left">
                          <p className="font-semibold">{title}</p>
                          <p className="text-muted-foreground text-xs">{tooltip}</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    </TableHead>
);

export function ProductProfitTable({ data, inputs, t }: ProductProfitTableProps) {
    const { costSummary, revenueSummary, profitSummary, monthlyRevenue, monthlyProfit } = data;
    const { currency } = inputs.parameters;

    const totalRevenue = revenueSummary.totalRevenue;

    const productData = inputs.products.map((product) => {
        const revenueData = revenueSummary.productBreakdown.find(p => p.name === product.productName);
        const unitsSold = revenueData?.totalSoldUnits || 0;
        const productRevenue = revenueData?.totalRevenue || 0;
        
        const productCogs = unitsSold * (product.unitCost || 0);
        const grossProfit = productRevenue - productCogs;
        const grossMargin = productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0;
        
        let totalAllocatedFixedCosts = 0;
        let totalAllocatedTaxes = 0;
        
        monthlyProfit.forEach(monthProfit => {
            const monthRevenueData = monthlyRevenue.find(mr => mr.month === monthProfit.month);
            if (!monthRevenueData) return;
            
            const totalMonthlyRevenue = Object.keys(monthRevenueData)
                .filter(k => k !== 'month')
                .reduce((sum, key) => sum + (monthRevenueData[key] || 0), 0);
            
            const productMonthlyRevenue = monthRevenueData[product.productName] || 0;
            const revenueShare = totalMonthlyRevenue > 0 ? productMonthlyRevenue / totalMonthlyRevenue : 0;

            const totalMonthlyFixed = profitSummary.totalOperatingProfit - profitSummary.totalGrossProfit + costSummary.totalOperating;
            const monthlyFixedCosts = (profitSummary.totalGrossProfit - profitSummary.totalOperatingProfit) * -1;
            totalAllocatedFixedCosts += monthlyFixedCosts * revenueShare;
            
            const totalMonthlyTaxes = (monthProfit.operatingProfit > 0) ? (monthProfit.operatingProfit - monthProfit.netProfit) : 0;
            totalAllocatedTaxes += totalMonthlyTaxes * revenueShare;
        });

        const operatingProfit = grossProfit + totalAllocatedFixedCosts;
        const netProfit = operatingProfit - totalAllocatedTaxes;
        
        const operatingMargin = productRevenue > 0 ? (operatingProfit / productRevenue) * 100 : 0;
        const netMargin = productRevenue > 0 ? (netProfit / productRevenue) * 100 : 0;

        return {
            ...product,
            color: getProductColor(product),
            unitsSold,
            totalRevenue: productRevenue,
            grossProfit,
            grossMargin,
            operatingProfit,
            operatingMargin,
            netProfit,
            netMargin,
        };
    });

    return (
        <Table className="text-xs md:text-sm">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px] md:w-auto">Product</TableHead>
                    <ExplanatoryHeader title="Sell-Through" className="text-right" tooltip={t.pages.profit.table.sellThroughHelp} />
                    <ExplanatoryHeader title="Gross Profit" className="text-right" tooltip={t.pages.profit.table.grossProfitHelp} isAbbreviated />
                    <ExplanatoryHeader title="Gross Margin" className="text-right" tooltip={t.pages.profit.table.grossMarginHelp} isAbbreviated />
                    <ExplanatoryHeader title="Op. Profit" className="text-right" tooltip={t.pages.profit.table.opProfitHelp} isAbbreviated />
                    <ExplanatoryHeader title="Op. Margin" className="text-right" tooltip={t.pages.profit.table.opMarginHelp} isAbbreviated />
                    <ExplanatoryHeader title="Net Profit" className="text-right" tooltip={t.pages.profit.table.netProfitHelp} isAbbreviated />
                    <ExplanatoryHeader title="Net Margin" className="text-right" tooltip={t.pages.profit.table.netMarginHelp} isAbbreviated />
                </TableRow>
            </TableHeader>
            <TableBody>
                {productData.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                             <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }}/>
                             <span className="truncate">{p.productName}</span>
                        </TableCell>
                        <TableCell className="text-right">{p.sellThrough?.toFixed(0) ?? 'N/A'}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.grossProfit, currency, true)}</TableCell>
                        <TableCell className="text-right">{p.grossMargin.toFixed(0)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.operatingProfit, currency, true)}</TableCell>
                        <TableCell className="text-right">{p.operatingMargin.toFixed(0)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.netProfit, currency, true)}</TableCell>
                        <TableCell className="text-right">{p.netMargin.toFixed(0)}%</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
