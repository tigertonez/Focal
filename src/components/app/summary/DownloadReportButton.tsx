// src/components/app/summary/DownloadReportButton.tsx
'use client';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Loader2, FileJson, Copy, FileDown } from 'lucide-react';
import { captureFullReport } from '@/lib/pdfCapture';
import { useForecast } from '@/context/ForecastContext';

const stopAll = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  (e.nativeEvent as any)?.stopImmediatePropagation?.();
};

export function DownloadReportButton() {
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [jsonOpen, setJsonOpen] = React.useState(false);
  const [jsonText, setJsonText] = React.useState<string>('');
  const [progress, setProgress] = React.useState<number>(0);
  const [log, setLog] = React.useState<string[]>([]);
  const { toast } = useToast();
  const { locale, inputs, financials } = useForecast();
  const [status, setStatus] = React.useState<string>('');
  const [isPaused, setIsPaused] = React.useState<boolean>(false);

  React.useEffect(() => {
    const h = () => setIsPaused(document.visibilityState === 'hidden');
    h();
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  const appendLog = (s: string) => setLog(l => [...l, s].slice(-100));

  async function handlePdfRequest(payload: any, isProbe: boolean, title: string) {
    const response = await fetch('/api/print/pdf', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        ...(isProbe && { 'Accept': 'application/json' }) 
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.message || `PDF generation failed (${response.status})`);
    }
    
    if (isProbe) {
      const json = await response.json();
      const text = JSON.stringify(json, null, 2);
      setJsonText(text);
      setJsonOpen(true);
      return;
    }
    
    const blob = await response.blob();
    if (blob.size < 16_000) {
      throw new Error('Generated PDF is too small.');
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

  async function runFull(isProbe: boolean) {
    if (!inputs || !financials.data) {
      toast({
        variant: 'destructive',
        title: 'Export Error',
        description: 'No forecast data available. Please generate a report first.',
      });
      return;
    }

    setBusy(true);
    setProgress(0);
    setLog([]);
    setStatus('Starting export with current forecast state...');

    try {
      // Use current in-memory state for consistent export
      const { slices, diag } = await captureFullReport({
        lang: (locale ?? 'en') as 'en' | 'de',
        inputs,
        data: financials.data,
        onProgress: (p) => setProgress(p * 100),
        onLog: appendLog,
        onStatus: (s) => setStatus(s),
      });

      if (slices.length === 0) {
        if (isProbe) {
          await handlePdfRequest({ images: slices, clientDiag: diag }, isProbe, 'FullForecastReport');
        }
        throw new Error('No printable content captured from any route.');
      }

      // Validate page order and uniqueness
      const expectedOrder = ['/inputs', '/revenue', '/costs', '/profit', '/cash-flow', '/summary'];
      const actualOrder = slices.map(s => s.routeName);
      
      if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
        appendLog(`⚠ Page order mismatch: expected ${expectedOrder.join(',')}, got ${actualOrder.join(',')}`);
      }
      
      // Check for duplicates
      const md5s = slices.map(s => s.md5);
      const uniqueMd5s = new Set(md5s);
      if (md5s.length !== uniqueMd5s.size) {
        appendLog(`⚠ Duplicate pages detected: ${md5s.length} pages, ${uniqueMd5s.size} unique`);
      }

      setStatus('Finalizing PDF...');
      await handlePdfRequest({ 
        images: slices, 
        clientDiag: diag,
        page: 'A4',
        dpi: 150,
        marginPt: 24,
        title: 'FullForecastReport'
      }, isProbe, 'FullForecastReport');

      setProgress(100);
      setStatus('Export complete!');
      
      if (!isProbe) {
        toast({
          title: 'PDF Generated',
          description: `Successfully exported ${slices.length} pages`,
        });
        setTimeout(() => setOpen(false), 1500);
      }
      
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Export Error', 
        description: err.message 
      });
      setStatus(`Error: ${err.message}`);
      appendLog(`❌ Export failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      toast({ title: 'Copied JSON to clipboard' });
    } catch {
      toast({ variant: 'destructive', title: 'Copy failed' });
    }
  };

  const downloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `probe-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="download-report-trigger" variant="default" className="group" data-no-print="true">
          <Download className="mr-2" /> Download Report
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDown={(e) => e.stopPropagation()} className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Export Full Report</DialogTitle>
          <DialogDescription>
            Generate a deterministic 6-page PDF of your forecast with current data state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {isPaused
              ? (locale === 'de'
                  ? 'Pausiert: Bitte diesen Tab wieder in den Vordergrund bringen, damit der Export fortgesetzt wird.'
                  : 'Paused: Please bring this tab to the front to resume export.')
              : (locale === 'de'
                  ? 'Hinweis: Bitte diesen Tab während des Exports im Vordergrund lassen.'
                  : 'Tip: Keep this tab visible during export for best results.')}
          </div>
          
          <div className="h-2 w-full rounded bg-muted relative overflow-hidden">
            <div 
              className="h-2 absolute left-0 top-0 rounded bg-primary transition-all" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          
          <div className="text-xs h-4 font-medium">
            {status}
          </div>

          <div className="h-28 overflow-auto rounded border bg-muted/30 p-2 text-xs font-mono">
            {log.map((l, i) => (
              <div key={i} className={l.startsWith('✓') ? 'text-green-600' : l.startsWith('✗') || l.startsWith('❌') ? 'text-red-600' : l.startsWith('⚠') ? 'text-yellow-600' : ''}>
                {l}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 py-2">
          <Button 
            type="button" 
            disabled={busy || !inputs || !financials.data} 
            onClick={(e) => { stopAll(e); runFull(false); }}
          >
            {busy ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />} 
            Download Full Report (PDF)
          </Button>
          <Button 
            variant="outline" 
            type="button" 
            disabled={busy || !inputs || !financials.data} 
            onClick={(e) => { stopAll(e); runFull(true); }}
          >
            {busy ? <Loader2 className="mr-2 animate-spin" /> : <FileJson className="mr-2" />} 
            Probe Full Report (JSON)
          </Button>
        </div>

        <DialogFooter>
          <Button 
            variant="secondary" 
            type="button" 
            disabled={busy} 
            onClick={(e) => { stopAll(e); setOpen(false); }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Export Diagnostics</DialogTitle>
            <DialogDescription>
              Detailed diagnostics for troubleshooting PDF export issues.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyJson}>
              <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button size="sm" variant="outline" onClick={downloadJson}>
              <FileDown className="mr-2 h-4 w-4" /> Download JSON
            </Button>
          </div>
          <textarea
            readOnly
            className="mt-2 w-full h-[60vh] overflow-auto rounded border bg-muted/30 p-3 text-xs leading-snug font-mono whitespace-pre break-words"
            value={jsonText}
          />
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setJsonOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}