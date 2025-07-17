import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import Proposta from "./pages/Proposta";
import Custo from "./pages/Custo";
import Balanco from "./pages/Balanco";
import Bonificacao from "./pages/Bonificacao";
import { useEffect, useState } from "react";
import { useInactivityTimer } from "./hooks/useInactivityTimer";
import { toast } from "./components/ui/use-toast";
import { supabase } from "./lib/supabaseClient";

const queryClient = new QueryClient();

function PrivateRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paginasPermitidas, setPaginasPermitidas] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Verifica se o usuário está logado
  const usuarioLogado = localStorage.getItem("usuario_logado");
  let usuarioObj = null;
  
  try {
    if (usuarioLogado) {
      usuarioObj = JSON.parse(usuarioLogado);
    }
  } catch (error) {
    console.error("Erro ao processar dados do usuário:", error);
  }

  // Carrega as permissões do usuário
  useEffect(() => {
    async function carregarPermissoes() {
      if (!usuarioObj?.email) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("usuario")
          .select("is_admin, paginas_permitidas")
          .eq("email", usuarioObj.email)
          .single();
          
        if (error) {
          console.error("Erro ao carregar permissões:", error);
          setLoading(false);
          return;
        }
        
        setIsAdmin(!!data?.is_admin);
        
        // Se for admin, tem acesso a todas as páginas
        if (data?.is_admin) {
          setPaginasPermitidas(["dashboard", "proposta", "custo", "balanco", "bonificacao", "settings"]);
        } 
        // Se não for admin, usa as páginas permitidas do banco
        else if (data?.paginas_permitidas) {
          setPaginasPermitidas(data.paginas_permitidas);
        }
        // Se não tiver permissões definidas, permite apenas dashboard
        else {
          setPaginasPermitidas(["dashboard"]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao processar permissões:", error);
        setLoading(false);
      }
    }
    
    carregarPermissoes();
  }, [usuarioObj?.email]);

  const handleInactivity = () => {
    localStorage.removeItem("usuario_logado");
    toast({
      title: "Sessão expirada",
      description: "Você foi desconectado automaticamente após 30 minutos de inatividade. Por favor, faça login novamente.",
      variant: "destructive",
    });
    navigate("/login");
  };

  useInactivityTimer(handleInactivity);

  if (!usuarioLogado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  // Verifica se o usuário tem permissão para acessar a página atual
  const paginaAtual = location.pathname.split('/')[1] || 'dashboard';
  if (!paginasPermitidas.includes(paginaAtual) && paginaAtual !== 'dashboard') {
    toast({
      title: "Acesso negado",
      description: "Você não tem permissão para acessar esta página.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}

// Componente para verificar permissão de acesso a uma página específica
function RotaProtegida({ path, element }: { path: string, element: React.ReactNode }) {
  const location = useLocation();
  const [temPermissao, setTemPermissao] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const usuarioLogado = localStorage.getItem("usuario_logado");
  let usuarioObj = null;
  
  try {
    if (usuarioLogado) {
      usuarioObj = JSON.parse(usuarioLogado);
    }
  } catch (error) {
    console.error("Erro ao processar dados do usuário:", error);
  }
  
  useEffect(() => {
    async function verificarPermissao() {
      if (!usuarioObj?.email) {
        setTemPermissao(false);
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("usuario")
          .select("is_admin, paginas_permitidas")
          .eq("email", usuarioObj.email)
          .single();
          
        if (error) {
          console.error("Erro ao verificar permissão:", error);
          setTemPermissao(false);
          setLoading(false);
          return;
        }
        
        // Se for admin ou tiver a página na lista de permissões
        if (data?.is_admin || (data?.paginas_permitidas && data.paginas_permitidas.includes(path))) {
          setTemPermissao(true);
        } else {
          setTemPermissao(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao processar permissão:", error);
        setTemPermissao(false);
        setLoading(false);
      }
    }
    
    verificarPermissao();
  }, [usuarioObj?.email, path]);
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }
  
  if (temPermissao === false) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{element}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="proposta" element={<RotaProtegida path="proposta" element={<Proposta />} />} />
                <Route path="custo" element={<RotaProtegida path="custo" element={<Custo />} />} />
                <Route path="balanco" element={<RotaProtegida path="balanco" element={<Balanco />} />} />
                <Route path="bonificacao" element={<RotaProtegida path="bonificacao" element={<Bonificacao />} />} />
                <Route path="settings" element={<RotaProtegida path="settings" element={<Settings />} />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
