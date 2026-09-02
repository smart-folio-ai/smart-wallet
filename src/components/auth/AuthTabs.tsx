import {Link} from 'react-router-dom';

interface AuthTabsProps {
  active: 'login' | 'register';
}

const tabs = [
  {id: 'login' as const, label: 'Entrar', to: '/signin'},
  {id: 'register' as const, label: 'Criar conta', to: '/register'},
];

export function AuthTabs({active}: AuthTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '3px',
        gap: '3px',
        border: '1px solid var(--hair)',
        borderRadius: '8px',
        background: 'transparent',
        width: '100%',
      }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12.5px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all .15s ease',
              ...(isActive
                ? {
                    background: 'rgba(145,132,217,0.20)',
                    color: 'var(--ac)',
                    boxShadow: 'inset 0 0 0 1px rgba(145,132,217,0.45)',
                  }
                : {
                    background: 'transparent',
                    color: 'var(--color-neutral-500)',
                  }),
            }}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
