import {Link} from 'react-router-dom';
import {cn} from '@/lib/utils';

interface AuthTabsProps {
  active: 'login' | 'register';
}

const tabs = [
  {id: 'login' as const, label: 'Entrar', to: '/signin'},
  {id: 'register' as const, label: 'Criar conta', to: '/register'},
];

export function AuthTabs({active}: AuthTabsProps) {
  return (
    <div className="inline-flex w-full gap-1 rounded-lg bg-muted p-1 text-muted-foreground">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default AuthTabs;
