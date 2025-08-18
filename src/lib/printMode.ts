// src/lib/printMode.ts
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
  if (typeof window !== 'undefined') {
    window.__PRINT_READY_RESOLVE__?.();
  }
}

export function usePrintMode() {
  const params = useSearchParams();
  const isPrint = params.get('print') === '1';
  const lang = params.get('lang') || undefined;

  const { locale, setLocale } = useForecast();
  
  React.useEffect(() => {
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
  // <details>
  doc.querySelectorAll('details').forEach(d => (d as HTMLDetailsElement).open = true);
  // Radix/Recharts toggles
  const toggles = Array.from(doc.querySelectorAll<HTMLElement>('[aria-expanded="false"],[data-state="closed"]'));
  for (const t of toggles) { try { t.click(); } catch {} await new Promise(r => setTimeout(r, 16)); }
}

/** Wait fonts + 2 RAF + small idle */
export async function settleLayout(doc: Document) {
  try { await (doc as any).fonts?.ready; } catch {}
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 120));
}
