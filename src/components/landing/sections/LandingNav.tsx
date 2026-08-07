import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {AppLogo} from '@/components/AppLogo';

const navLinks = [
  {label: 'Produto', id: 'produto'},
  {label: 'Como funciona', id: 'como-funciona'},
  {label: 'Planos', id: 'planos'},
  {label: 'Dúvidas', id: 'faq'},
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({behavior: 'smooth'});
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-surface-hairline/[0.07] bg-surface-base/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-on-surface">
          <AppLogo size="md" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goTo(link.id)}
              className="rounded-full px-4 py-2 text-sm text-on-surface-muted/60 transition-colors hover:bg-surface-hairline/[0.06] hover:text-on-surface">
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            className="text-on-surface-muted/70 hover:bg-surface-hairline/[0.06] hover:text-on-surface">
            <Link to="/signin">Entrar</Link>
          </Button>
          <Button
            asChild
            className="bg-brand text-brand-foreground transition-colors hover:bg-brand-strong">
            <Link to="/register">Criar conta</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

export default LandingNav;
