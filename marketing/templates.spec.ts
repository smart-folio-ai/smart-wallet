import {describe, it, expect} from 'vitest';
import {renderHook, renderCarouselSlide, CAROUSEL_SLIDE_COUNT} from './templates';
import {FORMATS} from './formats';
import {HOOK, CTA} from './content';

const plans = [
  {name: 'Pro', price: 14.9},
  {name: 'Premium', price: 24.9},
];

describe('renderHook', () => {
  it('includes the hook copy and the brand font import', () => {
    const html = renderHook(FORMATS.linkedin);
    expect(html).toContain(HOOK.line1);
    expect(html).toContain(HOOK.line2);
    expect(html).toContain('fonts.googleapis.com');
  });

  it('sizes the page to the requested format', () => {
    const html = renderHook(FORMATS['instagram-story']);
    expect(html).toContain('1080px');
    expect(html).toContain('1920px');
  });
});

describe('renderCarouselSlide', () => {
  it('has five slides', () => {
    expect(CAROUSEL_SLIDE_COUNT).toBe(5);
  });

  it('renders the price slide from the plans given, not hardcoded values', () => {
    const html = renderCarouselSlide(3, FORMATS['instagram-feed'], plans);
    expect(html).toContain('Pro');
    expect(html).toContain('14,90');
    expect(html).toContain('Premium');
    expect(html).toContain('24,90');
  });

  it('renders a different price when the plans change', () => {
    const html = renderCarouselSlide(3, FORMATS['instagram-feed'], [
      {name: 'Investidor Pro', price: 19.9},
    ]);
    expect(html).toContain('Investidor Pro');
    expect(html).toContain('19,90');
    expect(html).not.toContain('14,90');
  });

  it('ends on the call to action', () => {
    const html = renderCarouselSlide(4, FORMATS['instagram-feed'], plans);
    expect(html).toContain(CTA.url);
  });

  it('rejects a slide index outside the carousel', () => {
    expect(() => renderCarouselSlide(5, FORMATS['instagram-feed'], plans)).toThrow(
      /slide/i,
    );
  });

  it('escapes html-unsafe characters in plan names sourced from the api', () => {
    const html = renderCarouselSlide(3, FORMATS['instagram-feed'], [
      {name: 'Pro & <Premium>', price: 9.9},
    ]);
    expect(html).toContain('Pro &amp; &lt;Premium&gt;');
    expect(html).not.toContain('<Premium>');
  });

  it('renders plain plan names unchanged', () => {
    const html = renderCarouselSlide(3, FORMATS['instagram-feed'], plans);
    expect(html).toContain('Pro');
    expect(html).toContain('Premium');
  });
});
