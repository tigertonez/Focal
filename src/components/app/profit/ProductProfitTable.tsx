

'use client';

import React from "react";
import type { EngineInput, EngineOutput } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getProductColor, formatNumber } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, TrendingUp, Briefcase, Landmark } from "lucide-react";

interface ProductProfitTableProps {
    data: EngineOutput;
    inputs: EngineInput;
    t: any;
    isPrint?: boolean;
}

const ProfitLevelSection = ({ title, icon, children, defaultOpen = false, isPrint = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean, isPrint?: boolean }) => (
    <Collapsible defaultOpen={defaultOpen || isPrint}>
        <CollapsibleTrigger asChild>
             <div className="flex w-full items-center justify-between rounded-t-lg border bg-muted/50 px-4 py-3 text-left text-sm font-semibold shadow-sm hover:bg-muted/80 cursor-pointer" data-no-print={isPrint}>
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


export function ProductProfitTable({ data, inputs, t, isPrint = false }: ProductProfitTableProps) {
    const { productProfitability } = data;
    const { currency } = inputs.parameters;

    if (!productProfitability || productProfitability.length === 0) {
        return <p>No product profitability data available.</p>;
    }

    return (
        <div className="space-y-4">
            <ProfitLevelSection title={t.pages.profit.table.grossProfit} icon={<TrendingUp className="text-primary" />} defaultOpen={true} isPrint={isPrint}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.revenue.table.units}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.revenue.table.sellThrough}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.grossProfit}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.grossMargin}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productProfitability.map(p => (
                            <TableRow key={`${p.id}-gross`}>
                                <TableCell className="font-medium flex items-center gap-2 pl-2 md:pl-4">
                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                    <span className="truncate">{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatNumber(p.soldUnits)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.sellThrough?.toFixed(0) ?? 0}%</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatCurrency(p.grossProfit, currency, false)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.grossMargin.toFixed(1)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
            
            <ProfitLevelSection title={t.pages.profit.table.opProfit} icon={<Briefcase className="text-primary" />} isPrint={isPrint}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.revenue.table.units}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.revenue.table.sellThrough}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.opProfit}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.opMargin}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productProfitability.map(p => (
                            <TableRow key={`${p.id}-op`}>
                                <TableCell className="font-medium flex items-center gap-2 pl-2 md:pl-4">
                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                    <span className="truncate">{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatNumber(p.soldUnits)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.sellThrough?.toFixed(0) ?? 0}%</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatCurrency(p.operatingProfit, currency, false)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.operatingMargin.toFixed(1)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </ProfitLevelSection>
            
            <ProfitLevelSection title={t.pages.profit.table.netProfit} icon={<Landmark className="text-primary" />} isPrint={isPrint}>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-2 md:pl-4">Product</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.revenue.table.units}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.revenue.table.sellThrough}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.netProfit}</TableHead>
                            <TableHead className="text-right px-2 md:px-4">{t.pages.profit.table.netMargin}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productProfitability.map(p => (
                            <TableRow key={`${p.id}-net`}>
                                <TableCell className="font-medium flex items-center gap-2 pl-2 md:pl-4">
                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                    <span className="truncate">{p.productName}</span>
                                </TableCell>
                                <TableCell className="text-right px-2 md:px-4">{formatNumber(p.soldUnits)}</TableCell>
                                <TableCell className="text-right px-2 md:px-4">{p.sellThrough?.toFixed(0) ?? 0}%</TableCell>
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
