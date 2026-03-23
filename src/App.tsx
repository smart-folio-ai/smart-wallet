import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter, Routes, Route, useLocation} from 'react-router-dom';
import {useEffect} from 'react';
import {Toaster} from '@/components/ui/toaster';
import {Toaster as Sonner} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {SidebarInset, SidebarProvider} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/app-sidebar';
import {AppTopbar} from '@/components/layout/AppTopbar';
import ProtectedRoute from '@/components/ProtectedRoute';

import Index from './pages/Index';
import Landing from './pages/Landing';
import SyncAccounts from './pages/SyncAccounts';
import AIInsights from './pages/AIInsights';
import ChatInteligente from './pages/ChatInteligente';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Portfolio from './pages/Portfolio';
import AssetDetail from './pages/AssetDetail';
import AssetSearch from './pages/AssetSearch';
import Planning from './pages/Planning';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SignOut from './pages/SignOut';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancelled from './pages/SubscriptionCancelled';
import AddAsset from './pages/AddAsset';
import Comparator from './pages/Comparator';
import TwoFactorVerify from './pages/TwoFactorVerify';
import MyAssetDetail from './pages/MyAssetDetail';
import Fiscal from './pages/Fiscal';
import Transactions from './pages/Transactions';
import Dividends from './pages/Dividends';
import DividendDetail from './pages/DividendDetail';

const ScrollToTopOnRouteChange = () => {
  const {pathname} = useLocation();

  useEffect(() => {
    window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    const main = document.querySelector('main[data-app-main="true"]');
    if (main instanceof HTMLElement) {
      main.scrollTo({top: 0, left: 0, behavior: 'auto'});
    }
  }, [pathname]);

  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTopOnRouteChange />
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/2fa-verify" element={<TwoFactorVerify />} />
          <Route path="/signout" element={<SignOut />} />
          <Route
            path="/subscription-success"
            element={<SubscriptionSuccess />}
          />
          <Route
            path="/subscription-cancelled"
            element={<SubscriptionCancelled />}
          />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="relative flex min-h-screen w-full bg-background">
                    <AppSidebar />
                    <SidebarInset className="bg-background">
                      <AppTopbar />
                      <main
                        className="flex-1 px-3 py-4 md:px-6 md:py-6"
                        data-app-main="true">
                        <div className="mx-auto w-full max-w-[1600px]">
                          <Routes>
                            <Route path="/dashboard" element={<Index />} />
                            <Route
                              path="/sync-accounts"
                              element={<SyncAccounts />}
                            />
                            <Route
                              path="/ai-insights"
                              element={<AIInsights />}
                            />
                            <Route
                              path="/chat-inteligente"
                              element={<ChatInteligente />}
                            />
                            <Route
                              path="/asset-search"
                              element={<AssetSearch />}
                            />
                            <Route path="/add-asset" element={<AddAsset />} />
                            <Route
                              path="/comparator"
                              element={<Comparator />}
                            />
                            <Route
                              path="/subscription"
                              element={<Subscription />}
                            />
                            <Route path="/portfolio" element={<Portfolio />} />
                            <Route
                              path="/portfolio/asset/:assetId"
                              element={<MyAssetDetail />}
                            />
                            <Route
                              path="/portfolio/asset/symbol/:symbol"
                              element={<MyAssetDetail />}
                            />
                            <Route
                              path="/portfolio/:symbol"
                              element={<AssetDetail />}
                            />
                            <Route
                              path="/asset/:symbol"
                              element={<AssetDetail />}
                            />
                            <Route path="/planning" element={<Planning />} />
                            <Route
                              path="/transactions"
                              element={<Transactions />}
                            />
                            <Route path="/dividends" element={<Dividends />} />
                            <Route
                              path="/dividends/:symbol"
                              element={<DividendDetail />}
                            />
                            <Route path="/fiscal" element={<Fiscal />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route
                              path="/subscription-success"
                              element={<SubscriptionSuccess />}
                            />
                            <Route
                              path="/subscription-cancelled"
                              element={<SubscriptionCancelled />}
                            />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                      </main>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
