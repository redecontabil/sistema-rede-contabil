import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid, Label } from 'recharts';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

// Cores do tema
const CHART_COLORS = {
  indicacao: '#D90B91',
  cliente: '#A61B67',
  redes: '#03658C',
  site: '#049DBF',
  outros: '#6366F1'
};

interface OrigemData {
  name: string;
  clientes: number;
}

interface TopOrigensChartProps {
  data: OrigemData[];
  loading?: boolean;
}

const TopOrigensChart: React.FC<TopOrigensChartProps> = ({ data = [], loading = false }) => {
  // Calcular o total para percentuais
  const total = data.reduce((sum, item) => sum + item.clientes, 0);
  
  // Processar dados para incluir percentual
  const processedData = data.map(item => ({
    ...item,
    percentual: ((item.clientes / total) * 100).toFixed(1)
  }));
  
  // Configuração para o ChartContainer
  const chartConfig: ChartConfig = {
    bar: {
      theme: {
        light: CHART_COLORS.indicacao,
        dark: CHART_COLORS.indicacao
      }
    }
  };

  // Função para determinar a cor da barra
  const getBarColor = (index: number) => {
    switch (index) {
      case 0: return CHART_COLORS.indicacao;
      case 1: return CHART_COLORS.cliente;
      case 2: return CHART_COLORS.redes;
      case 3: return CHART_COLORS.site;
      default: return CHART_COLORS.outros;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
    <ChartContainer 
      config={chartConfig}
          className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          layout="vertical"
          margin={{ top: 20, right: 120, left: 80, bottom: 20 }}
        >
          <CartesianGrid 
            horizontal={true} 
            vertical={false} 
            stroke="#444" 
            opacity={0.1} 
          />
          <XAxis 
            type="number" 
            tickLine={false} 
            axisLine={false}
            domain={[0, 'auto']}
            tick={{ fill: '#666', fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tickLine={false} 
            axisLine={false}
            width={80}
            tick={(props) => {
              const { x, y, payload } = props;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text x={-10} y={0} dy={4} textAnchor="end" fill="#666" fontSize={13}>
                    {payload.value}
                  </text>
                </g>
              );
            }}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg bg-slate-900 p-3 shadow-lg border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-white">{data.name}</span>
                      <div className="text-slate-300 space-y-1">
                        <div>Total: {data.clientes} clientes</div>
                        <div>Percentual: {data.percentual}%</div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="clientes" 
            radius={8}
            barSize={32}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(index)}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
            <Label
              position="right"
              content={({ x = 0, y = 0, width = 0, height = 0, value }) => {
                const item = processedData[processedData.findIndex(d => d.clientes === value)];
                const xPos = typeof x === 'number' ? x : parseFloat(x);
                const widthNum = typeof width === 'number' ? width : parseFloat(width);
                const yPos = typeof y === 'number' ? y : parseFloat(y);
                const heightNum = typeof height === 'number' ? height : parseFloat(height);
                
                return (
                  <g>
                    <text
                      x={xPos + widthNum + 10}
                      y={yPos + heightNum / 2}
                      fill="#666"
                      fontSize={13}
                      textAnchor="start"
                      dy={4}
                    >
                      {`${item.clientes} (${item.percentual}%)`}
                    </text>
                  </g>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
      </div>
      
      {/* Legenda com cores */}
      <div className="flex flex-wrap justify-center gap-3 mt-auto py-2">
        {processedData.slice(0, 5).map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm shadow-sm" 
              style={{ backgroundColor: getBarColor(index) }} 
            />
            <span className="text-xs font-medium">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopOrigensChart;
