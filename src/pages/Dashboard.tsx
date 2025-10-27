import { useEffect, useState, useCallback, useRef } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Label } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, XCircle, FileText, DollarSign, ChartPie, ChartBar, History, BarChart3, Users, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Componentes personalizados para o Dashboard
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import PropostasTable from "@/components/dashboard/PropostasTable";
// Removendo a importação do HistoricoFechamentoTable
import TributacaoChart from "@/components/dashboard/TributacaoChart";
import TopOrigensChart from '@/components/charts/TopOrigensChart';
import PropostasTemporalChart from '@/components/charts/PropostasTemporalChart';

// Hooks personalizados
import { useGreeting } from "@/hooks/useGreeting";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toast } from "sonner";

// Cliente Supabase
import { supabase } from "@/lib/supabaseClient";

// Configurações de cores para gráficos
const PIE_COLORS = ['#A61B67', '#D90B91', '#03658C', '#049DBF'];

export default function Dashboard() {
  // Estado para controlar a animação dos gráficos
  const [animateCharts, setAnimateCharts] = useState(false);
  const [userName, setUserName] = useState("Contador");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Obter saudação baseada na hora do dia
  const {
    greeting,
    motivationalMessage
  } = useGreeting(userName);

  // Obter todos os dados do Dashboard usando o hook personalizado
  const {
    statsData,
    filteredData,
    kpiAnalytics,
    isRefreshing,
    filterDialogOpen,
    filtroDataInicio,
    filtroDataFim,
    filtroDataInicioEmpresa,
    filtroDataFimEmpresa,
    filtroSemDataInicio,
    selectedPeriod,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    setFilterDialogOpen,
    setFiltroDataInicio,
    setFiltroDataFim,
    setFiltroDataInicioEmpresa,
    setFiltroDataFimEmpresa,
    setFiltroSemDataInicio,
    setSelectedPeriod,
    aplicarFiltros,
    limparFiltros,
    updateDashboardData
  } = useDashboardData();

  const [localStatsData, setLocalStatsData] = useState({
    lucroProjetado: 'R$ 0,00',
    margemLucroProjetada: '0%'
  });

  // Função para carregar dados do lucro diretamente do Supabase
  const loadBalancoData = useCallback(async () => {
    try {
      console.log('🔄 Buscando dados do lucro do Supabase...');

      const { data, error } = await supabase
        .from('demonstrativo_financeiro')
        .select('value, percentage')
        .eq('item_id', 24) // ID do item LUCRO
        .single();

      if (error) {
        console.error('❌ Erro ao buscar dados do Supabase:', error);
        return;
      }

      if (data && data.value !== undefined) {
        const novoLucroProjetado = `R$ ${Math.abs(data.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const novaMargemLucroProjetada = data.percentage || '0%';

        setLocalStatsData(prevState => {
          // Verificar se os valores são diferentes antes de atualizar o estado
          if (novoLucroProjetado !== prevState.lucroProjetado ||
              novaMargemLucroProjetada !== prevState.margemLucroProjetada) {
            console.log('✅ Atualizando dados do balanço do Supabase:', {
              lucroProjetado: novoLucroProjetado,
              margemLucroProjetada: novaMargemLucroProjetada
            });

            return {
              lucroProjetado: novoLucroProjetado,
              margemLucroProjetada: novaMargemLucroProjetada
            };
          }
          return prevState;
        });
      } else {
        console.log('ℹ️ Nenhum dado de lucro encontrado no Supabase');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Supabase:', error);
    }
  }, []);

  // Função para monitorar mudanças no Supabase (tempo real)
  useEffect(() => {
    // Configurar subscription para mudanças no demonstrativo_financeiro
    const channel = supabase
      .channel('dashboard_lucro_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demonstrativo_financeiro',
          filter: 'item_id=eq.24' // Apenas o item LUCRO
        },
        (payload) => {
          console.log('🔄 Detectada mudança no lucro via Supabase realtime');
          loadBalancoData();
        }
      )
      .subscribe();

    // Verificar periodicamente os dados do balanço (a cada 5 segundos)
    const checkInterval = setInterval(() => {
      loadBalancoData();
    }, 5000);

    // Limpar os listeners quando o componente for desmontado
    return () => {
      supabase.removeChannel(channel);
      clearInterval(checkInterval);
    };
  }, [loadBalancoData]);

  // Flag para controlar se já fizemos a carga inicial
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Evitar múltiplas cargas iniciais
    if (initialLoadDone.current) return;
    
    // Carregar dados do localStorage primeiro
    loadBalancoData();
    
    // Forçar a atualização de dados ao carregar a página
    const loadData = async () => {
      try {
        console.log('Iniciando carregamento inicial do Dashboard');
        
        // Forçar a atualização dos dados do dashboard
        await updateDashboardData();
        
        // Garantir que os dados do balanço sejam carregados após atualização do dashboard
        loadBalancoData();
        
        // Definir dataLoaded como true após os dados estarem carregados
        setTimeout(() => {
          setAnimateCharts(true);
          setDataLoaded(true);
        }, 300);
        
        console.log('Carregamento inicial do Dashboard concluído');
        
        // Marcar que a carga inicial foi concluída
        initialLoadDone.current = true;
      } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        toast.error('Erro ao carregar dados do dashboard');
        
        // Mesmo em caso de erro, tentar mostrar os dados do balanço
        loadBalancoData();
        setDataLoaded(true);
        
        // Marcar que a carga inicial foi concluída mesmo com erro
        initialLoadDone.current = true;
      }
    };

    loadData();

    // Atualizar dados a cada 5 minutos
    const interval = setInterval(() => {
      loadBalancoData(); // Apenas atualizamos os dados do balanço periodicamente
    }, 300000);

    return () => {
      clearInterval(interval);
    };
  }, []); // Removemos as dependências para evitar re-renderizações

  return <div className="space-y-6 pb-12">
      {/* Cabeçalho do Dashboard com saudação e filtros */}
      <DashboardHeader 
        greeting={greeting} 
        motivationalMessage={motivationalMessage} 
        selectedPeriod={selectedPeriod} 
        setSelectedPeriod={setSelectedPeriod} 
        filterDialogOpen={filterDialogOpen} 
        setFilterDialogOpen={setFilterDialogOpen} 
        filtroDataInicio={filtroDataInicio} 
        setFiltroDataInicio={setFiltroDataInicio} 
        filtroDataFim={filtroDataFim} 
        setFiltroDataFim={setFiltroDataFim}
        filtroDataInicioEmpresa={filtroDataInicioEmpresa}
        setFiltroDataInicioEmpresa={setFiltroDataInicioEmpresa}
        filtroDataFimEmpresa={filtroDataFimEmpresa}
        setFiltroDataFimEmpresa={setFiltroDataFimEmpresa}
        filtroSemDataInicio={filtroSemDataInicio}
        setFiltroSemDataInicio={setFiltroSemDataInicio}
        aplicarFiltros={aplicarFiltros} 
        limparFiltros={limparFiltros} 
        userName={userName}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setSelectedMonth={setSelectedMonth}
        setSelectedYear={setSelectedYear}
      />
      
      {/* Cards de estatísticas - 2x3 grid com responsividade */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 px-4 md:px-8">
        {/* Primeira linha: Propostas de Entrada e Saída */}
        <StatCard 
          title="Propostas de Entrada" 
          value={statsData.propostasEntrada} 
          secondaryValue={statsData.propostasEntradaAnual}
          description="Total no período atual" 
          icon={<ArrowUpCircle className="h-4 w-4 text-emerald-500" />} 
          isLoading={isRefreshing || !dataLoaded}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900/30"
          showSecondary={true}
          primaryLabel="Mensal"
          secondaryLabel="Anual"
        />
        <StatCard 
          title="Propostas de Saída" 
          value={statsData.propostasSaida} 
          secondaryValue={statsData.propostasSaidaAnual}
          description="Total no período atual" 
          icon={<ArrowDownCircle className="h-4 w-4 text-rose-500" />} 
          isLoading={isRefreshing || !dataLoaded}
          className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-100 dark:border-rose-900/30"
          showSecondary={true}
          primaryLabel="Mensal"
          secondaryLabel="Anual"
        />
        {/* Segunda linha: Lucro Projetado e Margem */}
        <StatCard 
          title="Lucro Projetado" 
          value={localStatsData.lucroProjetado} 
          description="Baseado no Lucro do Demonstrativo Financeiro" 
          icon={<DollarSign className="h-4 w-4 text-blue-500" />} 
          isLoading={isRefreshing || !dataLoaded}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900/30" 
        />
        <StatCard 
          title="Margem de Lucro Projetada" 
          value={localStatsData.margemLucroProjetada} 
          description="Percentual de margem" 
          icon={<ChartPie className="h-4 w-4 text-purple-500" />} 
          isLoading={isRefreshing || !dataLoaded}
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-100 dark:border-purple-900/30" 
        />
        {/* Terceira linha: Taxa de Churn e Perdas */}
        <StatCard 
          title="Taxa de Churn" 
          value={statsData.taxaChurn} 
          description="Clientes perdidos" 
          icon={<XCircle className="h-4 w-4 text-amber-500" />} 
          isLoading={isRefreshing || !dataLoaded}
          className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-100 dark:border-amber-900/30" 
        />
        <StatCard 
          title="Perdas Totais" 
          value={statsData.perdasTotais} 
          description="Total do período" 
          icon={<DollarSign className="h-4 w-4 text-red-500" />} 
          isLoading={isRefreshing || !dataLoaded}
          className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-100 dark:border-red-900/30" 
        />
      </div>

      {/* Gráfico de Análise Temporal de Propostas */}
      <div className="px-4 md:px-8">
        <PropostasTemporalChart 
          className="w-full h-[450px]"
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>

      {/* Gráficos na mesma linha - Tributação e Origens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 px-4 md:px-8">
        {/* Gráfico de Tipo de Tributação */}
        <TributacaoChart animateCharts={animateCharts && !isRefreshing} />

        {/* Gráfico de Origem dos Clientes - Barras Horizontais */}
        <ChartCard 
          title="Top 5 Origens dos Clientes" 
          description="Principais canais de aquisição" 
          icon={<ChartBar className="h-5 w-5 text-[#D90B91]" />}
        >
          <TopOrigensChart 
            data={filteredData.origemClientes} 
            loading={isRefreshing || !dataLoaded}
          />
        </ChartCard>
      </div>

      {/* Tabelas de propostas - Primeira linha */}
      <div className="grid grid-cols-1 gap-5 px-4 md:px-8">
        <PropostasTable
          title="Propostas Recentes"
          description="Últimas propostas de entrada e saída"
          icon={<FileText className="h-5 w-5 text-[#A61B67]" />}
          propostas={filteredData.propostasRecentes || []}
          emptyMessage="Nenhuma proposta recente encontrada."
          tipo="misto"
          isLoading={isRefreshing || !dataLoaded}
        />
      </div>
    </div>;
}
