
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Loader2, FileJson, FileText } from 'lucide-react';
import { captureSummaryNodeRaw, captureRouteAsA4Pages, DEFAULT_A4 } from '@/lib/pdfCapture';

const stopAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.nativeEvent as any)?.stopImmediatePropagation) {
      (e.nativeEvent as any).stopImmediatePropagation();
    }
};

const FULL_REPORT_ROUTES = ['/inputs', '/revenue', '/costs', '/profit', '/cashflow', '/summary'];

export function DownloadReportButton() {
  const [isBusy, setIsBusy] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const { toast } = useToast();
  
  const handlePdfRequest = async (payload: any, isProbe: boolean, title: string) => {
    setIsBusy(true);
    try {
        const response = await fetch('/api/print/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(isProbe && { 'Accept': 'application/json' }),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            throw new Error(`PDF generation failed: ${errorJson.message || response.status}`);
        }

        if (isProbe) {
            const jsonData = await response.json();
            alert(`PROBE DATA:\n${JSON.stringify(jsonData, null, 2)}`);
        } else {
            const blob = await response.blob();
            if (blob.size < 5000 && !isProbe) {
                throw new Error("Generated PDF is empty or too small.");
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: err.message || 'An unknown error occurred. Please try again.',
      });
    } finally {
        setIsBusy(false);
        setModalOpen(false);
    }
  }

  const handleSummary = async (isProbe: boolean) => {
    const node = document.getElementById('report-content');
    if (!node) {
        toast({ variant: 'destructive', title: 'Error', description: 'Report content container not found.'});
        return;
    }
    
    setIsBusy(true);
    try {
        const { raw, w, h } = await captureSummaryNodeRaw(node);
        const payload = { 
            imageBase64: raw, 
            page: 'A4', 
            fit: 'contain', 
            ...DEFAULT_A4 
        };
        await handlePdfRequest(payload, isProbe, 'ForecastSummary');
    } catch (err: any) {
         toast({ variant: 'destructive', title: 'Capture Failed', description: err.message });
         setIsBusy(false);
    }
  };

  const handleFullReport = async (isProbe: boolean) => {
    setIsBusy(true);
    try {
        let allSlices: string[] = [];
        for (const route of FULL_REPORT_ROUTES) {
            const pages = await captureRouteAsA4Pages(route, DEFAULT_A4);
            allSlices.push(...pages);
        }
        
        const validSlices = allSlices.filter(s => s && s.length > 2000);
        if (validSlices.length === 0) {
            toast({ variant: "destructive", title: "Empty Report", description: "Could not capture any content for the report." });
            setIsBusy(false);
            return;
        }

        const payload = { 
            images: validSlices, 
            page: 'A4', 
            fit: 'contain',
            ...DEFAULT_A4 
        };
        await handlePdfRequest(payload, isProbe, 'FullForecastReport');
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Full Report Error', description: err.message });
        setIsBusy(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogTrigger asChild>
            <Button data-testid="download-report-trigger" variant="default" className="group">
                <Download className="mr-2" />
                Download Report
            </Button>
        </DialogTrigger>
        <DialogContent onPointerDown={(e) => e.stopPropagation()} className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Download Options</DialogTitle>
                <DialogDescription>
                    Choose the report you want to download as PDF or inspect the data payload.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <Button type="button" disabled={isBusy} onClick={(e) => { stopAll(e); handleSummary(false); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileText className="mr-2"/>} Download Summary (PDF)
               </Button>
               <Button type="button" disabled={isBusy} onClick={(e) => { stopAll(e); handleFullReport(false); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileText className="mr-2"/>} Download Full Report (PDF)
               </Button>
                <Button type="button" variant="outline" disabled={isBusy} onClick={(e) => { stopAll(e); handleSummary(true); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileJson className="mr-2"/>} Probe Summary (JSON)
               </Button>
                <Button type="button" variant="outline" disabled={isBusy} onClick={(e) => { stopAll(e); handleFullReport(true); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileJson className="mr-2"/>} Probe Full Report (JSON)
               </Button>
            </div>
            <DialogFooter>
                <Button variant="secondary" type="button" onClick={(e) => { stopAll(e); setModalOpen(false); }}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
