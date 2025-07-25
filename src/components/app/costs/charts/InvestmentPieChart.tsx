
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { getProductColor } from "@/lib/utils";
import type { FixedCostItem, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";


interface InvestmentPieChartProps {
    data: { name: string; value: number; color?: string, item?: Product | FixedCostItem }[];
    currency: string;
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


export function InvestmentPieChart({ data, currency }: InvestmentPieChartProps) {
    
    if (!data || data.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">No investment data.</div>;
    }
    
    const isMobile = (typeof window !== 'undefined') && window.innerWidth < 768;
    const manyItems = data.length > 4;
    
    const legendStyle: React.CSSProperties = {
      lineHeight: '1.5',
      bottom: 0,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      gap: manyItems ? '0.25rem 0.5rem' : '0.5rem',
      fontSize: manyItems && isMobile ? '11px' : '12px',
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
                    formatter={(value: number) => [formatCurrency(value, currency), "Amount"]}
                />
                <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={<CustomLabel />}
                    outerRadius={100}
                    innerRadius={0}
                    dataKey="value"
                    strokeWidth={0}
                >
                    {data.map((entry, index) => {
                        let color;
                        if (entry.color) {
                            color = entry.color;
                        } else if (entry.item) {
                            color = getProductColor(entry.item);
                        } else {
                            color = 'hsl(var(--muted-foreground))';
                        }
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                </Pie>
                <Legend 
                    iconSize={8} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={legendStyle}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
