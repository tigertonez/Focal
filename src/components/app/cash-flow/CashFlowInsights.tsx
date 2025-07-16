
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lightbulb, ShieldAlert } from 'lucide-react';

export function CashFlowInsights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash-Flow Health</CardTitle>
        <CardDescription>
          AI-powered analysis of your cash flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg border p-4 text-sm">
            <Lightbulb className="h-6 w-6 text-blue-500" />
            <div className="text-muted-foreground">
              AI insights are temporarily paused to prevent API errors. We can re-enable this when you're ready.
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
