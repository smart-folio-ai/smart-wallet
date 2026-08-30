import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useCommandPalette} from './useCommandPalette';

describe('useCommandPalette', () => {
  it('começa fechado', () => {
    const {result} = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);
  });

  it('abre com Ctrl+K', () => {
    const {result} = renderHook(() => useCommandPalette());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}),
      );
    });
    expect(result.current.open).toBe(true);
  });

  it('alterna (toggle) a cada Ctrl+K', () => {
    const {result} = renderHook(() => useCommandPalette());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}),
      );
    });
    expect(result.current.open).toBe(true);
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}),
      );
    });
    expect(result.current.open).toBe(false);
  });

  it('setOpen controla o estado diretamente', () => {
    const {result} = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setOpen(true);
    });
    expect(result.current.open).toBe(true);
  });
});
