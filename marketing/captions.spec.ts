import {describe, it, expect} from 'vitest';
import {buildCaptions, renderCaptionsMarkdown} from './captions';

describe('buildCaptions', () => {
  it('produces an entry per publishable piece', () => {
    const entries = buildCaptions('validacao');
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry) => {
      expect(entry.caption.trim()).not.toBe('');
      expect(entry.link).toContain('utm_campaign=validacao');
    });
  });

  it('warns that the instagram feed cannot carry a link in the caption', () => {
    const feedEntry = buildCaptions('validacao').find((entry) =>
      entry.piece.includes('feed'),
    );
    expect(feedEntry?.linkNote).toMatch(/bio/i);
  });

  it('propagates an invalid campaign as an error', () => {
    expect(() => buildCaptions('black friday')).toThrow(/campaign/);
  });
});

describe('renderCaptionsMarkdown', () => {
  it('renders every entry with its caption and link', () => {
    const markdown = renderCaptionsMarkdown(buildCaptions('validacao'));
    buildCaptions('validacao').forEach((entry) => {
      expect(markdown).toContain(entry.caption);
      expect(markdown).toContain(entry.link);
    });
  });
});
