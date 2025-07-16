
'use client';

import type { EngineInput, EngineOutput } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import React from "react";

interface ProductProfitTableProps {
    data: EngineOutput;
    inputs: EngineInput;
}

const getColorForProduct = (index: number) => {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
  ];
  return colors[index % colors.length];
};

const ExplanatoryHeader: React.FC<{ children: React.ReactNode; tooltip: string; className?: string }> = ({ children, tooltip, className }) => (
    <TableHead className={className}>
        <div className="flex items-center justify-end gap-1.5">
            {children}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    </TableHead>
);

export function ProductProfitTable({ data, inputs }: ProductProfitTableProps) {
    const { costSummary, revenueSummary, profitSummary } = data;
    const { currency } = inputs.parameters;

    const totalRevenue = revenueSummary.totalRevenue;
    const totalFixedCosts = costSummary.totalFixed;
    const totalTaxes = profitSummary.totalOperatingProfit - profitSummary.totalNetProfit;

    const productData = inputs.products.map((product, index) => {
        const revenueData = revenueSummary.productBreakdown.find(p => p.name === product.productName);
        const unitsSold = revenueData?.totalSoldUnits || 0;
        const productRevenue = revenueData?.totalRevenue || 0;
        
        const productCogs = unitsSold * (product.unitCost || 0);

        const grossProfit = productRevenue - productCogs;
        const grossMargin = productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0;
        
        // Allocate shared costs based on revenue contribution
        const revenueShare = totalRevenue > 0 ? productRevenue / totalRevenue : 0;
        const allocatedFixedCosts = totalFixedCosts * revenueShare;
        const allocatedTaxes = totalTaxes * revenueShare;

        const operatingProfit = grossProfit - allocatedFixedCosts;
        const netProfit = operatingProfit - allocatedTaxes;
        
        const operatingMargin = productRevenue > 0 ? (operatingProfit / productRevenue) * 100 : 0;
        const netMargin = productRevenue > 0 ? (netProfit / productRevenue) * 100 : 0;

        return {
            ...product,
            color: getColorForProduct(index),
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
                    <TableHead>Product</TableHead>
                     <ExplanatoryHeader className="text-right" tooltip="The percentage of planned units you forecast to sell. This is a key driver of revenue and profitability.">
                        Sell-Through
                    </ExplanatoryHeader>
                    <ExplanatoryHeader className="text-right" tooltip="Revenue minus the direct costs of producing goods sold (COGS). It shows how profitably you sell your product before overhead.">
                        Gross Profit
                    </ExplanatoryHeader>
                    <ExplanatoryHeader className="text-right" tooltip="Gross Profit as a percentage of Revenue. A higher percentage means more profit per sale.">
                        Gross Margin
                    </ExplanatoryHeader>
                    <ExplanatoryHeader className="text-right" tooltip="Gross Profit minus a share of your fixed operating costs (like salaries and rent). Shows profitability from core business operations.">
                        Op. Profit
                    </ExplanatoryHeader>
                    <ExplanatoryHeader className="text-right" tooltip="Operating Profit as a percentage of Revenue. Shows how efficiently your core business generates profit.">
                        Op. Margin
                    </ExplanatoryHeader>
                    <ExplanatoryHeader className="text-right" tooltip="Operating Profit minus a share of your taxes. This is the final 'bottom-line' profit for the product.">
                        Net Profit
                    </ExplanatoryHeader>
                    <ExplanatoryHeader className="text-right" tooltip="Net Profit as a percentage of Revenue. The ultimate measure of profitability after all costs and taxes.">
                        Net Margin
                    </ExplanatoryHeader>
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
