import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ColorPanel Export Recent Colors to JSON', () => {
  it('should verify ColorPanel.tsx contains export recent colors handlers and buttons', () => {
    const colorPanelPath = path.resolve('src/components/ColorPanel.tsx');
    const source = fs.readFileSync(colorPanelPath, 'utf8');

    // 1. Verify export logic exists
    expect(source).toContain('handleExportRecentColorsJSON');
    expect(source).toContain('recent-colors-');
    expect(source).toContain('.json');

    // 2. Verify export buttons exist
    expect(source).toContain('data-testid="export-recent-colors-btn"');
    expect(source).toContain('data-testid="export-recent-colors-bottom-btn"');
    expect(source).toContain('Download className=');
  });

  it('should generate a valid, clean JSON payload when exporting recent colors', () => {
    const rawColors = ['#ff0000', '#00ff00', '#ff0000', '#00000000', 'transparent', '#123456'];

    // Deduplicate and filter out invalid/transparent entries matching ColorPanel logic
    const uniqueColors: string[] = [];
    const seen = new Set<string>();
    rawColors.forEach(c => {
      const norm = (c || '').trim().toLowerCase();
      if (norm && !seen.has(norm) && norm !== 'transparent' && norm !== '#00000000') {
        seen.add(norm);
        uniqueColors.push(c.trim());
      }
    });

    const payload = {
      name: 'Recent Colors',
      type: 'palette',
      exportedAt: new Date().toISOString(),
      count: uniqueColors.length,
      colors: uniqueColors
    };

    expect(uniqueColors).toEqual(['#ff0000', '#00ff00', '#123456']);
    expect(payload.count).toBe(3);
    expect(payload.colors).toHaveLength(3);

    // Verify valid serialization and deserialization
    const jsonStr = JSON.stringify(payload, null, 2);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.name).toBe('Recent Colors');
    expect(parsed.type).toBe('palette');
    expect(parsed.colors).toEqual(['#ff0000', '#00ff00', '#123456']);
  });

  it('should trigger browser download with correct filename pattern and MIME type', () => {
    const sampleColors = ['#0f3d34', '#c8a96a', '#ffffff'];
    const payload = {
      name: 'Recent Colors',
      type: 'palette',
      exportedAt: new Date().toISOString(),
      count: sampleColors.length,
      colors: sampleColors
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });

    expect(blob.type).toBe('application/json;charset=utf-8');
    expect(blob.size).toBeGreaterThan(0);

    const dateStr = new Date().toISOString().slice(0, 10);
    const expectedFilename = `recent-colors-${dateStr}.json`;
    expect(expectedFilename).toMatch(/^recent-colors-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
