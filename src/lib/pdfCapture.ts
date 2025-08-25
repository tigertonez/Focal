// src/lib/pdfCapture.ts
'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { Md5 } from 'ts-md5';
import type { EngineInput, EngineOutput } from '@/lib/types';

const CAPTURE_WIDTH_PX = 1280;
const A4_ASPECT_RATIO = 8.27 / 11.69;
const MIN_KB_OK = 50;
const ROUTES: Route[] = ['/inputs', '/revenue', '/costs', '/profit', '/cash-flow', '/summary'] as const;

export type Route = '/inputs' | '/revenue' | '/costs' | '/profit' | '/cash-flow' | '/summary';
export type ImageSlice = {
  imageBase64: string;
  wPx: number;
  hPx: number;
  routeName: Route;
  pageIndex: number;
  md5: string;
  routeMarker: string; // Unique identifier for route verification
};

type CaptureMethod = 'html-to-image' | 'html2canvas';

type RouteDiag = {
  route: Route;
  attempt: number;
  url: string;
  routeIdentity: {
    want: Route;
    landed: string;
    ok: boolean;
    markerFound: boolean;
    routeMarker: string;
  };
  capture: {
    method: CaptureMethod;
    suspiciousPrimary?: boolean;
    error?: string;
    sizeKb: number;
    isBlank: boolean;
    retries: number;
  };
  readiness: {
    fontsReady: boolean;
    chartsReady: boolean;
    chartsCount: number;
    settleMs: number;
  };
  state: {
    source: 'serialized' | 'localStorage' | 'default';
    inputsHash: string;
    dataHash: string;
  };
  colors: {
    seedKeys: string[];
    mappedColors: Record<string, string>;
  };
  iframeLoadMs: number;
  usedCache?: boolean;
  recaptureDupe?: boolean;
};

type Diag = {
  runId: string;
  startTs: string;
  routes: RouteDiag[];
  totals: { slices: number; kb: number };
  guarantee: {
    before: number;
    after: number;
    missingBefore: string[];
    placeholdersAdded: string[];
  };
  visibility: { pauses: number; pausedMs: number };
  invariants: { dupesFound: number; dupesStillPresent: Route[] };
  md5ByRoute: Record<Route, string | null>;
  stateSnapshot: {
    inputs: EngineInput;
    data: EngineOutput;
    timestamp: string;
  };
};

const rawFromDataUrl = (url: string) => {
  if (!url) return '';
  const i = url.indexOf('base64,');
  if (i < 0) return '';
  return url.slice(i + 7);
};

// Generate unique route marker for verification
function generateRouteMarker(route: Route, runId: string): string {
  return `ROUTE_${route.replace('/', '').toUpperCase()}_${runId}`;
}

// Inject route marker into page for verification
function injectRouteMarker(doc: Document, marker: string) {
  const markerDiv = doc.createElement('div');
  markerDiv.id = 'route-marker';
  markerDiv.setAttribute('data-route-marker', marker);
  markerDiv.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  markerDiv.textContent = marker;
  doc.body.appendChild(markerDiv);
}

// Verify route marker exists
function verifyRouteMarker(doc: Document, expectedMarker: string): boolean {
  const markerEl = doc.querySelector(`[data-route-marker="${expectedMarker}"]`);
  return !!markerEl && markerEl.textContent === expectedMarker;
}

// Visibility guard (pause export while tab is hidden)
function onVisible(topDoc: Document = document) {
  return new Promise<void>((res) => {
    const handler = () => {
      if (topDoc.visibilityState === 'visible') {
        topDoc.removeEventListener('visibilitychange', handler);
        res();
      }
    };
    topDoc.addEventListener('visibilitychange', handler);
  });
}

async function waitTabVisible(topDoc: Document = document, onStatus?: (s: string) => void) {
  if (topDoc.visibilityState === 'visible') return;
  onStatus?.('Paused — tab is in background. Please return to this tab to continue…');
  await onVisible(topDoc);
  onStatus?.('Resumed — continuing export.');
}

async function waitIframeLoad(iframe: HTMLIFrameElement) {
  return new Promise<void>(res => {
    const t = setTimeout(() => {
      console.warn('Iframe load timeout');
      res();
    }, 10000);
    iframe.onload = () => {
      clearTimeout(t);
      res();
    };
    iframe.onerror = () => {
      clearTimeout(t);
      res();
    };
  });
}

