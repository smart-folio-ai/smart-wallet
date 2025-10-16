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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

      <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 blur-2xl animate-pulse" />
      <div
        className="absolute top-40 left-40 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-60 blur-2xl animate-pulse"
        style={{animationDelay: '1s'}}
      />
      <div
        className="absolute bottom-40 right-40 w-28 h-28 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-60 blur-2xl animate-pulse"
        style={{animationDelay: '2s'}}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-8">
        <div className="relative w-full h-32">
          <div
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `${progress}%`,
              transform: 'translateX(-50%)',
              top: '50%',
              marginTop: '-48px',
            }}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 blur-2xl opacity-60 animate-pulse" />
              <div className="relative bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl">
                <Wallet
                  className="w-12 h-12 text-white animate-bounce"
                  style={{animationDuration: '1s'}}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 transition-all duration-300 ease-out rounded-full shadow-lg shadow-orange-500/50"
              style={{width: `${progress}%`}}
            />
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/40 to-transparent"
              style={{width: `${progress}%`}}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-white/80 rounded-full animate-pulse"
                style={{animationDelay: '0s'}}
              />
              <div
                className="w-2 h-2 bg-white/80 rounded-full animate-pulse"
                style={{animationDelay: '0.2s'}}
              />
              <div
                className="w-2 h-2 bg-white/80 rounded-full animate-pulse"
                style={{animationDelay: '0.4s'}}
              />
            </div>
            <p className="text-white text-lg font-medium">{loadingText}</p>
          </div>

          <p className="text-center text-blue-200 text-sm font-medium">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
}
