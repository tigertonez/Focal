
'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Loader2, FileJson, FileText } from 'lucide-react';
import { toPng } from 'html-to-image';


// --- Capture & Utility Helpers ---
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));


async function waitReady(win: Window, timeout = 8000) {
  try {
    await (win.document as any).fonts?.ready;
  } catch {}
  let last = win.document.documentElement.scrollHeight;
  const start = Date.now();
  for (;;) {
    await sleep(120);
    const now = win.document.documentElement.scrollHeight;
    const stable = Math.abs(now - last) < 2;
    last = now;
    const readyFlag = (win as any).__PDF_READY__ === true || (win as any).__PRINT_READY__ === true;
    if (stable && readyFlag) break;
    if (Date.now() - start > timeout) break;
  }
  await raf2();
}

async function captureNodePng(node: HTMLElement, pixelRatio = 2): Promise<string> {
    return toPng(node, {
        backgroundColor: '#fff',
        pixelRatio,
        cacheBust: true,
        skipFonts: false,
    });
}

async function captureFullReport(): Promise<HTMLImageElement> {
  const ifr = document.createElement('iframe');
  ifr.src = '/print/full?pdf=1';
  Object.assign(ifr.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '1280px',
    height: '100vh',
    opacity: '0',
    pointerEvents: 'none',
    border: '0',
    zIndex: '-1'
  });
  document.body.appendChild(ifr);

  const cleanup = () => {
    try {
      document.body.removeChild(ifr);
    } catch {}
  };

  return new Promise((resolve, reject) => {
    ifr.onload = async () => {
      try {
        const win = ifr.contentWindow!;
        await waitReady(win);
        const h = win.document.documentElement.scrollHeight;
        ifr.style.height = `${h}px`;
        await raf2();

        const root = win.document.getElementById('full-report-root') || win.document.documentElement;
        
        const dataUrl = await toPng(root, {
            backgroundColor: '#fff',
            pixelRatio: 2,
            cacheBust: true,
            width: root.scrollWidth,
            height: root.scrollHeight,
            windowWidth: root.scrollWidth,
            windowHeight: root.scrollHeight,
        });
        const img = new Image();
        img.onload = () => {
          cleanup();
          resolve(img);
        };
        img.onerror = e => {
          cleanup();
          reject(e);
        };
        img.src = dataUrl;
      } catch (e) {
        cleanup();
        reject(e);
      }
    };
    ifr.onerror = e => {
      cleanup();
      reject(e);
    };
  });
}

function sliceToA4(dataUrl: string, opts?: { dpi?: number; marginPt?: number }) {
  const dpi = opts?.dpi ?? 150;
  const marginPt = opts?.marginPt ?? 24;
  const pxPerPt = dpi / 72;

  const a4WidthPx  = Math.round(8.27 * dpi);
  const a4HeightPx = Math.round(11.69 * dpi);
  const marginPx   = Math.round(marginPt * pxPerPt);
  const contentW   = a4WidthPx - marginPx * 2;
  const contentH   = a4HeightPx - marginPx * 2;

  const img = new Image();
  img.src = dataUrl;
  return new Promise<string[]>((resolve, reject) => {
    img.onload = () => {
      const scale = contentW / img.width;
      const scaledW = Math.round(img.width * scale);
      const scaledH = Math.round(img.height * scale);

      const scaled = document.createElement('canvas');
      scaled.width = scaledW; scaled.height = scaledH;
      const sctx = scaled.getContext('2d')!;
      sctx.fillStyle = '#fff'; sctx.fillRect(0,0,scaledW,scaledH);
      sctx.drawImage(img, 0, 0, scaledW, scaledH);

      const slices: string[] = [];
      for (let y = 0; y < scaledH; y += contentH) {
        const h = Math.min(contentH, scaledH - y);
        const page = document.createElement('canvas');
        page.width = a4WidthPx; page.height = a4HeightPx;
        const pctx = page.getContext('2d')!;
        pctx.fillStyle = '#fff'; pctx.fillRect(0,0,page.width,page.height);
        
        const xOff = Math.round((a4WidthPx - (marginPx*2) - contentW)/2) + marginPx;
        pctx.drawImage(scaled, 0, y, contentW, h, xOff, marginPx, contentW, h);
        slices.push(page.toDataURL('image/png'));
      }
      resolve(slices);
    };
    img.onerror = reject;
  });
}

const stopAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.nativeEvent as any)?.stopImmediatePropagation) {
      (e.nativeEvent as any).stopImmediatePropagation();
    }
};


// --- Main Component ---
export function DownloadReportButton() {
  const [isBusy, setIsBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  
  const handleDownload = async (isProbe: boolean, isFullReport: boolean) => {
    setIsBusy(true);
    const title = isFullReport ? 'FullForecastReport' : 'ForecastReport';

    try {
        let payload: any;
        if (isFullReport) {
            const img = await captureFullReport();
            const slices = await sliceToA4(img.src, {dpi: 150, marginPt: 24});
            const images = slices.map(s => s.replace(/^data:image\/\w+;base64,/, '')).filter(Boolean);
            if(images.length === 0) throw new Error("Slicing failed to produce images.");
            payload = { images, page: 'A4', dpi: 150, marginPt: 24, title };
        } else {
            const node = document.getElementById('report-content');
            if (!node) throw new Error("Could not find #report-content element.");
            const dataUrl = await captureNodePng(node);
            const img = new Image();
            img.src = dataUrl;
            await new Promise(r=>img.onload=r);
            payload = { imageBase64: dataUrl.split(',')[1], width: img.naturalWidth, height: img.naturalHeight, page:'A4', fit:'contain', marginPt: 36, dpi: 150, title };
        }

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
                    Choose the report you want to download or probe. Probes return technical data instead of a file.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <Button type="button" disabled={isBusy} onClick={(e) => { stopAll(e); handleDownload(false, false); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileText className="mr-2"/>} Download Summary (PDF)
               </Button>
               <Button type="button" disabled={isBusy} onClick={(e) => { stopAll(e); handleDownload(false, true); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileText className="mr-2"/>} Download Full Report (PDF)
               </Button>
                <Button type="button" variant="outline" disabled={isBusy} onClick={(e) => { stopAll(e); handleDownload(true, false); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileJson className="mr-2"/>} Probe Summary (JSON)
               </Button>
                <Button type="button" variant="outline" disabled={isBusy} onClick={(e) => { stopAll(e); handleDownload(true, true); }}>
                 {isBusy ? <Loader2 className="mr-2 animate-spin"/> : <FileJson className="mr-2"/>} Probe Full Report (JSON)
               </Button>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={(e) => { stopAll(e); setModalOpen(false); }}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
