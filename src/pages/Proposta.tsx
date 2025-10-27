import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, FileCheck, Filter, 
  Download, FilePlus, Plus, X,
  ArrowRight, ArrowLeft,
  LayoutList, CalendarIcon, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  FileX
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableActionMenu } from "@/components/TableActionMenu";
import { StatusBadge } from "@/components/StatusBadge";
import { exportToXLS } from "@/utils/exportToXLS";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { eventLogService, getUsuarioLogado } from "@/lib/eventLogService";

// Adicione a função utilitária para formatar datas:
function formatDateBR(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  
  try {
    // Adiciona o horário e o fuso de Brasília para evitar problemas de timezone
    const dataComFuso = new Date(dateStr + 'T12:00:00-03:00');
    
    if (isNaN(dataComFuso.getTime())) return "-";
    
    return dataComFuso.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "-";
  }
}

// Adicione o componente ErrorBoundary no topo do arquivo:
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null);
  if (error) {
    return <div style={{ color: 'red', padding: 16 }}>Erro ao renderizar o formulário: {error.message}</div>;
  }
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <React.Fragment>{children}</React.Fragment>
    </React.Suspense>
  );
}

// Interfaces para os formulários
interface PropostaFormData {
  data: string;
  cliente: string;
  tipo_publico: string;
  origem: string;
  quem_indicou: string;
  nome_quem_indicou: string;
  comissao: "paga" | "enviada_dp" | "pendente" | "dispensada" | "";
  responsavel: string;
  abertura_gratuita: boolean;
  tributacao: string;
  honorario: number;
  funcionarios: number;
  tipo_cliente: string;
  status: string;
  data_fechamento: string;
  data_inicio: string;
  reajuste_anual: string;
  observacoes: string;
}

interface PropostaSaidaFormData {
  data: string;
  cliente: string;
  evento: string;
  motivo: string;
  data_baixa: string;
  perda_valor: number;
  observacoes: string;
}

interface Proposta extends PropostaFormData {
  id: string | number;
  tipo_proposta: 'entrada' | 'saida';
  perda_valor?: number;
  evento?: string;
  motivo?: string;
  data_baixa?: string;
}

// Adicionar constantes para os valores dos dropdowns
const TIPO_PUBLICO_OPTIONS = ["Público Alvo", "Público Tradicional"];

const ORIGEM_OPTIONS = [
  "Prospecção",
  "Google pesquisa",
  "Indicação",
  "Instagram",
  "Instagram - Mariana",
  "Site",
  "Facebook",
  "Conhecido",
  "Psiapp",
  "E-mail marketing",
  "Retorno - ex cliente",
  "Cliente atual",
  "Insta abordagem",
  "Pesquisa de mercado",
  "Evento",
  "4mãos",
  "Outros"
];

const QUEM_INDICOU_OPTIONS = [
  "Funcionário",
  "Cliente",
  "Outros Comissionados",
  "Outros"
];

const RESPONSAVEL_OPTIONS = [
  "Nathalia",
  "Juliana",
  "Simone",
  "Juliana e Nathalia",
  "Renata"
];

const TRIBUTACAO_OPTIONS = [
  "Mei",
  "Sn",
  "Lp",
  "Lucro real",
  "Holding",
  "Pf",
  "Outra"
];

// Adicionar constante para os valores dos tipos de cliente
const TIPO_CLIENTE_OPTIONS = [
  "Abertura De Empresa",
  "Transformação Mei X Me",
  "Troca De Contador",
  "Abertura De Filial",
  "Abertura De Holding",
  "Retomando Atividade",
  "Declarações",
  "Dp. Fiscal",
  "Inativa - Acompanhamento",
  "Doméstica",
  "Carnê Leão",
  "Baixa",
  "Alteração",
  "Condominio",
  "Mei Abertura",
  "Mei Funcionário",
  "Mei Contabilidade",
  "Mei Baixa",
  "Mei Alteração",
  "Bpo Financeiro",
  "Holding",
  "Mei Declaração",
  "Consultoria",
  "Outros Diversos Não Recorrente",
  "Pendente",
  "Pago",
  "Informado Ao Dp",
  "Lançado No Financeiro",
  "Desconto Concedido"
];

// Adicionar constantes para os valores dos dropdowns da proposta de saída
const EVENTO_SAIDA_OPTIONS = [
  "Inatividade",
  "Baixa",
  "Saída",
  "Redução"
];

const MOTIVO_SAIDA_OPTIONS = [
  "Atendimento",
  "Honorário",
  "Mudança de contador",
  "Fechamento da empresa",
  "Inatividade",
  "Redução de honorário",
  "Outro"
];

// Função para registrar eventos no sistema
const registrarEvento = async (
  tipo_evento: "criacao" | "edicao" | "exclusao" | "visualizacao", 
  entidade: "proposta" | "proposta_saida", 
  entidade_id: string, 
  descricao: string, 
  dados?: any
) => {
  const usuario = getUsuarioLogado();
  if (!usuario) return;
  
  try {
    await eventLogService.registrarEvento({
      usuario_email: usuario.email,
      usuario_id: usuario.id,
      tipo_evento,
      entidade,
      entidade_id,
      descricao,
      dados
    });
  } catch (err) {
    console.error(`Erro ao registrar evento de ${tipo_evento}:`, err);
  }
};

