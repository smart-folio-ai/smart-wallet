import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor, act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PurchaseIntentModal} from './PurchaseIntentModal';
import {leadsService} from '@/server/api/api';

vi.mock('@/server/api/api', () => ({
  leadsService: {
    capturePurchaseIntent: vi.fn(),
  },
}));

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PurchaseIntentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the plan name and a disabled submit button until the form is valid', () => {
    wrap(
      <PurchaseIntentModal open onOpenChange={() => {}} planName="Premium" />
    );

    expect(screen.getByText(/Premium/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /enviar|confirmar/i})).toBeDisabled();
  });

  it('enables submit only after a valid email is entered and the consent checkbox is checked', () => {
    wrap(
      <PurchaseIntentModal open onOpenChange={() => {}} planName="Premium" />
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: {value: 'investidor@example.com'},
    });
    expect(screen.getByRole('button', {name: /enviar|confirmar/i})).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', {name: /enviar|confirmar/i})).toBeEnabled();
  });

  it('does not enable submit with an invalid email even if consent is checked', () => {
    wrap(
      <PurchaseIntentModal open onOpenChange={() => {}} planName="Premium" />
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: {value: 'not-an-email'},
    });
    fireEvent.click(screen.getByRole('checkbox'));

    expect(screen.getByRole('button', {name: /enviar|confirmar/i})).toBeDisabled();
  });

  it('submits the email and plan name, then shows a confirmation message on success', async () => {
    (leadsService.capturePurchaseIntent as any).mockResolvedValue({
      data: {success: true},
    });

    wrap(
      <PurchaseIntentModal open onOpenChange={() => {}} planName="Premium" />
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: {value: 'investidor@example.com'},
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', {name: /enviar|confirmar/i}));

    await waitFor(() => {
      expect(leadsService.capturePurchaseIntent).toHaveBeenCalledWith(
        'investidor@example.com',
        'Premium'
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText(/finalizando os acessos/i)
      ).toBeInTheDocument();
    });
  });

  it('shows an error toast and keeps the form visible when the request fails', async () => {
    (leadsService.capturePurchaseIntent as any).mockRejectedValue(
      new Error('network error')
    );

    wrap(
      <PurchaseIntentModal open onOpenChange={() => {}} planName="Premium" />
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: {value: 'investidor@example.com'},
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', {name: /enviar|confirmar/i}));

    await waitFor(() => {
      expect(leadsService.capturePurchaseIntent).toHaveBeenCalled();
    });
    expect(screen.queryByText(/finalizando os acessos/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  });

  it('does not show stale confirmation state after the modal is closed mid-flight and reopened for a different plan', async () => {
    // Simulates: user submits on "Premium", closes the modal while the
    // request is still in flight, then reopens the (same, never-unmounted)
    // modal instance for "Global Investor". The late-resolving promise from
    // the abandoned Premium request must not cause the reopened modal to
    // show the confirmation screen.
    let resolveCapture: (value: {data: {success: boolean}}) => void;
    const deferred = new Promise<{data: {success: boolean}}>((resolve) => {
      resolveCapture = resolve;
    });
    (leadsService.capturePurchaseIntent as any).mockReturnValue(deferred);

    const onOpenChange = vi.fn();
    const {rerender} = render(
      <MemoryRouter>
        <PurchaseIntentModal
          open
          onOpenChange={onOpenChange}
          planName="Premium"
        />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: {value: 'investidor@example.com'},
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', {name: /enviar|confirmar/i}));

    await waitFor(() => {
      expect(leadsService.capturePurchaseIntent).toHaveBeenCalledWith(
        'investidor@example.com',
        'Premium'
      );
    });

    // Parent closes the modal (e.g. Escape/outside-click) while the
    // request is still pending.
    rerender(
      <MemoryRouter>
        <PurchaseIntentModal
          open={false}
          onOpenChange={onOpenChange}
          planName="Premium"
        />
      </MemoryRouter>
    );

    // Parent reopens the same modal instance for a different plan.
    rerender(
      <MemoryRouter>
        <PurchaseIntentModal
          open
          onOpenChange={onOpenChange}
          planName="Global Investor"
        />
      </MemoryRouter>
    );

    // Now the original, abandoned request resolves late.
    await act(async () => {
      resolveCapture!({data: {success: true}});
      await deferred;
    });

    expect(
      screen.queryByText(/interesse registrado/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/finalizando os acessos/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/Global Investor/i)).toBeInTheDocument();
  });
});
