// src/components/app/summary/DownloadReportButton.tsx
'use client';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Loader2, FileJson } from 'lucide-react';
import { captureRouteAsA4Pages, DEFAULT_A4, type ImageSlice, popLastRouteDiag } from '@/lib/pdfCapture';
import { useForecast } from '@/context/ForecastContext';

const stopAll = (e: React.MouseEvent) => {
  e.preventDefault(); e.stopPropagation();
  (e.nativeEvent as any)?.stopImmediatePropagation?.();
};

const ROUTES = ['/inputs','/revenue','/costs','/profit','/cash-flow','/summary'] as const;

type RouteStatus = 'waiting'|'capturing'|'sliced'|'done'|'failed';

export function DownloadReportButton() {
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [jsonOpen, setJsonOpen] = React.useState(false);
  const [jsonText, setJsonText] = React.useState<string>('');
  const [routeStates, setRouteStates] = React.useState<Record<string, RouteStatus>>(
    Object.fromEntries(ROUTES.map(r=>[r,'waiting'])) as any
  );
  const [progress, setProgress] = React.useState<number>(0);
  const [log, setLog] = React.useState<string[]>([]);
  const { toast } = useToast();
  const { locale } = useForecast();

  const appendLog = (s:string)=> setLog(l => [...l, s].slice(-100));
  const setState = (r:string, st:RouteStatus) => setRouteStates(s => ({...s, [r]: st}));

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
    if (blob.size < 16_000) throw new Error('Generated PDF is too small.');
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
    setRouteStates(Object.fromEntries(ROUTES.map(r=>[r,'waiting'])) as any);
    try {
      const allSlices: ImageSlice[] = [];
      const lang = (locale ?? 'en') as 'en'|'de';
      const clientDiag = { startTs: new Date().toISOString(), routes: [] as any[], totals: { slices: 0, kb: 0 } };

      const routeWeight = 100 / ROUTES.length;
      for (const route of ROUTES) {
        setState(route, 'capturing');
        appendLog(`→ Capturing ${route} ...`);

        let pages: ImageSlice[] = [];
        try {
          const t0 = performance.now();
          pages = await captureRouteAsA4Pages(route, lang, DEFAULT_A4);
          if (pages.length === 0) {
            appendLog(`   (retrying ${route})`);
            await new Promise(r=>setTimeout(r, 200));
            pages = await captureRouteAsA4Pages(route, lang, DEFAULT_A4);
          }
          const meta = popLastRouteDiag() || null;
          clientDiag.routes.push(meta ? { ...meta } : { route, note:'no-meta' });
          setState(route, pages.length > 0 ? 'sliced' : 'failed');
          const dt = Math.round(performance.now() - t0);
          appendLog(`   ${route}: ${pages.length} slices (${dt}ms)`);
        } catch (e:any) {
          setState(route, 'failed');
          appendLog(`   ${route} failed: ${e.message}`);
        }

        allSlices.push(...pages);
        setProgress(p => Math.min(100, p + routeWeight));
      }

      const seen = new Set<string>();
      const deduped: ImageSlice[] = [];
      for (const s of allSlices) {
        if (!s?.md5 || seen.has(s.md5)) continue;
        seen.add(s.md5);
        deduped.push(s);
      }
      const valid = deduped.filter(s => s?.imageBase64 && s.imageBase64.length > 2000);
      clientDiag.totals.slices = valid.length;
      clientDiag.totals.kb = Math.round(valid.reduce((a,s)=>a + s.imageBase64.length,0) * 3/4/1024);

      if (valid.length === 0) throw new Error('No printable content captured from any route.');

      const payload = { images: valid, page: 'A4', dpi: DEFAULT_A4.dpi, marginPt: DEFAULT_A4.marginPt, clientDiag };
      await handlePdfRequest(payload, isProbe, 'FullForecastReport');

      setProgress(100);
      Object.keys(routeStates).forEach(r => setState(r,'done'));
      setOpen(!isProbe); // bei PDF schließen, bei Probe offen lassen
    } catch (err:any) {
      toast({ variant:'destructive', title:'Full Report Error', description: err.message });
    } finally {
      setBusy(false);
    }
  }

  const copyJson = async () => {
    try { await navigator.clipboard.writeText(jsonText); toast({ title:'Copied JSON to clipboard' }); }
    catch { toast({ variant:'destructive', title:'Copy failed' }); }
  };
  const openAsJson = () => {
    const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonText);
    window.open(url, '_blank');
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
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>Full PDF or rich Probe JSON with per-route diagnostics.</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-3">
          <div className="h-2 w-full rounded bg-muted relative overflow-hidden">
            <div className="h-2 absolute left-0 top-0 rounded bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          {/* Per-route status */}
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {ROUTES.map(r => (
              <li key={r} className="flex items-center justify-between rounded border px-2 py-1">
                <span className="truncate">{r}</span>
                <span className="text-xs rounded px-2 py-0.5 bg-muted">
                  {routeStates[r]}
                </span>
              </li>
            ))}
          </ul>

          {/* Log */}
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
          <Button variant="secondary" type="button" onClick={(e)=>{ stopAll(e); setOpen(false); }}>Close</Button>
        </DialogFooter>
      </DialogContent>

      {/* JSON Viewer */}
      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Probe Result</DialogTitle>
            <DialogDescription>Server echo + client diagnostics.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" onClick={copyJson}>Copy JSON</Button>
            <Button size="sm" variant="outline" onClick={openAsJson}>Open as JSON</Button>
          </div>
          <pre className="mt-2 max-h-[60vh] overflow-auto rounded border bg-muted/30 p-3 text-xs leading-snug whitespace-pre-wrap break-words">
{jsonText}
          </pre>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={()=>setJsonOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
