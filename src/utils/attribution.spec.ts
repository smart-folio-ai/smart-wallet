import {describe, it, expect, beforeEach} from 'vitest';
import {captureAttribution, getAttribution} from './attribution';

describe('attribution', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('captures the three utm params from the query string', () => {
    captureAttribution('?utm_source=reddit&utm_medium=social&utm_campaign=validacao');

    expect(getAttribution()).toEqual({
      utmSource: 'reddit',
      utmMedium: 'social',
      utmCampaign: 'validacao',
    });
  });

  it('returns an empty object when nothing was captured', () => {
    expect(getAttribution()).toEqual({});
  });

  it('captures only the params that are present', () => {
    captureAttribution('?utm_source=instagram');

    expect(getAttribution()).toEqual({utmSource: 'instagram'});
  });

  it('keeps the first touch and ignores a later capture', () => {
    captureAttribution('?utm_source=reddit');
    captureAttribution('?utm_source=instagram');

    expect(getAttribution()).toEqual({utmSource: 'reddit'});
  });

  it('drops values with characters the server would reject', () => {
    captureAttribution('?utm_source=<script>&utm_medium=social');

    expect(getAttribution()).toEqual({utmMedium: 'social'});
  });

  it('drops values longer than 64 characters', () => {
    captureAttribution(`?utm_campaign=${'a'.repeat(65)}`);

    expect(getAttribution()).toEqual({});
  });

  it('stores nothing when no utm param is present', () => {
    captureAttribution('?ref=someone');

    expect(getAttribution()).toEqual({});
    expect(sessionStorage.getItem('trackerr:attribution')).toBeNull();
  });

  it('survives a corrupted sessionStorage entry', () => {
    sessionStorage.setItem('trackerr:attribution', 'not json');

    expect(getAttribution()).toEqual({});
  });
});