// Componente da página de propostas
export default function Proposta() {
  const [propostasData, setPropostasData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("todas");
  const [activeComissaoFilter, setActiveComissaoFilter] = useState<"todas" | "paga" | "enviada_dp" | "pendente" | "dispensada">("todas");
  const [openNewProposal, setOpenNewProposal] = useState(false);
  const [openExitProposal, setOpenExitProposal] = useState(false);
  const [filteredPropostas, setFilteredPropostas] = useState(propostasData);
  const [tipoTabela, setTipoTabela] = useState<string>("entrada");
  const [etapaFormulario, setEtapaFormulario] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProposta, setSelectedProposta] = useState<any>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  
  // Estado para filtros adicionais
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroTributacao, setFiltroTributacao] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  // Novos filtros para data de início
  const [filtroDataInicioEmpresa, setFiltroDataInicioEmpresa] = useState("");
  const [filtroDataFimEmpresa, setFiltroDataFimEmpresa] = useState("");
  const [filtroSemDataInicio, setFiltroSemDataInicio] = useState(false);
  
  // Função auxiliar para ajustar o fuso horário para Brasília
  const ajustarDataFusoBrasilia = (dataStr: string | null) => {
    if (!dataStr) return null;
    // Cria a data no formato ISO com o fuso horário de Brasília (GMT-3)
    const data = new Date(dataStr + 'T12:00:00-03:00');
    return data.toISOString().split('T')[0];
  };
  
  // Configuração da paginação
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredPropostas.length / itemsPerPage);
  const paginatedPropostas = filteredPropostas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Adicione no início do componente Proposta:
  const [usuarios, setUsuarios] = useState<{id: string, email: string}[]>([]);
  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const { data, error } = await supabase.from('usuario').select('id, email');
        if (!error && data) setUsuarios(data);
        else setUsuarios([]);
      } catch (e) {
        setUsuarios([]);
      }
    }
    fetchUsuarios();
  }, []);

  // Formulário para criar nova proposta
  const form = useForm<PropostaFormData>({
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      cliente: "",
      tipo_publico: "",
      origem: "",
      quem_indicou: "",
      nome_quem_indicou: "",
      comissao: "",
      responsavel: "",
      abertura_gratuita: false,
      tributacao: "",
      honorario: 0,
      funcionarios: 0,
      tipo_cliente: "",
      status: "em_analise",
      data_fechamento: "",
      data_inicio: "",
      reajuste_anual: "",
      observacoes: ""
    },
    mode: "onChange"  // Validação acontece enquanto o usuário digita
  });
  
  // Efeito para monitorar mudanças no campo data_fechamento
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Se o campo data_fechamento for alterado e tiver valor, atualiza o status para "aprovado"
      if (name === 'data_fechamento' && value.data_fechamento) {
        form.setValue('status', 'aprovado');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Formulário para proposta de saída
  const exitForm = useForm<PropostaSaidaFormData>({
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      cliente: "",
      evento: "",
      motivo: "",
      data_baixa: "",
      perda_valor: 0,
      observacoes: ""
    },
    mode: "onChange"
  });

  // Função para buscar propostas do Supabase
  const fetchPropostas = async () => {
    try {
      console.log('Iniciando busca de propostas...');
      
      // Buscar propostas de entrada
      console.log('Buscando propostas de entrada...');
      const { data: propostasEntrada, error: errorEntrada } = await supabase
        .from("propostas")
        .select("*")
        .order('data', { ascending: false });

      if (errorEntrada) {
        console.error("Erro ao buscar propostas de entrada:", errorEntrada);
        toast({
          title: "Erro ao buscar propostas",
          description: "Não foi possível carregar as propostas de entrada.",
          variant: "destructive"
        });
        return;
      }
      console.log(`Encontradas ${propostasEntrada?.length || 0} propostas de entrada`);

      // Buscar propostas de saída
      console.log('Buscando propostas de saída...');
      const { data: propostasSaida, error: errorSaida } = await supabase
        .from("propostas_saida")
        .select("*")
        .order('data', { ascending: false });

      if (errorSaida) {
        console.error("Erro ao buscar propostas de saída:", errorSaida);
        toast({
          title: "Erro ao buscar propostas",
          description: "Não foi possível carregar as propostas de saída.",
          variant: "destructive"
        });
        return;
      }
      console.log(`Encontradas ${propostasSaida?.length || 0} propostas de saída`);

      // Adiciona campo tipo_proposta para facilitar filtragem
      const entradas = (propostasEntrada || []).map(p => ({ ...p, tipo_proposta: "entrada" }));
      const saidas = (propostasSaida || []).map(p => ({ ...p, tipo_proposta: "saida" }));
      
      console.log("Propostas de entrada:", entradas);
      console.log("Propostas de saída:", saidas);
      
      // Verificar se há dados sendo perdidos
      if (propostasSaida && propostasSaida.length > 0 && saidas.length === 0) {
        console.error("Possível perda de dados ao mapear propostas de saída", {propostasSaida, saidas});
      }
      
      setPropostasData([...entradas, ...saidas]);
      console.log('Dados das propostas atualizados no estado local');
      setFilteredPropostas([...entradas, ...saidas].filter(p => p.tipo_proposta === tipoTabela));
    } catch (error) {
      console.error("Erro ao buscar propostas:", error);
      toast({
        title: "Erro ao buscar propostas",
        description: "Ocorreu um erro ao carregar as propostas.",
        variant: "destructive"
      });
    }
  };

  // Buscar propostas ao montar o componente
  useEffect(() => {
    fetchPropostas();
    // eslint-disable-next-line
  }, []);

  // Nova função para aplicar todos os filtros e ordenar
  const aplicarTodosFiltros = (status = activeFilter) => {
    let propostas = propostasData.filter(proposta => proposta.tipo_proposta === tipoTabela);
    
    // Mapear valores do filtro para valores reais do banco para propostas de entrada
    if (tipoTabela === "entrada" && status !== "todas") {
      const statusMap: { [key: string]: string } = {
        "em_analise": "em_analise",
        "em_definicao": "em_definicao",
        "aprovado": "aprovado",
        "reprovado": "reprovado"
      };
      
      const dbStatus = statusMap[status] || status;
      propostas = propostas.filter(proposta => proposta.status === dbStatus);
    } else if (status !== "todas") {
      // Para outros tipos de tabela, usar o filtro como está
      propostas = propostas.filter(proposta => proposta.status === status);
    }

    // Filtrar por comissão
    if (activeComissaoFilter !== "todas") {
      propostas = propostas.filter(proposta => {
        if (!proposta.comissao) return false;
        return proposta.comissao.toLowerCase() === activeComissaoFilter.toLowerCase();
      });

      // Quando filtrar por comissão, sempre definir origem como "Indicação"
      propostas = propostas.map(proposta => ({
        ...proposta,
        origem: "Indicação"
      }));
    }

    if (filtroResponsavel) {
      propostas = propostas.filter(proposta => proposta.responsavel && proposta.responsavel.toLowerCase().includes(filtroResponsavel.toLowerCase()));
    }
    if (filtroCliente) {
      propostas = propostas.filter(proposta => proposta.cliente && proposta.cliente.toLowerCase().includes(filtroCliente.toLowerCase()));
    }
    if (filtroTributacao) {
      propostas = propostas.filter(proposta => proposta.tributacao && proposta.tributacao.toLowerCase().includes(filtroTributacao.toLowerCase()));
    }
    if (filtroDataInicio) {
      // Ajustar a data do filtro para o fuso horário de Brasília
      const dataInicioAjustada = ajustarDataFusoBrasilia(filtroDataInicio);
      propostas = propostas.filter(proposta => proposta.data >= dataInicioAjustada);
    }
    if (filtroDataFim) {
      // Ajustar a data do filtro para o fuso horário de Brasília
      const dataFimAjustada = ajustarDataFusoBrasilia(filtroDataFim);
      propostas = propostas.filter(proposta => proposta.data <= dataFimAjustada);
    }
    
    // Novos filtros para data de início da empresa
    if (filtroDataInicioEmpresa) {
      // Ajustar a data do filtro para o fuso horário de Brasília
      const dataInicioEmpresaAjustada = ajustarDataFusoBrasilia(filtroDataInicioEmpresa);
      propostas = propostas.filter(proposta => proposta.data_inicio && proposta.data_inicio >= dataInicioEmpresaAjustada);
    }
    if (filtroDataFimEmpresa) {
      // Ajustar a data do filtro para o fuso horário de Brasília
      const dataFimEmpresaAjustada = ajustarDataFusoBrasilia(filtroDataFimEmpresa);
      propostas = propostas.filter(proposta => proposta.data_inicio && proposta.data_inicio <= dataFimEmpresaAjustada);
    }
    // Filtro para propostas sem data de início
    if (filtroSemDataInicio) {
      propostas = propostas.filter(proposta => !proposta.data_inicio || proposta.data_inicio === null || proposta.data_inicio === "");
    }
    
    // Ordenar por data decrescente
    propostas = propostas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    setFilteredPropostas(propostas);
    setCurrentPage(1);
  };

  // Atualizar lista filtrada sempre que propostasData, tipoTabela ou activeFilter mudar
  useEffect(() => {
    aplicarTodosFiltros();
    // eslint-disable-next-line
  }, [propostasData, tipoTabela, activeFilter, activeComissaoFilter]);

  // Função para aplicar filtros ao clicar no botão "Aplicar Filtros"
  const aplicarFiltros = () => {
    aplicarTodosFiltros(activeFilter);
  };

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setFiltroResponsavel("");
    setFiltroCliente("");
    setFiltroTributacao("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setFiltroDataInicioEmpresa("");
    setFiltroDataFimEmpresa("");
    setFiltroSemDataInicio(false);
    setActiveComissaoFilter("todas");
    setActiveFilter("todas");
    setFilteredPropostas(propostasData);
    setCurrentPage(1);
  };

  // Função para filtrar propostas ao clicar nos botões de status
  const filterPropostas = (filter: string) => {
    setActiveFilter(filter);
    let propostas = propostasData.filter(proposta => proposta.tipo_proposta === tipoTabela);
    
    // Mapear valores do filtro para valores reais do banco para propostas de entrada
    if (tipoTabela === "entrada" && filter !== "todas") {
      const statusMap: { [key: string]: string } = {
        "em_analise": "em_analise",
        "em_definicao": "em_definicao",
        "aprovado": "aprovado",
        "reprovado": "reprovado"
      };
      
      const dbStatus = statusMap[filter] || filter;
      propostas = propostas.filter(proposta => proposta.status === dbStatus);
    } else if (filter !== "todas") {
      propostas = propostas.filter(proposta => proposta.status === filter);
    }

    // Manter o filtro de comissão se estiver ativo
    if (activeComissaoFilter !== "todas") {
      propostas = propostas.filter(proposta => {
        if (!proposta.comissao) return false;
        return proposta.comissao.toLowerCase() === activeComissaoFilter.toLowerCase();
      });

      // Quando filtrar por comissão, sempre definir origem como "Indicação"
      propostas = propostas.map(proposta => ({
        ...proposta,
        origem: "Indicação"
      }));
    }

    // Aplicar outros filtros ativos
    if (filtroDataInicio) {
      // Ajustar a data do filtro para o fuso horário de Brasília
      const dataInicioAjustada = ajustarDataFusoBrasilia(filtroDataInicio);
      propostas = propostas.filter(proposta => proposta.data >= dataInicioAjustada);
    }
    if (filtroDataFim) {
      // Ajustar a data do filtro para o fuso horário de Brasília
      const dataFimAjustada = ajustarDataFusoBrasilia(filtroDataFim);
      propostas = propostas.filter(proposta => proposta.data <= dataFimAjustada);
    }

    // Ordenar por data decrescente
    propostas = propostas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    setFilteredPropostas(propostas);
    setCurrentPage(1);
  };

  // Função para alternar entre tipos de tabela (entrada/saída)
  const handleTabelaChange = (tipo: string) => {
    try {
      setTipoTabela(tipo);
      
      // Garantir que estamos filtrando a partir dos dados mais recentes
      let propostas = propostasData.filter(proposta => proposta.tipo_proposta === tipo);
      
      // Aplicar filtro de status se não for "todas"
      if (activeFilter !== "todas") {
        // Usar o mesmo mapeamento da função aplicarTodosFiltros
        if (tipo === "entrada") {
          const statusMap: { [key: string]: string } = {
            "em_analise": "em_analise",
            "em_definicao": "em_definicao",
            "aprovado": "aprovado",
            "reprovado": "reprovado"
          };
          
          const dbStatus = statusMap[activeFilter] || activeFilter;
          propostas = propostas.filter(proposta => proposta.status === dbStatus);
        } else {
          propostas = propostas.filter(proposta => proposta.status === activeFilter);
        }
      }

      // Aplicar filtro de comissão se não for "todas"
      if (activeComissaoFilter !== "todas") {
        propostas = propostas.filter(proposta => proposta.comissao === activeComissaoFilter);
      }
      
      // Aplicar outros filtros ativos
      aplicarTodosFiltros(activeFilter);
      
      // Voltar para a primeira página para garantir visibilidade dos itens
      setCurrentPage(1);
    } catch (error) {
      console.error("Erro ao mudar tipo de tabela:", error);
      toast({
        title: "Erro ao mudar visualização",
        description: "Ocorreu um erro ao alternar entre propostas de entrada e saída.",
        variant: "destructive"
      });
    }
  };

  // Função para exportar para XLS
  const handleExportXLS = () => {
    try {
      // Usar filteredPropostas para exportar os dados filtrados atuais
      exportToXLS(filteredPropostas, `propostas-${tipoTabela}-${new Date().toISOString().split('T')[0]}`);
      toast({
        title: "Exportação concluída",
        description: "As propostas foram exportadas com sucesso."
      });
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    }
  };

  // Gerar um novo ID para propostas
  const generateNewId = () => {
    const year = new Date().getFullYear();
    const maxId = propostasData
      .filter(p => p.id.startsWith(`${year}-`))
      .map(p => parseInt(p.id.split('-')[1]))
      .reduce((max, id) => Math.max(max, id), 0);
    
    const newNumber = (maxId + 1).toString().padStart(3, '0');
    return `${year}-${newNumber}`;
  };

  // Função para tratar campos de data vazios
