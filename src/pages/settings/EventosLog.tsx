import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertCircle, CalendarIcon, Download, Filter, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eventLogService, EventType, EntityType } from "@/lib/eventLogService";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateEventosLogTable } from "@/components/CreateEventosLogTable";

interface EventoLog {
  id: string;
  usuario_email: string;
  usuario_id: string;
  tipo_evento: EventType;
  entidade: EntityType;
  entidade_id?: string;
  descricao: string;
  dados?: any;
  criado_em: string;
}

export function EventosLog() {
  const [eventos, setEventos] = useState<EventoLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [tabelaExiste, setTabelaExiste] = useState<boolean | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroTipoEvento, setFiltroTipoEvento] = useState<EventType | "todos">("todos");
  const [filtroEntidade, setFiltroEntidade] = useState<EntityType | "todas">("todas");
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date | undefined>(undefined);
  const [filtroDataFim, setFiltroDataFim] = useState<Date | undefined>(undefined);

  // Verificar se a tabela existe e criar se necessário
  useEffect(() => {
    async function verificarTabela() {
      try {
        const result = await eventLogService.verificarECriarTabela();
        setTabelaExiste(result.success);
        if (!result.success) {
          setErro("Não foi possível criar a tabela de eventos. Verifique o console para mais detalhes.");
        }
      } catch (error) {
        console.error("Erro ao verificar tabela:", error);
        setTabelaExiste(false);
        setErro("Erro ao verificar a tabela de eventos.");
      }
    }
    
    verificarTabela();
  }, []);

  // Carregar eventos
  useEffect(() => {
    if (tabelaExiste) {
      carregarEventos();
    }
  }, [page, activeTab, tabelaExiste]);

  async function carregarEventos() {
    setLoading(true);
    
    try {
      // Preparar filtros com base na tab ativa
      let filtros: {
        usuario_email?: string;
        tipo_evento?: EventType;
        entidade?: EntityType;
        dataInicio?: Date;
        dataFim?: Date;
      } = {};
      
      // Aplicar filtros personalizados
      if (filtroUsuario) {
        filtros.usuario_email = filtroUsuario;
      }
      
      if (filtroTipoEvento && filtroTipoEvento !== "todos") {
        filtros.tipo_evento = filtroTipoEvento as EventType;
      }
      
      if (filtroEntidade && filtroEntidade !== "todas") {
        filtros.entidade = filtroEntidade as EntityType;
      }
      
      if (filtroDataInicio) {
        filtros.dataInicio = filtroDataInicio;
      }
      
      if (filtroDataFim) {
        filtros.dataFim = filtroDataFim;
      }
      
      // Aplicar filtros baseados na tab selecionada
      if (activeTab === "sistema") {
        filtros.entidade = "sistema";
      }
      
      const result = await eventLogService.buscarEventos({
        ...filtros,
        page,
        pageSize: 20
      });
      
      if (result.success && result.data) {
        setEventos(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalRegistros(result.pagination?.total || 0);
      } else {
        setErro("Não foi possível carregar os eventos do sistema.");
        toast({
          title: "Erro ao carregar eventos",
          description: "Não foi possível carregar os eventos do sistema.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setErro("Ocorreu um erro ao carregar os eventos do sistema.");
      toast({
        title: "Erro ao carregar eventos",
        description: "Ocorreu um erro ao carregar os eventos do sistema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
  }

  function handleAplicarFiltros() {
    setPage(1); // Reset para a primeira página ao aplicar filtros
    carregarEventos();
  }

  function handleLimparFiltros() {
    setFiltroUsuario("");
    setFiltroTipoEvento("todos");
    setFiltroEntidade("todas");
    setFiltroDataInicio(undefined);
    setFiltroDataFim(undefined);
    setPage(1);
    carregarEventos();
  }

  // Função para tentar criar a tabela novamente
  async function handleCriarTabela() {
    setLoading(true);
    try {
      const result = await eventLogService.verificarECriarTabela();
      setTabelaExiste(result.success);
      if (result.success) {
        toast({
          title: "Tabela criada com sucesso",
          description: "A tabela de eventos foi criada com sucesso.",
        });
        carregarEventos();
      } else {
        setErro("Não foi possível criar a tabela de eventos. Verifique o console para mais detalhes.");
        toast({
          title: "Erro ao criar tabela",
          description: "Não foi possível criar a tabela de eventos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao criar tabela:", error);
      setErro("Erro ao criar a tabela de eventos.");
      toast({
        title: "Erro ao criar tabela",
        description: "Ocorreu um erro ao criar a tabela de eventos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  // Função para exportar eventos para CSV
  function exportarCSV() {
    if (eventos.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há eventos para exportar.",
        variant: "destructive"
      });
      return;
    }
    
    // Criar cabeçalho CSV
    const headers = [
      "ID", 
      "Usuário", 
      "Tipo de Evento", 
      "Entidade", 
      "ID da Entidade", 
      "Descrição", 
      "Data/Hora"
    ];
    
    // Converter eventos para linhas CSV
    const csvRows = eventos.map(evento => [
      evento.id,
      evento.usuario_email,
      evento.tipo_evento,
      evento.entidade,
      evento.entidade_id || "",
      evento.descricao,
      format(new Date(evento.criado_em), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
    ]);
    
    // Juntar tudo
    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `eventos_log_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Função para formatar a data
  function formatarData(dataString: string) {
    return format(new Date(dataString), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  }

  // Função para obter cor do badge com base no tipo de evento
  function getEventColor(tipo: EventType) {
    switch (tipo) {
      case "criacao":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "edicao":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "exclusao":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "login":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "logout":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  }

  // Se estamos verificando a existência da tabela
  if (tabelaExiste === null) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Logs de Eventos do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Verificando configuração da tabela de eventos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se a tabela não existe
  if (tabelaExiste === false) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Logs de Eventos do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tabela de eventos não encontrada</AlertTitle>
            <AlertDescription>
              {erro || "A tabela de eventos não foi encontrada no banco de dados."}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <p>
              Para usar o sistema de logs de eventos, é necessário criar a tabela no banco de dados.
              Use o botão abaixo para tentar criar a tabela automaticamente.
            </p>
            
            <CreateEventosLogTable onSuccess={() => {
              setTabelaExiste(true);
              carregarEventos();
            }} />
            
            <div className="text-sm text-muted-foreground">
              <p>Caso o problema persista, você pode criar a tabela manualmente seguindo as 
              <a href="/instalacao/criar_tabela_eventos_log.md" target="_blank" className="text-primary hover:underline ml-1">
                instruções para administradores
              </a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Logs de Eventos do Sistema</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLimparFiltros}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Limpar Filtros
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportarCSV}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {erro && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="filtroUsuario">Usuário</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="filtroUsuario"
                  placeholder="Filtrar por e-mail"
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-1/4">
              <Label htmlFor="filtroTipoEvento">Tipo de Evento</Label>
              <Select
                value={filtroTipoEvento}
                onValueChange={(value) => setFiltroTipoEvento(value as EventType | "todos")}
              >
                <SelectTrigger id="filtroTipoEvento" className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="criacao">Criação</SelectItem>
                  <SelectItem value="edicao">Edição</SelectItem>
                  <SelectItem value="exclusao">Exclusão</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="visualizacao">Visualização</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/4">
              <Label htmlFor="filtroEntidade">Entidade</Label>
              <Select
                value={filtroEntidade}
                onValueChange={(value) => setFiltroEntidade(value as EntityType | "todas")}
              >
                <SelectTrigger id="filtroEntidade" className="mt-1">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="proposta_saida">Proposta de Saída</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="custo">Custo</SelectItem>
                  <SelectItem value="balanco">Balanço</SelectItem>
                  <SelectItem value="fechamento">Fechamento</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtroDataInicio ? (
                      format(filtroDataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtroDataInicio}
                    onSelect={setFiltroDataInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full md:w-1/3">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtroDataFim ? (
                      format(filtroDataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtroDataFim}
                    onSelect={setFiltroDataFim}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full md:w-1/3 flex items-end">
              <Button 
                onClick={handleAplicarFiltros} 
                className="w-full mt-1 md:mt-0"
              >
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs para categorias de eventos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tabela de eventos */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-[120px]">Tipo</TableHead>
                <TableHead className="w-[120px]">Entidade</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Carregando eventos...
                  </TableCell>
                </TableRow>
              ) : eventos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum evento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                eventos.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="font-medium">
                      {formatarData(evento.criado_em)}
                    </TableCell>
                    <TableCell>{evento.usuario_email}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-normal", getEventColor(evento.tipo_evento))}>
                        {evento.tipo_evento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {evento.entidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {evento.descricao}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {eventos.length} de {totalRegistros} registros
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && handlePageChange(page - 1)}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Lógica para mostrar páginas ao redor da página atual
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && handlePageChange(page + 1)}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
} 