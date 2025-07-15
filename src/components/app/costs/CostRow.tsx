
import React from 'react';
import { cn } from '@/lib/utils';

interface CostRowProps {
    label: string;
    value: string | number;
    percentage?: string;
    className?: string;
}

export function CostRow({ label, value, percentage, className }: CostRowProps) {
    return (
        <div className={cn("flex justify-between items-center text-sm", className)}>
            <span className="text-muted-foreground">{label}</span>
            <div className="flex items-center gap-4 font-medium">
                {percentage && (
                    <span className="w-16 text-right text-muted-foreground">{percentage}%</span>
                )}
                <span>{value}</span>
            </div>
        </div>
    );
}
