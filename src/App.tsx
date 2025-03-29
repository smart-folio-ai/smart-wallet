import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {Toaster} from '@/components/ui/toaster';
import {Toaster as Sonner} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {SidebarProvider, SidebarTrigger} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/app-sidebar';

import Index from './pages/Index';
import SyncAccounts from './pages/SyncAccounts';
import AIInsights from './pages/AIInsights';
import Subscription from './pages/Subscription';
import NotFound from './pages/NotFound';
import Portfolio from './pages/Portifolio';
import Login from './pages/SignIn';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="*"
            element={
              <SidebarProvider>
                <div className="min-h-screen flex w-full">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center p-4 border-b lg:hidden">
                      <SidebarTrigger />
                    </div>
                    <main className="flex-1 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Index />} />
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
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
