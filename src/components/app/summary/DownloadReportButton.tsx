
'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Loader2, FileJson, FileText } from 'lucide-react';
import { toPng } from 'html-to-image';


// --- Capture & Utility Helpers ---
const stopAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.nativeEvent as any)?.stopImmediatePropagation) {
      (e.nativeEvent as any).stopImmediatePropagation();
    }
};

const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

async function captureNodePng(node: HTMLElement, pixelRatio = 2): Promise<string> {
    return await toPng(node, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: '#fff',
        skipFonts: false,
        style: {
            transform: 'none',
            animation: 'none',
            transition: 'none',
            filter: 'none',
        },
        filter: (el) => {
            if (el.tagName === 'IMG' && el.src.startsWith('http') && !el.crossOrigin) {
                console.warn('[PDF Capture] Skipping cross-origin image:', el.src);
                return false;
            }
            return true;
        }
    });
}

async function captureFullReport(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.src = '/print/full?pdf=1';
    Object.assign(iframe.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      width: '1280px',
      height: '10px', // Start small, will grow
      opacity: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
      border: '0',
    });
    document.body.appendChild(iframe);
    
    const cleanup = () => { try { document.body.removeChild(iframe); } catch {} };

    iframe.onload = async () => {
      try {
        const win = iframe.contentWindow!;
        if (!win) throw new Error("Iframe content window not available.");

        // Wait for the page to prep itself (expand accordions, load fonts)
        if (typeof win.__PRINT_PREP__ === 'function') {
            await win.__PRINT_PREP__();
        }

        await raf2();
        
        iframe.style.height = `${win.document.documentElement.scrollHeight}px`;
        
        const root = win.document.getElementById('full-report-root') || win.document.documentElement;
        
        const dataUrl = await toPng(root, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: '#fff',
            skipFonts: false,
            style: { transform: 'none', animation: 'none', transition: 'none', filter: 'none' },
            filter: (el) => {
                if (el.tagName === 'IMG' && el.src.startsWith('http') && !el.crossOrigin) return false;
                return true;
            }
        });
        
        if (!dataUrl || dataUrl.length < 1000 || !dataUrl.startsWith('data:image/png;base64,')) {
            throw new Error('Invalid or empty data URL returned from capture.');
        }

        const img = new Image();
        img.onload = () => { cleanup(); resolve(img); };
        img.onerror = e => { cleanup(); reject(new Error('Failed to load captured image.')); };
        img.src = dataUrl;

      } catch (e) {
        cleanup();
        reject(e);
      }
    };
    iframe.onerror = e => { cleanup(); reject(new Error('Iframe failed to load /print/full.')); };
  });
}

function slicePngToA4(dataUrl: string, dpi = 150, marginMm = 10): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const pxPerMm = dpi / 25.4;
        const a4WidthPx = Math.round(210 * pxPerMm);
        const a4HeightPx = Math.round(297 * pxPerMm);
        const marginPx = Math.round(marginMm * pxPerMm);
        const contentW = a4WidthPx - (2 * marginPx);
        const contentH = a4HeightPx - (2 * marginPx);
        
        const img = new Image();
        img.onload = () => {
            const scale = contentW / img.width;
            const scaledW = Math.round(img.width * scale);
            const scaledH = Math.round(img.height * scale);

            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = scaledW;
            scaledCanvas.height = scaledH;
            const sctx = scaledCanvas.getContext('2d')!;
            sctx.imageSmoothingEnabled = true;
            sctx.imageSmoothingQuality = 'high';
            sctx.drawImage(img, 0, 0, scaledW, scaledH);

            const slices: string[] = [];
            for (let y = 0; y < scaledH; y += contentH) {
                const h = Math.min(contentH, scaledH - y);
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = a4WidthPx;
                pageCanvas.height = a4HeightPx;
                const pctx = pageCanvas.getContext('2d')!;
                pctx.fillStyle = '#fff';
                pctx.fillRect(0, 0, a4WidthPx, a4HeightPx);
                pctx.drawImage(scaledCanvas, 0, y, contentW, h, marginPx, marginPx, contentW, h);
                const sliceDataUrl = pageCanvas.toDataURL('image/png');
                const rawBase64 = sliceDataUrl.split(',')[1];
                if (rawBase64 && rawBase64.length > 1000) {
                    slices.push(rawBase64);
                } else {
                    console.warn(`[PDF Slice] Skipping empty or invalid slice at y=${y}. Length: ${rawBase64?.length || 0}`);
                }
            }
            resolve(slices);
        };
        img.onerror = () => reject(new Error("Failed to load image for slicing."));
        img.src = dataUrl;
    });
}


// --- Main Component ---
export function DownloadReportButton() {
  const [isBusy, setIsBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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
        toast({ variant: 'destructive', title: 'Error', description: 'Report content not found.'});
        return;
    }
    const dataUrl = await captureNodePng(node);
    const rawBase64 = dataUrl.split(',')[1];
    if (!rawBase64 || rawBase64.length < 1000) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to capture summary content.'});
        return;
    }
    console.log('[PDF Summary]', { len: rawBase64.length, dataUrlLen: dataUrl.length });
    const payload = { imageBase64: rawBase64, format:'png', page:'A4', dpi:150, fit:'contain', marginMm:10 };
    await handlePdfRequest(payload, isProbe, 'ForecastSummary');
  };

  const handleFullReport = async (isProbe: boolean) => {
    try {
        const img = await captureFullReport();
        const slices = await slicePngToA4(img.src);
        console.log('[PDF Full Report]', { slices: slices.length, lengths: slices.map(s => s.length) });
        if (slices.length === 0) {
            throw new Error("Slicing failed to produce any valid pages.");
        }
        const payload = { images: slices, format:'png', page:'A4', dpi:150, marginMm:10 };
        await handlePdfRequest(payload, isProbe, 'FullForecastReport');
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Full Report Error', description: err.message });
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
                    Choose the report you want to download as PDF or inspect with a JSON probe.
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
