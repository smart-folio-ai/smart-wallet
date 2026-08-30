import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// Stored as the exact HSL triplets from src/index.css's .dark block, not as
// hex. Converting would be one more place for the values to drift, and
// brand.spec.ts asserts these strings against the stylesheet.
export const BRAND = {
  brand: '249 53% 68%',
  surfaceBase: '233 27% 12%',
  onSurface: '240 10% 92%',
  onSurfaceMuted: '228 18% 72%',
} as const;

export const FONT_IMPORT_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap';

export function readLogoSvg(): string {
  return readFileSync(
    resolve(import.meta.dirname, '../src/assets/logo-lockup-dark-bg.svg'),
    'utf-8',
  );
}
