
'use client';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForecast } from '@/context/ForecastContext';

declare global {
  interface Window {
    __PRINT_READY_RESOLVE__?: () => void;
    __PRINT_READY__?: Promise<void>;
    __COLOR_DIAG__?: { runs: any[], ts: string };
  }
}

export function initPrintReadyPromise() {
  if (typeof window !== 'undefined' && !window.__PRINT_READY__) {
    window.__PRINT_READY__ = new Promise<void>(res => {
      window.__PRINT_READY_RESOLVE__ = res;
    });
  }
}

export function signalPrintReady() {
  if (typeof window !== 'undefined' && window.__PRINT_READY_RESOLVE__) {
    window.__PRINT_READY_RESOLVE__();
  }
}

function collectChartColorDiag(root: Document | HTMLElement, runName: string) {
    if (typeof window === 'undefined') return;
    const surfaces = root.querySelectorAll('svg.recharts-surface');
    const results: any[] = [];
    surfaces.forEach((svg, chartIndex) => {
        const shapes = svg.querySelectorAll('path, rect, circle, g.recharts-legend-item text');
        shapes.forEach(el => {
            const computed = getComputedStyle(el);
            results.push({
                chart: chartIndex,
                shape: el.tagName,
                selectorHint: el.getAttribute('class') || el.getAttribute('name'),
                computedFill: computed.fill,
                computedStroke: computed.stroke,
                attrFill: el.getAttribute('fill'),
                attrStroke: el.getAttribute('stroke'),
                opacity: computed.opacity,
            });
        });
    });

    if (!window.__COLOR_DIAG__) window.__COLOR_DIAG__ = { runs: [], ts: '' };
    window.__COLOR_DIAG__.runs.push({ name: runName, ts: new Date().toISOString(), results });
    window.__COLOR_DIAG__.ts = new Date().toISOString();
    console.groupCollapsed(`[ColorDiag] ${runName} - ${results.length} shapes`);
    console.table(results);
    console.groupEnd();
}

export function usePrintMode() {
  const params = useSearchParams();
  const isPrint = params.get('print') === '1';
  const isDebug = params.get('debugColors') === '1';
  const lang = params.get('lang') || undefined;
  const { locale, setLocale } = useForecast();
  
  React.useLayoutEffect(() => {
    if (isDebug) {
        const runDiag = (name: string) => collectChartColorDiag(document.body, name);
        runDiag('mount');
        const handleResize = () => runDiag('resize');
        window.addEventListener('resize', handleResize);
        
        requestAnimationFrame(() => {
            runDiag('raf_1');
            requestAnimationFrame(() => runDiag('raf_2'));
        });
        const timer = setTimeout(() => runDiag('idle_1s'), 1000);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }
  }, [isDebug]);

  React.useLayoutEffect(() => {
    if (!isPrint) return;
    document.documentElement.setAttribute('data-print', '1');
    document.documentElement.classList.add('pdf-mode');
    
    if (lang && lang !== locale && typeof setLocale === 'function') {
        setLocale(lang as any);
    }
    
    initPrintReadyPromise();

    return () => {
      document.documentElement.removeAttribute('data-print');
      document.documentElement.classList.remove('pdf-mode');
    };
  }, [isPrint, lang, locale, setLocale]);

  return { isPrint, lang: (lang ?? locale ?? 'en') as 'en' | 'de' };
}

/** Expand accordions/details and any [aria-expanded="false"] toggles */
export async function expandAllInteractive(root: Document | HTMLElement) {
  const doc = (root as Document).querySelector ? (root as Document) : root.ownerDocument!;
  doc.querySelectorAll('details').forEach(d => (d as HTMLDetailsElement).open = true);
  const toggles = Array.from(doc.querySelectorAll<HTMLElement>('[aria-expanded="false"],[data-state="closed"]'));
  for (const t of toggles) { try { t.click(); } catch {} await new Promise(r => setTimeout(r, 16)); }
}

/** Wait fonts + 2 RAF + small idle */
export async function settleLayout(doc: Document) {
  try { await (doc as any).fonts?.ready; } catch {}
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 120));
}

/** Waits for at least one Recharts SVG to have a measurable size */
export async function waitForVisibleCharts(doc: Document, { timeoutMs = 8000 } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        const svgs = Array.from(doc.querySelectorAll<SVGSVGElement>('svg.recharts-surface'));
        if (svgs.length === 0) {
            resolve();
            return;
        }

        let attempts = 0;
        const interval = 100;
        const maxAttempts = timeoutMs / interval;

        const checkCharts = () => {
            const allVisible = svgs.every(svg => {
                try {
                    const box = svg.getBBox();
                    return box.width > 0 && box.height > 0 && svg.querySelector('path');
                } catch {
                    return false;
                }
            });

            if (allVisible) {
                clearInterval(timer);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(timer);
                console.warn("CHARTS_NOT_VISIBLE_TIMEOUT: Charts did not become visible in time.");
                resolve(); // DO NOT reject
            }
            attempts++;
        };

        const timer = setInterval(checkCharts, interval);
    });
}

/** New orchestrator for routes in print mode */
export async function signalWhenReady(opts: {
  ensureForecastReady: () => Promise<void>;
  root: Document;
}): Promise<void> {
  try {
    await opts.ensureForecastReady();
    await expandAllInteractive(opts.root);
    await opts.root.fonts.ready.catch(()=>{});

    // Resize-Handshake
    window.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Charts prüfen – darf NICHT blockieren
    try {
      await waitForVisibleCharts(opts.root, { timeoutMs: 8000 });
    } catch (e) {
      console.warn('[print] waitForVisibleCharts timeout – continue anyway:', (e as Error).message);
    }
  } finally {
    await settleLayout(opts.root);
    signalPrintReady();
  }
}
