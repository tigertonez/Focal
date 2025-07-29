
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { EngineOutput } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CashFlowTableProps {
    data: EngineOutput;
    currency: string;
    t: any;
}

export function CashFlowTable({ data, currency, t }: CashFlowTableProps) {
    const { monthlyCashFlow, monthlyRevenue, monthlyCosts } = data;
    
    const tableData = monthlyCashFlow.map((cf) => {
        // Calculate cash-in (revenue) for the month
        const revenue = Object.entries(monthlyRevenue.find(r => r.month === cf.month) || {})
            .reduce((sum, [key, val]) => (key !== 'month' ? sum + val : sum), 0);
        
        // Calculate cash-out from monthly costs (fixed and variable)
        // Note: Taxes are now excluded from this table for clarity and are shown on the summary page.
        const cashOut = Object.entries(monthlyCosts.find(c => c.month === cf.month) || {})
            .reduce((sum, [key, val]) => (key !== 'month' ? sum + val : sum), 0);
        
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
                                <TableCell className="text-center text-green-600">{formatCurrency(row.cashIn, currency)}</TableCell>
                                <TableCell className="text-center text-red-600">{formatCurrency(row.cashOut, currency)}</TableCell>
                                <TableCell className={cn(
                                    "text-center font-semibold",
                                    row.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'
                                )}>
                                    {formatCurrency(row.netCashFlow, currency)}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-center font-bold",
                                     row.cumulativeCash < 0 ? 'text-destructive' : 'text-foreground'
                                )}>
                                    {formatCurrency(row.cumulativeCash, currency)}
                                </TableCell>
                                <TableCell className="text-center">
                                     <span className={cn(
                                        "text-xs font-semibold px-2 py-1 rounded-full",
                                        row.status === t.pages.cashFlow.table.cashPositive 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
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
