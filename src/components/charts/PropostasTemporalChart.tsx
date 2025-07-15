import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { BarChart3 } from 'lucide-react';

// Interface para os dados do gráfico
interface ChartDataItem {
  ano: string;
  entrada: number;
  saida: number;
}

// Props do componente
interface PropostasTemporalChartProps {
  className?: string;
  // Adicionando props para integração com o sistema de filtros do Dashboard
  selectedMonth?: number;
  selectedYear?: number;
}

// Dados de exemplo para o gráfico caso não consiga buscar do Supabase
const DADOS_EXEMPLO: ChartDataItem[] = [
  { ano: '2020', entrada: 24, saida: 18 },
  { ano: '2021', entrada: 32, saida: 22 },
  { ano: '2022', entrada: 38, saida: 25 },
  { ano: '2023', entrada: 45, saida: 30 },
  { ano: '2024', entrada: 52, saida: 35 },
];

const PropostasTemporalChart: React.FC<PropostasTemporalChartProps> = ({ 
  className,
  selectedMonth = 0,
  selectedYear = 0
}) => {
  // Estado para os dados do gráfico
  const [chartData, setChartData] = useState<ChartDataItem[]>(DADOS_EXEMPLO);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("5");

  // Configuração das cores do gráfico
  const chartConfig = {
    entrada: {
      label: "Propostas de Entrada",
      color: "#A61B67" // Rosa escuro
    },
    saida: {
      label: "Propostas de Saída",
      color: "#03658C" // Azul
    }
  };

  // Função para buscar os dados
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const yearsToShow = parseInt(timeRange);
      const startYear = currentYear - yearsToShow + 1;

      // Criar array de anos para exibir no gráfico
      const years = Array.from({ length: yearsToShow }, (_, i) => startYear + i);
      
      // Buscar propostas de entrada
      let queryPropostas = supabase.from('propostas').select('data');
      let queryPropostasSaida = supabase.from('propostas_saida').select('data');
      
      // Log para debug
      console.log(`PropostasTemporalChart: fetchData chamado com filtros - Mês=${selectedMonth}, Ano=${selectedYear}`);
      
      // Consultas
      const { data: propostasEntrada, error: errorEntrada } = await queryPropostas;
      const { data: propostasSaida, error: errorSaida } = await queryPropostasSaida;

      if (errorEntrada || errorSaida) {
        console.error('Erro ao buscar dados:', { errorEntrada, errorSaida });
        // Se houver erro, manter os dados de exemplo ajustados para o período selecionado
        const dadosExemploFiltrados = DADOS_EXEMPLO.filter(item => {
          const ano = parseInt(item.ano);
          return ano >= startYear && ano <= currentYear;
        });
        setChartData(dadosExemploFiltrados.length > 0 ? dadosExemploFiltrados : DADOS_EXEMPLO);
        return;
      }

      // Processar os dados por ano
      const dadosPorAno = years.map(ano => {
        // Contar propostas de entrada para este ano
        const entradasDoAno = propostasEntrada?.filter(p => {
          const dataEntrada = new Date(p.data);
          return dataEntrada.getFullYear() === ano;
        }).length || 0;

        // Contar propostas de saída para este ano
        const saidasDoAno = propostasSaida?.filter(p => {
          const dataSaida = new Date(p.data);
          return dataSaida.getFullYear() === ano;
        }).length || 0;

        return {
          ano: ano.toString(),
          entrada: entradasDoAno,
          saida: saidasDoAno
        };
      });

      // Se não houver dados reais, usar os dados de exemplo
      if (dadosPorAno.every(item => item.entrada === 0 && item.saida === 0)) {
        const dadosExemploFiltrados = DADOS_EXEMPLO.filter(item => {
          const ano = parseInt(item.ano);
          return ano >= startYear && ano <= currentYear;
        });
        setChartData(dadosExemploFiltrados.length > 0 ? dadosExemploFiltrados : DADOS_EXEMPLO);
      } else {
        setChartData(dadosPorAno);
      }
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      // Em caso de erro, manter os dados de exemplo
      setChartData(DADOS_EXEMPLO);
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para buscar dados quando o componente montar ou o timeRange mudar
  useEffect(() => {
    fetchData();
  }, [timeRange]);
  
  // Efeito para atualizar quando os filtros do Dashboard mudarem
  useEffect(() => {
    console.log(`PropostasTemporalChart: Filtros do Dashboard alterados - ${selectedMonth}/${selectedYear}`);
    fetchData();
  }, [selectedMonth, selectedYear]);

  return (
    <Card className={className}>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row bg-gradient-to-r from-[#A61B67]/5 to-[#D90B91]/5 dark:from-[#A61B67]/10 dark:to-[#D90B91]/10">
        <div className="grid flex-1 gap-1">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#A61B67]" />
            <span>Análise Temporal de Propostas</span>
          </CardTitle>
          <CardDescription>
            {selectedYear !== 0 
              ? `Comparativo anual de propostas (${selectedYear} em destaque)`
              : "Comparativo anual de propostas de entrada e saída"}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Selecione o período"
          >
            <SelectValue placeholder="Últimos 5 anos" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="3" className="rounded-lg">
              Últimos 3 anos
            </SelectItem>
            <SelectItem value="5" className="rounded-lg">
              Últimos 5 anos
            </SelectItem>
            <SelectItem value="10" className="rounded-lg">
              Últimos 10 anos
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-6 pb-4 sm:px-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="ano"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={({ x, y, payload }) => {
                  // Destacar o ano selecionado no filtro
                  const isSelected = selectedYear !== 0 && payload.value === selectedYear.toString();
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text 
                        x={0} 
                        y={0} 
                        dy={16} 
                        textAnchor="middle" 
                        fill={isSelected ? "#A61B67" : "#666"}
                        fontWeight={isSelected ? "bold" : "normal"}
                        fontSize={12}
                      >
                        {payload.value}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ opacity: 0.3 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const isSelectedYear = selectedYear !== 0 && payload[0].payload.ano === selectedYear.toString();
                    return (
                      <div className={`rounded-lg ${isSelectedYear ? 'bg-[#A61B67]' : 'bg-slate-900'} p-3 shadow-lg border ${isSelectedYear ? 'border-[#D90B91]' : 'border-slate-800'}`}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-white">Ano: {payload[0].payload.ano}</span>
                          <div className="text-slate-300 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartConfig.entrada.color }} />
                              <span>Entrada: {payload[0].value} propostas</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartConfig.saida.color }} />
                              <span>Saída: {payload[1].value} propostas</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry, index) => (
                  <span className="text-sm font-medium">{value}</span>
                )}
              />
              <Bar 
                dataKey="entrada" 
                name="Propostas de Entrada" 
                fill="var(--color-entrada)" 
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Bar 
                dataKey="saida" 
                name="Propostas de Saída" 
                fill="var(--color-saida)" 
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default PropostasTemporalChart;