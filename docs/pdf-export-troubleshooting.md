# PDF Export Troubleshooting Guide

## Overview

The PDF export system captures screenshots of 6 forecast pages and assembles them into a single PDF. This guide helps diagnose and fix common issues.

## Architecture

1. **State Serialization**: Current forecast data is serialized and passed to print context
2. **Route Capture**: Each route is loaded in an isolated iframe with print CSS
3. **Image Generation**: Pages are captured as PNG images using html-to-image or html2canvas
4. **PDF Assembly**: Images are combined into a single PDF using pdf-lib

## Common Issues & Solutions

### 1. Missing or Duplicate Pages

**Symptoms**: PDF has fewer than 6 pages, or same page appears multiple times

**Causes**:
- Route identity mismatch (iframe loads wrong route)
- Timing race conditions during capture
- Duplicate MD5 hashes from identical content

**Solutions**:
- Check route markers in diagnostics JSON
- Verify each route has unique `data-route` attribute
- Look for `dupesFound` in diagnostics

### 2. Inputs Page Shows UI Instead of Data Table

**Symptoms**: First page shows interactive forms instead of clean data table

**Causes**:
- Print mode not detected correctly
- InputsSnapshot component not rendering

**Solutions**:
- Verify `?print=1` parameter in URL
- Check that `isPrint` flag is true in usePrintMode hook
- Ensure InputsSnapshot component is used for print mode

### 3. Wrong Colors in Costs Charts

**Symptoms**: Fixed cost colors don't match user selections, or variable costs use wrong colors

**Expected Behavior**:
- Fixed costs: Use user-selected colors from inputs
- Variable aggregates: Always use neutral greys
  - Deposits: `#9CA3AF` (light grey)
  - Final Payments: `#4B5563` (dark grey)  
  - Total Variable Costs: `#6B7280` (mid grey)

**Solutions**:
- Check color seeding in `seedPrintColorMap()`
- Verify special series override in `SPECIAL_SERIES_LOCK`
- Use `validateUserColors()` to check mappings

### 4. Stale Data in PDF

**Symptoms**: PDF shows old values that don't match current UI

**Causes**:
- Print context reading from localStorage instead of serialized state
- Race condition between state update and capture

**Solutions**:
- Verify state serialization in URL parameters
- Check `stateSnapshot` in diagnostics JSON
- Ensure print pages use injected state, not localStorage

### 5. Blank or Corrupted Pages

**Symptoms**: White/empty pages or garbled images

**Causes**:
- Charts not fully rendered before capture
- Fonts not loaded
- CSS animations interfering with capture

**Solutions**:
- Check `readiness` section in diagnostics
- Verify `chartsReady` and `fontsReady` flags
- Increase settle time if needed

## Diagnostics JSON Structure

```json
{
  "runId": "run_abc123",
  "routes": [
    {
      "route": "/inputs",
      "routeIdentity": {
        "ok": true,
        "markerFound": true,
        "routeMarker": "ROUTE_INPUTS_run_abc123"
      },
      "capture": {
        "method": "html-to-image",
        "sizeKb": 245,
        "isBlank": false,
        "retries": 0
      },
      "readiness": {
        "fontsReady": true,
        "chartsReady": true,
        "chartsCount": 2
      },
      "colors": {
        "seedKeys": ["Marketing", "Equipment"],
        "mappedColors": {
          "Marketing": "#FF0000",
          "Equipment": "#00FF00"
        }
      }
    }
  ],
  "invariants": {
    "dupesFound": 0,
    "dupesStillPresent": []
  },
  "guarantee": {
    "placeholdersAdded": []
  }
}
```

## Testing Commands

```bash
# Run unit tests for color mapping
npm run test:unit

# Run E2E tests including soak test
npm run test:e2e

# Run specific PDF export tests
npx playwright test tests/e2e/pdf-export.spec.ts

# Debug color mapping
# Add ?debugColors=1 to any route URL to see color diagnostics in console
```

## Acceptance Criteria Checklist

- [ ] 20 consecutive exports produce 6 unique, ordered pages
- [ ] Inputs page renders as data table, not interactive UI
- [ ] Fixed costs use user-selected colors, variables use neutral greys
- [ ] No stale data: PDF reflects current in-memory state
- [ ] No placeholders in normal operation
- [ ] Diagnostics JSON explains any failures
- [ ] Route markers verify page identity
- [ ] Charts fully rendered before capture

## Emergency Fixes

If exports are completely failing:

1. Check `/api/print/health` endpoint
2. Verify Chromium availability in `/api/print/capabilities`
3. Use probe mode to get detailed diagnostics
4. Check browser console for capture errors
5. Verify state serialization is working

## Performance Notes

- Each export takes ~10-15 seconds for 6 pages
- Exports pause automatically when tab is hidden
- Memory usage peaks during capture (~100MB per route)
- PDF file size typically 1-3MB for 6 pages