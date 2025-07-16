
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { getFinancials } from '@/lib/get-financials';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { ProfitToCashBridge } from '@/components/app/summary/ProfitToCashBridge';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';

// =================================================================
// STRATEGY BLUEPRINT: BUSINESS HEALTH SCORE
// =================================================================
// Phase 0: DO NOT IMPLEMENT. This is the strategic plan for alignment.
//
// 1. Vision (Zielbild)
//    - Create a single, powerful "Business Health Score" (0-100 scale).
//    - The score is automatically calculated from all previously generated KPIs.
//    - It should provide an immediate, at-a-glance understanding of the business model's viability.
//    - The score will drive concrete, actionable recommendations.
//
// 2. Calculation Logic
//    - KPI Pool: Exclusively use values already calculated by the financial engine:
//      - Contribution Margin %
//      - Operating Profit € & Margin %
//      - Peak Funding Need €
//      - Cash Runway (months)
//      - Sell-Through %
//    - Weighting (Example, adjustable):
//      - Profitability: 35%
//      - Liquidity/Cash: 30%
//      - Efficiency (e.g., Contribution Margin vs. Marketing ROI): 20%
//      - Demand/Sell-Through: 15%
//    - Scoring Method:
//      - Each KPI is normalized to a 0-100 scale.
//      - Benchmarks (e.g., thresholds for 'good', 'average', 'poor') define the scale for each KPI.
//      - Final Score = Σ (normalized KPI score × weight).
//      - Benchmarks and weights will be stored in a JSON configuration for easy fine-tuning.
//
// 3. UI Concept
//    - At the top of the Summary page, display a prominent gauge or large badge (e.g., "Health Score: 78/100").
//    - Below the score, show a "traffic light" bar with sub-scores for the four main categories (Profit, Cash, Efficiency, Demand), colored according to their performance.
//    - Action Panel:
//      - For each KPI performing in the 'red' or 'yellow' zone, automatically display one targeted recommendation.
//      - Recommendations should be actionable and allow users to click to navigate to the relevant page (e.g., Costs, Inputs) to make adjustments.
//    - Scenario Switcher (Optional future feature):
//      - A small toggle (e.g., Base Case / +20% Sales / -10% Margin) that recalculates the Health Score on the fly.
//
// 4. Recommendation Generator (High-Level)
//    - The engine will compare live KPIs against the defined benchmarks.
//    - For each underperforming KPI, it will generate a concise recommendation and tactic (e.g., "Raise price by X%", "Reallocate marketing spend", "Reduce specific cost").
//    - Recommendations will be returned as a simple array of strings to be rendered in the UI.
//
// 5. Implementation Plan
//    - Phase 1: Build the core calculation logic for the score within the financial engine.
//    - Phase 2: Develop the UI components on the Summary page (Gauge, Traffic Light Bar, Action Panel).

function SummaryPageContent({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
  const router = useRouter();

  const handleDownload = () => {
    // Hide the buttons during capture
    const buttons = document.querySelectorAll('footer button');
    buttons.forEach(btn => (btn as HTMLElement).style.visibility = 'hidden');

    html2canvas(document.body, {
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      useCORS: true,
      logging: false,
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'financial-summary.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // Show the buttons again
      buttons.forEach(btn => (btn as HTMLElement).style.visibility = 'visible');
    });
  };

  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Financial Summary" description="A high-level overview of your financial forecast." />
      
      <div className="space-y-8">
         <ProfitToCashBridge data={data} currency={inputs.parameters.currency} />
         {/* More summary components can be added here in the future */}
      </div>

      <footer className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/inputs')}>
          <ArrowLeft className="mr-2" /> Back to Inputs
        </Button>
         <Button onClick={handleDownload}>
          <Download className="mr-2" /> Download Report
        </Button>
      </footer>
    </div>
  )
}

export default function SummaryPage() {
  const [financials, setFinancials] = useState<{ data: EngineOutput | null; inputs: EngineInput | null; error: string | null; isLoading: boolean }>({
    data: null,
    inputs: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    const result = getFinancials();
    setFinancials({ ...result, isLoading: false });
  }, []);

  const { data, inputs, error, isLoading } = financials;

  if (isLoading) {
    return <SummaryPageSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Data Error</AlertTitle>
          <AlertDescription>
            {error} Please generate a new report from the Inputs page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || !inputs) {
    return <SummaryPageSkeleton />;
  }

  return <SummaryPageContent data={data} inputs={inputs} />;
}
