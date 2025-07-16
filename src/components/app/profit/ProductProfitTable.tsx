
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

export function ProductProfitTable({ data, inputs }: ProductProfitTableProps) {
    const { costSummary, revenueSummary, profitSummary } = data;
    const { currency } = inputs.parameters;

    const totalRevenue = revenueSummary.totalRevenue;
    const totalFixedCosts = costSummary.totalFixed;
    const totalTaxes = profitSummary.totalOperatingProfit - profitSummary.totalNetProfit;

    const productData = inputs.products.map((product) => {
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
            color: getProductColor(product.productName),
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
                     <ExplanatoryHeader title="Sell-Through" className="text-right" tooltip="The percentage of your total stock you expect to sell. A higher rate is a key driver of profitability." />
                    <ExplanatoryHeader title="Gross Profit" className="text-right" tooltip="Sales revenue minus the direct cost to produce the goods (COGS). Shows if your product is profitable before overhead costs." />
                    <ExplanatoryHeader title="Gross Margin" className="text-right" tooltip="Gross Profit as a percentage of revenue. A high margin means more profit from each dollar of sales." />
                    <ExplanatoryHeader title="Op. Profit" className="text-right" tooltip="Gross Profit minus a share of fixed operational costs (like salaries). Shows if the product is profitable after day-to-day business expenses." />
                    <ExplanatoryHeader title="Op. Margin" className="text-right" tooltip="Operating Profit as a percentage of revenue. A measure of how efficiently your core business generates profit." />
                    <ExplanatoryHeader title="Net Profit" className="text-right" tooltip="The final 'bottom-line' profit for the product after all expenses, including a share of taxes, have been deducted." />
                    <ExplanatoryHeader title="Net Margin" className="text-right" tooltip="Net Profit as a percentage of revenue. The ultimate measure of a product's profitability." />
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
