
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Activity } from "lucide-react";

// Dados para o gráfico de tipo tributário
const tributacaoData = [
  { name: 'Simples Nacional', value: 65, color: '#A61B67' },
  { name: 'MEI', value: 15, color: '#D90B91' },
  { name: 'Lucro Real', value: 10, color: '#03658C' },
  { name: 'Lucro Presumido', value: 10, color: '#049DBF' }
];

const COLORS = tributacaoData.map(item => item.color);

const TipoTributacaoChart = () => {
  // Configuração para o ChartContainer
  const chartConfig = tributacaoData.reduce((acc, item) => {
    acc[item.name] = { color: item.color };
    return acc;
  }, {} as Record<string, { color: string }>);

  return (
    <ChartContainer 
      config={chartConfig}
      className="aspect-[1.5/1] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={tributacaoData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {tributacaoData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="flex flex-col">
                      <span className="font-medium">{data.name}</span>
                      <span>{data.value}%</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom"
            align="center"
            formatter={(value, entry, index) => (
              <span className="text-xs font-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default TipoTributacaoChart;
