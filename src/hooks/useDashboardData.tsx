import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, handleQueryError } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

// Removida a função de debounce que não é mais necessária

// Define interface for comparativo KPI
export interface ComparativoKPI {
  valor: string;
  direcao: "up" | "down" | "neutral";
}

// Interface for proposta data
export interface PropostaData {
  id: string | number;
  cliente: string;
  tipo?: string;
  responsavel: string;
  valor: number;
  data: string;
  status: string;
  origem?: string;
  observacoes?: string;
  tipo_proposta?: 'entrada' | 'saida';
}

// Interface for KPI analytics
export interface KpiAnalytics {
  mediaEntrada: string;
  mediaSaida: string;
  ticketMedio: string;
  comparativoEntrada: ComparativoKPI;
  comparativoSaida: ComparativoKPI;
  comparativoConversao: ComparativoKPI;
  comparativoChurn: ComparativoKPI;
  comparativoHonorarios: ComparativoKPI;
  comparativoPerdas: ComparativoKPI;
}

// Interface for stats data - adicionando os novos campos
export interface StatsData {
  propostasEntrada: string;
  propostasSaida: string;
  taxaConversao: string;
  taxaChurn: string;
  honorariosAprovados: string;
  perdasTotais: string;
  lucroProjetado: string;
  margemLucroProjetada: string;
}

// Interface for filtered data
export interface FilteredData {
  propostasRecentes: PropostaData[];
  historicoFechamento: any[]; 
  tributacao: { name: string; value: number }[];
  origemClientes: { name: string; clientes: number }[];
  rankingResponsaveis: { nome: string; propostas: number }[];
}

// Dados estáticos de tributação
const DEFAULT_TRIBUTACAO_DATA = [
  { name: "Simples Nacional", value: 65 },
  { name: "MEI", value: 15 },
  { name: "Lucro Real", value: 10 },
  { name: "Lucro Presumido", value: 10 }
];

// Dados estáticos de origem de clientes
const DEFAULT_ORIGEM_DATA = [
  { name: "Indicação", clientes: 45 },
  { name: "Site", clientes: 30 },
  { name: "Redes Sociais", clientes: 15 },
  { name: "Google", clientes: 8 },
  { name: "Eventos", clientes: 2 }
];

// Dados estáticos de histórico de fechamento
const HISTORICO_FECHAMENTO_DATA = [
  { 
    id: 1, 
    mes: "Janeiro/2023", 
    dataFechamento: "05/02/2023", 
    status: "Concluído",
    responsavel: "Carlos Silva",
    observacoes: "Fechamento realizado com sucesso. Todos os lançamentos foram conferidos e aprovados."
  },
  { 
    id: 2, 
    mes: "Fevereiro/2023", 
    dataFechamento: "08/03/2023", 
    status: "Concluído",
    responsavel: "Maria Santos",
    observacoes: "Alguns ajustes foram necessários na conta de despesas gerais. Documentação completa."
  },
  { 
    id: 3, 
    mes: "Março/2023", 
    dataFechamento: "10/04/2023", 
    status: "Concluído",
    responsavel: "Carlos Silva",
    observacoes: "Fechamento com pendência na conciliação bancária. Resolvido após contato com o banco."
  },
  { 
    id: 4, 
    mes: "Abril/2023", 
    dataFechamento: "07/05/2023", 
    status: "Concluído",
    responsavel: "Ana Oliveira",
    observacoes: "Fechamento sem pendências. Todos os relatórios entregues no prazo."
  },
  { 
    id: 5, 
    mes: "Maio/2023", 
    dataFechamento: "06/06/2023", 
    status: "Concluído",
    responsavel: "Carlos Silva",
    observacoes: "Houve atraso na entrega de documentos fiscais pelo cliente. Fechamento concluído com sucesso após recebimento."
  },
];

