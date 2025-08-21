
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip, LabelList } from "recharts"
import type { FixedCostItem, Product } from "@/lib/types";
import { formatCurrency, getProductColor } from "@/lib/utils";
import { colorFor } from "@/lib/printColorMap";
import { specialColorFor } from "@/lib/specialSeries";

interface InvestmentPieChartProps {
    data: { name: string; value: number; color?: string, item?: Product | FixedCostItem }[];
    currency: string;
    isPrint?: boolean;
}

const RADIAN = Math.PI / 180;

const PrintPercentLabel: React.FC<any> = (props) => {
  const { percent, cx, cy, midAngle, innerRadius = 0, outerRadius = 0 } = props || {};
  if (!Number.isFinite(percent) || percent < 0.05) return null; // nur ≥5%
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.78;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill="#fff">
      {Math.round(percent * 100)}%
    </text>
  );
};

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


export function InvestmentPieChart({ data, currency, isPrint = false }: InvestmentPieChartProps) {
    
    if (!data || data.length === 0) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">No investment data.</div>;
    }
    
    const isMobile = !isPrint && (typeof window !== 'undefined') && window.innerWidth < 768;
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
          textAlign: 'center',
    };
    
    const legendStylePrint: React.CSSProperties = { 
        width: '100%',
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginTop: 0,
        fontSize: 11,
    };
    const OUTER_PRINT = "88%";
    const OUTER_UI    = 100;
    const CY_PRINT    = "47%";
    const CY_UI       = "45%";


    return (
        <ResponsiveContainer width="100%" height="100%" style={{ minHeight: isPrint ? 440 : undefined, overflow: isPrint ? 'visible' : 'hidden' }}>
            <PieChart margin={isPrint ? { top: 12, right: 16, bottom: 0, left: 16 } : { top: 16, right: 16, bottom: 24, left: 16 }}>
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    wrapperStyle={isPrint ? { display: 'none' } : {}}
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
                    cy={isPrint ? CY_PRINT : CY_UI}
                    labelLine={false}
                    label={<CustomLabel />}
                    outerRadius={isPrint ? OUTER_PRINT : OUTER_UI}
                    innerRadius={0}
                    dataKey="value"
                    strokeWidth={0}
                    isAnimationActive={!isPrint}
                >
                    {isPrint && <LabelList content={<PrintPercentLabel />} />}
                    {data.map((entry, index) => {
                        const forced = specialColorFor(entry.name);
                        const color = forced ?? (isPrint ? colorFor(entry.name) : (entry.color || (entry.item ? getProductColor(entry.item) : 'hsl(var(--muted-foreground))')));
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                </Pie>
                <Legend 
                    iconSize={isPrint ? 10 : 8} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={isPrint ? legendStylePrint : legendStyle}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
