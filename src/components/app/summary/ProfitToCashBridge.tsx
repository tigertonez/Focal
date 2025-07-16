
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { EngineOutput } from '@/lib/types';
import { ArrowDown, Minus, Plus } from 'lucide-react';

interface BridgeRowProps {
    label: string;
    value: number;
    currency: string;
    type: 'positive' | 'negative' | 'total' | 'start';
    description?: string;
}

const BridgeRow: React.FC<BridgeRowProps> = ({ label, value, currency, type, description }) => {
    const isTotal = type === 'total';
    const isStart = type === 'start';
    
    const icon = {
        positive: <Plus className="h-4 w-4 text-green-500" />,
        negative: <Minus className="h-4 w-4 text-red-500" />,
        total: <ArrowDown className="h-4 w-4 text-primary" />,
        start: <div className="w-4 h-4" />
    }[type];

    const valueClass = {
        positive: 'text-green-600',
        negative: 'text-red-600',
        total: 'text-primary font-bold',
        start: 'text-foreground font-semibold'
    }[type];

    return (
        <TableRow className={isTotal ? 'bg-muted/50' : ''}>
            <TableCell className="font-medium flex items-center gap-3">
                {icon}
                <div className="flex flex-col">
                    <span>{label}</span>
                    {description && <span className="text-xs text-muted-foreground">{description}</span>}
                </div>
            </TableCell>
            <TableCell className={`text-right ${valueClass}`}>
                {formatCurrency(value, currency)}
            </TableCell>
        </TableRow>
    );
};


export function ProfitToCashBridge({ data, currency }: { data: EngineOutput, currency: string }) {
    const { profitSummary, cashFlowSummary, costSummary } = data;

    // This is the core logic for the bridge
    const cogsOfUnsoldGoods = costSummary.cogsOfUnsoldGoods;
    const taxesPaid = profitSummary.totalOperatingProfit - profitSummary.totalNetProfit;
    
    // Net cash flow is the change in cash over the period
    const netCashFlow = cashFlowSummary.endingCashBalance; // Assuming starting cash is 0

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profit to Cash Bridge</CardTitle>
                <CardDescription>
                    This explains why your final cash balance is different from your operating profit.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        <BridgeRow 
                            label="Total Operating Profit"
                            value={profitSummary.totalOperatingProfit}
                            currency={currency}
                            type="start"
                            description="Your profit before interest and taxes."
                        />
                         <BridgeRow 
                            label="Cash Spent on Unsold Inventory"
                            value={cogsOfUnsoldGoods}
                            currency={currency}
                            type="negative"
                            description="Cash used for inventory that hasn't been sold yet."
                        />
                         <BridgeRow 
                            label="Taxes Paid"
                            value={taxesPaid}
                            currency={currency}
                            type="negative"
                            description="Cash paid for corporate income taxes."
                        />
                        <BridgeRow 
                            label="Ending Cash Balance"
                            value={cashFlowSummary.endingCashBalance}
                            currency={currency}
                            type="total"
                            description="The actual cash forecast to be in your bank account."
                        />
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

