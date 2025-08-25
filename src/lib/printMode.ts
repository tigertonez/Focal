'use client';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForecast } from '@/context/ForecastContext';
import type { EngineInput, EngineOutput } from '@/lib/types';

declare global {
  interface Window {
    __PRINT_READY_RESOLVE__?: () => void;
    __PRINT_READY__?: Promise<void>;
    __PRINT_STATE__?: { inputs: EngineInput; data: EngineOutput };
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

// Deserialize state from URL params
function deserializeState(stateParam: string | null): { inputs: EngineInput; data: EngineOutput } | null {
  if (!stateParam) return null;
  
  try {
    const decoded = atob(stateParam);
    const parsed = JSON.parse(decoded);
    
    if (parsed.inputs && parsed.data) {
      return { inputs: parsed.inputs, data: parsed.data };
    }
  } catch (e) {
    console.warn('Failed to deserialize print state:', e);
  }
  
  return null;
}

export function usePrintMode() {
  const params = useSearchParams();
  const isPrint = params.get('print') === '1';
  const isDebug = params.get('debugColors') === '1';
  const lang = params.get('lang') || undefined;
  const stateParam = params.get('state');
  const runId = params.get('runId');
  const { locale, setLocale, setInputs, setFinancials } = useForecast();

  // Handle state injection for print mode
  React.useEffect(() => {
    if (isPrint && stateParam) {
      const deserializedState = deserializeState(stateParam);
      if (deserializedState) {
        // Inject state into context for print rendering
        setInputs(deserializedState.inputs);
        setFinancials({
          data: deserializedState.data,
          error: null,
          isLoading: false,
        });
        
        // Also store in window for route marker injection
        window.__PRINT_STATE__ = deserializedState;
      }
    }
  }, [isPrint, stateParam, setInputs, setFinancials]);

  React.useLayoutEffect(() => {
    if (!isPrint) return;
    
    document.documentElement.setAttribute('data-print', '1');
    document.documentElement.classList.add('pdf-mode');
    
    if (lang && lang !== locale && typeof setLocale === 'function') {
      setLocale(lang as any);
    }
    
    initPrintReadyPromise();

    // Inject route marker for verification
    if (runId) {
      const currentRoute = window.location.pathname as any;
      const marker = `ROUTE_${currentRoute.replace('/', '').toUpperCase()}_${runId}`;
      
      const markerDiv = document.createElement('div');
      markerDiv.id = 'route-marker';
      markerDiv.setAttribute('data-route-marker', marker);
      markerDiv.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      markerDiv.textContent = marker;
      document.body.appendChild(markerDiv);
    }

    return () => {
      document.documentElement.removeAttribute('data-print');
      document.documentElement.classList.remove('pdf-mode');
    };
  }, [isPrint, lang, locale, setLocale, runId]);

  return { 
    isPrint, 
    isDebug, 
    lang: (lang ?? locale ?? 'en') as 'en' | 'de',
    runId: runId || undefined,
  };
}

/** Wait fonts + multiple RAF + settle delay */
export async function settleLayout(doc: Document) {
  try {
    await doc.fonts?.ready;
  } catch {}
  
  // Multiple animation frames to ensure stability
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
  
  // Trigger resize events
  const win = doc.defaultView;
  if (win) {
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(r));
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(r));
  }
  
  await new Promise(r => setTimeout(r, 200));
}

/** Expand accordions/details and any [aria-expanded="false"] toggles */
export async function expandAllInteractive(root: Document | HTMLElement) {
  const doc = (root as Document).querySelector ? (root as Document) : root.ownerDocument!;
  
  doc.querySelectorAll('details').forEach(d => (d as HTMLDetailsElement).open = true);
  
  const toggles = Array.from(doc.querySelectorAll<HTMLElement>('[aria-expanded="false"],[data-state="closed"]'));
  for (const t of toggles) {
    try {
      if (t.tagName === 'BUTTON' || t.getAttribute('role') === 'button') {
        t.click();
        await new Promise(r => setTimeout(r, 50));
      }
    } catch {}
  }
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
          return box.width > 0 && box.height > 0 && svg.querySelector('path, rect, circle');
        } catch {
          return false;
        }
      });

      if (allVisible) {
        clearInterval(timer);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.warn('CHARTS_NOT_VISIBLE_TIMEOUT: Charts did not become visible in time.');
        resolve(); // DO NOT reject - continue with capture
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
    await settleLayout(opts.root);
    
    // Charts check - non-blocking
    try {
      await waitForVisibleCharts(opts.root, { timeoutMs: 6000 });
    } catch (e) {
      console.warn('[print] waitForVisibleCharts timeout – continue anyway:', (e as Error).message);
    }
  } finally {
    signalPrintReady();
  }
}