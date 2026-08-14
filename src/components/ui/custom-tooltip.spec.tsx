import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {CustomTooltip} from './custom-tooltip';

describe('CustomTooltip', () => {
  it('renders nothing when inactive', () => {
    const {container} = render(
      <CustomTooltip active={false} payload={[{value: 1, name: 'x'}]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('passes the raw payload entry to the formatter', () => {
    render(
      <CustomTooltip
        active
        payload={[
          {value: 1872.03, name: undefined, payload: {name: 'VBBR3'}} as any,
        ]}
        formatter={(value, _name, entry) => [
          String(value),
          String((entry?.payload as any)?.name),
        ]}
      />
    );

    expect(screen.getByText('VBBR3')).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('still supports a two-argument formatter', () => {
    render(
      <CustomTooltip
        active
        payload={[{value: 10, name: 'IBOV'}]}
        formatter={(value, name) => [`${value}%`, name]}
      />
    );

    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('IBOV')).toBeInTheDocument();
  });

  it('does not anchor itself with a fixed arrow', () => {
    const {container} = render(
      <CustomTooltip active payload={[{value: 1, name: 'x'}]} />
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain('before:');
    expect(root.className).not.toMatch(/\brelative\b/);
  });
});
