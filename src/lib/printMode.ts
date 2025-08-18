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

/** Waits for at least one Recharts SVG to have a measurable size */
async function waitForVisibleCharts(root: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      const svgs = Array.from(root.querySelectorAll<SVGSVGElement>('.recharts-surface, .recharts-wrapper svg'));
      const hasVisibleChart = svgs.some(svg => {
        try {
          const box = svg.getBBox();
          return box.width > 0 && box.height > 0;
        } catch {
          return false; // getBBox can fail if element is not rendered
        }
      });

      if (hasVisibleChart || attempts >= 40) { // 40 * 50ms = 2 seconds timeout
        clearInterval(interval);
        resolve();
      }
      attempts++;
    }, 50);
  });
}

export function usePrintMode() {
  const params = useSearchParams();
  const isPrint = params.get('print') === '1';
  const lang = params.get('lang') || undefined;
  const { locale, setLocale, ensureForecastReady } = useForecast();
  
  React.useEffect(() => {
    if (!isPrint) return;
    document.documentElement.setAttribute('data-print', '1');
    document.documentElement.classList.add('pdf-mode');
    
    (async () => {
        if (lang && lang !== locale && typeof setLocale === 'function') {
            await setLocale(lang as any);
        }
        await ensureForecastReady();
        initPrintReadyPromise();
    })();

    return () => {
      document.documentElement.removeAttribute('data-print');
      document.documentElement.classList.remove('pdf-mode');
    };
  }, [isPrint, lang, locale, setLocale, ensureForecastReady]);

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

/** Awaits data, expands UI, waits for layout/charts, then signals ready */
export async function signalWhenReady(root: Document | HTMLElement) {
    const doc = root.ownerDocument || document;
    await expandAllInteractive(doc);
    await settleLayout(doc);
    await waitForVisibleCharts(doc.body); // Check the whole body for SVGs
    signalPrintReady();
}
