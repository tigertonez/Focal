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
  e.preventDefault(); e.stopPropagation();
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
  const { locale } = useForecast();
  const [status, setStatus] = React.useState<string>('');
  const [isPaused, setIsPaused] = React.useState<boolean>(false);

  React.useEffect(() => {
    const h = () => setIsPaused(document.visibilityState === 'hidden');
    h();
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  const appendLog = (s:string)=> setLog(l => [...l, s].slice(-100));

  async function handlePdfRequest(payload: any, isProbe: boolean, title: string) {
    const response = await fetch('/api/print/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(isProbe && { 'Accept': 'application/json' }) },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorJson = await response.json().catch(()=>({}));
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
        if(isProbe) {
            const json = await response.json();
            const text = JSON.stringify(json, null, 2);
            setJsonText(text);
            setJsonOpen(true);
        }
        throw new Error('Generated PDF is too small.');
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title}-${Date.now()}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function runFull(isProbe: boolean) {
    setBusy(true);
    setProgress(0);
    setLog([]);
    setStatus('Starting export...');

    try {
      const { slices, diag } = await captureFullReport({
        lang: (locale ?? 'en') as 'en'|'de',
        onProgress: (p) => setProgress(p * 100),
        onLog: appendLog,
        onStatus: (s) => setStatus(s),
      });

      if (slices.length === 0) {
        if(isProbe) {
          await handlePdfRequest({ images: slices, clientDiag: diag }, isProbe, 'FullForecastReport');
        }
        throw new Error('No printable content captured from any route.');
      }
      
      setStatus('Finalizing PDF...');
      await handlePdfRequest({ images: slices, clientDiag: diag }, isProbe, 'FullForecastReport');

      setProgress(100);
      setStatus('Done!');
      if (!isProbe) {
        setTimeout(() => setOpen(false), 1000);
      }
    } catch (err:any) {
      toast({ variant:'destructive', title:'Full Report Error', description: err.message });
      setStatus(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  const copyJson = async () => {
    try { await navigator.clipboard.writeText(jsonText); toast({ title:'Copied JSON to clipboard' }); }
    catch { toast({ variant:'destructive', title:'Copy failed' }); }
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
      <DialogContent onPointerDown={(e)=>e.stopPropagation()} className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Export Full Report</DialogTitle>
          <DialogDescription>Generate a multi-page PDF of your forecast or a detailed JSON for diagnostics.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {isPaused
              ? (locale === 'de'
                  ? 'Pausiert: Bitte diesen Tab wieder in den Vordergrund bringen, damit der Export fortgesetzt wird.'
                  : 'Paused: Please bring this tab to the front to resume export.')
              : (locale === 'de'
                  ? 'Hinweis: Bitte diesen Tab während des Exports im Vordergrund lassen. Wir pausieren automatisch, wenn Sie wegklicken.'
                  : 'Tip: Keep this tab visible during export. We pause automatically if you switch away.')}
          </div>
          <div className="h-2 w-full rounded bg-muted relative overflow-hidden">
            <div className="h-2 absolute left-0 top-0 rounded bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs h-4">
            {status}
          </div>

          <div className="h-28 overflow-auto rounded border bg-muted/30 p-2 text-xs font-mono">
            {log.map((l,i)=><div key={i}>{l}</div>)}
          </div>
        </div>

        <div className="grid gap-3 py-2">
          <Button type="button" disabled={busy} onClick={(e)=>{ stopAll(e); runFull(false); }}>
            {busy ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />} Download Full Report (PDF)
          </Button>
          <Button variant="outline" type="button" disabled={busy} onClick={(e)=>{ stopAll(e); runFull(true); }}>
            {busy ? <Loader2 className="mr-2 animate-spin" /> : <FileJson className="mr-2" />} Probe Full Report (JSON)
          </Button>
        </div>

        <DialogFooter>
          <Button variant="secondary" type="button" disabled={busy} onClick={(e)=>{ stopAll(e); setOpen(false); }}>Close</Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Probe Result</DialogTitle>
            <DialogDescription>Server echo + client diagnostics. Useful for debugging.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyJson}><Copy className="mr-2 h-4 w-4" /> Copy JSON</Button>
            <Button size="sm" variant="outline" onClick={downloadJson}><FileDown className="mr-2 h-4 w-4" /> Download JSON</Button>
          </div>
          <textarea
            readOnly
            className="mt-2 w-full h-[60vh] overflow-auto rounded border bg-muted/30 p-3 text-xs leading-snug font-mono whitespace-pre break-words"
            value={jsonText}
          />
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={()=>setJsonOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
