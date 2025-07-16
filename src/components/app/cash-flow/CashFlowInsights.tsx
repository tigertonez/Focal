
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
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
             <h3 className="font-semibold text-sm flex items-center gap-2">Key Metrics</h3>
              <div className="text-sm text-muted-foreground pl-7 space-y-2">
                <p>AI insights are temporarily paused.</p>
              </div>
          </div>
           <div className="space-y-3">
             <h3 className="font-semibold text-sm flex items-center gap-2">Recommendations</h3>
              <div className="text-sm text-muted-foreground pl-7 space-y-2">
                 <p>AI insights are temporarily paused.</p>
              </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
