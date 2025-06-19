import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {Toaster} from '@/components/ui/toaster';
import {Toaster as Sonner} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {SidebarProvider, SidebarTrigger} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/app-sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

import Index from './pages/Index';
import SyncAccounts from './pages/SyncAccounts';
import AIInsights from './pages/AIInsights';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Portfolio from './pages/Portifolio';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import SignOut from './pages/SignOut';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signout" element={<SignOut />} />
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
                            path="/subscription"
                            element={<Subscription />}
                          />
                          <Route path="/portfolio" element={<Portfolio />} />
                          <Route path="/settings" element={<Settings />} />
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
