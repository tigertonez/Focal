
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { EngineOutput } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CashFlowTableProps {
    data: EngineOutput;
    currency: string;
    t: any;
}

export function CashFlowTable({ data, currency, t }: CashFlowTableProps) {
    const { monthlyCashFlow, monthlyRevenue, monthlyCosts, monthlyProfit } = data;

    const tableData = monthlyCashFlow.map((cf) => {
        const revenue = Object.values(monthlyRevenue.find(r => r.month === cf.month) || {}).reduce((sum, val) => (typeof val === 'number' ? sum + val : sum), 0);
        const costs = Object.values(monthlyCosts.find(c => c.month === cf.month) || {}).reduce((sum, val) => (typeof val === 'number' ? sum + val : sum), 0);
        const taxes = (monthlyProfit.find(p => p.month === cf.month)?.operatingProfit || 0) - (monthlyProfit.find(p => p.month === cf.month)?.netProfit || 0);
        const cashOut = costs + taxes;
        
        return {
            month: cf.month,
            cashIn: revenue,
            cashOut: cashOut,
            netCashFlow: cf.netCashFlow,
            cumulativeCash: cf.cumulativeCash,
            status: cf.cumulativeCash < 0 ? t.pages.cashFlow.table.fundingNeeded : t.pages.cashFlow.table.cashPositive,
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.pages.cashFlow.table.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <Table className="text-xs md:text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center w-[60px] md:w-[80px]">Month</TableHead>
                            <TableHead className="text-center">In</TableHead>
                            <TableHead className="text-center">Out</TableHead>
                            <TableHead className="text-center">Net</TableHead>
                            <TableHead className="text-center">End</TableHead>
                            <TableHead className="text-center w-[90px] md:w-[150px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.map((row) => (
                            <TableRow key={row.month}>
                                <TableCell className="text-center font-medium text-muted-foreground">{row.month}</TableCell>
                                <TableCell className="text-center text-foreground">{formatCurrency(row.cashIn, currency, true)}</TableCell>
                                <TableCell className="text-center text-red-600">{formatCurrency(row.cashOut, currency, true)}</TableCell>
                                <TableCell className={cn(
                                    "text-center",
                                    row.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'
                                )}>
                                    {formatCurrency(row.netCashFlow, currency, true)}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-center font-bold",
                                    row.cumulativeCash >= 0 ? 'text-green-700' : 'text-red-700'
                                )}>
                                    {formatCurrency(row.cumulativeCash, currency, true)}
                                </TableCell>
                                <TableCell className="text-center">
                                     <span className={cn(
                                        "text-xs font-semibold",
                                        row.status === t.pages.cashFlow.table.cashPositive ? 'text-green-700' : 'text-red-700'
                                     )}>
                                        {row.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