const formatDateForDatabase = (dateValue) => {
  if (!dateValue || dateValue === "" || dateValue === null || dateValue === undefined) {
    return null;
  }
  return dateValue;
};

// Handlers para os formulários
const onSubmitNewProposal = async (values: PropostaFormData) => {
  try {
    // Processar values para tratar campos de data opcionais
    const processedValues = {
      ...values,
      data_fechamento: formatDateForDatabase(values.data_fechamento),
      data_inicio: formatDateForDatabase(values.data_inicio)
    };

    // Verificar se é uma edição ou uma nova proposta
    if (selectedProposta) {
      const { data, error } = await supabase
        .from('propostas')
        .update({
          ...processedValues,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProposta.id);
      if (error) throw error;
      
      // Registrar evento de edição
      await registrarEvento(
        "edicao",
        "proposta",
        selectedProposta.id.toString(),
        `Proposta de entrada editada: ${values.cliente}`,
        { 
          cliente: values.cliente,
          honorario: values.honorario,
          status: values.status,
          responsavel: values.responsavel
        }
      );
      toast({
        title: "Proposta atualizada com sucesso!",
      });
    } else {
      // Criar uma nova proposta
      const { data, error } = await supabase
        .from('propostas')
        .insert([{
          ...processedValues,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      if (error) throw error;
      
      // Registrar evento de criação
      if (data && data[0]) {
        await registrarEvento(
          "criacao",
          "proposta",
          data[0].id.toString(),
          `Nova proposta de entrada criada: ${values.cliente}`,
          { 
            cliente: values.cliente,
            honorario: values.honorario,
            status: values.status,
            responsavel: values.responsavel
          }
        );
      }
      toast({
        title: "Proposta criada com sucesso!",
      });
    }
    // Fechar o diálogo e recarregar as propostas
    setOpenNewProposal(false);
    setSelectedProposta(null);
    fetchPropostas();
    form.reset();
  } catch (error: any) {
    console.error('Erro ao salvar proposta:', error);
    toast({
      title: "Erro ao salvar proposta",
      description: error.message,
      variant: "destructive",
    });
  }
};
  
  const onSubmitExitProposal = async (values: PropostaSaidaFormData) => {
    try {
      // Verificar se é uma edição ou uma nova proposta de saída
      if (selectedProposta && selectedProposta.tipo_proposta === 'saida') {
        const { data, error } = await supabase
          .from('propostas_saida')
          .update({
            ...values,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedProposta.id);

        if (error) throw error;
        
        // Registrar evento de edição
        await registrarEvento(
          "edicao",
          "proposta_saida",
          selectedProposta.id.toString(),
          `Proposta de saída editada: ${values.cliente}`,
          { 
            cliente: values.cliente,
            evento: values.evento,
            motivo: values.motivo,
            perda_valor: values.perda_valor
          }
        );

        toast({
          title: "Proposta de saída atualizada com sucesso!",
        });
      } else {
        // Criar uma nova proposta de saída
        const { data, error } = await supabase
          .from('propostas_saida')
          .insert([{
            ...values,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;
        
        // Registrar evento de criação
        if (data && data[0]) {
          await registrarEvento(
            "criacao",
            "proposta_saida",
            data[0].id.toString(),
            `Nova proposta de saída criada: ${values.cliente}`,
            { 
              cliente: values.cliente,
              evento: values.evento,
              motivo: values.motivo,
              perda_valor: values.perda_valor
            }
          );
        }

        toast({
          title: "Proposta de saída criada com sucesso!",
        });
      }

      // Fechar o diálogo e recarregar as propostas
      setOpenExitProposal(false);
      setSelectedProposta(null);
      fetchPropostas();
      exitForm.reset();
    } catch (error: any) {
      console.error('Erro ao salvar proposta de saída:', error);
      toast({
        title: "Erro ao salvar proposta de saída",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Função para avançar para a próxima etapa do formulário
  const avancarEtapa = () => {
    // Validar campos da primeira etapa antes de avançar
    if (!validateRequiredFields()) {
      return;
    }
    
    setEtapaFormulario(2);
  };

  // Função para voltar para a etapa anterior do formulário
  const voltarEtapa = () => {
    setEtapaFormulario(1);
  };
  
  // Handlers para ações de tabela
  const handleViewProposta = (proposta: any) => {
    setSelectedProposta(proposta);
    setOpenViewDialog(true);
    
    // Registrar evento de visualização
    registrarEvento(
      "visualizacao",
      proposta.tipo_proposta === 'saida' ? "proposta_saida" : "proposta",
      proposta.id.toString(),
      `Visualização de proposta: ${proposta.cliente}`,
      { 
        cliente: proposta.cliente,
        tipo_proposta: proposta.tipo_proposta
      }
    );
  };
  
  const handleEditProposta = (proposta: Proposta) => {
    if (!proposta || !proposta.id) {
      toast({
        title: "Erro ao editar",
        description: "Não foi possível carregar os dados desta proposta.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedProposta(proposta);
    
    if (proposta.tipo_proposta === "entrada") {
      form.reset({
        data: proposta.data,
        cliente: proposta.cliente,
        tipo_publico: proposta.tipo_publico,
        origem: proposta.origem,
        quem_indicou: proposta.quem_indicou || "",
        nome_quem_indicou: proposta.nome_quem_indicou || "",
        comissao: proposta.comissao || "",
        responsavel: proposta.responsavel,
        abertura_gratuita: proposta.abertura_gratuita || false,
        tributacao: proposta.tributacao,
        honorario: proposta.honorario,
        funcionarios: proposta.funcionarios || 0,
        tipo_cliente: proposta.tipo_cliente || "",
        status: proposta.status,
        data_fechamento: proposta.data_fechamento || "",
        data_inicio: proposta.data_inicio || "",
        reajuste_anual: proposta.reajuste_anual || "",
        observacoes: proposta.observacoes || ""
      });
      setOpenNewProposal(true);
    } else {
      // Preencher formulário de saída
      exitForm.reset({
        data: proposta.data || new Date().toISOString().split('T')[0],
        cliente: proposta.cliente || "",
        evento: proposta.evento || "",
        motivo: proposta.motivo || "",
        data_baixa: proposta.data_baixa || "",
        perda_valor: proposta.perda_valor || 0,
        observacoes: proposta.observacoes || ""
      });
      setOpenExitProposal(true);
    }
  };
  
  const handleDeleteProposta = async (proposta: Proposta) => {
    if (!window.confirm(`Tem certeza que deseja excluir a proposta de ${proposta.cliente}?`)) {
      return;
    }

    try {
    let error;

      if (proposta.tipo_proposta === 'saida') {
        const result = await supabase
          .from('propostas_saida')
          .delete()
          .eq('id', proposta.id);
        error = result.error;
    } else {
        const result = await supabase
          .from('propostas')
          .delete()
          .eq('id', proposta.id);
        error = result.error;
      }

      if (error) throw error;
      
      // Registrar evento de exclusão
      await registrarEvento(
        "exclusao",
        proposta.tipo_proposta === 'saida' ? "proposta_saida" : "proposta",
        proposta.id.toString(),
        `Proposta excluída: ${proposta.cliente}`,
        { 
          cliente: proposta.cliente,
          tipo_proposta: proposta.tipo_proposta
        }
      );

      toast({
        title: "Proposta excluída com sucesso!",
      });

      // Recarregar as propostas
      fetchPropostas();
    } catch (error: any) {
      console.error('Erro ao excluir proposta:', error);
    toast({
        title: "Erro ao excluir proposta",
        description: error.message,
        variant: "destructive",
    });
    }
  };

  // Validação de campos obrigatórios para nova proposta
  const validateRequiredFields = () => {
    // Não validamos mais campos como obrigatórios
    return true;
  };

  // Validação de campos obrigatórios para proposta de saída
  const validateExitFields = () => {
    // Não validamos mais campos como obrigatórios
    return true;
  };

  // Nova função para filtrar por comissão
  const filterByComissao = (comissao: "todas" | "paga" | "enviada_dp" | "pendente" | "dispensada") => {
    setActiveComissaoFilter(comissao);
    let propostas = propostasData.filter(proposta => proposta.tipo_proposta === tipoTabela);

    // Aplicar filtro de status se estiver ativo
    if (activeFilter !== "todas") {
      if (tipoTabela === "entrada") {
        const statusMap: { [key: string]: string } = {
          "em_analise": "em_analise",
          "em_definicao": "em_definicao",
          "aprovado": "aprovado",
          "reprovado": "reprovado"
        };

        const dbStatus = statusMap[activeFilter] || activeFilter;
        propostas = propostas.filter(proposta => proposta.status === dbStatus);
      } else {
        propostas = propostas.filter(proposta => proposta.status === activeFilter);
      }
    }

    // Aplicar filtro de comissão
    if (comissao !== "todas") {
      propostas = propostas.filter(proposta => {
        if (!proposta.comissao) return false;
        return proposta.comissao.toLowerCase() === comissao.toLowerCase();
      });

      // Quando filtrar por comissão, sempre definir origem como "Indicação"
      // Isso será aplicado apenas quando o filtro de comissão for diferente de "todas"
      propostas = propostas.map(proposta => ({
        ...proposta,
        origem: "Indicação"
      }));
    }

    // Ordenar por data decrescente
    propostas = propostas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    setFilteredPropostas(propostas);
    setCurrentPage(1);
  };

  // Adicione antes do return:
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPropostas.length)} de {filteredPropostas.length} registros
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Primeira página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium">Página</p>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                className="h-8 w-[70px] text-center"
              />
              <p className="text-sm font-medium">de {totalPages}</p>
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Próxima página</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Propostas</h1>
        <p className="text-muted-foreground">
          Gerencie propostas para seus clientes
        </p>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 hover:bg-primary hover:text-white transition-colors">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[600px] max-w-[600px] p-6 shadow-lg" align="start" side="bottom">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </h4>
                  <Tabs defaultValue="geral" className="w-full">
                    <TabsList className="w-full mb-4 grid grid-cols-2">
                      <TabsTrigger value="geral">Geral</TabsTrigger>
                      <TabsTrigger value="datas">Datas</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="geral" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="comissao" className="text-sm font-medium">
                            Comissão
                          </Label>
                          <Select 
                            value={activeComissaoFilter} 
                            onValueChange={(value) => {
                              setActiveComissaoFilter(value as "todas" | "paga" | "enviada_dp" | "pendente" | "dispensada");
                              filterByComissao(value as "todas" | "paga" | "enviada_dp" | "pendente" | "dispensada");
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Comissão" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas</SelectItem>
                              <SelectItem value="paga">Paga</SelectItem>
                              <SelectItem value="enviada_dp">Enviada ao DP</SelectItem>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="dispensada">Dispensada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-sm font-medium">
                            Status
                          </Label>
                          <Select 
                            value={activeFilter} 
                            onValueChange={(value) => {
                              setActiveFilter(value);
                              filterPropostas(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas</SelectItem>
                              <SelectItem value="em_analise">Em Análise</SelectItem>
                              <SelectItem value="em_definicao">Em Definição</SelectItem>
                              <SelectItem value="aprovado">Aprovado</SelectItem>
                              <SelectItem value="reprovado">Reprovado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="responsavel" className="text-sm font-medium">
                            Responsável
                          </Label>
                          <Input
                            id="responsavel"
                            value={filtroResponsavel}
                            onChange={(e) => setFiltroResponsavel(e.target.value)}
                            placeholder="Nome do responsável"
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cliente" className="text-sm font-medium">
                            Cliente
                          </Label>
                          <Input
                            id="cliente"
                            value={filtroCliente}
                            onChange={(e) => setFiltroCliente(e.target.value)}
                            placeholder="Nome do cliente"
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tributacao" className="text-sm font-medium">
                            Tributação
                          </Label>
                          <Input
                            id="tributacao"
                            value={filtroTributacao}
                            onChange={(e) => setFiltroTributacao(e.target.value)}
                            placeholder="Tipo de tributação"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="datas" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dataInicio" className="text-sm font-medium">
                            Data Início
                          </Label>
                          <Input
                            type="date"
                            id="dataInicio"
                            value={filtroDataInicio}
                            onChange={(e) => setFiltroDataInicio(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dataFim" className="text-sm font-medium">
                            Data Fim
                          </Label>
                          <Input
                            type="date"
                            id="dataFim"
                            value={filtroDataFim}
                            onChange={(e) => setFiltroDataFim(e.target.value)}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dataInicioEmpresa" className="text-sm font-medium">
                            Data Início Empresa
                          </Label>
                          <Input
                            type="date"
                            id="dataInicioEmpresa"
                            value={filtroDataInicioEmpresa}
                            onChange={(e) => setFiltroDataInicioEmpresa(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dataFimEmpresa" className="text-sm font-medium">
                            Data Fim Empresa
                          </Label>
                          <Input
                            type="date"
                            id="dataFimEmpresa"
                            value={filtroDataFimEmpresa}
                            onChange={(e) => setFiltroDataFimEmpresa(e.target.value)}
                            className="w-full"
                          />
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="semDataInicio"
                              checked={filtroSemDataInicio}
                              onCheckedChange={(checked) => setFiltroSemDataInicio(checked as boolean)}
                            />
                            <Label htmlFor="semDataInicio" className="text-sm font-medium">
                              Sem data de início
                            </Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={limparFiltros}
                    className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    Limpar
                  </Button>
                  <Button 
                    onClick={aplicarFiltros}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="secondary" onClick={limparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Lista de Propostas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Lista de Propostas</h2>
            <p className="text-sm text-muted-foreground">
              Total de {filteredPropostas.length} propostas encontradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportXLS}>
              <Download className="h-4 w-4 mr-2" />
              Exportar XLS
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenExitProposal(true);
                setEtapaFormulario(1);
              }}
            >
              <FileX className="h-4 w-4 mr-2" />
              Proposta de Saída
            </Button>
            <Button 
              onClick={() => {
                setOpenNewProposal(true);
                setEtapaFormulario(1);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <Button
            variant={tipoTabela === "entrada" ? "default" : "outline"}
            className="relative"
            onClick={() => handleTabelaChange("entrada")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Propostas de Entrada
          </Button>
          <Button
            variant={tipoTabela === "saida" ? "default" : "outline"}
            className="relative"
            onClick={() => handleTabelaChange("saida")}
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Propostas de Saída
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-lg border bg-card">
          <div className="relative">
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {tipoTabela === "entrada" ? (
                        <>
                          <TableHead className="hidden w-[60px] font-semibold bg-muted/50 first:rounded-tl-lg">#</TableHead>
                          <TableHead className="w-[100px] font-semibold bg-muted/50">Data</TableHead>
                          <TableHead className="min-w-[150px] font-semibold bg-muted/50">Cliente</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Tipo de Público</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Origem</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Quem Indicou</TableHead>
                          <TableHead className="min-w-[150px] font-semibold bg-muted/50">Nome de Quem Indicou</TableHead>
                          <TableHead className="min-w-[100px] font-semibold bg-muted/50">Comissão</TableHead>
                          <TableHead className="min-w-[150px] font-semibold bg-muted/50">Responsável</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Abertura Gratuita</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Tributação</TableHead>
                          <TableHead className="min-w-[100px] font-semibold bg-muted/50">Honorário</TableHead>
                          <TableHead className="w-[100px] font-semibold bg-muted/50">Funcionários</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Tipo Cliente</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Status</TableHead>
                          <TableHead className="min-w-[100px] font-semibold bg-muted/50">Fechado Em</TableHead>
                          <TableHead className="min-w-[100px] font-semibold bg-muted/50">Início Em</TableHead>
                          <TableHead className="min-w-[120px] font-semibold bg-muted/50">Reajuste Anual</TableHead>
                          <TableHead className="w-[80px] text-right font-semibold bg-muted/50 last:rounded-tr-lg">Ações</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="hidden w-[60px] font-semibold bg-muted/50 first:rounded-tl-lg">#</TableHead>
                          <TableHead className="w-[100px] font-semibold bg-muted/50">Data</TableHead>
                          <TableHead className="min-w-[150px] font-semibold bg-muted/50">Cliente</TableHead>
                          <TableHead className="min-w-[150px] font-semibold bg-muted/50">Evento</TableHead>
                          <TableHead className="min-w-[200px] font-semibold bg-muted/50">Motivo</TableHead>
                          <TableHead className="min-w-[100px] font-semibold bg-muted/50">Data Baixa</TableHead>
                          <TableHead className="min-w-[100px] font-semibold bg-muted/50">Perda (R$)</TableHead>
                          <TableHead className="w-[80px] text-right font-semibold bg-muted/50 last:rounded-tr-lg">Ações</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPropostas.length > 0 ? (
                      paginatedPropostas.map((proposta, index) => (
                        <TableRow 
                          key={proposta.id} 
                          className="hover:bg-muted/30 transition-colors"
                        >
                          {tipoTabela === "entrada" ? (
                            <>
                              <TableCell className="hidden font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateBR(proposta.data)}</TableCell>
                              <TableCell>
                                <div className="font-medium">{proposta.cliente}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.tipo_publico || "-"}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.origem || "-"}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.quem_indicou || "-"}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.nome_quem_indicou || "-"}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.comissao || "-"}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.responsavel || "-"}</div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`font-normal ${
                                    proposta.abertura_gratuita 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' 
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                                  }`}
                                >
                                  {proposta.abertura_gratuita ? "Sim" : "Não"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.tributacao || "-"}</div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                                R$ {Number(proposta.honorario ?? 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">{proposta.funcionarios || 0}</TableCell>
                              <TableCell>
                                <div>{proposta.tipo_cliente || "-"}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <StatusBadge status={proposta.status} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateBR(proposta.data_fechamento)}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateBR(proposta.data_inicio)}</TableCell>
                              <TableCell>
                                <div>{proposta.reajuste_anual || "-"}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                  <TableActionMenu 
                                    row={proposta}
                                    onView={() => handleViewProposta(proposta)}
                                    onEdit={() => handleEditProposta(proposta)}
                                    onDelete={() => handleDeleteProposta(proposta)}
                                  />
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="hidden font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateBR(proposta.data)}</TableCell>
                              <TableCell>
                                <div className="font-medium">{proposta.cliente}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.evento || "-"}</div>
                              </TableCell>
                              <TableCell>
                                <div>{proposta.motivo || "-"}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateBR(proposta.data_baixa)}</TableCell>
                              <TableCell className="text-right font-medium text-destructive whitespace-nowrap">
                                R$ {Number(proposta.perda_valor ?? 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                  <TableActionMenu 
                                    row={proposta}
                                    onView={() => handleViewProposta(proposta)}
                                    onEdit={() => handleEditProposta(proposta)}
                                    onDelete={() => handleDeleteProposta(proposta)}
                                  />
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={tipoTabela === "entrada" ? 19 : 8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <FileX className="h-8 w-8 text-muted-foreground/50" />
                            <span>Nenhuma proposta encontrada para os filtros selecionados.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t bg-white dark:bg-gray-950 p-2">
                <Pagination />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog para visualizar proposta */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Proposta</DialogTitle>
            <DialogDescription>
              {selectedProposta?.tipo_proposta === "entrada" 
                ? "Visualizando proposta de entrada" 
                : "Visualizando proposta de saída"}
              {selectedProposta?.id && (
                <span className="block text-xs mt-1 text-muted-foreground">
                  ID: {selectedProposta.id.substring(0, 8)}...
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedProposta.tipo_proposta === "entrada" ? (
                  // Campos para proposta de entrada
                  <>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h4>
                  <p>{selectedProposta.cliente}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h4>
                  <p>{selectedProposta.tipo_publico}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Origem</h4>
                  <p>{selectedProposta.origem}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Responsável</h4>
                  <p>{selectedProposta.responsavel}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Tributação</h4>
                  <p>{selectedProposta.tributacao}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Honorário</h4>
                      <p>R$ {Number(selectedProposta.honorario ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <StatusBadge status={selectedProposta.status} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Data</h4>
                  <p>{formatDateBR(selectedProposta.data)}</p>
                </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Quem Indicou</h4>
                      <p>{selectedProposta.quem_indicou || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Nome de Quem Indicou</h4>
                      <p>{selectedProposta.nome_quem_indicou || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Comissão</h4>
                      <p>{selectedProposta.comissao || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Funcionários</h4>
                      <p>{selectedProposta.funcionarios || "0"}</p>
                    </div>
                  </>
                ) : (
                  // Campos para proposta de saída
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Data</h4>
                      <p>{formatDateBR(selectedProposta.data)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h4>
                      <p>{selectedProposta.cliente}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Evento</h4>
                      <p>{selectedProposta.evento || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Motivo</h4>
                      <p>{selectedProposta.motivo || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Data da Baixa</h4>
                      <p>{formatDateBR(selectedProposta.data_baixa)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Perda</h4>
                      <p>R$ {Number(selectedProposta.perda_valor ?? 0).toFixed(2)}</p>
                    </div>
                  </>
                )}
              </div>
              
              {selectedProposta.observacoes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                  <p className="text-sm">{selectedProposta.observacoes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setOpenViewDialog(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      setOpenViewDialog(false);
                      handleEditProposta(selectedProposta);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Nova Proposta - Primeira Etapa */}
      {etapaFormulario === 1 && (
        <Dialog open={openNewProposal} onOpenChange={setOpenNewProposal}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Proposta de Entrada</DialogTitle>
              <DialogDescription>
                Etapa 1: Informações Básicas
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    {...form.register("data")}
                  />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    type="text"
                    {...form.register("cliente")}
                    placeholder="Nome do cliente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_publico">Tipo de Público</Label>
                  <Select
                    value={form.watch("tipo_publico") || ""}
                    onValueChange={(value) => form.setValue("tipo_publico", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_PUBLICO_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Select
                    value={form.watch("origem") || ""}
                    onValueChange={(value) => form.setValue("origem", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIGEM_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quem_indicou">Quem Indicou</Label>
                  <Select
                    value={form.watch("quem_indicou") || ""}
                    onValueChange={(value) => form.setValue("quem_indicou", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUEM_INDICOU_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nome_quem_indicou">Nome de Quem Indicou</Label>
                  <Input
                    id="nome_quem_indicou"
                    type="text"
                    {...form.register("nome_quem_indicou")}
                    placeholder="Nome de quem indicou"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comissao">Comissão</Label>
                  <Select
                    value={form.watch("comissao") || ""}
                    onValueChange={(value: "" | "paga" | "enviada_dp" | "pendente" | "dispensada") => form.setValue("comissao", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="enviada_dp">Enviada ao DP</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="dispensada">Dispensada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Select
                    value={form.watch("responsavel") || ""}
                    onValueChange={(value) => form.setValue("responsavel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPONSAVEL_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tributacao">Tributação</Label>
                  <Select
                    value={form.watch("tributacao") || ""}
                    onValueChange={(value) => form.setValue("tributacao", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIBUTACAO_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="abertura_gratuita"
                  checked={form.watch("abertura_gratuita")}
                  onCheckedChange={(checked) => form.setValue("abertura_gratuita", checked as boolean)}
                />
                <Label htmlFor="abertura_gratuita" className="text-sm font-medium">
                  Abertura Gratuita
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNewProposal(false)}>
                Cancelar
              </Button>
              <Button onClick={avancarEtapa}>
                Próxima Etapa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Nova Proposta - Segunda Etapa */}
      {etapaFormulario === 2 && (
        <Dialog open={openNewProposal} onOpenChange={setOpenNewProposal}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Proposta de Entrada</DialogTitle>
              <DialogDescription>
                Etapa 2: Informações Complementares
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="honorario">Honorário (R$)</Label>
                  <Input
                    id="honorario"
                    type="number"
                    {...form.register("honorario")}
                    defaultValue="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="funcionarios">Funcionários</Label>
                  <Input
                    id="funcionarios"
                    type="number"
                    {...form.register("funcionarios")}
                    defaultValue="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo_cliente">Tipo de Serviço</Label>
                  <Select
                    value={form.watch("tipo_cliente") || ""}
                    onValueChange={(value) => form.setValue("tipo_cliente", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_CLIENTE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="data_fechamento">Data de Fechamento</Label>
                  <Input
                    id="data_fechamento"
                    type="date"
                    {...form.register("data_fechamento")}
                    onChange={(e) => {
                      form.setValue("data_fechamento", e.target.value);
                      // Se o campo tiver valor, atualiza o status para "aprovado"
                      if (e.target.value) {
                        form.setValue("status", "aprovado");
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    {...form.register("data_inicio")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reajuste_anual">Reajuste Anual</Label>
                  <Input
                    id="reajuste_anual"
                    type="text"
                    {...form.register("reajuste_anual")}
                    placeholder="Digite o reajuste anual"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status") || ""}
                    onValueChange={(value) => form.setValue("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="em_definicao">Em Definição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  {...form.register("observacoes")}
                  placeholder="Observações adicionais"
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={voltarEtapa}>
                Voltar
              </Button>
              <Button onClick={() => onSubmitNewProposal(form.getValues())}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Proposta de Saída */}
      <Dialog open={openExitProposal} onOpenChange={setOpenExitProposal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Proposta de Saída</DialogTitle>
            <DialogDescription>
              Preencha os dados da proposta de saída
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  {...exitForm.register("data")}
                />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  type="text"
                  {...exitForm.register("cliente")}
                  placeholder="Nome do cliente"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="evento">Evento</Label>
                <Select
                  value={exitForm.watch("evento") || ""}
                  onValueChange={(value) => exitForm.setValue("evento", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" className="max-h-[200px] overflow-y-auto">
                    {EVENTO_SAIDA_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data_baixa">Data de Baixa</Label>
                <Input
                  id="data_baixa"
                  type="date"
                  {...exitForm.register("data_baixa")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="perda_valor">Perda em R$</Label>
                <Input
                  id="perda_valor"
                  type="number"
                  {...exitForm.register("perda_valor")}
                  defaultValue="0"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Select
                value={exitForm.watch("motivo") || ""}
                onValueChange={(value) => exitForm.setValue("motivo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" className="max-h-[200px] overflow-y-auto">
                  {MOTIVO_SAIDA_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...exitForm.register("observacoes")}
                placeholder="Observações adicionais"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenExitProposal(false)}>
              Cancelar
            </Button>
            <Button onClick={exitForm.handleSubmit(onSubmitExitProposal)}>
              Registrar Saída
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Espaço no final da página */}
      <div className="h-8 md:h-12"></div>
    </div>
  );
}
