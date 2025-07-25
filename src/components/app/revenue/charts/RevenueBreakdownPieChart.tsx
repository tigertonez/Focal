
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { getProductColor, formatCurrency } from "@/lib/utils";
import type { RevenueProductBreakdown, EngineInput } from "@/lib/types";

interface RevenueBreakdownPieChartProps {
    data: RevenueProductBreakdown[];
    currency: string;
    inputs: EngineInput;
}

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't render label for small slices
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.8;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function RevenueBreakdownPieChart({ data, currency, inputs }: RevenueBreakdownPieChartProps) {
    
    if (!data || data.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">No revenue data.</div>;
    }

    const chartData = data.map(item => {
        const inputProduct = inputs.products.find(p => p.productName === item.name);
        return {
            ...item,
            color: inputProduct ? getProductColor(inputProduct) : 'hsl(var(--muted-foreground))',
        };
    });

    const legendStyle = {
      fontSize: chartData.length > 4 ? '11px' : '12px',
      bottom: 0,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px",
                    }}
                    formatter={(value: number) => [formatCurrency(value, currency), "Revenue"]}
                />
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={<CustomLabel />}
                    outerRadius={100}
                    innerRadius={0}
                    dataKey="totalRevenue"
                    nameKey="name"
                    strokeWidth={0}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Legend 
                    iconSize={10} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={legendStyle}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
