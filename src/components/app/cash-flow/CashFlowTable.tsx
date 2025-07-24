
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
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center w-[80px]">{t.pages.cashFlow.table.month}</TableHead>
                            <TableHead className="text-right">{t.pages.cashFlow.table.cashIn}</TableHead>
                            <TableHead className="text-right">{t.pages.cashFlow.table.cashOut}</TableHead>
                            <TableHead className="text-right">{t.pages.cashFlow.table.netFlow}</TableHead>
                            <TableHead className="text-right">{t.pages.cashFlow.table.endBalance}</TableHead>
                            <TableHead className="text-center w-[150px]">{t.pages.cashFlow.table.status}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.map((row) => (
                            <TableRow key={row.month}>
                                <TableCell className="text-center font-medium">{row.month}</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(row.cashIn, currency)}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(row.cashOut, currency)}</TableCell>
                                <TableCell className={cn(
                                    "text-right font-semibold",
                                    row.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'
                                )}>
                                    {formatCurrency(row.netCashFlow, currency)}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right font-bold",
                                    row.cumulativeCash >= 0 ? 'text-foreground' : 'text-destructive'
                                )}>
                                    {formatCurrency(row.cumulativeCash, currency)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={row.status === t.pages.cashFlow.table.cashPositive ? 'default' : 'destructive'} className="w-[120px] justify-center">
                                        {row.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
