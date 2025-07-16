
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import { chartColorVars } from './chart-colors';

interface InvestmentPieChartProps {
    data: { name: string; value: number }[];
}

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    return (
        <text x={x} y={y} fill="hsl(var(--muted-foreground))" textAnchor={textAnchor} dominantBaseline="central" fontSize={12}>
            {`${name} ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export function InvestmentPieChart({ data }: InvestmentPieChartProps) {
    
    if (!data || data.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">No investment data.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={<CustomLabel />}
                    outerRadius={80}
                    innerRadius={0}
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColorVars[index % chartColorVars.length]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}
