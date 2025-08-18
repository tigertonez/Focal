'use client';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Loader2, FileJson, FileText } from 'lucide-react';
import { captureSummaryNodeRaw, captureRouteAsA4Pages, DEFAULT_A4, ImageSlice } from '@/lib/pdfCapture';
import { useForecast } from '@/context/ForecastContext';

const stopAll = (e: React.MouseEvent) => {
  e.preventDefault(); e.stopPropagation();
  (e.nativeEvent as any)?.stopImmediatePropagation?.();
};

const FULL_ROUTES = ['/inputs','/revenue','/costs','/profit','/cash-flow','/summary'];

export function DownloadReportButton() {
  const [isBusy, setIsBusy] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const { toast } = useToast();
  const { locale } = useForecast();

  const handlePdfRequest = async (payload: any, isProbe: boolean, title: string) => {
    const response = await fetch('/api/print/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isProbe && { 'Accept': 'application/json' }),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorJson = await response.json().catch(()=>({}));
      throw new Error(errorJson.message || `PDF generation failed (${response.status})`);
    }
    if (isProbe) {
      const jsonData = await response.json();
      alert(`PROBE DATA:\n${JSON.stringify(jsonData, null, 2)}`);
      return;
    }
    const blob = await response.blob();
    if (blob.size < 8000) throw new Error('Generated PDF is empty or too small.');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title}-${Date.now()}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSummary = async (isProbe: boolean) => {
    const node = document.getElementById('report-content');
    if (!node) return toast({ variant:'destructive', title:'Error', description:'Report content not found.' });
    setIsBusy(true);
    try {
      const { raw, w, h } = await captureSummaryNodeRaw(node);
      await handlePdfRequest({ imageBase64: raw, width: w, height: h, page:'A4', fit:'contain', ...DEFAULT_A4 }, isProbe, 'ForecastSummary');
      setModalOpen(false);
    } catch (err:any) {
      toast({ variant:'destructive', title:'Capture Failed', description: err.message });
    } finally { setIsBusy(false); }
  };

  const handleFullReport = async (isProbe: boolean) => {
    setIsBusy(true);
    try {
      const slices: ImageSlice[] = [];
      const lang = (locale ?? 'en') as 'en'|'de';
      for (const route of FULL_ROUTES) {
        const pages = await captureRouteAsA4Pages(route, lang, DEFAULT_A4);
        slices.push(...pages);
      }
      const valid = slices.filter(s => s?.imageBase64 && s.imageBase64.length > 2000);
      if (valid.length === 0) throw new Error('No printable content was captured (0 slices).');
      await handlePdfRequest({ images: valid, page:'A4', dpi: DEFAULT_A4.dpi, marginPt: DEFAULT_A4.marginPt }, isProbe, 'FullForecastReport');
      setModalOpen(false);
    } catch (err:any) {
      toast({ variant:'destructive', title:'Full Report Error', description: err.message });
    } finally { setIsBusy(false); }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button data-testid="download-report-trigger" variant="default" className="group">
          <Download className="mr-2" /> Download Report
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDown={(e)=>e.stopPropagation()} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>Choose the report to download as PDF or inspect the payload.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button type="button" disabled={isBusy} onClick={(e)=>{ stopAll(e); handleSummary(false); }}>
            {isBusy ? <Loader2 className="mr-2 animate-spin" /> : <FileText className="mr-2" />} Download Summary (PDF)
          </Button>
          <Button type="button" disabled={isBusy} onClick={(e)=>{ stopAll(e); handleFullReport(false); }}>
            {isBusy ? <Loader2 className="mr-2 animate-spin" /> : <FileText className="mr-2" />} Download Full Report (PDF)
          </Button>
          <Button variant="outline" type="button" disabled={isBusy} onClick={(e)=>{ stopAll(e); handleSummary(true); }}>
            {isBusy ? <Loader2 className="mr-2 animate-spin" /> : <FileJson className="mr-2" />} Probe Summary (JSON)
          </Button>
          <Button variant="outline" type="button" disabled={isBusy} onClick={(e)=>{ stopAll(e); handleFullReport(true); }}>
            {isBusy ? <Loader2 className="mr-2 animate-spin" /> : <FileJson className="mr-2" />} Probe Full Report (JSON)
          </Button>
        </div>
        <DialogFooter>
          <Button variant="secondary" type="button" onClick={(e)=>{ stopAll(e); setModalOpen(false); }}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
