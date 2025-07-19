import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Scale, TrendingUp, TrendingDown, Edit2, Check, X, DollarSign, Wallet, Plus, Trash2, ArrowUpRight, Briefcase, Building, CircleDollarSign, BarChart3, Info, Loader2
} from "lucide-react";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import StatCard from "@/components/dashboard/StatCard";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

// Interface para os dados de bonificação mensal
interface BonificacaoMensal {
  mes: string;
  valor: number;
  observacao?: string;
  calculado?: boolean;
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

// Dados para outros anos
const bonificacao2024: BonificacaoAnual = {
  ano: 2024,
  meses: [
    { mes: "Janeiro", valor: 1500.00, observacao: "TOTAL 1º SEMESTRE" },
    { mes: "Fevereiro", valor: 1200.00 },
    { mes: "Março", valor: 1800.00 },
    { mes: "Abril", valor: 2100.00 },
    { mes: "Maio", valor: 1950.00 },
    { mes: "Junho", valor: 2300.00 },
    { mes: "Julho", valor: 2100.00, observacao: "TOTAL 2º SEMESTRE" },
    { mes: "Agosto", valor: 1800.00 },
    { mes: "Setembro", valor: 2200.00 },
    { mes: "Outubro", valor: 2400.00 },
    { mes: "Novembro", valor: 2100.00 },
    { mes: "Dezembro", valor: 2500.00 }
  ],
  totalPrimeiroSemestre: 10850.00,
  totalSegundoSemestre: 13100.00
};

const bonificacao2023: BonificacaoAnual = {
  ano: 2023,
  meses: [
    { mes: "Janeiro", valor: 1200.00, observacao: "TOTAL 1º SEMESTRE" },
    { mes: "Fevereiro", valor: 1100.00 },
    { mes: "Março", valor: 1300.00 },
    { mes: "Abril", valor: 1400.00 },
    { mes: "Maio", valor: 1350.00 },
    { mes: "Junho", valor: 1500.00 },
    { mes: "Julho", valor: 1450.00, observacao: "TOTAL 2º SEMESTRE" },
    { mes: "Agosto", valor: 1400.00 },
    { mes: "Setembro", valor: 1600.00 },
    { mes: "Outubro", valor: 1700.00 },
    { mes: "Novembro", valor: 1650.00 },
    { mes: "Dezembro", valor: 1800.00 }
  ],
  totalPrimeiroSemestre: 7850.00,
  totalSegundoSemestre: 9600.00
};

// Chave para o localStorage
const STORAGE_KEY = 'bonificacao-data';

// Anos disponíveis para seleção
const ANOS_DISPONIVEIS = [2023, 2024, 2025, 2026];

// Mapeamento de nomes de meses para números
const MESES_PARA_NUMERO: Record<string, number> = {
  "Janeiro": 1,
  "Fevereiro": 2,
  "Março": 3,
  "Abril": 4,
  "Maio": 5,
  "Junho": 6,
  "Julho": 7,
  "Agosto": 8,
  "Setembro": 9,
  "Outubro": 10,
  "Novembro": 11,
  "Dezembro": 12
};

// Mapeamento de números para nomes de meses
const NUMERO_PARA_MESES: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro"
};

