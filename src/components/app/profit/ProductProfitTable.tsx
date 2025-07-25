
'use client';

import React from "react";
import type { EngineInput, EngineOutput } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, getProductColor } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, TrendingUp, Briefcase, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CollapsibleContent>
            <div className="border-x border-b rounded-b-lg">
                {children}
            </div>
        </CollapsibleContent>
    </Collapsible>
);


export function ProductProfitTable({ data, inputs, t }: ProductProfitTableProps) {
    const { revenueSummary, monthlyRevenue, monthlyProfit, costSummary, profitSummary } = data;
    const { currency, taxRate } = inputs.parameters;

    const productData = React.useMemo(() => inputs.products.map((product) => {
        const revenueData = revenueSummary.productBreakdown.find(p => p.name === product.productName);
        const unitsSold = revenueData?.totalSoldUnits || 0;
        const productRevenue = revenueData?.totalRevenue || 0;
        
        const productCogs = unitsSold * (product.unitCost || 0);
        const grossProfit = productRevenue - productCogs;
        const grossMargin = productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0;
        
        let allocatedFixedCosts = 0;

        monthlyRevenue.forEach(monthRevenue => {
            const month = monthRevenue.month;
            const totalMonthlyRevenue = Object.keys(monthRevenue)
                .filter(k => k !== 'month')
                .reduce((sum, key) => sum + (monthRevenue[key] || 0), 0);
            
            const productMonthlyRevenue = monthRevenue[product.productName] || 0;
            const revenueShare = totalMonthlyRevenue > 0 ? productMonthlyRevenue / totalMonthlyRevenue : 0;
            
            const monthProfitData = monthlyProfit.find(mp => mp.month === month);
            if(monthProfitData) {
                const monthlyFixedCosts = monthProfitData.grossProfit - monthProfitData.operatingProfit;
                allocatedFixedCosts += monthlyFixedCosts * revenueShare;
            }
        });
        
        const operatingProfit = grossProfit - allocatedFixedCosts;

        // Apply tax rule based on OVERALL business profitability
        const netProfit = profitSummary.totalOperatingProfit > 0
            ? operatingProfit * (1 - taxRate / 100)
            : operatingProfit;
        
        const operatingMargin = productRevenue > 0 ? (operatingProfit / productRevenue) * 100 : 0;
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
    }), [data, inputs.products, currency]);

    return (
        <div className="space-y-4">
            <ProfitLevelSection title="Level 1: Gross Profit & Margin" icon={<TrendingUp className="text-primary" />} defaultOpen={true}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Gross Profit</TableHead>
                            <TableHead className="text-right">Gross Margin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productData.map(p => (
                            <TableRow key={`${p.id}-gross`}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span>{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(p.grossProfit, currency)}</TableCell>
                                <TableCell className="text-right">{p.grossMargin.toFixed(0)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
            
            <ProfitLevelSection title="Level 2: Operating Profit & Margin" icon={<Briefcase className="text-primary" />}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Op. Profit</TableHead>
                            <TableHead className="text-right">Op. Margin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productData.map(p => (
                            <TableRow key={`${p.id}-op`}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span>{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(p.operatingProfit, currency)}</TableCell>
                                <TableCell className="text-right">{p.operatingMargin.toFixed(0)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
            
            <ProfitLevelSection title="Level 3: Net Profit & Margin" icon={<Landmark className="text-primary" />}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Net Profit</TableHead>
                            <TableHead className="text-right">Net Margin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productData.map(p => (
                            <TableRow key={`${p.id}-net`}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span>{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(p.netProfit, currency)}</TableCell>
                                <TableCell className="text-right">{p.netMargin.toFixed(0)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
        </div>
    )
}
