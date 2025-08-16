import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TeamSelection from "./pages/TeamSelection";
import TeamLayout from "./pages/TeamLayout";
import MyTeamPage from "./pages/MyTeamPage";
import TradesPage from "./pages/TradesPage";
import FreeAgentsPage from "./pages/FreeAgentsPage";
import StatisticsPage from "./pages/StatisticsPage";
import NotFound from "./pages/NotFound";
import { useTeam } from "@/hooks/useTeams";
import OwnerRoute from "@/components/OwnerRoute";
import TeamIndexRedirect from "@/components/TeamIndexRedirect";
import Wall from "./components/Wall";
import WallPage from "./pages/WallPage";
import TeamViewPage from "./pages/TeamViewPage";
import AdminLayout from "./pages/admin/AdminLayout";
import UsersPage from "./pages/admin/UsersPage";
import TeamsPage from "./pages/admin/TeamsPage";
import SeasonsPage from "./pages/admin/SeasonsPage";
import RostersSeasonPage from "./pages/admin/RostersSeasonPage";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import ConnectionTest from "./components/ConnectionTest";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import SmartRedirect from "./components/SmartRedirect";
import LoadingScreen from "./components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import RostersPlayoffsPage from "./pages/admin/RostersPlayoffsPage";
import TradesAdminPage from "./pages/admin/TradesAdminPage";
import DraftPicksPage from "./pages/admin/DraftPicksPage";
import AwardsPage from "./pages/admin/AwardsPage";
import StandingsPage from "./pages/admin/StandingsPage";
import WaiversAdminPage from "./pages/admin/WaiversAdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para verificar autenticação e redirecionar
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isLoading && !user) {
        const isAuthenticated = await checkAuth();
      }
    };

    checkAuthentication();
  }, [user, isLoading, checkAuth]);

  // Se ainda está carregando, mostrar loading elegante
  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <TooltipProvider>
      <BrowserRouter>
        <AuthGuard>
          {/* Componente de redirecionamento inteligente */}
          <SmartRedirect />
          
          <Routes>
              {/* Página de login como rota principal */}
              <Route path="/" element={<LoginPage />} />
              
              {/* Página de seleção de time */}
              <Route path="/teams" element={<TeamSelection />} />

             

              {/* Rotas do time com layout compartilhado */}
              <Route path="/team/:teamId" element={<TeamLayout />}>
                {/* Redireciona /team/:teamId para /team/:teamId/myteam */}
                <Route index element={<TeamIndexRedirect />} />
                <Route path="wall" element={<WallPage />} />
                <Route path="myteam" element={
                  <OwnerRoute>
                    <MyTeamPage />
                  </OwnerRoute>
                } />
                 <Route path="view/:otherTeamId" element={<TeamViewPage />} />
                <Route path="trades" element={<TradesPage />} />
                <Route path="free-agents" element={<FreeAgentsPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
              </Route>

              {/* Rotas administrativas */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="users" element={<UsersPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="seasons" element={<SeasonsPage />} />
                <Route path="rosters-season" element={<RostersSeasonPage />} />
                <Route path="rosters-playoffs" element={<RostersPlayoffsPage />} />
                <Route path="trades" element={<TradesAdminPage />} />
                <Route path="draft-picks" element={<DraftPicksPage />} />
                <Route path="awards" element={<AwardsPage />} />
                <Route path="standings" element={<StandingsPage />} />
                <Route path="waivers" element={<WaiversAdminPage />} />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthGuard>
        </BrowserRouter>
        
        {/* Componentes PWA */}
        {/* <PWAInstallPrompt /> */}
        <OfflineIndicator />
        
        {/* Componente de debug - remover em produção */}
        {/* {import.meta.env.DEV && <ConnectionTest />} */}
        
        {/* Componente para atualizar ícone no iOS */}
        {/* <PWAUpdatePrompt /> */}
      </TooltipProvider>
    </QueryClientProvider>
  );

export default App;
