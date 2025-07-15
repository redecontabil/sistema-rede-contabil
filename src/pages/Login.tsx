import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import loginBg from "../assets/images/login-bg.svg";
import businessPerson from "../assets/images/business-person.svg";
import logoImage from "../assets/images/logotipo.png";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import { eventLogService } from "@/lib/eventLogService";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Buscar usuário pelo email
    const { data, error } = await supabase
      .from("usuario")
      .select("id, email, senha_hash, is_admin, paginas_permitidas")
      .eq("email", email)
      .single();
    if (error || !data) {
      setLoading(false);
      toast({
        title: "Usuário não encontrado",
        description: "Verifique seu e-mail e senha.",
        variant: "destructive",
      });
      
      // Registra tentativa de login malsucedida
      try {
        await eventLogService.registrarEvento({
          usuario_email: email,
          usuario_id: "desconhecido",
          tipo_evento: "outro",
          entidade: "sistema",
          descricao: `Tentativa de login malsucedida: usuário não encontrado (${email})`,
        });
      } catch (err) {
        console.error("Erro ao registrar evento de login malsucedido:", err);
      }
      
      return;
    }
    // Validar senha
    const senhaCorreta = await bcrypt.compare(password, data.senha_hash);
    if (!senhaCorreta) {
      setLoading(false);
      toast({
        title: "Senha incorreta",
        description: "Verifique sua senha e tente novamente.",
        variant: "destructive",
      });
      
      // Registra tentativa de login com senha incorreta
      try {
        await eventLogService.registrarEvento({
          usuario_email: email,
          usuario_id: data.id,
          tipo_evento: "outro",
          entidade: "sistema",
          descricao: `Tentativa de login malsucedida: senha incorreta (${email})`,
        });
      } catch (err) {
        console.error("Erro ao registrar evento de login malsucedido:", err);
      }
      
      return;
    }
    
    // Salvar sessão com dados de permissão
    localStorage.setItem("usuario_logado", JSON.stringify({ 
      id: data.id, 
      email: data.email,
      is_admin: data.is_admin,
      paginas_permitidas: data.paginas_permitidas
    }));
    
    // Registra login bem-sucedido
    try {
      await eventLogService.registrarEvento({
        usuario_email: data.email,
        usuario_id: data.id,
        tipo_evento: "login",
        entidade: "sistema",
        descricao: `Login bem-sucedido (${data.email})`,
        dados: {
          is_admin: data.is_admin,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error("Erro ao registrar evento de login:", err);
    }
    
    setLoading(false);
    toast({
      title: "Login realizado",
      description: "Bem-vindo ao Rede Contábil Dashboard",
    });
    
    // Redireciona para o dashboard (página que todos têm acesso)
    navigate("/dashboard");
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        {/* Área da esquerda com imagem e texto */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#A61B67] to-[#049DBF] relative flex items-center justify-center p-8">
          {/* Background pattern */}
          <div className="absolute inset-0 z-0 opacity-30">
            <img src={loginBg} alt="" className="w-full h-full object-cover" />
          </div>
          
          {/* Business person silhouette */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-auto z-0 opacity-40">
            <img src={businessPerson} alt="" className="w-full h-full" />
          </div>
          
          {/* Logo e conteúdo integrados em uma única estrutura */}
          <div className="relative z-10 text-center max-w-md flex flex-col items-center justify-center">
            {/* Logo da empresa */}
            <div className="mb-4 w-64 md:w-80 mx-auto">
              <img 
                src={logoImage} 
                alt="Rede Contábil" 
                className="w-full h-auto object-contain p-2 rounded-lg"
                style={{ filter: "brightness(0) invert(1)" }} // Aplicar filtro para garantir que o logo seja branco
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Previne loop infinito
                  target.style.display = 'none';
                  
                  // Texto alternativo caso a imagem falhe
                  const textElement = document.createElement('div');
                  textElement.textContent = 'Rede Contábil';
                  textElement.style.fontSize = '24px';
                  textElement.style.fontWeight = 'bold';
                  textElement.style.color = 'white';
                  textElement.style.textAlign = 'center';
                  textElement.style.padding = '20px';
                  target.parentNode?.appendChild(textElement);
                }}
              />
            </div>
            
            {/* Textos explicativos abaixo do logo */}
            <div className="space-y-3">
              <p className="text-sm md:text-base text-white opacity-90">
                Simplifique sua gestão contábil, automatize processos e tome decisões mais inteligentes para o crescimento da sua empresa.
              </p>
              <div className="border-t border-white/20 pt-2">
                <p className="text-xs md:text-sm font-medium text-white">
                  Plataforma completa • Suporte especializado • Tecnologia avançada
                </p>
              </div>
            </div>
          </div>
          
          {/* Overlay decorativo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent mix-blend-overlay"></div>
        </div>
        
        {/* Área da direita com formulário */}
        <div className="md:w-1/2 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Acesse sua Conta Rede Contábil
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            <Card className="border-0 shadow-sm">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-12"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Senha</Label>
                      <a href="#" className="text-sm text-[#A61B67] hover:underline">
                        Esqueceu a senha?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-12"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label 
                      htmlFor="remember" 
                      className="text-sm font-normal text-gray-600 dark:text-gray-400"
                    >
                      Lembrar de mim
                    </Label>
                  </div>
                  
                  <Button 
                    className="w-full h-12 bg-[#A61B67] hover:bg-[#D90B91] text-white font-medium"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Processando..." : "Entrar"}
                  </Button>
                </CardContent>
              </form>
            </Card>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Rede Contábil. Todos os direitos reservados.
            </div>
          </div>
          
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
