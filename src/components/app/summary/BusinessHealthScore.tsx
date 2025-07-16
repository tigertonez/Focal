
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, TrendingUp, Wallet, Zap, Target } from 'lucide-react';
import type { BusinessHealth, SubScore } from '@/lib/types';
import { cn } from '@/lib/utils';

const getScoreColor = (score: number): string => {
  if (score < 50) return '#E57373'; // Muted Red
  if (score < 75) return '#FBC02D'; // Amber
  return '#81C784'; // Green
};

const SubScoreItem: React.FC<{ subScore: SubScore }> = ({ subScore }) => {
  const { score, label, value, benchmark } = subScore;
  const color = getScoreColor(score);

  const subScoreIcons: Record<string, React.ReactNode> = {
    Profitability: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    Liquidity: <Wallet className="h-4 w-4 text-muted-foreground" />,
    Efficiency: <Zap className="h-4 w-4 text-muted-foreground" />,
    Demand: <Target className="h-4 w-4 text-muted-foreground" />,
  };
  
  return (
    <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 font-medium">
                {subScoreIcons[label]}
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs w-28 text-right">
                    {value}
                </span>
                <span className="font-bold w-10 text-right" style={{ color }}>{score}/100</span>
            </div>
        </div>
        <Progress value={score} style={{ backgroundColor: color }} />
    </div>
  );
};


export function BusinessHealthScore({ healthData }: { healthData?: BusinessHealth }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!healthData) {
        return null;
    }

    const { score, subScores } = healthData;
    const color = getScoreColor(score);

    return (
        <Card>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex items-center justify-center h-16 w-16 rounded-full text-white font-bold text-2xl"
                            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}
                            aria-label={`Business Health Score: ${score}`}
                        >
                            {score}
                        </div>
                        <div>
                            <CardTitle className="text-xl">Business Health Score</CardTitle>
                            <CardDescription>An overall measure of your forecast's viability.</CardDescription>
                        </div>
                    </div>
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center text-sm font-medium text-primary cursor-pointer mt-2 sm:mt-0">
                            Details
                            <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", isOpen && "rotate-180")} />
                        </div>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                    <div className="border-t px-6 py-4 space-y-4">
                        {subScores.map(subScore => (
                            <SubScoreItem key={subScore.label} subScore={subScore} />
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
