import {useEffect, useState} from 'react';
import {Wallet} from 'lucide-react';

interface WalletLoadingScreenProps {
  isLoading: boolean;
  loadingText?: string;
}

export default function WalletLoadingScreen({
  isLoading,
  loadingText = 'Carregando...',
}: WalletLoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300"
      style={{backgroundColor: 'var(--auth-bg)'}}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDM4LDEwMSwyNTMsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

      {/* Esferas decorativas sutis */}
      <div
        className="absolute top-20 right-20 w-32 h-32 rounded-full blur-3xl animate-pulse"
        style={{backgroundColor: 'var(--auth-brand-soft-10)'}}
      />
      <div
        className="absolute bottom-40 left-20 w-40 h-40 rounded-full blur-3xl animate-pulse"
        style={{
          backgroundColor: 'var(--auth-brand-soft-05)',
          animationDelay: '1.5s',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-8">
        <div className="relative w-full h-32 flex items-center justify-center">
          <div
            className="transition-all duration-300 ease-out"
            style={{
              marginLeft: `${progress - 50}%`,
            }}>
            <div className="relative">
              <div
                className="absolute inset-0 blur-2xl opacity-60 animate-pulse"
                style={{backgroundColor: 'var(--auth-brand-soft-20)'}}
              />
              <div
                className="relative rounded-2xl p-6 border shadow-2xl"
                style={{
                  borderColor: 'var(--auth-brand-soft-20)',
                  backgroundColor: 'var(--auth-highlight-subtle)',
                }}>
                <Wallet
                  className="w-12 h-12 animate-bounce"
                  style={{color: 'var(--auth-brand)', animationDuration: '1.5s'}}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-5">
          <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-300 ease-out rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--auth-brand)',
                boxShadow: '0 0 15px var(--auth-brand-soft-50)',
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5 mb-1">
              {[0, 0.2, 0.4].map((delay) => (
                <div
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'var(--auth-brand-soft-40)',
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
            <p
              className="text-lg font-bold tracking-tight"
              style={{color: 'var(--auth-text-main-alt)', fontFamily: 'var(--font-heading)'}}>
              {loadingText}
            </p>
            <p
              className="text-xs font-semibold tabular-nums tracking-widest opacity-40 uppercase"
              style={{color: 'var(--auth-text-accent)', letterSpacing: '0.2em'}}>
              Sincronizando Ativos — {progress}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
