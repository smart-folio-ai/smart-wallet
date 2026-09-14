import {useEffect} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';

/**
 * Renderiza dentro do shell autenticado (App.tsx monta esta rota como
 * catch-all "*" dentro do <main> já cercado por sidebar/topbar) — usuário
 * deslogado nunca chega aqui, ProtectedRoute já redireciona pra "/" antes.
 * Por isso não tem header/footer próprios como a página 404 do handoff
 * (design_handoff_trackerr/Trackerr Legal.dc.html), só o conteúdo central.
 */
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="font-heading text-6xl font-bold text-[var(--cy)]">404</div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Essa posição saiu da carteira
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        A página que você procura não existe, foi movida ou o link está
        desatualizado. Confira o endereço ou volte para um lugar conhecido.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/dashboard">Ir para o dashboard</Link>
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Código do erro: TKR-404 · precisa de ajuda?{' '}
        <a
          href="mailto:suporte@trackerr.com.br"
          className="text-primary hover:underline">
          Fale com o suporte
        </a>
      </p>
    </div>
  );
};

export default NotFound;