function createIsolatedFrame(routeUrl: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-20000px';
  iframe.style.top = '0px';
  iframe.width = `${CAPTURE_WIDTH_PX + 40}`;
  iframe.height = '4000';
  iframe.style.border = 'none';
  iframe.style.background = '#ffffff';
  document.body.appendChild(iframe);

  const t0 = performance.now();
  iframe.src = routeUrl;

  return {
    iframe,
    async ready() {
      await waitIframeLoad(iframe);
      return {
        win: iframe.contentWindow!,
        doc: iframe.contentDocument || iframe.contentWindow!.document,
        tLoadMs: Math.round(performance.now() - t0),
      };
    },
    cleanup() {
      try {
        iframe.remove();
      } catch {}
    },
  };
}

function injectPrintCSS(doc: Document) {
  const style = doc.createElement('style');
  style.textContent = `
    html, body { 
      width: ${CAPTURE_WIDTH_PX}px !important; 
      margin: 0 auto !important; 
      background: #fff !important; 
      overflow-x: hidden !important;
    }
    [data-report-root] { 
      width: ${CAPTURE_WIDTH_PX}px !important; 
      margin: 0 auto !important; 
    }
    .container { max-width: 100% !important; }
    [data-no-print="true"] { display: none !important; }
    [data-hide-in-pdf="true"] { display: none !important; }
    header, nav, footer, .mobile-nav { display: none !important; }
    
    /* Freeze animations and transitions */
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      transform: none !important;
      will-change: auto !important;
    }
    
    /* Chart optimizations */
    .recharts-wrapper, .recharts-responsive-container, .recharts-surface { 
      transform: none !important; 
    }
    
    /* Hide AI insights and interactive elements */
    [data-ai-insight], [data-ai-report], .ai-insights, .ai-insight, 
    #ai-insights, #get-strategic-analysis, [data-print-hide="ai"], 
    .strategic-cta, button:not([data-print-keep]) {
      display: none !important; 
      visibility: hidden !important;
    }
    
    /* Ensure proper text rendering */
    * {
      text-rendering: geometricPrecision !important;
      font-synthesis: none !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
  doc.head.appendChild(style);
}

async function waitForReportRoot(win: Window, { timeoutMs = 8000 } = {}): Promise<HTMLElement> {
  const doc = win.document;
  const t0 = performance.now();
  
  while (performance.now() - t0 < timeoutMs) {
    const el = doc.querySelector<HTMLElement>('[data-report-root]');
    if (el) return el;
    await new Promise(r => requestAnimationFrame(r));
  }
  throw new Error('REPORT_ROOT_NOT_FOUND');
}

async function waitForChartsReady(doc: Document, { timeoutMs = 6000 } = {}): Promise<{ ready: boolean; count: number }> {
  return new Promise((resolve) => {
    const svgs = Array.from(doc.querySelectorAll<SVGSVGElement>('svg.recharts-surface'));
    
    if (svgs.length === 0) {
      resolve({ ready: true, count: 0 });
      return;
    }

    let attempts = 0;
    const interval = 100;
    const maxAttempts = timeoutMs / interval;

    const checkCharts = () => {
      const allVisible = svgs.every(svg => {
        try {
          const box = svg.getBBox();
          const hasContent = svg.querySelector('path, rect, circle');
          return box.width > 0 && box.height > 0 && hasContent;
        } catch {
          return false;
        }
      });

      if (allVisible || attempts >= maxAttempts) {
        clearInterval(timer);
        resolve({ ready: allVisible, count: svgs.length });
      }
      attempts++;
    };

    const timer = setInterval(checkCharts, interval);
  });
}

async function settleLayout(doc: Document): Promise<{ fontsReady: boolean; settleMs: number }> {
  const t0 = performance.now();
  
  let fontsReady = false;
  try {
    await doc.fonts?.ready;
    fontsReady = true;
  } catch {}

  // Multiple RAF cycles to ensure layout stability
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
  
  // Trigger resize events to ensure charts recalculate
  const win = doc.defaultView;
  if (win) {
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(r));
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(r));
  }
  
  // Final settle delay
  await new Promise(r => setTimeout(r, 200));
  
  return {
    fontsReady,
    settleMs: Math.round(performance.now() - t0)
  };
}

async function expandAllInteractive(doc: Document) {
  // Expand details elements
  doc.querySelectorAll('details').forEach(d => (d as HTMLDetailsElement).open = true);
  
  // Click collapsed elements
  const toggles = Array.from(doc.querySelectorAll<HTMLElement>('[aria-expanded="false"], [data-state="closed"]'));
  for (const toggle of toggles) {
    try {
      if (toggle.tagName === 'BUTTON' || toggle.getAttribute('role') === 'button') {
        toggle.click();
        await new Promise(r => setTimeout(r, 50));
      }
    } catch {}
  }
}

async function isImageMostlyBlank(dataUrl: string): Promise<boolean> {
  if (!dataUrl) return true;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 200); // Sample smaller area for performance
        canvas.height = Math.min(img.height, 200);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(false);
          return;
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let blank = 0;
        const samples = 25;
        for (let i = 0; i < samples; i++) {
          const x = Math.floor(Math.random() * canvas.width);
          const y = Math.floor(Math.random() * canvas.height);
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const [r, g, b, a] = pixel;
          
          const isWhite = r > 250 && g > 250 && b > 250;
          const isTransparent = a < 10;
          if (isWhite || isTransparent) blank++;
        }
        
        resolve(blank / samples > 0.9);
      } catch {
        resolve(true);
      }
    };
    img.onerror = () => resolve(true);
    img.src = dataUrl;
  });
}

function createPlaceholder(route: Route, reason: string): ImageSlice {
  const w = CAPTURE_WIDTH_PX;
  const h = Math.round(w / A4_ASPECT_RATIO);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  
  // Error content
  ctx.font = '24px Arial';
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.fillText(`${route} - Placeholder`, w / 2, h / 2 - 40);
  
  ctx.font = '16px Arial';
  ctx.fillStyle = '#999999';
  ctx.fillText(`Reason: ${reason}`, w / 2, h / 2);
  ctx.fillText(`Generated: ${new Date().toISOString()}`, w / 2, h / 2 + 30);
  
  const raw = rawFromDataUrl(canvas.toDataURL('image/png'));
  const marker = generateRouteMarker(route, 'placeholder');
  
  return {
    imageBase64: raw,
    wPx: w,
    hPx: h,
    routeName: route,
    pageIndex: 0,
    md5: Md5.hashStr(raw),
    routeMarker: marker,
  };
}

// Serialize state for consistent handoff to print context
function serializeState(inputs: EngineInput, data: EngineOutput): string {
  return btoa(JSON.stringify({ inputs, data, timestamp: Date.now() }));
}

// Build URL with serialized state
function buildPrintUrl(route: Route, lang: string, statePayload: string, runId: string): string {
  const params = new URLSearchParams({
    print: '1',
    lang,
    state: statePayload,
    runId,
    ts: Date.now().toString()
  });
  return `${route}?${params.toString()}`;
}

async function captureSingleRoute(
  route: Route,
  statePayload: string,
  lang: string,
  runId: string,
  attemptNum = 1
): Promise<{ slice: ImageSlice | null; diag: RouteDiag }> {
  const routeMarker = generateRouteMarker(route, runId);
  const routeDiag: RouteDiag = {
    route,
    attempt: attemptNum,
    url: '',
    routeIdentity: {
      want: route,
      landed: '',
      ok: false,
      markerFound: false,
      routeMarker,
    },
    capture: {
      method: 'html-to-image',
      sizeKb: 0,
      isBlank: true,
      retries: 0,
    },
    readiness: {
      fontsReady: false,
      chartsReady: false,
      chartsCount: 0,
      settleMs: 0,
    },
    state: {
      source: 'serialized',
      inputsHash: '',
      dataHash: '',
    },
    colors: {
      seedKeys: [],
      mappedColors: {},
    },
    iframeLoadMs: 0,
  };

  const routeUrl = buildPrintUrl(route, lang, statePayload, runId);
  const frame = createIsolatedFrame(routeUrl);
  
  try {
    const { win, doc, tLoadMs } = await frame.ready();
    routeDiag.iframeLoadMs = tLoadMs;
    routeDiag.url = win.location.href;

    // Route identity verification
    const currentPath = new URL(win.location.href).pathname;
    routeDiag.routeIdentity.landed = currentPath;
    
    // Wait for route marker to be injected by the page
    let markerFound = false;
    for (let i = 0; i < 20; i++) {
      markerFound = verifyRouteMarker(doc, routeMarker);
      if (markerFound) break;
      await new Promise(r => setTimeout(r, 100));
    }
    
    routeDiag.routeIdentity.markerFound = markerFound;
    routeDiag.routeIdentity.ok = currentPath.endsWith(route) && markerFound;

    if (!routeDiag.routeIdentity.ok) {
      throw new Error(`ROUTE_IDENTITY_MISMATCH: Expected ${route} with marker ${routeMarker}, got ${currentPath}`);
    }

    // Inject print CSS and route marker
    injectPrintCSS(doc);
    if (!markerFound) {
      injectRouteMarker(doc, routeMarker);
    }

    // Remove AI elements
    const aiSelectors = '[data-ai-insight], [data-ai-report], .ai-insights, .ai-insight, #ai-insights, #get-strategic-analysis, [data-print-hide="ai"], .strategic-cta';
    const aiNodes = doc.querySelectorAll(aiSelectors);
    aiNodes.forEach(n => n.remove());

    // Expand interactive elements
    await expandAllInteractive(doc);

    // Wait for layout to settle
    const settleResult = await settleLayout(doc);
    routeDiag.readiness.fontsReady = settleResult.fontsReady;
    routeDiag.readiness.settleMs = settleResult.settleMs;

    // Wait for charts to be ready
    const chartsResult = await waitForChartsReady(doc);
    routeDiag.readiness.chartsReady = chartsResult.ready;
    routeDiag.readiness.chartsCount = chartsResult.count;

    const root = await waitForReportRoot(win);

    // Capture with retry logic
    let dataUrl = '';
    let method: CaptureMethod = 'html-to-image';
    let retries = 0;
    let isBlank = true;
    let sizeKb = 0;

    const tryCapture = async (useMethod: CaptureMethod): Promise<boolean> => {
      try {
        if (useMethod === 'html-to-image') {
          dataUrl = await toPng(root, {
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            cacheBust: true,
            skipFonts: false,
          });
        } else {
          const localH2C = (win as any).html2canvas || html2canvas;
          const canvas = await localH2C(root, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          });
          dataUrl = canvas.toDataURL('image/png');
        }

        const raw = rawFromDataUrl(dataUrl);
        sizeKb = Math.round((raw.length * 3) / 4 / 1024);
        isBlank = sizeKb < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
        
        return !isBlank;
      } catch (e) {
        console.warn(`Capture failed with ${useMethod}:`, e);
        return false;
      }
    };

    // Primary capture attempt
    let success = await tryCapture('html-to-image');
    method = 'html-to-image';

    // Retry with fallback if needed
    if (!success && retries < 2) {
      retries++;
      routeDiag.capture.suspiciousPrimary = true;
      
      // Brief settle before retry
      await new Promise(r => setTimeout(r, 200));
      
      // Try html2canvas fallback
      success = await tryCapture('html2canvas');
      method = 'html2canvas';
      
      // One more retry with original method if still failing
      if (!success && retries < 2) {
        retries++;
        await new Promise(r => setTimeout(r, 300));
        success = await tryCapture('html-to-image');
        method = 'html-to-image';
      }
    }

    routeDiag.capture.method = method;
    routeDiag.capture.retries = retries;
    routeDiag.capture.sizeKb = sizeKb;
    routeDiag.capture.isBlank = isBlank;

    if (!success) {
      throw new Error(`CAPTURE_FAILED: All capture methods failed for ${route}`);
    }

    const finalRaw = rawFromDataUrl(dataUrl);
    const slice: ImageSlice = {
      imageBase64: finalRaw,
      wPx: CAPTURE_WIDTH_PX,
      hPx: Math.round(CAPTURE_WIDTH_PX / A4_ASPECT_RATIO),
      routeName: route,
      pageIndex: 0,
      md5: Md5.hashStr(finalRaw),
      routeMarker,
    };

    return { slice, diag: routeDiag };

  } catch (e: any) {
    routeDiag.capture.error = e.message;
    return { slice: null, diag: routeDiag };
  } finally {
    frame.cleanup();
  }
}

export async function captureFullReport({
  lang = 'en',
  inputs,
  data,
  onLog,
  onProgress,
  onStatus,
}: {
  lang: 'en' | 'de';
  inputs: EngineInput;
  data: EngineOutput;
  onLog?: (msg: string) => void;
  onProgress?: (p: number) => void;
  onStatus?: (s: string) => void;
}) {
  const runId = 'run_' + Math.random().toString(36).substr(2, 9);
  const statePayload = serializeState(inputs, data);
  
  const diag: Diag = {
    runId,
    startTs: new Date().toISOString(),
    routes: [],
    totals: { slices: 0, kb: 0 },
    guarantee: { before: 0, after: 0, missingBefore: [], placeholdersAdded: [] },
    visibility: { pauses: 0, pausedMs: 0 },
    invariants: { dupesFound: 0, dupesStillPresent: [] },
    md5ByRoute: {} as Record<Route, string | null>,
    stateSnapshot: {
      inputs,
      data,
      timestamp: new Date().toISOString(),
    },
  };

  onStatus?.('Starting PDF export with deterministic state...');

  const byRoute: Partial<Record<Route, ImageSlice>> = {};
  const paused = { ms: 0, cnt: 0, t0: 0 };

  async function ensureVisiblePoint() {
    if (document.visibilityState === 'hidden') {
      paused.cnt += 1;
      paused.t0 = performance.now();
      await waitTabVisible(document, onStatus);
      paused.ms += performance.now() - paused.t0;
      paused.t0 = 0;
    }
  }

  // Main capture loop - process routes in exact order
  for (const [i, route] of ROUTES.entries()) {
    await ensureVisiblePoint();
    onStatus?.(`Capturing ${route} (${i + 1}/${ROUTES.length})...`);
    
    const { slice, diag: routeDiag } = await captureSingleRoute(route, statePayload, lang, runId);
    diag.routes.push(routeDiag);
    
    if (slice) {
      byRoute[route] = slice;
      onLog?.(`✓ Captured ${route} (${routeDiag.capture.sizeKb}KB, ${routeDiag.capture.method})`);
    } else {
      onLog?.(`✗ Failed to capture ${route}: ${routeDiag.capture.error}`);
    }
    
    onProgress?.((i + 1) / ROUTES.length * 0.8); // Reserve 20% for post-processing
  }

  // Post-processing: Handle duplicates and missing routes
  diag.guarantee.before = Object.values(byRoute).filter(Boolean).length;
  diag.guarantee.missingBefore = ROUTES.filter(r => !byRoute[r]);

  // Check for duplicates by MD5
  const md5Map = new Map<string, Route[]>();
  for (const route of ROUTES) {
    if (byRoute[route]) {
      const md5 = byRoute[route]!.md5;
      const routes = md5Map.get(md5) || [];
      routes.push(route);
      md5Map.set(md5, routes);
    }
  }

  // Handle duplicates with forced recapture
  const dupesToRecapture: Route[] = [];
  for (const routes of md5Map.values()) {
    if (routes.length > 1) {
      diag.invariants.dupesFound++;
      dupesToRecapture.push(...routes.slice(1)); // Recapture all but the first
    }
  }

  if (dupesToRecapture.length > 0) {
    await ensureVisiblePoint();
    onStatus?.('Fixing duplicate pages...');
    
    for (const route of dupesToRecapture) {
      onLog?.(`! Recapturing duplicate: ${route}`);
      const { slice, diag: routeDiag } = await captureSingleRoute(route, statePayload, lang, runId, 99);
      routeDiag.recaptureDupe = true;
      diag.routes.push(routeDiag);
      
      if (slice) {
        byRoute[route] = slice;
      }
    }
  }

  // Handle missing routes with placeholders
  for (const route of ROUTES) {
    if (!byRoute[route]) {
      onLog?.(`! Creating placeholder for missing route: ${route}`);
      byRoute[route] = createPlaceholder(route, 'CAPTURE_FAILED');
      diag.guarantee.placeholdersAdded.push(route);
    }
  }

  // Final assembly in exact order
  const finalSlices = ROUTES.map(r => byRoute[r]).filter((s): s is ImageSlice => !!s);

  // Final duplicate check
  const finalMd5Map = new Map<string, Route[]>();
  finalSlices.forEach(s => {
    const routes = finalMd5Map.get(s.md5) || [];
    routes.push(s.routeName);
    finalMd5Map.set(s.md5, routes);
  });
  
  diag.invariants.dupesStillPresent = Array.from(finalMd5Map.values())
    .filter(v => v.length > 1)
    .flat();

  diag.guarantee.after = finalSlices.length;
  diag.totals = {
    slices: finalSlices.length,
    kb: Math.round(finalSlices.reduce((a, s) => a + s.imageBase64.length, 0) * 3 / 4 / 1024),
  };
  diag.visibility = { pauses: paused.cnt, pausedMs: Math.round(paused.ms) };
  diag.md5ByRoute = ROUTES.reduce((acc, r) => {
    const s = byRoute[r];
    acc[r] = s?.md5 || null;
    return acc;
  }, {} as Record<Route, string | null>);

  onProgress?.(1.0);
  onStatus?.('PDF export complete');

  return { slices: finalSlices, diag };
}