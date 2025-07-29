'use client';

import React from "react";
import type { EngineInput, EngineOutput } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getProductColor } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, TrendingUp, Briefcase, Landmark } from "lucide-react";

interface ProductProfitTableProps {
    data: EngineOutput;
    inputs: EngineInput;
    t: any;
}

const ProfitLevelSection = ({ title, icon, children, defaultOpen = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean }) => (
    <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger asChild>
            <div className="flex w-full items-center justify-between rounded-t-lg border bg-muted/50 px-4 py-3 text-left text-sm font-semibold shadow-sm hover:bg-muted/80 cursor-pointer">
                <div className="flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
            </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-x border-b rounded-b-lg overflow-x-auto">
            {children}
        </CollapsibleContent>
    </Collapsible>
);


export function ProductProfitTable({ data, inputs, t }: ProductProfitTableProps) {
    const { revenueSummary, profitSummary, costSummary } = data;
    const { currency, taxRate } = inputs.parameters;

    const productData = React.useMemo(() => {
        const businessIsProfitable = profitSummary.totalOperatingProfit > 0;

        return inputs.products.map((product) => {
            const revenueBreakdown = revenueSummary.productBreakdown.find(p => p.name === product.productName);
            const productRevenue = revenueBreakdown?.totalRevenue || 0;
            const soldUnits = revenueBreakdown?.totalSoldUnits || 0;
            
            // ** CORRECTED COGS CALCULATION **
            // Use cost of goods *sold*, not total planned units cost.
            const productCogs = soldUnits * (product.unitCost || 0);

            const grossProfit = productRevenue - productCogs;
            const grossMargin = productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0;
            
            const revenueShare = revenueSummary.totalRevenue > 0 ? productRevenue / revenueSummary.totalRevenue : 0;
            const allocatedFixedCosts = costSummary.totalFixed * revenueShare;
            
            const operatingProfit = grossProfit - allocatedFixedCosts;
            const operatingMargin = productRevenue > 0 ? (operatingProfit / productRevenue) * 100 : 0;

            // ** CORRECTED TAX LOGIC **
            // Only apply tax if the business is profitable overall AND the product's operating profit is positive.
            const productTax = (businessIsProfitable && operatingProfit > 0)
                ? operatingProfit * (taxRate / 100)
                : 0;

            const netProfit = operatingProfit - productTax;
            const netMargin = productRevenue > 0 ? (netProfit / productRevenue) * 100 : 0;

            return {
                ...product,
                color: getProductColor(product),
                grossProfit,
                grossMargin,
                operatingProfit,
                operatingMargin,
                netProfit,
                netMargin,
            };
        });
    }, [data, inputs.products, currency, taxRate]);

    return (
        <div className="space-y-4">
            <ProfitLevelSection title="Level 1: Gross Profit & Margin" icon={<TrendingUp className="text-primary" />} defaultOpen={true}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">Gross Profit</TableHead>
                            <TableHead className="text-right px-2 md:px-4">Gross Margin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productData.map(p => (
                            <TableRow key={`${p.id}-gross`}>
                                <TableCell className="font-medium flex items-center gap-2 pl-2 md:pl-4">
                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                    <span className="truncate">{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatCurrency(p.grossProfit, currency, false)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.grossMargin.toFixed(1)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
            
            <ProfitLevelSection title="Level 2: Operating Profit & Margin" icon={<Briefcase className="text-primary" />}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">Op. Profit</TableHead>
                            <TableHead className="text-right px-2 md:px-4">Op. Margin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productData.map(p => (
                            <TableRow key={`${p.id}-op`}>
                                <TableCell className="font-medium flex items-center gap-2 pl-2 md:pl-4">
                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                    <span className="truncate">{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatCurrency(p.operatingProfit, currency, false)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.operatingMargin.toFixed(1)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
            
            <ProfitLevelSection title="Level 3: Net Profit & Margin" icon={<Landmark className="text-primary" />}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">Net Profit</TableHead>
                            <TableHead className="text-right px-2 md:px-4">Net Margin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productData.map(p => (
                            <TableRow key={`${p.id}-net`}>
                                <TableCell className="font-medium flex items-center gap-2 pl-2 md:pl-4">
                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                    <span className="truncate">{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatCurrency(p.netProfit, currency, false)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.netMargin.toFixed(1)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
        </div>
    )
}
