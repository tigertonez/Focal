'use client';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForecast } from '@/context/ForecastContext';

declare global {
  interface Window {
    __PRINT_READY_RESOLVE__?: () => void;
    __PRINT_READY__?: Promise<void>;
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

export function usePrintMode() {
  const params = useSearchParams();
  const isPrint = params.get('print') === '1';
  const lang = params.get('lang') || undefined;
  const { locale, setLocale, ensureForecastReady } = useForecast();
  
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
                reject(new Error("CHARTS_NOT_VISIBLE_TIMEOUT: Charts did not become visible in time."));
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
    await opts.ensureForecastReady();
    await expandAllInteractive(opts.root);
    await opts.root.fonts.ready.catch(()=>{});
    await waitForVisibleCharts(opts.root);
    // Dispatch resize events and wait for layout to settle
    window.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await settleLayout(opts.root);
    signalPrintReady();
}
