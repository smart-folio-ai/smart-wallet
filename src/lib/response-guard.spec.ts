import {describe, expect, it} from 'vitest';
import {AxiosError, type AxiosResponse} from 'axios';
import {rejectHtmlResponse} from './response-guard';

const response = (overrides: Partial<AxiosResponse>): AxiosResponse =>
  ({data: {}, status: 200, statusText: 'OK', headers: {'content-type': 'application/json'}, config: {} as never, ...overrides}) as AxiosResponse;

describe('rejectHtmlResponse', () => {
  it('deixa passar JSON', () => {
    const ok = response({data: [{id: 1}]});
    expect(rejectHtmlResponse(ok)).toBe(ok);
  });

  it('rejeita HTML com status 200 como 502', () => {
    const html = response({data: '<!doctype html><html></html>', headers: {'content-type': 'text/html; charset=utf-8'}});
    try {
      rejectHtmlResponse(html);
      throw new Error('deveria rejeitar');
    } catch (error) {
      expect(error).toBeInstanceOf(AxiosError);
      expect((error as AxiosError).response?.status).toBe(502);
    }
  });

  it('rejeita HTML mesmo sem content-type', () => {
    expect(() => rejectHtmlResponse(response({data: '  <html><body/></html>', headers: {}}))).toThrow(AxiosError);
  });

  it('não interfere em download binário', () => {
    const blob = response({data: 'x', headers: {'content-type': 'text/html'}, config: {responseType: 'blob'} as never});
    expect(rejectHtmlResponse(blob)).toBe(blob);
  });
});