export default function Bonificacao() {
  // Estado para armazenar os dados de bonificação por ano
  const [bonificacaoDataMap, setBonificacaoDataMap] = useState<Record<number, BonificacaoAnual>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de bonificação:', error);
    }
    return {
      2023: bonificacao2023,
      2024: bonificacao2024,
      2025: bonificacaoInicial
    };
  });
  
  const [anoAtual, setAnoAtual] = useState<number>(2025);
  
  // Estado para indicar quando está calculando os valores
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Função para validar e atualizar o ano
  const handleAnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    
    // Se o campo estiver vazio, não fazemos nada
    if (!valor) {
      e.target.value = anoAtual.toString();
      return;
    }
    
    const novoAno = parseInt(valor);
    
    // Validar se é um ano válido (entre 2023 e 2030)
    if (novoAno >= 2023 && novoAno <= 2030) {
      setAnoAtual(novoAno);
    } else {
      // Se for inválido, manter o valor anterior
      e.target.value = anoAtual.toString();
      toast.error("Por favor, insira um ano entre 2023 e 2030");
    }
  };
  
  // Obter os dados do ano atual
  const bonificacaoData = useMemo(() => {
    return bonificacaoDataMap[anoAtual] || bonificacaoInicial;
  }, [bonificacaoDataMap, anoAtual]);
  
  // Função para salvar dados no localStorage
  const saveToStorage = (dataMap: Record<number, BonificacaoAnual>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMap));
      console.log('Dados de bonificação salvos com sucesso');
    } catch (error) {
      console.error('Erro ao salvar dados de bonificação:', error);
    }
  };
  
  // Efeito para salvar os dados quando eles forem alterados
  useEffect(() => {
    saveToStorage(bonificacaoDataMap);
  }, [bonificacaoDataMap]);
  
  // Função para calcular o total do primeiro semestre
  const calcularTotalPrimeiroSemestre = (meses: BonificacaoMensal[]) => {
    return meses.slice(0, 6).reduce((total, mes) => total + mes.valor, 0);
  };
  
  // Função para calcular o total do segundo semestre
  const calcularTotalSegundoSemestre = (meses: BonificacaoMensal[]) => {
    return meses.slice(6, 12).reduce((total, mes) => total + mes.valor, 0);
  };
  
  // Função para atualizar os totais
  const atualizarTotais = (ano: number, meses: BonificacaoMensal[]) => {
    setBonificacaoDataMap(prev => ({
      ...prev,
      [ano]: {
        ...prev[ano],
        meses,
        totalPrimeiroSemestre: calcularTotalPrimeiroSemestre(meses),
        totalSegundoSemestre: calcularTotalSegundoSemestre(meses)
      }
    }));
  };
  
  // Formatação de valores monetários
  const formatarValorMonetario = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Função para converter valores monetários
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
  
  // Função para calcular automaticamente os valores de bonificação
  const calcularBonificacoes = async (anosParaCalcular?: number[]) => {
    try {
      setIsCalculating(true);
      
      // Se não foi especificado anos para calcular, usar apenas o ano atual
      const anos = anosParaCalcular || [anoAtual];
      
      toast.info(`Calculando valores de bonificação para ${anos.length > 1 ? 'todos os anos' : 'o ano ' + anos[0]}...`);
      
      // Para cada ano que queremos calcular
      for (const ano of anos) {
        // Obter todos os meses do ano atual
        const mesesCalculados = [];
        
        for (let mesNumero = 1; mesNumero <= 12; mesNumero++) {
          const mesNome = NUMERO_PARA_MESES[mesNumero];
          
          // Definir o primeiro e último dia do mês
          const primeiroDia = new Date(ano, mesNumero - 1, 1);
          const ultimoDia = new Date(ano, mesNumero, 0);
          
          // Formatar as datas para YYYY-MM-DD
          const dataInicio = primeiroDia.toISOString().split('T')[0];
          const dataFim = ultimoDia.toISOString().split('T')[0];
          
          console.log(`Calculando bonificação para ${mesNome} ${ano} (${dataInicio} a ${dataFim})`);
          
          // Buscar propostas aprovadas para o período
          const { data: propostas, error: propostasError } = await supabase
            .from("propostas")
            .select("*")
            .eq('status', 'aprovado')
            .not('data_inicio', 'is', null)
            .gte('data_inicio', dataInicio)
            .lte('data_inicio', dataFim);
            
          if (propostasError) {
            console.error(`Erro ao buscar propostas para ${mesNome}:`, propostasError);
            continue;
          }
          
          // Buscar perdas para o período
          const { data: perdas, error: perdasError } = await supabase
            .from("propostas_saida")
            .select("*")
            .gte('data', dataInicio)
            .lte('data', dataFim);
            
          if (perdasError) {
            console.error(`Erro ao buscar perdas para ${mesNome}:`, perdasError);
            continue;
          }
          
          // Calcular total de honorários
          const totalHonorarios = propostas?.reduce((total, proposta) => {
            return total + parseMonetaryValue(proposta.honorario);
          }, 0) || 0;
          
          // Calcular total de perdas
          const totalPerdas = perdas?.reduce((total, perda) => {
            return total + parseMonetaryValue(perda.perda_valor || 0);
          }, 0) || 0;
          
          // Calcular resultado: Total Honorários - Total Perdas
          const resultado = totalHonorarios - totalPerdas;
          
          // Calcular bonificação: Resultado * 0.4 (40%)
          const bonificacao = resultado * 0.4;
          
          console.log(`${mesNome} ${ano}: Honorários: ${totalHonorarios}, Perdas: ${totalPerdas}, Resultado: ${resultado}, Bonificação: ${bonificacao}`);
          
          // Adicionar observação para os meses que marcam o final de semestre
          let observacao = undefined;
          if (mesNumero === 1) observacao = "TOTAL 1º SEMESTRE";
          if (mesNumero === 7) observacao = "TOTAL 2º SEMESTRE";
          
          // Adicionar ao array de meses calculados
          mesesCalculados.push({
            mes: mesNome,
            valor: bonificacao,
            observacao,
            calculado: true
          });
        }
        
        // Atualizar os dados de bonificação com os valores calculados
        atualizarTotais(ano, mesesCalculados);
      }
      
      toast.success("Valores de bonificação calculados com sucesso!");
    } catch (error) {
      console.error("Erro ao calcular bonificações:", error);
      toast.error("Erro ao calcular bonificações");
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Efeito para calcular os valores automaticamente quando o ano muda
  useEffect(() => {
    calcularBonificacoes([anoAtual]);
  }, [anoAtual]);
  
  // Calcular o total anual
  const totalAnual = bonificacaoData.totalPrimeiroSemestre + bonificacaoData.totalSegundoSemestre;

  return (
    <div className="space-y-6 pb-16">
      {/* Cabeçalho da página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Bonificações</h1>
          <p className="text-muted-foreground">
            Gerencie as bonificações dos funcionários por ano
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="ano" className="text-sm font-medium whitespace-nowrap">
            Filtrar por ano:
          </Label>
          <Input
            id="ano"
            type="number"
            value={anoAtual}
            onChange={handleAnoChange}
            onBlur={(e) => {
              // Garantir que ao sair do campo, o valor seja válido
              if (!e.target.value || parseInt(e.target.value) < 2023 || parseInt(e.target.value) > 2030) {
                e.target.value = anoAtual.toString();
                toast.error("Por favor, insira um ano entre 2023 e 2030");
              }
            }}
            min="2023"
            max="2030"
            className="w-[100px] text-center font-medium border-primary/20 focus:border-primary"
            placeholder="Ano"
          />
        </div>
      </div>
      
      {/* Indicador de carregamento */}
      {isCalculating && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
          <p className="text-amber-600 dark:text-amber-400">
            Calculando valores de bonificação... Por favor, aguarde.
          </p>
        </div>
      )}
      
      {/* Cards de estatísticas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total 1º Semestre" 
          value={`R$ ${formatarValorMonetario(bonificacaoData.totalPrimeiroSemestre)}`} 
          description="Janeiro a Junho" 
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} 
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
        />
        <StatCard 
          title="Total 2º Semestre" 
          value={`R$ ${formatarValorMonetario(bonificacaoData.totalSegundoSemestre)}`} 
          description="Julho a Dezembro" 
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
        />
        <StatCard 
          title="Total Anual" 
          value={`R$ ${formatarValorMonetario(totalAnual)}`} 
          description="Soma de todos os meses" 
          icon={<CircleDollarSign className="h-4 w-4 text-purple-500" />} 
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30"
        />
      </div>
      
      {/* Card informativo */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Informativo sobre Bonificações</AlertTitle>
        <AlertDescription>
          Esta tabela mostra as bonificações mensais dos funcionários para o ano {anoAtual}.
          Os valores são calculados automaticamente com base na fórmula: (Total Honorários - Total Perdas) × 0,4.
          Ao selecionar um ano diferente no filtro, os valores são recalculados automaticamente.
        </AlertDescription>
      </Alert>
      
      {/* Tabela de Bonificações */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#A61B67] to-[#D90B91] text-white p-4">
          <div className="text-center">
            <CardTitle className="text-xl font-bold">Ano {bonificacaoData.ano}</CardTitle>
            <CardDescription className="text-white/90">
              BONIFICAÇÕES FUNCIONÁRIOS
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border p-2 text-center w-1/2">Mês</th>
                  <th className="border border-border p-2 text-center w-1/2">40% DO VALOR</th>
                </tr>
              </thead>
              <tbody>
                {bonificacaoData.meses.map((mes, index) => (
                  <tr key={mes.mes} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                    <td className="border border-border p-2 font-medium">{mes.mes}</td>
                    <td className="border border-border p-2 text-right">
                      <span className="font-mono">R$ {formatarValorMonetario(mes.valor)}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="border border-border p-2 font-bold text-right">
                    TOTAL ANUAL:
                  </td>
                  <td className="border border-border p-2 font-bold text-purple-600 dark:text-purple-400 text-right">
                    R$ {formatarValorMonetario(totalAnual)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

