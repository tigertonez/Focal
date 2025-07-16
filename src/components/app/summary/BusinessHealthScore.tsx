
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, TrendingUp, Wallet, Zap, BarChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { BusinessHealth, SubScore } from '@/lib/types';

const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
};

const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700 dark:text-green-400';
    if (score >= 50) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-red-700 dark:text-red-400';
};

const SubScoreItem: React.FC<{ subScore: SubScore, icon: React.ReactNode }> = ({ subScore, icon }) => (
    <div className="flex items-center gap-4">
        <div className="text-muted-foreground">{icon}</div>
        <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{subScore.label}</span>
                <span className={cn("font-semibold", getScoreTextColor(subScore.score))}>{subScore.score}/100</span>
            </div>
            <Progress value={subScore.score} className="h-2 [&>div]:bg-primary" />
        </div>
    </div>
);

export function BusinessHealthScore({ healthData }: { healthData: BusinessHealth }) {
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
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle>Business Health Score</CardTitle>
                            <CardDescription>An overall measure of your forecast's viability.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={cn("text-2xl font-bold px-4 py-2 rounded-lg text-white", getScoreColor(score))}>
                                {score}
                                <span className="text-sm font-normal opacity-80">/100</span>
                            </div>
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer hover:text-primary">
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
