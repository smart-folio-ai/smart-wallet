import {describe, expect, it} from 'vitest';
import {safeExternalUrl} from './safeExternalUrl';

describe('safeExternalUrl', () => {
  it('aceita http e https', () => {
    expect(safeExternalUrl('https://ri.empresa.com.br/doc.pdf')).toBe('https://ri.empresa.com.br/doc.pdf');
    expect(safeExternalUrl(' http://cvm.gov.br/x ')).toBe('http://cvm.gov.br/x');
  });

  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', 'file:///etc/passwd', '/relativo', '', null, 42])(
    'recusa %s',
    (value) => {
      expect(safeExternalUrl(value)).toBeNull();
    },
  );
});
