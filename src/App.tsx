import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {Toaster} from '@/components/ui/toaster';
import {Toaster as Sonner} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {SidebarProvider, SidebarTrigger} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/app-sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

import Index from './pages/Index';
import Landing from './pages/Landing';
import SyncAccounts from './pages/SyncAccounts';
import AIInsights from './pages/AIInsights';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Portfolio from './pages/Portifolio';
import AssetDetail from './pages/AssetDetail';
import AssetSearch from './pages/AssetSearch';
import Planning from './pages/Planning';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import SignOut from './pages/SignOut';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancelled from './pages/SubscriptionCancelled';
import AddAsset from './pages/AddAsset';
import Comparator from './pages/Comparator';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
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
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center p-4 border-b lg:hidden">
                        <SidebarTrigger />
                      </div>
                      <main className="flex-1 overflow-auto">
                        <Routes>
                          <Route path="/dashboard" element={<Index />} />
                          <Route
                            path="/sync-accounts"
                            element={<SyncAccounts />}
                          />
                          <Route path="/ai-insights" element={<AIInsights />} />
                          <Route
                            path="/asset-search"
                            element={<AssetSearch />}
                          />
                          <Route path="/add-asset" element={<AddAsset />} />
                          <Route path="/comparator" element={<Comparator />} />
                          <Route
                            path="/subscription"
                            element={<Subscription />}
                          />
                          <Route path="/portfolio" element={<Portfolio />} />
                          <Route
                            path="/portfolio/:symbol"
                            element={<AssetDetail />}
                          />
                          <Route
                            path="/asset/:symbol"
                            element={<AssetDetail />}
                          />
                          <Route path="/planning" element={<Planning />} />
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
                      </main>
                    </div>
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
