import {describe, expect, it} from 'vitest';
import {render} from '@testing-library/react';
import * as Icons from './icons';

const expectedNames = [
  'Activity', 'AlertCircle', 'AlertTriangle', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
  'ArrowUpDown', 'BadgeCheck', 'BarChart3', 'Bell', 'Bitcoin', 'Bot', 'Brain',
  'Briefcase', 'Building', 'Building2', 'Calculator', 'Calendar', 'CalendarClock',
  'CalendarIcon', 'Camera', 'Check', 'CheckCircle2', 'ChevronDown', 'ChevronLeft',
  'ChevronRight', 'ChevronUp', 'Circle', 'CircleDollarSign', 'CircleHelp', 'Clock', 'Coins',
  'Cookie', 'Cpu', 'CreditCard', 'Crown', 'Diamond', 'DollarSign', 'Dot', 'Download',
  'Edit', 'ExternalLink', 'Eye', 'EyeOff', 'FileSearch', 'FileSpreadsheet', 'FileText',
  'GitCompare', 'Globe', 'GripVertical', 'HelpCircle', 'Hexagon', 'Info', 'KeyRound',
  'Landmark', 'Layers', 'Loader', 'Loader2', 'LogOut', 'Mail', 'MessageCircle',
  'MessageSquare', 'Moon', 'MoreHorizontal', 'PanelLeft', 'Pencil', 'PieChart',
  'PiggyBank', 'Plus', 'QrCode', 'Receipt', 'RefreshCcw', 'RefreshCw', 'RotateCcw',
  'Save', 'Search', 'Send', 'Settings', 'Shield', 'ShieldAlert', 'ShieldCheck',
  'ShieldOff', 'Shuffle', 'Sparkles', 'Star', 'Sun', 'Target', 'Trash2', 'TrendingDown',
  'TrendingUp', 'Unlink', 'Upload', 'User', 'User2', 'Users', 'Wallet', 'X', 'XCircle',
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
