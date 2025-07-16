
'use client';

import type { EngineInput, EngineOutput } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";

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

export function ProductProfitTable({ data, inputs }: ProductProfitTableProps) {
    const { costSummary, revenueSummary, profitSummary } = data;
    const { currency } = inputs.parameters;

    const productData = inputs.products.map((product, index) => {
        const revenueData = revenueSummary.productBreakdown.find(p => p.name === product.productName);
        const unitsSold = revenueData?.totalSoldUnits || 0;
        const totalRevenue = revenueData?.totalRevenue || 0;
        
        const avgVariableCostPerUnit = costSummary.avgCostPerUnit;
        const productCogs = unitsSold * (product.unitCost || 0);

        const grossProfit = totalRevenue - productCogs;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        return {
            ...product,
            color: getColorForProduct(index),
            unitsSold,
            totalRevenue,
            grossProfit,
            grossMargin,
        };
    });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Gross Margin</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {productData.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                             <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }}/>
                             {p.productName}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(p.unitsSold)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.totalRevenue, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.grossProfit, currency)}</TableCell>
                        <TableCell className="text-right">{p.grossMargin.toFixed(1)}%</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
