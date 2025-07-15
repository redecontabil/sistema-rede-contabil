import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, LabelList } from "recharts";
import { ChartPie } from "lucide-react";
import ChartCard from "./ChartCard";
import { useTributacaoData } from "@/hooks/useTributacaoData";

// Configurações de cores para o gráfico
const COLORS = ['#A61B67', '#D90B91', '#03658C', '#049DBF', '#6366F1', '#8B5CF6'];

interface TributacaoChartProps {
  animateCharts?: boolean;
}

export default function TributacaoChart({ animateCharts = true }: TributacaoChartProps) {
  const { tributacaoData, isLoading, error } = useTributacaoData();

  // Ordenar dados do maior para o menor e pegar apenas os top 5
  const sortedData = [...tributacaoData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Limitar aos top 5

  if (error) {
    return (
      <ChartCard 
        title="Tipo de Tributação" 
        description="Erro ao carregar dados" 
        icon={<ChartPie className="h-5 w-5 text-red-500" />}
        error={error}
      />
    );
  }

  return (
    <ChartCard 
      title="Top 5 Tipos de Tributação" 
      description="Principais regimes tributários" 
      icon={<ChartPie className="h-5 w-5 text-[#A61B67]" />} 
      animateCharts={animateCharts && !isLoading}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid 
            vertical={false}
            horizontal={true} 
            stroke="#444" 
            opacity={0.1} 
          />
          <XAxis 
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#666', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
            tickMargin={10}
          />
          <YAxis
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <Bar 
            dataKey="value" 
            radius={8}
            barSize={32}
          >
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
            <LabelList
              position="top"
              offset={12}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) => `${value}%`}
            />
          </Bar>
          <RechartsTooltip 
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg bg-slate-900 p-2 shadow-lg border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-white">{data.name}</span>
                      <span className="text-slate-300">{data.value}%</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
        </div>

      {/* Legenda com valores - apenas top 5 */}
        <div className="flex flex-wrap justify-center gap-3 mt-auto py-2">
        {sortedData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm shadow-sm" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }} 
            />
            <span className="text-xs font-medium">
              {entry.name}: {entry.value}%
            </span>
          </div>
        ))}
        </div>
      </div>
    </ChartCard>
  );
} 