
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfitWaterfallChart } from "./charts/ProfitWaterfallChart";
import type { EngineOutput } from "@/lib/types";

interface ProfitBreakdownCardProps {
    data: EngineOutput;
    currency: string;
}

export function ProfitBreakdownCard({ data, currency }: ProfitBreakdownCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Profit Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                <ProfitWaterfallChart data={data} currency={currency} />
            </CardContent>
        </Card>
    );
}
