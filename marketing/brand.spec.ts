import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {BRAND} from './brand';

function readDarkPaletteVar(name: string): string {
  const css = readFileSync(resolve(__dirname, '../src/index.css'), 'utf-8');
  const darkBlock = css.slice(css.indexOf('.dark {'));
  const match = darkBlock.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`--${name} not found in the .dark block`);
  return match[1].trim();
}

describe('brand tokens', () => {
  it.each([
    ['brand', 'brand'],
    ['surface-base', 'surfaceBase'],
    ['on-surface', 'onSurface'],
    ['on-surface-muted', 'onSurfaceMuted'],
  ])('matches --%s from index.css', (cssVar, brandKey) => {
    expect(BRAND[brandKey as keyof typeof BRAND]).toBe(
      readDarkPaletteVar(cssVar),
    );
  });
});
