import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import AdminDashboard from './AdminDashboard';

const mockGetOverview = vi.fn();

vi.mock('@/services/admin', () => ({
  default: {
    getOverview: () => mockGetOverview(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminDashboard />
    </QueryClientProvider>,
  );
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overview metrics returned by the admin API', async () => {
    mockGetOverview.mockResolvedValue({
      totalActiveSubscriptions: 12,
      totalTrialSubscriptions: 3,
      totalManualGrants: 4,
      mostUsedPlan: {
        planId: 'plan-pro',
        planName: 'Investidor Pro',
        count: 8,
      },
      usersByPlan: [
        {planId: 'plan-pro', planName: 'Investidor Pro', count: 8},
        {planId: 'plan-free', planName: 'Free', count: 4},
      ],
    });

    renderPage();

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText('4')).toHaveLength(2);
    expect(screen.getAllByText('Investidor Pro')).toHaveLength(2);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });
});
