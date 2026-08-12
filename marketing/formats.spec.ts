import {describe, it, expect} from 'vitest';
import {FORMATS} from './formats';

describe('FORMATS', () => {
  it('declares the four channel dimensions', () => {
    expect(FORMATS).toEqual({
      'instagram-feed': {width: 1080, height: 1350},
      'instagram-story': {width: 1080, height: 1920},
      linkedin: {width: 1200, height: 627},
      x: {width: 1600, height: 900},
    });
  });
});
