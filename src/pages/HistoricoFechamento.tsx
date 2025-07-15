import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dados para a tabela de bonificações conforme a imagem
const bonificacoesData = [
  { mes: "Janeiro", valor: 2362.54 },
  { mes: "Fevereiro", valor: 1079.30 },
  { mes: "Março", valor: 148.53 },
  { mes: "Abril", valor: 1690.48 },
  { mes: "Maio", valor: 984.00 },
  { mes: "Junho", valor: 0 },
  { mes: "Julho", valor: 0 },
  { mes: "Agosto", valor: 0 },
  { mes: "Setembro", valor: 0 },
  { mes: "Outubro", valor: 0 },
  { mes: "Novembro", valor: 0 },
  { mes: "Dezembro", valor: 0 }
];

// Função para calcular o total do primeiro semestre
const calcularTotalPrimeiroSemestre = () => {
  return bonificacoesData
    .slice(0, 6)
    .reduce((total, item) => total + item.valor, 0);
};

// Função para calcular o total do segundo semestre
const calcularTotalSegundoSemestre = () => {
  return bonificacoesData
    .slice(6, 12)
    .reduce((total, item) => total + item.valor, 0);
};

// Função para formatar valores monetários
const formatarValor = (valor: number) => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function Bonificacao() {
  return (
    <>
      <div className="flex items-center pb-6 pt-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonificações</h1>
          <p className="text-muted-foreground">
            Relatório de bonificações para funcionários
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Tabela de Bonificações */}
      <Card>
          <CardHeader>
            <CardTitle>Bonificações Funcionários - 2025</CardTitle>
        </CardHeader>
          <CardContent className="p-0">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-primary/80 to-primary/70 text-white">
                  <th className="py-2 px-3 text-left font-medium text-xs">Mês</th>
                  <th className="py-2 px-3 text-right font-medium text-xs">40% do Valor</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Primeiro Semestre */}
                {bonificacoesData.slice(0, 6).map((item, index) => (
                  <tr 
                    key={index} 
                    className={index % 2 === 0 ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-primary/5"}
                  >
                    <td className="py-2 px-3 border-b border-border">{item.mes}</td>
                    <td className="py-2 px-3 text-right border-b border-border">
                      {item.valor > 0 ? formatarValor(item.valor) : "-"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-secondary/20">
                  <td className="py-2 px-3 text-right font-medium border-b border-border">
                    Total 1º Semestre:
                  </td>
                  <td className="py-2 px-3 text-right font-medium border-b border-border">
                    {formatarValor(calcularTotalPrimeiroSemestre())}
                      </td>
                </tr>
                
                {/* Segundo Semestre */}
                {bonificacoesData.slice(6, 12).map((item, index) => (
                  <tr 
                    key={index + 6} 
                    className={index % 2 === 0 ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-primary/5"}
                  >
                    <td className="py-2 px-3 border-b border-border">{item.mes}</td>
                    <td className="py-2 px-3 text-right border-b border-border">
                      {item.valor > 0 ? formatarValor(item.valor) : "-"}
                      </td>
                    </tr>
                  ))}
                <tr className="bg-secondary/20">
                  <td className="py-2 px-3 text-right font-medium border-b border-border">
                    Total 2º Semestre:
                  </td>
                  <td className="py-2 px-3 text-right font-medium border-b border-border">
                    {formatarValor(calcularTotalSegundoSemestre())}
                  </td>
                </tr>
                
                {/* Total Anual */}
                <tr className="bg-gradient-to-r from-purple-900/90 to-violet-900/90 text-white">
                  <td className="py-2 px-3 font-bold">Total Anual</td>
                  <td className="py-2 px-3 text-right font-bold">
                    {formatarValor(calcularTotalPrimeiroSemestre() + calcularTotalSegundoSemestre())}
                  </td>
                </tr>
                </tbody>
              </table>
        </CardContent>
      </Card>
            </div>
      <div className="h-8 md:h-12"></div>
    </>
  );
} 