import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
