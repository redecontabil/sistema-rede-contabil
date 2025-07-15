import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  BadgeDollarSign,
  Scale,
  History,
  Clock,
  Award
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabaseClient";
import { eventLogService } from "@/lib/eventLogService";

type SidebarLink = {
  icon: React.ElementType;
  label: string;
  href: string;
  id: string;
};

const links: SidebarLink[] = [
  {
    icon: BarChart3,
    label: "Dashboard",
    href: "/dashboard",
    id: "dashboard",
  },
  {
    icon: FileText,
    label: "Proposta",
    href: "/proposta",
    id: "proposta",
  },
  {
    icon: BadgeDollarSign,
    label: "Custo",
    href: "/custo",
    id: "custo",
  },
  {
    icon: Scale,
    label: "Balanço",
    href: "/balanco",
    id: "balanco",
  },
  {
    icon: Award,
    label: "Bonificações",
    href: "/bonificacao",
    id: "bonificacao",
  },
  {
    icon: Settings,
    label: "Configurações",
    href: "/settings",
    id: "settings",
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [paginasPermitidas, setPaginasPermitidas] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Pega email do usuário logado do localStorage
  let userEmail = "";
  let userId = "";
  let usuarioObj = null;
  try {
    usuarioObj = JSON.parse(localStorage.getItem("usuario_logado") || "null");
    userEmail = usuarioObj?.email || "";
    userId = usuarioObj?.id || "";
  } catch {}
  
  // Carrega as permissões do usuário
  useEffect(() => {
    async function carregarPermissoes() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("usuario")
          .select("is_admin, paginas_permitidas")
          .eq("email", userEmail)
          .single();
          
        if (error) {
          console.error("Erro ao carregar permissões:", error);
          setLoading(false);
          return;
        }
        
        setIsAdmin(!!data?.is_admin);
        
        // Se for admin, tem acesso a todas as páginas
        if (data?.is_admin) {
          setPaginasPermitidas(links.map(link => link.id));
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
  }, [userEmail]);
  
  // Em dispositivos móveis, a sidebar não deve ficar colapsada
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    // Registrar evento de logout
    if (userEmail && userId) {
      try {
        await eventLogService.registrarEvento({
          usuario_email: userEmail,
          usuario_id: userId,
          tipo_evento: "logout",
          entidade: "sistema",
          descricao: `Logout do sistema (${userEmail})`,
          dados: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error("Erro ao registrar evento de logout:", err);
      }
    }
    
    // Remover dados do usuário do localStorage
    localStorage.removeItem("usuario_logado");
    
    // Redirecionar para a página de login
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Filtra os links com base nas permissões do usuário
  const linksPermitidos = links.filter(link => paginasPermitidas.includes(link.id));

  return (
    <div
      className={cn(
        "h-screen flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-72",
        "bg-gradient-to-b from-background to-background/95 dark:from-sidebar dark:to-sidebar/95",
        "border-r border-border/50 overflow-hidden backdrop-blur-sm"
      )}
      style={{ minHeight: '100vh', height: '100vh' }}
    >
      {/* Header com logo */}
      <div className="flex items-center p-5 border-b border-border/50">
        <div className={cn("flex items-center", collapsed ? "mx-auto" : "")}>
          <div className={cn(
            "flex items-center justify-center rounded-xl overflow-hidden",
            "bg-white/10 dark:bg-white/5 shadow-inner",
            collapsed ? "h-10 w-10" : "h-11 w-11"
          )}>
            <img 
              src="/logo.png" 
              alt="Rede Contábil" 
              className="w-full h-full object-contain p-2"
            />
          </div>
          {!collapsed && (
            <span className="ml-3 text-lg font-semibold tracking-tight">
              Rede Contábil
            </span>
          )}
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "ml-auto flex items-center justify-center text-muted-foreground hover:text-foreground",
              collapsed && "hidden"
            )}
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {!isMobile && collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="mt-2 mx-auto hover:bg-muted/50"
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Links de navegação */}
      <div className="flex flex-col flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse h-6 w-3/4 bg-muted rounded"></div>
          </div>
        ) : (
          linksPermitidos.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-primary/10 dark:hover:bg-primary/20",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 dark:shadow-primary/10"
                  : "hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  collapsed ? "mx-auto transform scale-110" : "",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              {!collapsed && (
                <span className={cn(
                  "font-medium tracking-tight",
                  isActive ? "text-primary-foreground" : "text-foreground"
                )}>
                  {link.label}
                </span>
              )}
            </Link>
          );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 p-3 flex-shrink-0 bg-muted/20" style={{ marginTop: 'auto' }}>
        <div className={cn(
          "flex items-center w-full gap-2",
          collapsed ? "flex-col space-y-3" : "justify-between"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "p-2 h-auto flex items-center gap-3 hover:bg-muted/80 dark:hover:bg-muted/20 rounded-xl",
                  collapsed ? "justify-center w-full" : "justify-start w-full"
                )}
              >
                <Avatar className={cn(
                  "ring-2 ring-border transition-all",
                  collapsed ? "h-10 w-10" : "h-9 w-9"
                )}>
                  <AvatarImage src="/logo.png" />
                  <AvatarFallback className="bg-primary/10">RC</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{userEmail.split('@')[0]}</span>
                    <span className="text-xs text-muted-foreground">{isAdmin ? "Administrador" : "Usuário"}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {paginasPermitidas.includes("settings") && (
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!collapsed && <ThemeToggle />}
          {collapsed && (
            <div className="flex justify-center w-full">
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
