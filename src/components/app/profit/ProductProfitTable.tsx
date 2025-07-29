
'use client';

import React from "react";
import type { EngineInput, EngineOutput } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getProductColor } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, TrendingUp, Briefcase, Landmark } from "lucide-react";
import { useForecast } from "@/context/ForecastContext";

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
    const { currency, taxRate, accountingMethod } = inputs.parameters;
    const { locale } = useForecast();

    const productData = React.useMemo(() => {
        const totalOperatingProfit = profitSummary.totalOperatingProfit;
        const totalRevenue = revenueSummary.totalRevenue;
        const totalFixedCosts = costSummary.totalFixed;
        const businessIsProfitable = totalOperatingProfit > 0;
        
        let totalProfitToTax = 0;
        if(businessIsProfitable) {
            totalProfitToTax = totalOperatingProfit;
        }
        
        const totalTaxAmount = totalProfitToTax * (taxRate / 100);
        
        return inputs.products.map((product) => {
            const revenueBreakdown = revenueSummary.productBreakdown.find(p => p.name === product.productName);
            const productRevenue = revenueBreakdown?.totalRevenue || 0;
            const soldUnits = revenueBreakdown?.totalSoldUnits || 0;

            let productVariableCosts = 0;
            if (accountingMethod === 'cogs') {
                productVariableCosts = soldUnits * (product.unitCost || 0);
            } else { // Conservative
                if (product.costModel === 'monthly') {
                    productVariableCosts = soldUnits * (product.unitCost || 0);
                } else { // Batch
                    productVariableCosts = (product.plannedUnits || 0) * (product.unitCost || 0);
                }
            }
            
            const grossProfit = productRevenue - productVariableCosts;
            const grossMargin = productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0;

            const revenueShare = totalRevenue > 0 ? productRevenue / totalRevenue : 0;
            const allocatedFixedCosts = totalFixedCosts * revenueShare;

            const operatingProfit = grossProfit - allocatedFixedCosts;
            const operatingMargin = productRevenue > 0 ? (operatingProfit / productRevenue) * 100 : 0;

            let productTax = 0;
            if (businessIsProfitable && operatingProfit > 0) {
                 // Tax is allocated based on the product's share of positive operating profit
                 const productOpProfitShare = totalOperatingProfit > 0 ? operatingProfit / totalOperatingProfit : 0;
                 productTax = totalTaxAmount * productOpProfitShare;
            }

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
    }, [data, inputs, locale, accountingMethod, taxRate]); // Ensure recalculation when dependencies change

    return (
        <div className="space-y-4">
            <ProfitLevelSection title={t.pages.profit.table.grossProfit} icon={<TrendingUp className="text-primary" />} defaultOpen={true}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.grossProfit}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.grossMargin}</TableHead>
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
            
            <ProfitLevelSection title={t.pages.profit.table.opProfit} icon={<Briefcase className="text-primary" />}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.opProfit}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.opMargin}</TableHead>
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
            
            <ProfitLevelSection title={t.pages.profit.table.netProfit} icon={<Landmark className="text-primary" />}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.netProfit}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.netMargin}</TableHead>
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
