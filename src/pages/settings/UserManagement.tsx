import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Lista de páginas disponíveis no sistema
const PAGINAS_DISPONIVEIS = [
  { id: "dashboard", nome: "Dashboard" },
  { id: "proposta", nome: "Proposta" },
  { id: "custo", nome: "Custo" },
  { id: "balanco", nome: "Balanço" },
  { id: "bonificacao", nome: "Bonificações" },
  { id: "settings", nome: "Configurações" }
];

export function UserManagement({ adminEmail }: { adminEmail: string }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [paginasPermitidas, setPaginasPermitidas] = useState<string[]>(["dashboard"]);

  // Carregar usuários existentes
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Verifica se o usuário logado é admin
  useEffect(() => {
    async function checkAdmin() {
      if (!adminEmail) { setIsAdminUser(false); return; }
      const { data } = await supabase.from("usuario").select("is_admin").eq("email", adminEmail).single();
      setIsAdminUser(!!data?.is_admin);
    }
    checkAdmin();
  }, [adminEmail]);

  // Atualiza as páginas permitidas quando o status de admin muda
  useEffect(() => {
    if (isAdmin) {
      // Se for admin, seleciona todas as páginas
      setPaginasPermitidas(PAGINAS_DISPONIVEIS.map(p => p.id));
    } else {
      // Se não for admin, seleciona apenas dashboard por padrão
      setPaginasPermitidas(["dashboard"]);
    }
  }, [isAdmin]);

  async function fetchUsuarios() {
    const { data, error } = await supabase
      .from("usuario")
      .select("id, email, criado_em, is_admin, paginas_permitidas")
      .order("criado_em", { ascending: false });
    if (!error) setUsuarios(data || []);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Verifica se já existe
      const { data: existente } = await supabase.from("usuario").select("id").eq("email", email).single();
      if (existente) {
        toast({ title: "Usuário já existe", variant: "destructive" });
        setLoading(false);
        return;
      }
      const senha_hash = await bcrypt.hash(senha, 10);
      const { error } = await supabase.from("usuario").insert([{ 
        email, 
        senha_hash, 
        is_admin: isAdmin,
        paginas_permitidas: paginasPermitidas
      }]);
      if (error) throw error;
      toast({ title: "Usuário cadastrado com sucesso" });
      setEmail("");
      setSenha("");
      setIsAdmin(false);
      setPaginasPermitidas(["dashboard"]);
      fetchUsuarios();
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar usuário", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  }

  async function handleDeleteUser(id: string, email: string) {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário ${email}?`)) return;
    const { error } = await supabase.from("usuario").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao deletar usuário", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário deletado com sucesso" });
      fetchUsuarios();
    }
  }

  function handleTogglePagina(pagina: string) {
    setPaginasPermitidas(prev => {
      // Se já existe na lista, remove
      if (prev.includes(pagina)) {
        return prev.filter(p => p !== pagina);
      } 
      // Se não existe, adiciona
      else {
        return [...prev, pagina];
      }
    });
  }

  if (isAdminUser === false) {
    return <div className="p-6 text-center text-red-600 font-semibold">Acesso restrito: apenas administradores podem acessar esta área.</div>;
  }
  if (isAdminUser === null) {
    return <div className="p-6 text-center">Verificando permissões...</div>;
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Gerenciar Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
          <Input
            type="email"
            placeholder="E-mail do usuário"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
          <div className="flex items-center gap-2">
              <Checkbox 
                id="isAdmin" 
                checked={isAdmin} 
                onCheckedChange={v => setIsAdmin(!!v)} 
              />
            <label htmlFor="isAdmin" className="text-sm">Administrador</label>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Páginas permitidas:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PAGINAS_DISPONIVEIS.map((pagina) => (
                <div key={pagina.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`pagina-${pagina.id}`}
                    checked={paginasPermitidas.includes(pagina.id)}
                    onCheckedChange={() => handleTogglePagina(pagina.id)}
                    disabled={isAdmin} // Desabilita se for admin, pois terá acesso a tudo
                  />
                  <label 
                    htmlFor={`pagina-${pagina.id}`}
                    className={`text-sm ${isAdmin ? "text-gray-500" : ""}`}
                  >
                    {pagina.nome}
                  </label>
                </div>
              ))}
            </div>
            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-2">
                Administradores têm acesso a todas as páginas automaticamente.
              </p>
            )}
          </div>
          
          <Button type="submit" disabled={loading} className="mt-4">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
        
        <Separator className="my-6" />
        
        <div>
          <h3 className="font-semibold mb-2">Usuários cadastrados</h3>
          <ul className="divide-y">
            {usuarios.map(u => (
              <li key={u.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <span>{u.email}</span>
                    {u.is_admin && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">admin</span>}
                  </div>
                  {!u.is_admin && u.paginas_permitidas && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">
                        Acesso: {u.paginas_permitidas.map((p: string) => {
                          const pagina = PAGINAS_DISPONIVEIS.find(pg => pg.id === p);
                          return pagina ? pagina.nome : p;
                        }).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{u.id}</span>
                  {u.email === adminEmail ? (
                    <button
                      className="ml-2 text-gray-300 cursor-not-allowed"
                      title="Você não pode deletar o próprio usuário logado"
                      disabled
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      className="ml-2 text-red-500 hover:text-red-700"
                      title="Deletar usuário"
                      onClick={() => handleDeleteUser(u.id, u.email)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </span>
              </li>
            ))}
            {usuarios.length === 0 && <li className="text-gray-500">Nenhum usuário cadastrado.</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 