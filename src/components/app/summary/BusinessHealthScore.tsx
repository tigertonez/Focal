
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, TrendingUp, Wallet, Zap, BarChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { BusinessHealth, SubScore } from '@/lib/types';

const getScoreColor = (score: number) => {
    if (score < 50) return '#E57373'; // Muted Red
    if (score < 75) return '#FBC02D'; // Amber
    return '#81C784'; // Green
};

const SubScoreItem: React.FC<{ subScore: SubScore, icon: React.ReactNode }> = ({ subScore, icon }) => {
    const scoreColor = getScoreColor(subScore.score);
    return (
        <div className="flex items-center gap-4">
            <div className="text-muted-foreground">{icon}</div>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{subScore.label}</span>
                    <span className="font-semibold" style={{ color: scoreColor }}>
                        {subScore.score}/100
                    </span>
                </div>
                <Progress value={subScore.score} style={{ backgroundColor: scoreColor }} />
            </div>
        </div>
    );
};


export function BusinessHealthScore({ healthData }: { healthData?: BusinessHealth }) {
    if (!healthData) {
        return null;
    }

    const { score, subScores } = healthData;

    const subScoreIcons: Record<string, React.ReactNode> = {
        profitability: <TrendingUp className="h-5 w-5" />,
        liquidity: <Wallet className="h-5 w-5" />,
        efficiency: <Zap className="h-5 w-5" />,
        demand: <BarChart className="h-5 w-5" />,
    };

    return (
        <Card>
            <Collapsible>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle>Business Health Score</CardTitle>
                            <CardDescription>An overall measure of your forecast's viability.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                            <div 
                                className="text-2xl font-bold px-4 py-2 rounded-lg text-white text-center min-w-[80px]"
                                style={{ backgroundColor: getScoreColor(score) }}
                                aria-label={`Business Health Score: ${score}`}
                            >
                                {score}
                                <span className="text-sm font-normal opacity-80">/100</span>
                            </div>
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer hover:text-primary shrink-0">
                                    <span>Details</span>
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                                </div>
                            </CollapsibleTrigger>
                        </div>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                         <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t">
                            {Object.entries(subScores).map(([key, subScore]) => (
                                <SubScoreItem key={key} subScore={subScore} icon={subScoreIcons[key]}/>
                            ))}
                         </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
