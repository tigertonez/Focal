
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { chartColorVars } from './chart-colors';
import { formatCurrency } from "@/lib/utils";

interface InvestmentPieChartProps {
    data: { name: string; value: number }[];
    currency: string;
}

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't render label for small slices
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export function InvestmentPieChart({ data, currency }: InvestmentPieChartProps) {
    
    if (!data || data.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">No investment data.</div>;
    }

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
                    formatter={(value: number) => [formatCurrency(value, currency), "Amount"]}
                />
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={<CustomLabel />}
                    outerRadius={100}
                    innerRadius={0}
                    dataKey="value"
                    strokeWidth={0}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColorVars[index % chartColorVars.length]} />
                    ))}
                </Pie>
                <Legend 
                    iconSize={10} 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
