import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Scale, TrendingUp, TrendingDown, Edit2, Check, X, DollarSign, Wallet, Plus, Trash2, ArrowUpRight, Briefcase, Building, CircleDollarSign, BarChart3
} from "lucide-react";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import StatCard from "@/components/dashboard/StatCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AdminPasswordDialog } from "@/components/dialogs/AdminPasswordDialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

// Interface para os dados de bonificação mensal
interface BonificacaoMensal {
  mes: string;
  valor: number;
  observacao?: string;
}

// Interface para os dados de bonificação anual
interface BonificacaoAnual {
  ano: number;
  meses: BonificacaoMensal[];
  totalPrimeiroSemestre: number;
  totalSegundoSemestre: number;
}

// Dados iniciais de bonificação para 2025
const bonificacaoInicial: BonificacaoAnual = {
  ano: 2025,
  meses: [
    { mes: "Janeiro", valor: 2362.54, observacao: "TOTAL 1º SEMESTRE" },
    { mes: "Fevereiro", valor: 1079.30 },
    { mes: "Março", valor: 148.53 },
    { mes: "Abril", valor: 479.20 },
    { mes: "Maio", valor: 185.68 },
    { mes: "Junho", valor: 1180.32 },
    { mes: "Julho", valor: 137.65, observacao: "TOTAL 2º SEMESTRE" },
    { mes: "Agosto", valor: 0 },
    { mes: "Setembro", valor: 0 },
    { mes: "Outubro", valor: 0 },
    { mes: "Novembro", valor: 0 },
    { mes: "Dezembro", valor: 0 }
  ],
  totalPrimeiroSemestre: 5435.56,
  totalSegundoSemestre: 137.65
};

// Chave para o localStorage
const STORAGE_KEY = 'bonificacao-data';
const HISTORICO_STORAGE_KEY = 'bonificacao-historico-data';

export default function Bonificacao() {
  // Estado para armazenar os dados de bonificação
  const [bonificacaoData, setBonificacaoData] = useState<BonificacaoAnual>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de bonificação:', error);
    }
    return bonificacaoInicial;
  });
  
  // Estado para controlar a edição de células
  const [editingCell, setEditingCell] = useState<{mes: string, valor: number} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [anoAtual, setAnoAtual] = useState<number>(2025);
  
  // Função para salvar dados no localStorage
  const saveToStorage = (data: BonificacaoAnual) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Dados de bonificação salvos com sucesso');
    } catch (error) {
      console.error('Erro ao salvar dados de bonificação:', error);
    }
  };
  
  // Efeito para salvar os dados quando eles forem alterados
  useEffect(() => {
    saveToStorage(bonificacaoData);
  }, [bonificacaoData]);
  
  // Função para calcular o total do primeiro semestre
  const calcularTotalPrimeiroSemestre = () => {
    return bonificacaoData.meses
      .slice(0, 6)
      .reduce((total, mes) => total + mes.valor, 0);
  };
  
  // Função para calcular o total do segundo semestre
  const calcularTotalSegundoSemestre = () => {
    return bonificacaoData.meses
      .slice(6, 12)
      .reduce((total, mes) => total + mes.valor, 0);
  };
  
  // Função para atualizar os totais
  const atualizarTotais = () => {
    setBonificacaoData(prev => ({
      ...prev,
      totalPrimeiroSemestre: calcularTotalPrimeiroSemestre(),
      totalSegundoSemestre: calcularTotalSegundoSemestre()
    }));
  };
  
  // Efeito para atualizar os totais quando os valores mensais mudarem
  useEffect(() => {
    atualizarTotais();
  }, [bonificacaoData.meses]);
  
  // Função para iniciar a edição de uma célula
  const startEditing = (mes: string, valor: number) => {
    setEditingCell({ mes, valor });
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
  };
  
  // Função para salvar a edição
  const saveEdit = () => {
    if (!editingCell) return;
    
    const novoValor = parseFloat(inputRef.current?.value || '0');
    
    setBonificacaoData(prev => ({
      ...prev,
      meses: prev.meses.map(item => 
        item.mes === editingCell.mes 
          ? { ...item, valor: novoValor } 
          : item
      )
    }));
    
    setEditingCell(null);
  };
  
  // Função para cancelar a edição
  const cancelEdit = () => {
    setEditingCell(null);
  };
  
  // Formatação de valores monetários
  const formatarValorMonetario = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonificações</h1>
          <p className="text-muted-foreground">
            Gerencie as bonificações dos funcionários
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={anoAtual.toString()}
            onValueChange={(value) => setAnoAtual(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Tabela de Bonificações */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-teal-600 text-white p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold">Ano {bonificacaoData.ano}</h2>
            <h3 className="text-lg font-semibold">BONIFICAÇÕES FUNCIONÁRIOS</h3>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-teal-100">
                  <th className="border border-gray-300 p-2 text-center w-1/4">Mês</th>
                  <th className="border border-gray-300 p-2 text-center w-1/4">40% DO VALOR</th>
                  <th className="border border-gray-300 p-2 text-center w-1/2">Resultados</th>
                </tr>
              </thead>
              <tbody>
                {bonificacaoData.meses.map((mes, index) => (
                  <tr key={mes.mes} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 p-2">{mes.mes}</td>
                    <td 
                      className="border border-gray-300 p-2 text-right cursor-pointer"
                      onClick={() => startEditing(mes.mes, mes.valor)}
                    >
                      {editingCell && editingCell.mes === mes.mes ? (
                        <Input
                          ref={inputRef}
                          type="number"
                          step="0.01"
                          defaultValue={editingCell.valor}
                          className="w-full"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          onBlur={saveEdit}
                        />
                      ) : (
                        <>R$ {formatarValorMonetario(mes.valor)}</>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {mes.observacao && (
                        <div className="flex justify-between">
                          <span>{mes.observacao}</span>
                          {index === 0 && (
                            <span className="font-bold">R$ {formatarValorMonetario(bonificacaoData.totalPrimeiroSemestre)}</span>
                          )}
                          {index === 6 && (
                            <span className="font-bold">R$ {formatarValorMonetario(bonificacaoData.totalSegundoSemestre)}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
