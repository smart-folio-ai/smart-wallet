import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {PurchaseIntentModal} from './PurchaseIntentModal';
import {leadsService} from '@/server/api/api';

vi.mock('@/server/api/api', () => ({
  leadsService: {
    capturePurchaseIntent: vi.fn(),
  },
}));

describe('PurchaseIntentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the plan name and a disabled submit button until the form is valid', () => {
    render(
      <PurchaseIntentModal open onOpenChange={() => {}} planName="Premium" />
    );

    expect(screen.getByText(/Premium/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /enviar|confirmar/i})).toBeDisabled();
  });

  it('enables submit only after a valid email is entered and the consent checkbox is checked', () => {
    render(
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
    render(
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

    render(
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

    render(
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
});
