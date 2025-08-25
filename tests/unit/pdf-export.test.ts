import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seedPrintColorMap, colorFor, validateUserColors, dumpColorMap } from '@/lib/printColorMap';

describe('PDF Export Color Mapping', () => {
  beforeEach(() => {
    // Clear any existing mappings
    seedPrintColorMap([]);
  });

  it('should preserve user-defined colors for fixed costs', () => {
    const testItems = [
      { id: 'fc1', name: 'Marketing', color: '#FF0000' },
      { id: 'fc2', name: 'Salaries', color: '#00FF00' },
      { id: 'fc3', name: 'Equipment', color: '#0000FF' },
    ];

    seedPrintColorMap(testItems);

    expect(colorFor('Marketing')).toBe('#FF0000');
    expect(colorFor('Salaries')).toBe('#00FF00');
    expect(colorFor('Equipment')).toBe('#0000FF');
  });

  it('should use neutral greys for special variable cost series', () => {
    const testItems = [
      { id: 'deposits', name: 'Deposits', color: '#FF0000' }, // User color should be ignored
      { id: 'final', name: 'Final Payments', color: '#00FF00' }, // User color should be ignored
      { id: 'total', name: 'Total Variable Costs', color: '#0000FF' }, // User color should be ignored
    ];

    seedPrintColorMap(testItems);

    expect(colorFor('Deposits')).toBe('#9CA3AF'); // light grey
    expect(colorFor('Final Payments')).toBe('#4B5563'); // dark grey
    expect(colorFor('Total Variable Costs')).toBe('#6B7280'); // mid grey
  });

  it('should validate user color preservation', () => {
    const testItems = [
      { id: 'fc1', name: 'Marketing', color: '#FF0000' },
      { id: 'fc2', name: 'Salaries', color: '#00FF00' },
      { id: 'special', name: 'Deposits', color: '#0000FF' }, // Should be overridden
    ];

    seedPrintColorMap(testItems);

    const validation = validateUserColors({
      'Marketing': '#FF0000',
      'Salaries': '#00FF00',
      'Deposits': '#0000FF', // This should fail validation
    });

    expect(validation.valid).toBe(false);
    expect(validation.mismatches).toHaveLength(1);
    expect(validation.mismatches[0].key).toBe('Deposits');
    expect(validation.mismatches[0].expected).toBe('#0000FF');
    expect(validation.mismatches[0].actual).toBe('#9CA3AF');
  });

  it('should provide deterministic colors for items without user colors', () => {
    const testItems = [
      { id: 'p1', name: 'Product A' }, // No color specified
      { id: 'p2', name: 'Product B' }, // No color specified
    ];

    seedPrintColorMap(testItems);

    const colorA = colorFor('Product A');
    const colorB = colorFor('Product B');

    // Colors should be deterministic and different
    expect(colorA).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colorB).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colorA).not.toBe(colorB);

    // Should be consistent across multiple calls
    expect(colorFor('Product A')).toBe(colorA);
    expect(colorFor('Product B')).toBe(colorB);
  });

  it('should handle invalid user colors gracefully', () => {
    const testItems = [
      { id: 'fc1', name: 'Marketing', color: 'invalid-color' },
      { id: 'fc2', name: 'Salaries', color: '#ZZZ' },
      { id: 'fc3', name: 'Equipment', color: '#FF00' }, // Too short
    ];

    seedPrintColorMap(testItems);

    // Should fall back to deterministic colors for invalid inputs
    expect(colorFor('Marketing')).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colorFor('Salaries')).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colorFor('Equipment')).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should provide diagnostic information', () => {
    const testItems = [
      { id: 'fc1', name: 'Marketing', color: '#FF0000' },
      { id: 'p1', name: 'Product A' },
    ];

    seedPrintColorMap(testItems);

    const dump = dumpColorMap();
    expect(dump).toHaveLength(2);
    expect(dump.find(d => d.key === 'Marketing')?.color).toBe('#FF0000');
    expect(dump.find(d => d.key === 'Product A')?.color).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('PDF Export Route Verification', () => {
  it('should generate unique route markers', () => {
    const runId = 'test123';
    const routes = ['/inputs', '/revenue', '/costs', '/profit', '/cash-flow', '/summary'];
    
    const markers = routes.map(route => `ROUTE_${route.replace('/', '').toUpperCase()}_${runId}`);
    
    // All markers should be unique
    const uniqueMarkers = new Set(markers);
    expect(uniqueMarkers.size).toBe(routes.length);
    
    // Markers should follow expected format
    expect(markers[0]).toBe('ROUTE_INPUTS_test123');
    expect(markers[1]).toBe('ROUTE_REVENUE_test123');
    expect(markers[5]).toBe('ROUTE_SUMMARY_test123');
  });
});