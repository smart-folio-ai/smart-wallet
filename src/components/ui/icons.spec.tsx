import {describe, expect, it} from 'vitest';
import {render} from '@testing-library/react';
import * as Icons from './icons';

const expectedNames = [
  'AlertTriangle', 'ArrowLeft', 'ArrowRight', 'ArrowUpDown', 'BadgeCheck',
  'BarChart3', 'Bell', 'Bot', 'Building', 'Building2', 'Calculator',
  'Calendar', 'CalendarIcon', 'Check', 'CheckCircle2', 'ChevronDown',
  'ChevronLeft', 'ChevronRight', 'ChevronUp', 'Circle', 'CircleDollarSign',
  'CircleHelp', 'Coins', 'Cookie', 'Crown', 'Dot', 'Download', 'Edit',
  'Eye', 'EyeOff', 'FileText', 'GripVertical', 'Info', 'Landmark', 'Loader',
  'Loader2', 'Mail', 'MessageSquare', 'Moon', 'MoreHorizontal', 'PanelLeft',
  'Pencil', 'PiggyBank', 'Plus', 'RefreshCw', 'RotateCcw', 'Save', 'Search',
  'Send', 'Settings', 'Shield', 'ShieldCheck', 'Sparkles', 'Star', 'Sun',
  'Trash2', 'TrendingUp', 'Upload', 'User', 'User2', 'Users', 'Wallet', 'X',
  'Zap',
];

describe('icons compat layer', () => {
  it('exporta todos os nomes que os callsites de lucide-react esperam', () => {
    for (const name of expectedNames) {
      expect(Icons[name as keyof typeof Icons], `faltando: ${name}`).toBeDefined();
    }
  });

  it('cada ícone renderiza um <svg>', () => {
    for (const name of expectedNames) {
      const Icon = Icons[name as keyof typeof Icons] as React.ComponentType<{className?: string}>;
      const {container, unmount} = render(<Icon className="h-4 w-4" />);
      expect(container.querySelector('svg'), `não renderizou svg: ${name}`).not.toBeNull();
      unmount();
    }
  });
});
