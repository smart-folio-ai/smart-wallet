import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter, Routes, Route, useLocation} from 'react-router-dom';
import {lazy, Suspense, useEffect, type CSSProperties} from 'react';
import {Toaster} from '@/components/ui/toaster';
import {Toaster as Sonner} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {SidebarInset, SidebarProvider} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/app-sidebar';
import {AppTopbar} from '@/components/layout/AppTopbar';
import {OnboardingTutorial} from '@/components/onboarding/OnboardingTutorial';
import ProtectedRoute from '@/components/ProtectedRoute';
import {AdminHostRedirect} from '@/components/AdminHostRedirect';
import {ConsentProvider} from '@/contexts/ConsentContext';
import {AdaptiveLevelProvider} from '@/contexts/AdaptiveLevelContext';
import {SelectedPortfolioProvider} from '@/contexts/SelectedPortfolioContext';
import {CookieConsentBanner} from '@/components/CookieConsentBanner';

import Index from './pages/Index';
// Carregada sob demanda: só a landing usa GSAP, então o bundle do app
// autenticado não paga por essa dependência.
const Landing = lazy(() => import('./pages/Landing'));
import SyncAccounts from './pages/SyncAccounts';
import AIInsights from './pages/AIInsights';
import ChatInteligente from './pages/ChatInteligente';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import Security from './pages/Security';
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
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Dividends from './pages/Dividends';
import DividendDetail from './pages/DividendDetail';
import RiInteligente from './pages/RiInteligente';
import AdminDashboard from './pages/AdminDashboard';
import AdminPlans from './pages/AdminPlans';
import AdminGrants from './pages/AdminGrants';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';
import Cookies from './pages/Cookies';

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
    <ConsentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <CookieConsentBanner />
        <ScrollToTopOnRouteChange />
        <AdminHostRedirect />
        <Routes>
          <Route
            path="/"
            element={
              <Suspense
                fallback={
                  <div
                    className="min-h-screen"
                    style={{background: 'hsl(var(--surface-base))'}}
                  />
                }>
                <Landing />
              </Suspense>
            }
          />
          <Route path="/signin" element={<SignIn />} />
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
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <AdaptiveLevelProvider>
                <SelectedPortfolioProvider>
                <SidebarProvider
                  style={{'--sidebar-width': '244px'} as CSSProperties}>
                  {/* Fundo e medidas do shell de design_handoff_trackerr/Trackerr App.dc.html */}
                  <div
                    className="relative flex min-h-screen w-full"
                    style={{
                      background:
                        'radial-gradient(1100px 560px at 10% -12%, var(--neb-1) 0%, rgba(43,39,65,0) 62%), radial-gradient(880px 520px at 92% -6%, var(--neb-2) 0%, rgba(35,39,82,0) 58%), var(--color-bg)',
                    }}>
                    <AppSidebar />
                    <SidebarInset className="bg-transparent">
                      <AppTopbar />
                      <OnboardingTutorial />
                      <main
                        className="flex-1 px-3 py-4 md:p-[22.4px]"
                        data-app-main="true">
                        <div className="w-full">
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
                              path="/ri-inteligente"
                              element={<RiInteligente />}
                            />
                            <Route
                              path="/dividends/:symbol"
                              element={<DividendDetail />}
                            />
                            <Route path="/fiscal" element={<Fiscal />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/security" element={<Security />} />
                            <Route
                              path="/admin"
                              element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                  <AdminDashboard />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/admin/plans"
                              element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                  <AdminPlans />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/admin/grants"
                              element={
                                <ProtectedRoute allowedRoles={['admin', 'editor']}>
                                  <AdminGrants />
                                </ProtectedRoute>
                              }
                            />
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
                </SelectedPortfolioProvider>
                </AdaptiveLevelProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ConsentProvider>
  </QueryClientProvider>
);

export default App;
