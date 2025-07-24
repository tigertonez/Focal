
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

const ExplanatoryHeader: React.FC<{ title: string, tooltip: string; className?: string }> = ({ title, tooltip, className }) => (
    <TableHead className={className}>
        <div className="flex items-center justify-end gap-1.5">
            {title}
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t.pages.profit.table.product}</TableHead>
                     <ExplanatoryHeader title={t.pages.profit.table.sellThrough} className="text-right" tooltip={t.pages.profit.table.sellThroughHelp} />
                    <ExplanatoryHeader title={t.pages.profit.table.grossProfit} className="text-right" tooltip={t.pages.profit.table.grossProfitHelp} />
                    <ExplanatoryHeader title={t.pages.profit.table.grossMargin} className="text-right" tooltip={t.pages.profit.table.grossMarginHelp} />
                    <ExplanatoryHeader title={t.pages.profit.table.opProfit} className="text-right" tooltip={t.pages.profit.table.opProfitHelp} />
                    <ExplanatoryHeader title={t.pages.profit.table.opMargin} className="text-right" tooltip={t.pages.profit.table.opMarginHelp} />
                    <ExplanatoryHeader title={t.pages.profit.table.netProfit} className="text-right" tooltip={t.pages.profit.table.netProfitHelp} />
                    <ExplanatoryHeader title={t.pages.profit.table.netMargin} className="text-right" tooltip={t.pages.profit.table.netMarginHelp} />
                </TableRow>
            </TableHeader>
            <TableBody>
                {productData.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                             <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }}/>
                             {p.productName}
                        </TableCell>
                        <TableCell className="text-right">{p.sellThrough?.toFixed(0) ?? 'N/A'}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.grossProfit, currency)}</TableCell>
                        <TableCell className="text-right">{p.grossMargin.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.operatingProfit, currency)}</TableCell>
                        <TableCell className="text-right">{p.operatingMargin.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.netProfit, currency)}</TableCell>
                        <TableCell className="text-right">{p.netMargin.toFixed(1)}%</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
