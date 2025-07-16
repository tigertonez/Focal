
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

    const totalRevenue = revenueSummary.totalRevenue;
    const totalFixedCosts = costSummary.totalFixed;
    const totalTaxes = profitSummary.totalOperatingProfit - profitSummary.totalNetProfit;

    const productData = inputs.products.map((product, index) => {
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
        
        return {
            ...product,
            color: getColorForProduct(index),
            unitsSold,
            totalRevenue: productRevenue,
            grossProfit,
            grossMargin,
            operatingProfit,
            netProfit,
        };
    });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Gross Margin</TableHead>
                    <TableHead className="text-right">Operating Profit</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {productData.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                             <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }}/>
                             {p.productName}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(p.grossProfit, currency)}</TableCell>
                        <TableCell className="text-right">{p.grossMargin.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.operatingProfit, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.netProfit, currency)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