// Removendo o cache global para garantir dados atualizados
export function useDashboardData() {
  // Estado para dados estatísticos - atualizando com os novos campos
  const [statsData, setStatsData] = useState<StatsData>({
    propostasEntrada: "0",
    propostasSaida: "0",
    taxaConversao: "0%",
    taxaChurn: "0%",
    honorariosAprovados: "R$ 0",
    perdasTotais: "R$ 0",
    lucroProjetado: "R$ 0",
    margemLucroProjetada: "0%"
  });
  
  // Estado para dados filtrados
  const [filteredData, setFilteredData] = useState<FilteredData>({ 
    propostasRecentes: [],
    historicoFechamento: HISTORICO_FECHAMENTO_DATA,
    tributacao: DEFAULT_TRIBUTACAO_DATA,
    origemClientes: [],
    rankingResponsaveis: []
  });

  // Estado para análise de KPIs
  const [kpiAnalytics, setKpiAnalytics] = useState<KpiAnalytics>({
    mediaEntrada: "0",
    mediaSaida: "0",
    ticketMedio: "R$ 0",
    comparativoEntrada: { valor: "0%", direcao: "neutral" },
    comparativoSaida: { valor: "0%", direcao: "neutral" },
    comparativoConversao: { valor: "0%", direcao: "neutral" },
    comparativoChurn: { valor: "0%", direcao: "neutral" },
    comparativoHonorarios: { valor: "0%", direcao: "neutral" },
    comparativoPerdas: { valor: "0%", direcao: "neutral" }
  });
  
  // Estado para indicar quando está atualizando dados
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para filtros
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date | undefined>(undefined);
  const [filtroDataFim, setFiltroDataFim] = useState<Date | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  
  // Novo estado para filtro temporal - iniciando com 0 para mostrar todos os dados
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  
  // Referência para controlar se dados já foram carregados
  const initialLoadComplete = useRef(false);

  // Função para filtrar dados por mês e ano - otimizada para evitar recálculos desnecessários
  const filterDataByDate = useCallback((data: any[], dateField: string) => {
    // Se não temos filtro de mês/ano, retornamos os dados originais
    if (selectedMonth === 0 || selectedYear === 0) {
      return data;
    }
    
    // Filtramos apenas quando necessário
    return data.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate.getMonth() + 1 === selectedMonth && 
             itemDate.getFullYear() === selectedYear;
    });
  }, [selectedMonth, selectedYear]);

  // Função para buscar indicadores do Supabase
  const fetchIndicadores = useCallback(async () => {
    try {
      console.log('Buscando indicadores do Supabase...');
      console.log(`Filtro temporal: ${selectedMonth}/${selectedYear}`);

      // Obter os valores atuais dos filtros para garantir consistência
      const currentMonth = selectedMonth;
      const currentYear = selectedYear;
      
      console.log(`Valores atuais dos filtros: Mês=${currentMonth}, Ano=${currentYear}`);

      let queryPropostas = supabase
        .from("propostas")
        .select("*");

      let queryPropostasSaida = supabase
        .from("propostas_saida")
        .select("*");

      // Aplicar filtro de data apenas se não estiver no modo "todos os dados"
      if (currentMonth !== 0 && currentYear !== 0) {
        // Garantir que estamos usando o último dia do mês corretamente
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        // Obter o último dia do mês selecionado
        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
        const endDate = new Date(currentYear, currentMonth - 1, lastDay, 23, 59, 59);
        
        const startDateISO = startDate.toISOString();
        const endDateISO = endDate.toISOString();
        
        console.log(`Aplicando filtro de data: ${startDateISO} até ${endDateISO}`);
        queryPropostas = queryPropostas.gte('data', startDateISO).lte('data', endDateISO);
        queryPropostasSaida = queryPropostasSaida.gte('data', startDateISO).lte('data', endDateISO);
      } else {
        console.log('Sem filtro de data aplicado - mostrando todos os dados');
      }

      // Consulta para propostas de entrada
      let { data: propostasData, error: propostasError } = await queryPropostas;

      // Consulta para propostas de saída
      let { data: propostasSaidaData, error: propostasSaidaError } = await queryPropostasSaida;
      
      // Verificar se houve erro nas consultas
      if (propostasError || propostasSaidaError) {
        console.error('Erro ao buscar propostas:', { propostasError, propostasSaidaError });
        toast.error('Erro ao carregar dados do dashboard');
        return null;
      }
      
      // Usar dados disponíveis ou valores padrão
      const propostas = propostasData || [];
      const propostasSaida = propostasSaidaData || [];
      
      console.log('Dados brutos recuperados:', { 
        totalPropostas: propostas.length, 
        totalSaidas: propostasSaida.length 
      });
      
      // Função auxiliar para converter valores monetários
      const parseMonetaryValue = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'string') {
          // Remove todos os caracteres exceto números, vírgula e ponto
          const cleanValue = value.replace(/[^0-9,.-]/g, '');
          // Substitui vírgula por ponto para conversão
          return parseFloat(cleanValue.replace(',', '.')) || 0;
        }
        return Number(value) || 0;
      };

      // Cálculos para propostas de entrada
      const totalEntrada = propostas.filter(p => 
        p.status?.toString().toLowerCase() === "aprovado"
      ).length;
      const propostasAprovadas = propostas.filter(p => 
        p.status?.toString().toLowerCase() === "aprovado"
      );
      const aprovadas = propostasAprovadas.length;
      
      // Cálculos para propostas de saída
      const totalSaida = propostasSaida.length;
      
      // Cálculo de perdas totais
      const perdasTotais = propostasSaida.reduce((acc, p) => {
        const perda = parseMonetaryValue(p.perda_valor);
        console.log('Perda processada:', { original: p.perda_valor, convertido: perda });
        return acc + perda;
      }, 0);
      
      // Cálculo da taxa de churn
      const taxaChurn = totalEntrada > 0 ? ((totalSaida / totalEntrada) * 100) : 0;
      
      // Formatação para taxas
      const taxaConversao = totalEntrada > 0 
        ? ((aprovadas / totalEntrada) * 100).toFixed(1) + "%" 
        : "0,0%";
        
      // Cálculo para valores monetários de propostas aprovadas
      const honorariosAprovados = propostasAprovadas.reduce((acc, p) => {
        const honorario = parseMonetaryValue(p.honorario);
        console.log('Honorário processado:', { original: p.honorario, convertido: honorario });
        return acc + honorario;
      }, 0);

      // Cálculo do lucro projetado
      const totalHonorario = propostasAprovadas.reduce((acc, p) => {
        const honorario = parseMonetaryValue(p.honorario);
        return acc + honorario;
      }, 0);

      const totalComissao = propostasAprovadas.reduce((acc, p) => {
        const comissao = parseMonetaryValue(p.comissao);
        console.log('Comissão processada:', { original: p.comissao, convertido: comissao });
        return acc + comissao;
      }, 0);

      console.log('Totais calculados:', {
        totalHonorario,
        totalComissao,
        honorariosAprovados,
        perdasTotais,
        taxaChurn
      });

      const lucroProjetado = totalHonorario - totalComissao;
      const margemLucroProjetada = totalHonorario > 0 ? (lucroProjetado / totalHonorario) * 100 : 0;
      
      // Criar objeto de retorno com formatação correta
      const newStatsData = {
        propostasEntrada: totalEntrada.toString(),
        propostasSaida: totalSaida.toString(),
        taxaConversao: taxaConversao.replace('.', ','),
        taxaChurn: `${taxaChurn.toFixed(1).replace('.', ',')}%`,
        honorariosAprovados: formatCurrency(honorariosAprovados),
        perdasTotais: formatCurrency(perdasTotais),
        lucroProjetado: formatCurrency(lucroProjetado),
        margemLucroProjetada: `${margemLucroProjetada.toFixed(1).replace('.', ',')}%`
      };
      
      console.log('Stats calculados:', newStatsData);
      
      // Atualizar state imediatamente
      setStatsData(newStatsData);
      
      return newStatsData;
    } catch (err) {
      console.error("Erro ao buscar indicadores:", err);
      toast.error('Falha ao carregar indicadores do dashboard');
      
      const defaultStats = {
        propostasEntrada: "0",
        propostasSaida: "0",
        taxaConversao: "0%",
        taxaChurn: "0%",
        honorariosAprovados: "R$ 0,00",
        perdasTotais: "R$ 0,00",
        lucroProjetado: "R$ 0,00",
        margemLucroProjetada: "0%"
      };
      
      setStatsData(defaultStats);
      return defaultStats;
    }
  }, [selectedMonth, selectedYear]);
  
  // Função otimizada para buscar propostas recentes diretamente do Supabase
  const fetchPropostasRecentes = useCallback(async () => {
    try {
      console.log('Buscando propostas recentes...');

      let queryEntrada = supabase
        .from('propostas')
        .select('*')
        .order('data', { ascending: false })
        .limit(5);

      let querySaida = supabase
        .from('propostas_saida')
        .select('*')
        .order('data', { ascending: false })
        .limit(5);

      if (filtroDataInicio && filtroDataFim) {
        const startDateISO = filtroDataInicio.toISOString();
        const endDateISO = filtroDataFim.toISOString();
        console.log(`fetchPropostasRecentes: Aplicando filtro de data de ${startDateISO} a ${endDateISO}`);
        queryEntrada = queryEntrada.gte('data', startDateISO).lte('data', endDateISO);
        querySaida = querySaida.gte('data', startDateISO).lte('data', endDateISO);
      } else {
        console.log('fetchPropostasRecentes: Nenhum filtro de data aplicado.');
      }
      
      // Buscar propostas de entrada mais recentes
      const { data: propostasEntrada, error: errorEntrada } = await queryEntrada;

      if (errorEntrada) {
        console.error('Erro ao buscar propostas de entrada:', errorEntrada);
        toast.error('Erro ao carregar propostas recentes');
        return [];
      }

      // Buscar propostas de saída mais recentes
      const { data: propostasSaida, error: errorSaida } = await querySaida;

      if (errorSaida) {
        console.error('Erro ao buscar propostas de saída:', errorSaida);
        toast.error('Erro ao carregar propostas de saída');
        return [];
      }

      // Função auxiliar para converter valores monetários
      const parseMonetaryValue = (value: any): number => {
        if (typeof value === 'string') {
          return parseFloat(value.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
        }
        return Number(value) || 0;
      };

      // Processar propostas de entrada
      const entradasProcessadas = (propostasEntrada || []).map(p => ({
        ...p,
        tipo_proposta: 'entrada' as const,
        valor: parseMonetaryValue(p.honorario),
        honorario: parseMonetaryValue(p.honorario),
        comissao: parseMonetaryValue(p.comissao),
        status: p.status || "pendente"
      }));

      // Processar propostas de saída
      const saidasProcessadas = (propostasSaida || []).map(p => ({
        ...p,
        tipo_proposta: 'saida' as const,
        valor: parseMonetaryValue(p.perda_valor),
        status: p.status || "pendente"
      }));

      // Combinar e ordenar por data
      const todasPropostas = [...entradasProcessadas, ...saidasProcessadas]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);
      
      console.log('Propostas recentes processadas:', todasPropostas.length);
      
      setFilteredData(prev => ({ ...prev, propostasRecentes: todasPropostas }));
      return todasPropostas;
    } catch (error) {
      console.error('Erro ao buscar propostas recentes:', error);
      setFilteredData(prev => ({ ...prev, propostasRecentes: [] }));
      return [];
    }
  }, []);
  
  // Função para buscar dados de tipo de tributação - corrigindo a query
  const fetchTipoTributacao = useCallback(async () => {
    try {
      console.log('Buscando dados de tributação...');
      
      let query = supabase
        .from('propostas')
        .select('tributacao')
        .not('tributacao', 'is', null);

      if (filtroDataInicio && filtroDataFim) {
        const startDateISO = filtroDataInicio.toISOString();
        const endDateISO = filtroDataFim.toISOString();
        console.log(`fetchTipoTributacao: Aplicando filtro de data de ${startDateISO} a ${endDateISO}`);
        query = query.gte('data', startDateISO).lte('data', endDateISO);
      } else {
        console.log('fetchTipoTributacao: Nenhum filtro de data aplicado.');
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar dados de tributação:', error);
        // Usar dados estáticos em caso de erro
        setFilteredData(prev => ({ ...prev, tributacao: DEFAULT_TRIBUTACAO_DATA }));
        return DEFAULT_TRIBUTACAO_DATA;
      }
      
      // Se temos dados reais, contar e calcular percentuais
      if (data && data.length > 0) {
        const countByType: Record<string, number> = {};
        
        // Contar por tipo
        data.forEach(item => {
          const type = item.tributacao || 'Não informado';
          countByType[type] = (countByType[type] || 0) + 1;
        });
        
        // Calcular total
        const total = Object.values(countByType).reduce((sum, count) => sum + count, 0);
        
        // Converter para formato de gráfico com percentuais
        const tributacaoData = Object.entries(countByType).map(([name, count]) => ({
          name,
          value: Math.round((count / total) * 100)
        }));
        
        console.log('Dados de tributação calculados:', tributacaoData);
        setFilteredData(prev => ({ ...prev, tributacao: tributacaoData }));
        return tributacaoData;
      }
      
      // Se não temos dados suficientes, usar dados estáticos
      console.log('Usando dados estáticos de tributação');
      setFilteredData(prev => ({ ...prev, tributacao: DEFAULT_TRIBUTACAO_DATA }));
      return DEFAULT_TRIBUTACAO_DATA;
    } catch (error) {
      console.error('Erro ao processar dados de tributação:', error);
      setFilteredData(prev => ({ ...prev, tributacao: DEFAULT_TRIBUTACAO_DATA }));
      return DEFAULT_TRIBUTACAO_DATA;
    }
  }, []);
  
  // Função para buscar dados de origem de clientes - corrigindo a query
  const fetchOrigemClientes = useCallback(async () => {
    try {
      console.log('Buscando dados de origem...');
      
      let query = supabase
        .from('propostas')
        .select('origem')
        .not('origem', 'is', null);

      if (filtroDataInicio && filtroDataFim) {
        const startDateISO = filtroDataInicio.toISOString();
        const endDateISO = filtroDataFim.toISOString();
        console.log(`fetchOrigemClientes: Aplicando filtro de data de ${startDateISO} a ${endDateISO}`);
        query = query.gte('data', startDateISO).lte('data', endDateISO);
      } else {
        console.log('fetchOrigemClientes: Nenhum filtro de data aplicado.');
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar dados de origem:', error);
        // Retornar array vazio em caso de erro
        setFilteredData(prev => ({ ...prev, origemClientes: [] }));
        return [];
      }
      
      // Se temos dados reais, fazer a contagem
      if (data && data.length > 0) {
        const countByOrigin: Record<string, number> = {};
        
        // Contar por origem
        data.forEach(item => {
          const origin = item.origem || 'Não informado';
          countByOrigin[origin] = (countByOrigin[origin] || 0) + 1;
        });
        
        // Converter para formato de gráfico
        const origemData = Object.entries(countByOrigin)
          .map(([name, count]) => ({
            name,
            clientes: count
          }))
          .sort((a, b) => b.clientes - a.clientes)
          .slice(0, 5); // Top 5 origens
        
        console.log('Dados de origem calculados:', origemData);
        setFilteredData(prev => ({ ...prev, origemClientes: origemData }));
        return origemData;
      }
      
      // Se não temos dados suficientes, retornar array vazio
      console.log('Nenhum dado de origem encontrado');
      setFilteredData(prev => ({ ...prev, origemClientes: [] }));
      return [];
    } catch (error) {
      console.error('Erro ao processar dados de origem:', error);
      setFilteredData(prev => ({ ...prev, origemClientes: [] }));
      return [];
    }
  }, []);
  
  // Função para buscar histórico de fechamento - usando dados estáticos melhorados
  const fetchHistoricoFechamento = useCallback(async () => {
    // Usar dados estáticos para melhor desempenho
    setFilteredData(prev => ({ ...prev, historicoFechamento: HISTORICO_FECHAMENTO_DATA }));
    return HISTORICO_FECHAMENTO_DATA;
  }, []);

  // Função para calcular análises comparativas com dados reais sempre que possível
  const fetchAnalytics = useCallback(async () => {
    try {      
      // Definir o período atual com base nos filtros
      let currentPeriodStart = filtroDataInicio;
      let currentPeriodEnd = filtroDataFim;

      // Se os filtros não estiverem definidos, usar o mês atual como padrão para analytics
      if (!currentPeriodStart || !currentPeriodEnd) {
        console.warn('Filtros de data não definidos para analytics. Usando período padrão (mês atual).');
        const today = new Date();
        currentPeriodStart = new Date(today.getFullYear(), today.getMonth(), 1);
        currentPeriodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      // Calcular o período anterior com base no período atual
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;

      if (selectedPeriod === 'week') {
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 7);
        previousPeriodEnd = new Date(currentPeriodEnd);
        previousPeriodEnd.setDate(currentPeriodEnd.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
        previousPeriodEnd = new Date(currentPeriodEnd);
        previousPeriodEnd.setMonth(currentPeriodEnd.getMonth() - 1);
      } else { // 'year'
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setFullYear(currentPeriodStart.getFullYear() - 1);
        previousPeriodEnd = new Date(currentPeriodEnd);
        previousPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() - 1);
      }
      
      // Converter datas para formato ISO para consulta
      const currentPeriodStartISO = currentPeriodStart.toISOString();
      const currentPeriodEndISO = currentPeriodEnd.toISOString();
      const previousPeriodStartISO = previousPeriodStart.toISOString();
      const previousPeriodEndISO = previousPeriodEnd.toISOString();
      
      console.log(`fetchAnalytics: Período atual: ${currentPeriodStartISO} a ${currentPeriodEndISO}`);
      console.log(`fetchAnalytics: Período anterior: ${previousPeriodStartISO} a ${previousPeriodEndISO}`);

      // Buscar propostas de entrada do período atual
      const { data: currentMonthEntrada, error: currentEntradaError } = await supabase
        .from('propostas')
        .select('id, status, honorario, comissao, data')
        .gte('data', currentPeriodStartISO)
        .lte('data', currentPeriodEndISO);
      
      // Buscar propostas de entrada do período anterior
      const { data: prevMonthEntrada, error: prevEntradaError } = await supabase
        .from('propostas')
        .select('id, status, honorario, comissao, data')
        .gte('data', previousPeriodStartISO)
        .lte('data', previousPeriodEndISO);
      
      // Buscar propostas de saída do período atual
      const { data: currentMonthSaida, error: currentSaidaError } = await supabase
        .from('propostas_saida')
        .select('id, perda_valor, data')
        .gte('data', currentPeriodStartISO)
        .lte('data', currentPeriodEndISO);
      
      // Buscar propostas de saída do período anterior
      const { data: prevMonthSaida, error: prevSaidaError } = await supabase
        .from('propostas_saida')
        .select('id, perda_valor, data')
        .gte('data', previousPeriodStartISO)
        .lte('data', previousPeriodEndISO);
      
      // Validar dados e usar defaults caso necessário
      const curEntrada = currentMonthEntrada || [];
      const prevEntrada = prevMonthEntrada || [];
      const curSaida = currentMonthSaida || [];
      const prevSaida = prevMonthSaida || [];
      
      // Função auxiliar para converter valores monetários
      const parseMonetaryValue = (value: any): number => {
        if (typeof value === 'string') {
          return parseFloat(value.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
        }
        return Number(value) || 0;
      };
      
      // Calcular total de entradas
      const totalCurEntrada = curEntrada.length;
      const totalPrevEntrada = prevEntrada.length;
      
      // Calcular total de saídas
      const totalCurSaida = curSaida.length;
      const totalPrevSaida = prevSaida.length;
      
      // Calcular conversões
      const curAprovadas = curEntrada.filter(p => p.status?.toLowerCase() === "aprovado").length;
      const prevAprovadas = prevEntrada.filter(p => p.status?.toLowerCase() === "aprovado").length;
      
      const curConversao = totalCurEntrada > 0 ? curAprovadas / totalCurEntrada : 0;
      const prevConversao = totalPrevEntrada > 0 ? prevAprovadas / totalPrevEntrada : 0;
      
      // Calcular churn
      const curChurn = totalCurEntrada > 0 ? totalCurSaida / totalCurEntrada : 0;
      const prevChurn = totalPrevEntrada > 0 ? totalPrevSaida / totalPrevEntrada : 0;
      
      // Calcular honorários
      const curHonorarios = curEntrada
        .filter(p => p.status?.toLowerCase() === "aprovado")
        .reduce((acc, p) => acc + parseMonetaryValue(p.honorario), 0);
        
      const prevHonorarios = prevEntrada
        .filter(p => p.status?.toLowerCase() === "aprovado")
        .reduce((acc, p) => acc + parseMonetaryValue(p.honorario), 0);
        
      // Calcular perdas
      const curPerdas = curSaida.reduce((acc, s) => acc + parseMonetaryValue(s.perda_valor), 0);
      const prevPerdas = prevSaida.reduce((acc, s) => acc + parseMonetaryValue(s.perda_valor), 0);
      
      // Calcular variações percentuais com proteção contra divisão por zero
      function calcVariation(current: number, previous: number): {valor: string, direcao: "up" | "down" | "neutral"} {
        if (previous === 0) {
          return current > 0 
            ? { valor: "100%", direcao: "up" } 
            : { valor: "0%", direcao: "neutral" };
        }
        
        const variation = ((current - previous) / previous) * 100;
        return {
          valor: `${Math.abs(variation).toFixed(1).replace('.', ',')}%`,
          direcao: variation > 0 ? "up" : variation < 0 ? "down" : "neutral"
        };
      }
      
      // Calcular ticket médio
      const curTicketMedio = curAprovadas > 0 ? curHonorarios / curAprovadas : 0;
      
      // Criar objeto de análise com dados calculados
      const analytics: KpiAnalytics = {
        mediaEntrada: totalCurEntrada.toString(),
        mediaSaida: totalCurSaida.toString(),
        ticketMedio: formatCurrency(curTicketMedio),
        comparativoEntrada: calcVariation(totalCurEntrada, totalPrevEntrada),
        comparativoSaida: calcVariation(totalCurSaida, totalPrevSaida),
        comparativoConversao: calcVariation(curConversao, prevConversao),
        comparativoChurn: calcVariation(curChurn, prevChurn),
        comparativoHonorarios: calcVariation(curHonorarios, prevHonorarios),
        comparativoPerdas: calcVariation(curPerdas, prevPerdas)
      };
      
      console.log('Analytics calculados:', analytics);
      
      setKpiAnalytics(analytics);
      return analytics;
    } catch (err) {
      console.error("Erro ao processar dados analíticos:", err);
      
      // Return default data in case of error
      const defaultAnalytics = {
        mediaEntrada: "0",
        mediaSaida: "0",
        ticketMedio: formatCurrency(0),
        comparativoEntrada: { valor: "0%", direcao: "neutral" as const },
        comparativoSaida: { valor: "0%", direcao: "neutral" as const },
        comparativoConversao: { valor: "0%", direcao: "neutral" as const },
        comparativoChurn: { valor: "0%", direcao: "neutral" as const },
        comparativoHonorarios: { valor: "0%", direcao: "neutral" as const },
        comparativoPerdas: { valor: "0%", direcao: "neutral" as const }
      };
      
      setKpiAnalytics(defaultAnalytics);
      return defaultAnalytics;
    }
  }, []);
  
  // Função de diagnóstico para verificar a integridade dos dados
  const runDiagnostics = useCallback(() => {
    // Executar diagnóstico apenas quando necessário (modo debug)
    const debugMode = false;
    if (!debugMode) return;
    
    console.log('Executando diagnóstico de dados do dashboard...');
    
    // Verificar se os dados do filteredData estão definidos corretamente
    if (!filteredData.propostasRecentes || !Array.isArray(filteredData.propostasRecentes)) {
      console.error('Diagnóstico: propostasRecentes não é um array válido', filteredData.propostasRecentes);
    } else {
      console.log(`Diagnóstico: propostasRecentes tem ${filteredData.propostasRecentes.length} items`);
      
      // Verificar se todos os itens têm os campos obrigatórios
      const itemsComProblemas = filteredData.propostasRecentes.filter(p => 
        !p.cliente || !p.responsavel || !p.data || p.status === undefined || p.valor === undefined
      );
      
      if (itemsComProblemas.length > 0) {
        console.warn('Diagnóstico: Encontrados itens com dados incompletos:', itemsComProblemas);
      }
    }
    
    // Verificar estrutura dos dados de tributação
    if (!filteredData.tributacao || !Array.isArray(filteredData.tributacao)) {
      console.error('Diagnóstico: dados de tributação não são válidos', filteredData.tributacao);
    }
    
    // Verificar estrutura dos dados de origem
    if (!filteredData.origemClientes || !Array.isArray(filteredData.origemClientes)) {
      console.error('Diagnóstico: dados de origem não são válidos', filteredData.origemClientes);
    }
    
    console.log('Diagnóstico concluído');
  }, [filteredData]);

  // Referência para controlar a última execução de updateDashboardData
  const lastDashboardUpdate = useRef({
    timestamp: 0,
    inProgress: false
  });
  
  // Função para atualizar todos os dados do dashboard - otimizada para melhor performance
  const updateDashboardData = useCallback(async () => {
    // Verificar se já está em andamento ou foi executado recentemente
    const now = Date.now();
    if (lastDashboardUpdate.current.inProgress) {
      console.log('Ignorando updateDashboardData - já está em andamento');
      return;
    }
    
    // Reduzir o tempo mínimo entre atualizações para garantir que os filtros sejam aplicados rapidamente
    if (now - lastDashboardUpdate.current.timestamp < 500) {
      console.log('Ignorando updateDashboardData - executado muito recentemente');
      return;
    }
    
    // Marcar como em andamento e atualizar timestamp
    lastDashboardUpdate.current.inProgress = true;
    lastDashboardUpdate.current.timestamp = now;
    
    // Sempre indicar que estamos atualizando os dados
    setIsRefreshing(true);
    
    console.log('Iniciando atualização de dados do dashboard...');
    console.log(`Atualizando com filtros: Mês=${selectedMonth}, Ano=${selectedYear}`);
    
    try {
      // Primeiro, carregar indicadores principais para exibição imediata
      await fetchIndicadores();
      
      // Depois, carregar dados secundários em paralelo
      const secondaryDataPromises = [
        fetchPropostasRecentes(),
        fetchTipoTributacao(),
        fetchOrigemClientes(),
        fetchHistoricoFechamento(),
        fetchAnalytics()
      ];
      
      // Usar Promise.allSettled para não bloquear se uma falhar
      const results = await Promise.allSettled(secondaryDataPromises);
      
      // Verificar se houve falhas nas promessas secundárias
      const falhas = results.filter(r => r.status === 'rejected').length;
      if (falhas > 0) {
        console.warn(`${falhas} operações secundárias falharam durante a atualização`);
      }
      
      console.log('Atualização de dados do dashboard concluída com sucesso');
      
      // Se os filtros estão ativos, mostrar um toast de confirmação
      if (selectedMonth !== 0 && selectedYear !== 0) {
        const nomeMes = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('pt-BR', { month: 'long' });
        toast.success(`Dados filtrados: ${nomeMes} de ${selectedYear}`);
      }
    } catch (error) {
      console.error('Erro na atualização de dados:', error);
      toast.error('Erro ao atualizar dados do dashboard');
    } finally {
      // Sempre finalizar o estado de refreshing
      setIsRefreshing(false);
      
      // Marcar que a carga inicial foi concluída
      if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
      }
      
      // Marcar que a atualização foi concluída
      lastDashboardUpdate.current.inProgress = false;
    }
  }, [fetchIndicadores, fetchPropostasRecentes, fetchTipoTributacao, fetchOrigemClientes, fetchHistoricoFechamento, fetchAnalytics, selectedMonth, selectedYear]);
  
  // Removido o debounce que não é mais necessário

  // Referência para controlar a última aplicação de filtros
  const lastFilterApply = useRef({
    timestamp: 0
  });
  
  // Função para aplicar filtros
  const aplicarFiltros = useCallback(() => {
    // Evitar múltiplas chamadas em curto período de tempo
    const now = Date.now();
    if (now - lastFilterApply.current.timestamp < 500) {
      console.log('Ignorando chamada de aplicarFiltros (muito frequente)');
      return;
    }
    
    // Atualizar timestamp da última aplicação
    lastFilterApply.current.timestamp = now;
    
    console.log('Aplicando filtros:', { selectedMonth, selectedYear });
    setFilterDialogOpen(false);
    
    // Atualizar a referência de última atualização para evitar duplicação no useEffect
    lastUpdate.current = {
      month: selectedMonth,
      year: selectedYear,
      timestamp: now
    };
    
    // Forçar atualização imediata com os valores atuais dos filtros
    console.log('Executando updateDashboardData com filtros:', { selectedMonth, selectedYear });
    
    // Persistir os filtros no localStorage
    if (selectedMonth !== 0 && selectedYear !== 0) {
      localStorage.setItem('dashboard-filters', JSON.stringify({ 
        selectedMonth, 
        selectedYear 
      }));
    }
    
    // Pequeno delay para garantir que os estados foram atualizados
    setTimeout(() => {
      updateDashboardData();
    }, 50);
  }, [updateDashboardData, selectedMonth, selectedYear]);

  // Função para limpar filtros
  const limparFiltros = useCallback(() => {
    console.log('Limpando filtros');
    
    // Usar 0 como valor especial para indicar "sem filtro"
    setSelectedMonth(0);
    setSelectedYear(0);
    
    // Remover filtros do localStorage
    localStorage.removeItem('dashboard-filters');
    
    // Atualizar a referência de última atualização para evitar duplicação no useEffect
    lastUpdate.current = {
      month: 0,
      year: 0,
      timestamp: Date.now()
    };
    
    // Pequeno delay antes de atualizar os dados para garantir que os estados foram atualizados
    setTimeout(() => {
      // Atualizar os dados sem filtros
      console.log('Atualizando dados após limpar filtros');
      updateDashboardData();
      toast.success("Filtros removidos com sucesso!");
    }, 100);
  }, [updateDashboardData]);
  
  // Configurar período selecionado
  useEffect(() => {
    const now = new Date();
    let startDate;
    let endDate = now; // Por padrão, o fim é a data atual

    if (selectedPeriod === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Início do mês atual
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fim do mês atual
    } else if (selectedPeriod === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1); // Início do ano atual
      endDate = new Date(now.getFullYear(), 11, 31); // Fim do ano atual
    } else {
      // Caso padrão ou 'custom' se o usuário definir manualmente
      // Não fazemos nada aqui, pois as datas já seriam definidas pelos inputs
      return; 
    }
    
    setFiltroDataInicio(startDate);
    setFiltroDataFim(endDate);
    
    // Chamar updateDashboardData apenas se o período selecionado for alterado
    // e não for a carga inicial, para evitar loop.
    // A carga inicial será tratada por outro useEffect.
    if (initialLoadComplete.current) {
      updateDashboardData();
    }

  }, [selectedPeriod, updateDashboardData]);
  
  // Modificar o useEffect para usar a versão com debounce
  useEffect(() => {
    // Inicializar os dados apenas uma vez durante a primeira renderização
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true;
      updateDashboardData();
    }
    
    // Esta função é executada quando o componente é desmontado
    return () => {
      console.log('Limpando recursos do dashboard');
    };
  }, [updateDashboardData]);

  // Referência para controlar a última atualização
  const lastUpdate = useRef({
    month: 0,
    year: 0,
    timestamp: 0
  });

  // Modificar o useEffect para monitorar mudanças nos filtros
  useEffect(() => {
    // Não executar na montagem inicial
    if (initialLoadComplete.current) {
      console.log('Filtros alterados:', { selectedMonth, selectedYear });
      
      // Verificar se já atualizamos com esses mesmos filtros recentemente
      const now = Date.now();
      const lastUpdateTime = lastUpdate.current.timestamp;
      const sameFilters = lastUpdate.current.month === selectedMonth && 
                          lastUpdate.current.year === selectedYear;
      
      // Só atualizar se os filtros mudaram ou se passou tempo suficiente desde a última atualização
      if (!sameFilters || (now - lastUpdateTime > 2000)) {
        console.log('Executando updateDashboardData após mudança de filtros:', { selectedMonth, selectedYear });
        
        // Atualizar referência da última atualização
        lastUpdate.current = {
          month: selectedMonth,
          year: selectedYear,
          timestamp: now
        };
        
        updateDashboardData();
      } else {
        console.log('Ignorando atualização repetida com os mesmos filtros');
      }
    }
  }, [selectedMonth, selectedYear, updateDashboardData]);

  // Adicionar um efeito para persistir os filtros no localStorage
  useEffect(() => {
    // Não salvar na montagem inicial
    if (initialLoadComplete.current && (selectedMonth !== 0 || selectedYear !== 0)) {
      console.log('Salvando filtros no localStorage:', { selectedMonth, selectedYear });
      localStorage.setItem('dashboard-filters', JSON.stringify({ 
        selectedMonth, 
        selectedYear 
      }));
    }
  }, [selectedMonth, selectedYear]);

  // Adicionar um efeito para carregar os filtros do localStorage
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('dashboard-filters');
      if (savedFilters) {
        const { selectedMonth: month, selectedYear: year } = JSON.parse(savedFilters);
        console.log('Carregando filtros do localStorage:', { month, year });
        
        // Só aplicar se os valores forem diferentes dos atuais
        if (month !== selectedMonth) setSelectedMonth(month);
        if (year !== selectedYear) setSelectedYear(year);
      }
    } catch (error) {
      console.error('Erro ao carregar filtros do localStorage:', error);
    }
  }, []);

  return {
    statsData,
    filteredData,
    kpiAnalytics,
    isRefreshing,
    filterDialogOpen,
    filtroDataInicio,
    filtroDataFim,
    selectedPeriod,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    setFilterDialogOpen,
    setFiltroDataInicio,
    setFiltroDataFim,
    setSelectedPeriod,
    aplicarFiltros,
    limparFiltros,
    updateDashboardData
  };
}
