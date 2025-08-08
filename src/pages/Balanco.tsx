import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Scale, TrendingUp, TrendingDown, Edit2, Check, X, DollarSign, Wallet, Plus, Trash2, ArrowUpRight, Briefcase, Building, BarChart3
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


// Dados de exemplo para os gráficos
const balanceData = [
  { month: 'Jan', receitas: 125000, despesas: 85000 },
  { month: 'Fev', receitas: 132000, despesas: 92000 },
  { month: 'Mar', receitas: 141000, despesas: 88000 },
  { month: 'Abr', receitas: 138000, despesas: 95000 },
  { month: 'Mai', receitas: 155000, despesas: 102000 },
  { month: 'Jun', receitas: 165000, despesas: 110000 },
];

// Definir tipos para as categorias disponíveis
type CategoryType = 'RECEITA' | 'ENCERRAMENTO' | 'RESERVA';

// Definir interface para os itens financeiros
interface FinancialItem {
  id: number;
  type: 'header' | 'item' | 'footer' | 'spacer';
  description?: string;
  value: number;
  editable: boolean;
  bold?: boolean;
  bgColor?: string;
  textColor?: string;
  percentage?: string;
  category?: CategoryType;
}

// Interface para o histórico do balanço
interface HistoricoBalanco {
  id: string;
  data: string;
  financialData: FinancialItem[];
  receitaTotal: number;
  despesasTotal: number;
  reservasTotal: number;
  lucro: number;
}

// Dados iniciais para a tabela de demonstrativo financeiro
const financialDataInitial: FinancialItem[] = [
  { id: 1, type: 'header', description: 'RECEITA', value: 130300, editable: true, bold: true, bgColor: 'bg-[#0f2933]', textColor: 'text-white', category: 'RECEITA' },
  { id: 2, type: 'item', description: 'EXTRAS', value: 14000.00, editable: true, category: 'RECEITA' },
  { id: 3, type: 'item', description: 'PERDAS', value: -1300.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 4, type: 'spacer', value: 0, editable: false },
  { id: 5, type: 'item', description: 'ENCERRAMENTO', value: -2036.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 6, type: 'item', description: 'Funcionários', value: -1000.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 7, type: 'item', description: 'Pró-labore', value: -1300.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 8, type: 'item', description: 'Marketing', value: -300.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 9, type: 'item', description: 'Tarifa Bancária', value: -200.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 10, type: 'item', description: 'Centro de Custo Fixo', value: -500.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 11, type: 'item', description: 'Centro de Custo Variável', value: -400.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 12, type: 'item', description: 'Centro de Custo Certificado Digital', value: -100.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 13, type: 'item', description: 'Recrutamento e Seleção', value: -0.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 14, type: 'item', description: 'OUTROS', value: -50.00, editable: true, category: 'ENCERRAMENTO' },
  { id: 15, type: 'spacer', value: 0, editable: false },
  { id: 16, type: 'header', description: 'RESERVA PARA ENCONTRO', value: -500.00, editable: true, bold: true, category: 'RESERVA' },
  { id: 17, type: 'item', description: 'RESERVA PARA EVENTOS', value: -1000.00, editable: true, category: 'RESERVA' },
  { id: 18, type: 'item', description: 'RESERVA PARA CONFRATERNIZ', value: -1300.00, editable: true, category: 'RESERVA' },
  { id: 19, type: 'item', description: 'RESERVA PARA BRINDES', value: -300.00, editable: true, category: 'RESERVA' },
  { id: 20, type: 'item', description: 'RESERVA GERAL', value: -0.00, editable: true, category: 'RESERVA' },
  { id: 21, type: 'item', description: 'RESERVA 13º', value: -3900.00, editable: true, category: 'RESERVA' },
  { id: 22, type: 'item', description: 'RESERVA FÉRIAS', value: -2600.00, editable: true, category: 'RESERVA' },
  { id: 23, type: 'spacer', value: 0, editable: false },
  { id: 24, type: 'footer', description: 'LUCRO', value: 14331.25, percentage: '9.42%', editable: false, bold: true, bgColor: 'bg-[#435e19]', textColor: 'text-white' },
];

// Chave apenas para histórico (mantido para compatibilidade)
const HISTORICO_STORAGE_KEY = 'balanco-historico-data';

export default function Balanco() {
  console.log('🔄 Componente Balanco iniciando...');

  // Função para carregar dados do localStorage
  // REMOVIDO: Funções de localStorage - usando apenas Supabase como fonte única

  const [financialData, setFinancialData] = useState<FinancialItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  console.log('📊 Estado atual:', { 
    isInitialLoading, 
    financialDataLength: financialData.length,
    hasData: financialData.length > 0 
  });
  const [editingCell, setEditingCell] = useState<{id: number, value: number} | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newItem, setNewItem] = useState<{
    description: string;
    value: string;
    category: CategoryType;
  }>({
    description: '',
    value: '0',
    category: 'ENCERRAMENTO'
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [adminPasswordDialogOpen, setAdminPasswordDialogOpen] = useState(false);
  const [pendingEditCell, setPendingEditCell] = useState<{id: number, value: number} | null>(null);
  const [editingDescription, setEditingDescription] = useState<{ id: number; description: string } | null>(null);
  const [pendingEditDescription, setPendingEditDescription] = useState<{ id: number; description: string } | null>(null);
  
  const [historicoBalanco, setHistoricoBalanco] = useState<HistoricoBalanco[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORICO_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do localStorage:', error);
    }
    return [];
  });
  
  // Estados para o modal de edição/exclusão de histórico
  const [historicoSelecionado, setHistoricoSelecionado] = useState<HistoricoBalanco | null>(null);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  
  // Função para salvar o histórico
  const salvarHistorico = () => {
    // Calcular os totais atuais
    const receitaTotalAtual = calculateReceitaTotal();
    const despesasTotalAtual = calcularDespesasTotal();
    const reservasTotalAtual = calcularReservasTotal();
    const lucroCalculado = calculateLucro();
    
    // Criar novo registro de histórico
    const novoHistorico: HistoricoBalanco = {
      id: new Date().getTime().toString(),
      data: new Date().toISOString().split('T')[0],
      financialData: [...financialData],
      receitaTotal: receitaTotalAtual,
      despesasTotal: despesasTotalAtual,
      reservasTotal: reservasTotalAtual,
      lucro: lucroCalculado.value
    };
    
    // Atualizar o estado com o novo histórico
    const historicoAtualizado = [...historicoBalanco, novoHistorico];
    setHistoricoBalanco(historicoAtualizado);
    
    // Salvar no localStorage
    localStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(historicoAtualizado));
    
    toast({
      title: "Histórico salvo",
      description: "O histórico foi salvo com sucesso."
    });
  };
  
  // Salvar no localStorage sempre que os dados mudarem (exceto durante carregamento inicial)
  // REMOVIDO: Salvamento automático no localStorage - usando apenas Supabase

  // Garantir que todos os valores de despesas e reservas sejam negativos (apenas para dados iniciais padrão)
  useEffect(() => {
    // Só executar se não estamos carregando e se temos dados padrão
    if (!isInitialLoading && financialData.length > 0) {
      // Verificar se são dados que precisam de ajuste (dados iniciais sem ajuste)
      const needsAdjustment = financialData.some(item => 
        (item.category === 'ENCERRAMENTO' || item.category === 'RESERVA') && 
        item.type !== 'spacer' && 
        !['RECEITA', 'EXTRAS'].includes(item.description || '') &&
        item.value > 0
      );

      if (needsAdjustment) {
        console.log('🔧 Ajustando valores para negativos (dados iniciais)');
    setFinancialData(prev => {
      return prev.map(item => {
            // Se for um item de despesa (ENCERRAMENTO) ou reserva (RESERVA), garantir que seja negativo
            if ((item.category === 'ENCERRAMENTO' || item.category === 'RESERVA') && 
                item.type !== 'spacer' && 
                !['RECEITA', 'EXTRAS'].includes(item.description || '')) {
              // Garantir que o valor seja negativo apenas se for positivo
              if (item.value > 0) {
                const value = -Math.abs(item.value);
          return { ...item, value };
              }
        }
        return item;
      });
    });
      }
    }
  }, [isInitialLoading, financialData.length]); // Executar quando carregamento inicial terminar
  
  // Foco automático no input quando está editando
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // Calcular o total da receita (somente o valor de RECEITA)
  const calculateReceitaTotal = () => {
    // RECEITA já tem as perdas subtraídas diretamente
    const receitaItem = financialData.find(item => item.description === 'RECEITA');
    return receitaItem ? receitaItem.value : 0;
  };

  // Calcular totais para as métricas principais (usando valores reais, não Math.abs)
  const calcularDespesasTotal = () => {
    // Incluir tanto itens quanto headers da categoria ENCERRAMENTO
    const itensEncerramento = financialData.filter(item => 
      item.category === 'ENCERRAMENTO' && (item.type === 'item' || item.type === 'header')
    );
    const total = itensEncerramento.reduce((acc, cur) => acc + cur.value, 0);
    return total;
  };

  const calcularReservasTotal = () => {
    // Incluir tanto itens quanto headers da categoria RESERVA
    return financialData
      .filter(item => item.category === 'RESERVA' && (item.type === 'item' || item.type === 'header'))
      .reduce((acc, cur) => acc + cur.value, 0);
  };

  // Calcular a receita bruta (RECEITA já inclui EXTRAS)
  const calculateReceitaBruta = () => {
    const receita = financialData.find(item => item.description === 'RECEITA')?.value || 0;
    
    // Agora retornamos apenas o valor de RECEITA, pois ele já inclui EXTRAS
    return receita;
  };

  // Calcular o Lucro e a Margem de Lucro (subtrai todos os itens abaixo de EXTRAS pelo valor absoluto)
  const calculateLucro = () => {
    // Encontrar o índice do item EXTRAS
    const extrasIndex = financialData.findIndex(item => item.description === 'EXTRAS');
    
    // Somar os valores absolutos de todos os itens abaixo de EXTRAS (exceto spacers e o próprio Lucro)
    // Agora incluindo PERDAS como despesa
    const totalDespesas = financialData
      .slice(extrasIndex + 1)
      .filter(item => 
        item.type !== 'spacer' && 
        item.description !== 'LUCRO'
      )
      .reduce((acc, cur) => acc + Math.abs(cur.value || 0), 0);

    const receitaBruta = calculateReceitaBruta();
    // Garantir que o lucro seja sempre um valor positivo para exibição
    const lucro = receitaBruta - totalDespesas;
    const percentage = receitaBruta !== 0 ? (lucro / receitaBruta) * 100 : 0;

    return {
      value: lucro, // Mantemos o valor original (pode ser negativo) para cálculos
      percentage: `${percentage.toFixed(2)}%`
    };
  };

  // Atualizar o LUCRO sempre que os dados mudam
  useEffect(() => {
    const lucro = calculateLucro();
    setFinancialData(prev => {
      return prev.map(item => 
        item.description === 'LUCRO'
          ? { ...item, value: lucro.value, percentage: lucro.percentage } 
          : item
      );
    });
    // Usando uma versão estável da dependência para evitar loop infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(financialData.filter(item => item.description !== 'LUCRO'))]);

  // Função para iniciar a edição de uma célula
  const startEditing = (id: number, value: number) => {
    // Se for a célula de RECEITA (id === 1), abrir diálogo de senha
    if (id === 1) {
      setPendingEditCell({ id, value });
      setAdminPasswordDialogOpen(true);
      return;
    }
    
    setEditingCell({ id, value });
  };

  // Função para iniciar a edição de uma descrição
  const startEditingDescription = (id: number, description: string) => {
    // Verificar se é um item editável
    const item = financialData.find(item => item.id === id);
    if (!item || !item.editable) return;

    // Abrir diálogo de senha para qualquer edição de descrição
    setPendingEditDescription({ id, description });
    setAdminPasswordDialogOpen(true);
  };

  // Função para confirmar edição após senha do admin
  const handleAdminConfirm = () => {
    if (pendingEditCell) {
      setEditingCell(pendingEditCell);
      setPendingEditCell(null);
    }
    if (pendingEditDescription) {
      setEditingDescription(pendingEditDescription);
      setPendingEditDescription(null);
    }
  };

  // Função para salvar o valor editado
  const saveEdit = async () => {
    if (editingCell) {
      // PRIMEIRO: Marcar como editado manualmente ANTES de atualizar dados
      const editedItem = financialData.find(item => item.id === editingCell.id);
      if (editedItem && editedItem.description) {
        console.log(`📝 Marcando "${editedItem.description}" como editado manualmente`);
        
        // Marcar no Supabase como editado manualmente
        await markAsManuallyEdited(editedItem.description);
      }

      setFinancialData(prev => {
        const newData = [...prev];
        
        // Encontrar o item sendo editado para verificar se precisa ser negativo
        const itemBeingEdited = newData.find(item => item.id === editingCell.id);
        let valueToSave = editingCell.value;
        
        // Se for um item de despesa (ENCERRAMENTO) ou reserva (RESERVA), garantir que seja negativo
        if (itemBeingEdited && 
            (itemBeingEdited.category === 'ENCERRAMENTO' || itemBeingEdited.category === 'RESERVA') && 
            !['RECEITA', 'EXTRAS'].includes(itemBeingEdited.description || '')) {
          valueToSave = -Math.abs(editingCell.value); // Sempre negativo para despesas e reservas
        }
        
        // Atualizar o item que está sendo editado
        const updatedData = newData.map(item =>
          item.id === editingCell.id
            ? { ...item, value: valueToSave }
            : item
        );
        
        // Se o item editado for EXTRAS, atualizar também a RECEITA
        if (newData.find(item => item.id === editingCell.id)?.description === 'EXTRAS') {
          const receitaItem = updatedData.find(item => item.description === 'RECEITA');
          const extrasValue = editingCell.value;
          
          if (receitaItem) {
            // Buscar o valor atual da RECEITA (sem o valor anterior de EXTRAS)
            const currentExtrasValue = newData.find(item => item.description === 'EXTRAS')?.value || 0;
            const receitaBaseValue = receitaItem.value - currentExtrasValue;
            
            // Atualizar RECEITA com o novo valor de EXTRAS
            const receitaIndex = updatedData.findIndex(item => item.description === 'RECEITA');
            if (receitaIndex !== -1) {
              updatedData[receitaIndex] = {
                ...updatedData[receitaIndex],
                value: receitaBaseValue + extrasValue
              };
              console.log(`Atualizando RECEITA após edição de EXTRAS: ${receitaBaseValue} + ${extrasValue} = ${receitaBaseValue + extrasValue}`);
            }
          }
        }
        
        // Sincronizar diretamente com Supabase (principal fonte de dados)
        setTimeout(() => {
          debouncedSyncToSupabase(updatedData);
        }, 200);
        
        return updatedData;
      });
      
      setEditingCell(null);
      toast({
        title: "Valor atualizado",
        description: "O valor foi atualizado com sucesso."
      });
    }
  };

  // Função para salvar a descrição editada
  const saveDescription = () => {
    if (editingDescription) {
      setFinancialData(prev => {
        const updatedData = prev.map(item => 
          item.id === editingDescription.id 
            ? { ...item, description: editingDescription.description } 
            : item
        );
        
        // Sincronizar diretamente com Supabase (principal fonte de dados)
        setTimeout(() => {
          debouncedSyncToSupabase(updatedData);
        }, 200);
        
        return updatedData;
      });
      setEditingDescription(null);
      toast({
        title: "Descrição atualizada",
        description: "A descrição foi atualizada com sucesso."
      });
    }
  };

  // Função para cancelar a edição
  const cancelEdit = () => {
    setEditingCell(null);
  };

  // Função para cancelar a edição da descrição
  const cancelEditDescription = () => {
    setEditingDescription(null);
  };

  // Função para adicionar novo item
  const addNewItem = () => {
    // Validar entrada
    if (!newItem.description.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive"
      });
      return;
    }

    // Encontrar o último ID
    const maxId = Math.max(...financialData.map(item => item.id));

    // Encontrar onde inserir o novo item
    let insertIndex = -1;
    switch(newItem.category) {
      case 'RECEITA':
        insertIndex = financialData.findIndex(item => item.id === 4);
        break;
      case 'ENCERRAMENTO':
        insertIndex = financialData.findIndex(item => item.id === 15);
        break;
      case 'RESERVA':
        insertIndex = financialData.findIndex(item => item.id === 23);
        break;
    }

    if (insertIndex === -1) return;

    // Criar novo item
    const newFinancialItem: FinancialItem = {
      id: maxId + 1,
      type: 'item',
      description: newItem.description,
      value: parseFloat(newItem.value),
      editable: true,
      category: newItem.category
    };

    // Adicionar o novo item
    const updatedData = [
      ...financialData.slice(0, insertIndex),
      newFinancialItem,
      ...financialData.slice(insertIndex)
    ];

    // Atualizar os IDs para manter a sequência
    const reindexedData = updatedData.map((item, index) => ({
      ...item,
      id: index + 1
    }));

    setFinancialData(reindexedData);
    setOpenAddDialog(false);

    // Resetar formulário
    setNewItem({
      description: '',
      value: '0',
      category: 'ENCERRAMENTO'
    });

    toast({
      title: "Item adicionado",
      description: "Item adicionado com sucesso ao demonstrativo"
    });
  };

  // Função para remover um item - agora permite remover itens originais também
  const removeItem = (idToRemove: number) => {
    // Verificar se é um item que não pode ser removido (headers, spacers, footer)
    const itemToRemove = financialData.find(item => item.id === idToRemove);
    
    if (!itemToRemove) return;

    // Não permitir remover headers, spacers ou footer
    if (itemToRemove.type === 'header' || itemToRemove.type === 'spacer' || itemToRemove.type === 'footer') {
      toast({
        title: "Operação não permitida",
        description: "Não é possível remover cabeçalhos, espaçadores ou totais",
        variant: "destructive"
      });
      return;
    }

    setFinancialData(prev => {
      const filtered = prev.filter(item => item.id !== idToRemove);
      
      // Re-indexar os IDs
      return filtered.map((item, index) => ({
        ...item,
        id: index + 1
      }));
    });

    toast({
      title: "Item removido",
      description: "Item removido com sucesso do demonstrativo"
    });
  };

  // Funções para manipulação do histórico
  const abrirHistoricoSelecionado = (historico: HistoricoBalanco) => {
    setHistoricoSelecionado(historico);
    setModalHistoricoAberto(true);
  };

  const fecharModalHistorico = () => {
    setHistoricoSelecionado(null);
    setModalHistoricoAberto(false);
  };

  const excluirHistorico = (id: string) => {
    const historicoAtualizado = historicoBalanco.filter(item => item.id !== id);
    setHistoricoBalanco(historicoAtualizado);
    localStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(historicoAtualizado));
    fecharModalHistorico();
    
    toast({
      title: "Histórico excluído",
      description: "O histórico foi excluído com sucesso."
    });
  };

  const carregarHistoricoSelecionado = () => {
    if (!historicoSelecionado) return;
    
    // Carregar os dados do histórico selecionado na tabela principal
    setFinancialData(historicoSelecionado.financialData);
    fecharModalHistorico();
    
    toast({
      title: "Histórico carregado",
      description: "Os dados do histórico foram carregados com sucesso."
    });
  };

  // Calcular o lucro para exibição nos cards
  const lucro = useMemo(() => {
    const lucroObj = calculateLucro();
    return lucroObj.value;
  }, [financialData]);

  // Calcular a receita total para exibição nos cards
  const receitaTotal = useMemo(() => {
    return calculateReceitaTotal();
  }, [financialData]);

  // Calcular despesas total para exibição nos cards
  const despesasTotal = useMemo(() => {
    return Math.abs(calcularDespesasTotal());
  }, [financialData]);

  // Calcular reservas total para exibição nos cards
  const reservasTotal = useMemo(() => {
    return Math.abs(calcularReservasTotal());
  }, [financialData]);

  // Função para verificar se item foi editado manualmente (usando campo no Supabase)
  const isItemManuallyEdited = (item: FinancialItem): boolean => {
    return item.textColor === 'MANUALLY_EDITED';
  };

  // Função para marcar item como editado manualmente no Supabase
  const markAsManuallyEdited = async (itemDescription: string) => {
    try {
      console.log(`📝 Marcando "${itemDescription}" como editado manualmente no Supabase`);
      
      // Verificar estado atual antes da atualização
      const { data: currentData, error: selectError } = await supabase
        .from('demonstrativo_financeiro')
        .select('description, text_color, value')
        .eq('description', itemDescription)
        .single();
      
      if (selectError) {
        console.error('❌ Erro ao buscar item atual:', selectError);
      } else {
        console.log(`🔍 Estado atual de "${itemDescription}":`, currentData);
      }
      
      // Atualizar o item para marcar como editado manualmente
      const { error } = await supabase
        .from('demonstrativo_financeiro')
        .update({ 
          text_color: 'MANUALLY_EDITED',
          updated_at: new Date().toISOString()
        })
        .eq('description', itemDescription);
        
      if (error) throw error;
      
      console.log(`✅ "${itemDescription}" marcado como editado manualmente no Supabase`);
      
      // Verificar se a atualização foi aplicada
      const { data: updatedData, error: verifyError } = await supabase
        .from('demonstrativo_financeiro')
        .select('description, text_color, value')
        .eq('description', itemDescription)
        .single();
      
      if (!verifyError && updatedData) {
        console.log(`🔍 Estado após atualização de "${itemDescription}":`, updatedData);
      }
    } catch (error) {
      console.error('❌ Erro ao marcar edição manual no Supabase:', error);
    }
  };

  // Estado para rastrear itens editados manualmente (baseado nos dados do Supabase)
  const [manuallyEditedItems, setManuallyEditedItems] = useState<Set<string>>(new Set());
  
  // Atualizar lista de itens editados manualmente baseado nos dados carregados
  useEffect(() => {
    const editedItems = new Set<string>();
    console.log('🔍 Verificando itens editados manualmente nos dados:', financialData.length, 'itens');
    
    financialData.forEach(item => {
      console.log(`🔍 Item "${item.description}": textColor="${item.textColor}", isManuallyEdited=${isItemManuallyEdited(item)}`);
      if (isItemManuallyEdited(item) && item.description) {
        editedItems.add(item.description);
        console.log(`✅ Adicionando "${item.description}" como editado manualmente`);
      }
    });
    setManuallyEditedItems(editedItems);
    console.log('🔄 Itens editados manualmente atualizados:', Array.from(editedItems));
  }, [financialData]);

  // Estado para controlar se deve sincronizar com outros usuários
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Estado para indicar se uma atualização é externa (vem do Supabase)
  const [isExternalUpdate, setIsExternalUpdate] = useState(false);
  
  // Ref para controlar debounce da sincronização
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset da flag de atualização externa
  useEffect(() => {
    if (isExternalUpdate) {
      const timer = setTimeout(() => {
        setIsExternalUpdate(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExternalUpdate]);

  // Função para sincronização com debounce
  const debouncedSyncToSupabase = (data: FinancialItem[]) => {
    // Não sincronizar se for uma atualização externa
    if (isExternalUpdate) {
      console.log('⏸️ Pulando sincronização - atualização externa em andamento');
      return;
    }
    
    // Limpar timeout anterior se existir
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Criar novo timeout
    syncTimeoutRef.current = setTimeout(() => {
      // Verificar novamente antes de sincronizar
      if (!isExternalUpdate && !isSyncing) {
        syncToSupabase(data);
      }
    }, 500); // Aguarda 500ms sem mudanças antes de sincronizar
  };

  // Função para inicializar dados padrão no Supabase
  const initializeSupabaseData = async (): Promise<void> => {
    try {
      console.log('🚀 Inicializando dados padrão no Supabase...');
      await syncToSupabase(financialDataInitial);
      
      toast({
        title: "Dados inicializados",
        description: "Dados padrão foram criados no servidor.",
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar dados no Supabase:', error);
      throw error;
    }
  };

  // Função para salvar dados no Supabase para sincronização
  const syncToSupabase = async (data: FinancialItem[]) => {
    if (isSyncing) return; // Evitar loop infinito
    
    try {
      setIsSyncing(true);
      console.log('🔄 Iniciando sincronização com Supabase...');
      
      // Mapear dados para o formato da tabela demonstrativo_financeiro
      const supabaseData = await Promise.all(data.map(async (item) => {
        // Para itens editados manualmente, preservar o text_color do banco de dados
        let textColorToSave = item.textColor || null;
        
        if (item.textColor === 'MANUALLY_EDITED') {
          // Se já está marcado como editado manualmente, manter
          textColorToSave = 'MANUALLY_EDITED';
        } else {
          // Verificar se existe uma marcação manual no banco
          try {
            const { data: existingItem, error } = await supabase
              .from('demonstrativo_financeiro')
              .select('text_color')
              .eq('item_id', item.id)
              .single();
            
            if (!error && existingItem?.text_color === 'MANUALLY_EDITED') {
              console.log(`🔒 Preservando marcação manual para "${item.description}"`);
              textColorToSave = 'MANUALLY_EDITED';
            }
          } catch (e) {
            // Ignorar erros, usar o valor original
          }
        }
        
        return {
          item_id: item.id,
          type: item.type,
          description: item.description || null,
          value: item.value,
          editable: item.editable,
          bold: item.bold || false,
          bg_color: item.bgColor || null,
          text_color: textColorToSave,
          percentage: item.percentage || null,
          category: item.category || null
        };
      }));

      // Usar upsert para inserir ou atualizar registros baseado no item_id
      const { error } = await supabase
        .from('demonstrativo_financeiro')
        .upsert(supabaseData, { 
          onConflict: 'item_id',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      console.log('✅ Dados sincronizados com Supabase com sucesso');
    } catch (error) {
      console.error('❌ Erro ao sincronizar com Supabase:', error);
      toast({
        title: "Erro de sincronização",
        description: "Não foi possível sincronizar os dados com o servidor.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Função para carregar dados do Supabase
  const loadFromSupabase = async (): Promise<FinancialItem[] | null> => {
    try {
      console.log('📥 Carregando dados do Supabase...');
      
      const { data, error } = await supabase
        .from('demonstrativo_financeiro')
        .select('*')
        .order('item_id', { ascending: true });

      if (error) {
        console.error('❌ Erro no Supabase:', error);
        throw error;
      }

      console.log('📊 Resposta do Supabase:', data?.length || 0, 'registros encontrados');

      if (!data || data.length === 0) {
        console.log('ℹ️ Tabela demonstrativo_financeiro está vazia');
        return null;
      }

      // Mapear dados do Supabase para o formato React
      const financialItems: FinancialItem[] = data.map(item => ({
        id: item.item_id,
        type: item.type as 'header' | 'item' | 'footer' | 'spacer',
        description: item.description,
        value: Number(item.value),
        editable: item.editable,
        bold: item.bold,
        bgColor: item.bg_color,
        textColor: item.text_color,
        percentage: item.percentage,
        category: item.category as CategoryType
      }));

      console.log('✅ Dados mapeados com sucesso:', financialItems.length, 'itens');
      console.log('📋 Primeiros itens:', financialItems.slice(0, 3).map(i => `${i.id}: ${i.description}`));
      
      // Debug: Verificar itens editados manualmente carregados do Supabase
      const manuallyEditedFromDb = financialItems.filter(item => item.textColor === 'MANUALLY_EDITED');
      console.log('🔍 Itens marcados como editados manualmente no Supabase:', manuallyEditedFromDb.map(i => `${i.description}: ${i.textColor}`));
      
      return financialItems;
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Supabase:', error);
      return null;
    }
  };

  // Função para buscar o total de todos os centros de custo
  const fetchTotalCentrosCusto = async () => {
    try {
      // Lista de todos os centros de custo específicos que queremos buscar
      const centrosCustoEspecificos = [
        'Funcionários',
        'Pró-Labore',
        'Marketing',
        'Tarifa Bancária',
        'Centro de Custo Fixo',
        'Centro de Custo Variável',
        'Centro de Custo Certificado Digital',
        'Recrutamento e Seleção'
      ];

      // Busca TODOS os registros da tabela de custos
      const { data, error } = await supabase
        .from('custos')
        .select('valor_categoria, centro_custo');

      if (error) {
        throw error;
      }

      // Calcula os totais para cada centro de custo específico
      const totais = {};
      centrosCustoEspecificos.forEach(centro => {
        totais[centro] = data
          .filter(item => item.centro_custo === centro)
          .reduce((sum, item) => sum + Math.abs(Number(item.valor_categoria) || 0), 0);
      });

      // Calcula o total para "Outros" (todos os custos que não estão nos centros específicos)
      const totalOutros = data
        .filter(item => !centrosCustoEspecificos.includes(item.centro_custo) || item.centro_custo === null || item.centro_custo === '')
        .reduce((sum, item) => sum + Math.abs(Number(item.valor_categoria) || 0), 0);

      totais["Outros"] = totalOutros;

      console.log('Totais calculados:', totais);
      console.log('Valor OUTROS:', totalOutros);
      console.log('Itens editados manualmente:', manuallyEditedItems);

      // Atualiza os valores na tabela de balanço (como valores negativos)
      setFinancialData(prev => {
        const updated = prev.map(item => {
          // SEMPRE atualizar o campo OUTROS (não é editável manualmente)
          if (item.description === 'OUTROS') {
            console.log('Atualizando campo OUTROS com valor:', -totalOutros);
            return { ...item, value: -totalOutros };
          }
          
          // VERIFICAR se o item foi editado manualmente - se sim, NÃO sobrescrever
          const isManualEdit = isItemManuallyEdited(item);
          
          if (isManualEdit) {
            console.log(`🔒 Preservando valor manual de "${item.description}": ${item.value} (editado manualmente)`);
            return item; // Manter valor atual sem alterar
          }
          
          // Mapeamento entre as descrições na tabela de balanço e os centros de custo
          const descriptionToCentroCusto = {
            'Funcionários': 'Funcionários',
            'Pró-labore': 'Pró-Labore', // Tabela usa 'Pró-labore', Supabase usa 'Pró-Labore'
            'Marketing': 'Marketing',
            'Tarifa Bancária': 'Tarifa Bancária',
            'Centro de Custo Fixo': 'Centro de Custo Fixo',
            'Centro de Custo Variável': 'Centro de Custo Variável',
            'Centro de Custo Certificado Digital': 'Centro de Custo Certificado Digital',
            'Recrutamento e Seleção': 'Recrutamento e Seleção'
          };

          const centroCusto = descriptionToCentroCusto[item.description];
          if (centroCusto && totais[centroCusto] !== undefined) {
            console.log(`Atualizando "${item.description}" com valor do Supabase: -${totais[centroCusto]}`);
            return { ...item, value: -totais[centroCusto] };
          }
          return item;
        });
        
        // Verificar se houve mudanças reais antes de salvar
        const hasChanges = JSON.stringify(prev) !== JSON.stringify(updated);
        
        if (hasChanges) {
          console.log('💾 Sincronizando mudanças dos custos com Supabase');
          
          // Sincronizar com Supabase apenas se houve mudanças significativas
          setTimeout(() => {
            debouncedSyncToSupabase(updated);
          }, 1000); // Aguarda 1 segundo para evitar conflito
        } else {
          console.log('⏸️ Nenhuma mudança nos custos detectada');
        }
        
        return updated;
      });

    } catch (error) {
      console.error('Erro ao buscar totais:', error);
      toast({
        title: "Erro ao atualizar valores",
        description: "Não foi possível buscar os valores totais dos centros de custo.",
        variant: "destructive"
      });
    }
  };

  // Chama a função quando o componente é montado e também quando os dados são carregados do localStorage
  useEffect(() => {
    // Só buscar dados dos custos após carregamento inicial completo
    if (!isInitialLoading) {
      console.log('⏰ Buscando dados de custos após carregamento inicial...');
    fetchTotalCentrosCusto();
    
    // Configurar um intervalo para buscar novamente periodicamente, garantindo que os dados estejam atualizados
    const intervalId = setInterval(() => {
        console.log('🔄 Buscando dados atualizados de custos...');
      fetchTotalCentrosCusto();
      }, 120000); // Buscar a cada 2 minutos (menos agressivo)
    
    return () => clearInterval(intervalId);
    }
  }, [isInitialLoading]); // Depende do carregamento inicial

  // Inscreve-se para mudanças na tabela de custos
  useEffect(() => {
    const channel = supabase
      .channel('custos_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'custos'
        },
        () => {
          // Quando houver qualquer mudança na tabela de custos, atualiza todos os valores
          fetchTotalCentrosCusto();
        }
      )
      .subscribe();

    // Limpa a inscrição quando o componente é desmontado
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Função para buscar e calcular a soma dos honorários das propostas
  // Função removida pois a lógica foi integrada diretamente em atualizarReceita

  // Atualizar o valor de RECEITA com os honorários das propostas
  const atualizarReceita = async () => {
    console.log('Atualizando valor da RECEITA com honorários das propostas...');
    
    try {
      // Buscar propostas de entrada a partir de 01/01/2025
      const { data: propostasEntrada, error: errorEntrada } = await supabase
        .from('propostas')
        .select('honorario, data_inicio')
        .gte('data_inicio', '2025-01-01')
        .not('data_inicio', 'is', null);
      
      if (errorEntrada) {
        console.error('Erro ao buscar honorários das propostas de entrada:', errorEntrada);
        return;
      }
      
      // Calcular a soma dos honorários de entrada
      const totalHonorariosEntrada = propostasEntrada?.reduce((acc, proposta) => acc + (proposta.honorario || 0), 0) || 0;
      console.log('Total de honorários de entrada a partir de 01/01/2025:', totalHonorariosEntrada);
      
      // Buscar propostas de saída a partir de 01/01/2025 para subtrair da RECEITA
      const { data: propostasSaida, error: errorSaida } = await supabase
        .from('propostas_saida')
        .select('perda_valor, data_baixa')
        .gte('data_baixa', '2025-01-01')
        .not('data_baixa', 'is', null);
      
      if (errorSaida) {
        console.error('Erro ao buscar valores das propostas de saída:', errorSaida);
        return;
      }
      
      // Calcular a soma dos valores de perda das saídas
      const totalPerdasSaida = propostasSaida?.reduce((acc, proposta) => acc + (proposta.perda_valor || 0), 0) || 0;
      console.log('Total de perdas de saída a partir de 01/01/2025:', totalPerdasSaida);
      
      // Valor base para RECEITA
      const valorBase = 130300;
      
      setFinancialData(prev => {
        const newData = [...prev];
        
        // Obter o valor atual de EXTRAS
        const extrasItem = newData.find(item => item.description === 'EXTRAS');
        const extrasValue = extrasItem ? extrasItem.value : 0;
        
        // Atualizar RECEITA (id: 1) com o valor base + honorários - perdas + extras
        const receitaIndex = newData.findIndex(item => item.id === 1);
        if (receitaIndex !== -1) {
          const valorFinal = valorBase + totalHonorariosEntrada - totalPerdasSaida + extrasValue;
          console.log(`Atualizando RECEITA para ${valorFinal} (${valorBase} + ${totalHonorariosEntrada} - ${totalPerdasSaida} + ${extrasValue})`);
          newData[receitaIndex] = {
            ...newData[receitaIndex],
            value: valorFinal
          };
        }
        
        // Não atualizamos o valor de PERDAS automaticamente
        // O valor de PERDAS será editado manualmente pelo usuário
        
        return newData;
      });
      
      // O useEffect que observa mudanças em financialData já vai recalcular o lucro automaticamente
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
    }
  };
  
  // Carregar honorários quando o componente montar
  useEffect(() => {
    atualizarReceita();
    
    // Configurar canal de tempo real para atualizar quando houver mudanças nas propostas de entrada
    const channelEntrada = supabase
      .channel('propostas-entrada-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'propostas',
          filter: 'data_inicio:gte:2025-01-01'
        },
        () => {
          console.log('Detectada mudança em proposta de entrada com data_inicio >= 2025-01-01');
          // Atualizar receita quando houver mudanças nas propostas
          atualizarReceita();
        }
      )
      .subscribe();

    // Configurar canal de tempo real para atualizar quando houver mudanças nas propostas de saída
    const channelSaida = supabase
      .channel('propostas-saida-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'propostas_saida',
          filter: 'data_baixa:gte:2025-01-01'
        },
        () => {
          console.log('Detectada mudança em proposta de saída com data_baixa >= 2025-01-01');
          // Atualizar receita quando houver mudanças nas propostas de saída
          atualizarReceita();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelEntrada);
      supabase.removeChannel(channelSaida);
    };
  }, []);

  // Inicialização prioritária do Supabase
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsInitialLoading(true);
        console.log('🚀 Iniciando carregamento de dados...');
        
        // SEMPRE tentar carregar do Supabase primeiro
        const supabaseData = await loadFromSupabase();
        
        if (supabaseData && supabaseData.length > 0) {
          console.log('📥 Dados carregados do Supabase com sucesso');
          setIsExternalUpdate(true);
          setFinancialData(supabaseData);
        } else {
          console.log('🚀 Supabase vazio, inicializando com dados padrão...');
          setFinancialData(financialDataInitial);
          await initializeSupabaseData();
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        
        // Fallback: usar dados padrão se Supabase não estiver disponível
        console.log('🔄 Usando dados padrão como fallback');
        setFinancialData(financialDataInitial);
        
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor. Usando dados padrão.",
          variant: "destructive"
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeData();
  }, []); // Executar apenas uma vez na montagem

  // Configurar subscription para mudanças em tempo real (apenas após carregamento inicial)
  useEffect(() => {
    // Só ativar subscription após carregamento inicial completar
    if (isInitialLoading) {
      return;
    }

    console.log('🔗 Ativando subscription em tempo real');
    const channel = supabase
      .channel('demonstrativo_financeiro_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'demonstrativo_financeiro'
        },
        async (payload) => {
          console.log('🔄 Detectada mudança no demonstrativo de outro usuário:', payload);
          
          // Evitar loop de sincronização - só atualizar se não estamos sincronizando
          if (isSyncing) {
            console.log('⏸️ Ignorando mudança durante sincronização local...');
            return;
          }
          
          // Adicionar debounce para evitar múltiplas atualizações rápidas
          setTimeout(async () => {
            // Verificar novamente se ainda não estamos sincronizando
            if (isSyncing) {
              console.log('⏸️ Cancelando atualização - sincronização em andamento...');
              return;
            }
            
            // Recarregar dados do Supabase quando houver mudanças externas
            const updatedData = await loadFromSupabase();
            if (updatedData && updatedData.length > 0) {
              console.log('📥 Atualizando dados locais com mudanças de outros usuários');
              
              // Marcar como atualização externa
              setIsExternalUpdate(true);
              setFinancialData(prev => {
                // Só atualizar se os dados realmente mudaram
                if (JSON.stringify(prev) !== JSON.stringify(updatedData)) {
                  return updatedData;
                }
                return prev;
              });
              
              // Mostrar notificação para o usuário
              toast({
                title: "Dados atualizados",
                description: "O demonstrativo foi atualizado por outro usuário.",
                duration: 3000
              });
            }
          }, 100); // Debounce de 100ms
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Limpar timeout de sincronização se existir
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isSyncing, isInitialLoading]); // Dependência do isSyncing e loading para evitar loops

  // Mostrar loading durante inicialização
  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Balanço Patrimonial</h1>
            <p className="text-muted-foreground">
              Carregando demonstrativo financeiro...
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados do servidor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não há dados carregados, mostrar mensagem de erro
  if (!financialData || financialData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Balanço Patrimonial</h1>
            <p className="text-muted-foreground">
              Erro ao carregar demonstrativo financeiro
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhum dado encontrado. Verifique a conexão com o servidor.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Recarregar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Balanço Patrimonial</h1>
          <p className="text-muted-foreground">
            Demonstrativo detalhado de receitas e despesas
          </p>
        </div>
        {/* Botões "Periodo" e "Exportar" foram removidos daqui */}
      </div>
      
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Total"
          value={`R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Receita bruta + extras"
          icon={<DollarSign size={18} className="text-emerald-500" />}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900/30"
        />
        <StatCard
          title="Despesas"
          value={`R$ ${despesasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Total de despesas operacionais"
          icon={<TrendingDown size={18} className="text-rose-500" />}
          className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-100 dark:border-rose-900/30"
        />
        <StatCard
          title="Reservas"
          value={`R$ ${reservasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Total alocado para reservas"
          icon={<Wallet size={18} className="text-blue-500" />}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900/30"
        />
        <StatCard
          title="Lucro"
          value={`${lucro < 0 ? '-R$ ' : 'R$ '}${Math.abs(lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description={`${financialData.find(item => item.description === 'LUCRO')?.percentage || '0%'} da receita total`}
          icon={<Scale size={18} className="text-purple-500" />}
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-100 dark:border-purple-900/30"
        />
      </div>
      
      {/* Demonstrativo Financeiro */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#A61B67]/10 to-[#D90B91]/10 dark:from-[#A61B67]/20 dark:to-[#D90B91]/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Demonstrativo Financeiro
                {isSyncing && (
                  <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    Sincronizando...
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Demonstrativo detalhado de receitas e despesas • Sincronizado em tempo real
              </CardDescription>
            </div>
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/80 dark:bg-white/5">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Item</DialogTitle>
                  <DialogDescription>
                    Adicione um novo item ao demonstrativo financeiro.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Categoria
                    </Label>
                    <Select 
                      value={newItem.category} 
                      onValueChange={(value) => setNewItem({...newItem, category: value as CategoryType})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Categorias</SelectLabel>
                          <SelectItem value="RECEITA">Receita</SelectItem>
                          <SelectItem value="ENCERRAMENTO">Encerramento</SelectItem>
                          <SelectItem value="RESERVA">Reserva</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Descrição
                    </Label>
                    <Input
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="value" className="text-right">
                      Valor (R$)
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      value={newItem.value}
                      onChange={(e) => setNewItem({...newItem, value: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
                  <Button onClick={addNewItem}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full table-auto">
            <tbody className="text-sm">
              {financialData.map(item => {
                if (item.type === 'spacer') {
                  return (
                    <tr key={item.id} className="h-2"></tr>
                  );
                }

                const getBackgroundColor = () => {
                  // Adicionar divisão vermelha específica entre PERDAS e ENCERRAMENTO
                  if (item.description === 'ENCERRAMENTO' && item.type === 'item') {
                    return 'border-t-4 border-red-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20';
                  }
                  
                  switch(item.category) {
                    case 'RECEITA':
                      return item.type === 'header' ? 'bg-gradient-to-r from-emerald-900/90 to-teal-900/90' : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20';
                    case 'ENCERRAMENTO':
                      return item.type === 'header' ? 'border-t-4 border-rose-600' : 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20';
                    case 'RESERVA':
                      return item.type === 'header' ? 'border-t-4 border-blue-600' : 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20';
                    default:
                      return item.type === 'footer' ? 'bg-gradient-to-r from-purple-900/90 to-violet-900/90' : '';
                  }
                };

                return (
                  <tr 
                    key={item.id} 
                    className={cn(
                      getBackgroundColor(),
                      (item.type === 'header' && item.category !== 'ENCERRAMENTO' && item.category !== 'RESERVA') || item.type === 'footer' ? 'text-white' : '',
                      'transition-colors'
                    )}
                  >
                    <td 
                      className={cn(
                        "py-1 px-3 w-6/12",
                        item.bold && "font-bold"
                      )}
                    >
                      {editingDescription && editingDescription.id === item.id ? (
                        <div className="flex items-center">
                          <Input
                            type="text"
                            value={editingDescription.description}
                            onChange={(e) => setEditingDescription({
                              ...editingDescription,
                              description: e.target.value
                            })}
                            className="bg-white/80 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveDescription();
                              if (e.key === 'Escape') cancelEditDescription();
                            }}
                          />
                          <div className="flex ml-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={saveDescription}
                              className="h-8 w-8 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20"
                            >
                              <Check className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={cancelEditDescription}
                              className="h-8 w-8 hover:bg-rose-100/50 dark:hover:bg-rose-900/20"
                            >
                              <X className="h-4 w-4 text-rose-500" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group flex items-center">
                          <span 
                            className={item.editable ? "cursor-pointer group-hover:text-primary group-hover:underline decoration-primary/30" : ""}
                            onClick={() => {
                              if (item.editable) {
                                startEditingDescription(item.id, item.description || "");
                              }
                            }}
                          >
                            {item.description}
                          </span>
                          {item.editable && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => startEditing(item.id, item.value)}
                              className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                            >
                              <Edit2 className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-1 px-3 w-2/12 text-right">
                      {(item.description === 'LUCRO' && item.value < 0) ? '-R$' : 
                       (item.description === 'LUCRO' || item.description === 'RECEITA' || item.description === 'EXTRAS') ? 'R$' : '-R$'}
                    </td>
                    <td 
                      className={cn(
                        "py-1 px-3 w-3/12 text-right",
                        item.bold && "font-bold"
                      )}
                    >
                      {editingCell && editingCell.id === item.id ? (
                        <div className="flex items-center justify-end">
                          <Input
                            ref={inputRef}
                            type="number"
                            value={Math.abs(editingCell.value)}
                            onChange={(e) => setEditingCell({
                              ...editingCell,
                              value: e.target.value === '' ? 0 : item.value < 0 ? -Number(e.target.value) : Number(e.target.value)
                            })}
                            className="w-24 text-right bg-white/80 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <div className="flex ml-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={saveEdit}
                              className="h-8 w-8 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20"
                            >
                              <Check className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={cancelEdit}
                              className="h-8 w-8 hover:bg-rose-100/50 dark:hover:bg-rose-900/20"
                            >
                              <X className="h-4 w-4 text-rose-500" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group flex items-center justify-end">
                          <span 
                            className={item.editable ? "cursor-pointer group-hover:text-primary group-hover:underline decoration-primary/30" : ""}
                            onClick={() => {
                              if (item.editable) {
                                startEditing(item.id, item.value);
                              }
                            }}
                          >
                            {item.description === 'LUCRO' 
                              ? item.value.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : ['RECEITA', 'EXTRAS'].includes(item.description || '')
                                ? Math.abs(item.value).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })
                                : Math.abs(item.value).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                          </span>
                          {item.editable && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => startEditing(item.id, item.value)}
                              className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                            >
                              <Edit2 className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                          {item.percentage && (
                            <div className="ml-4 px-4 py-1 bg-gradient-to-r from-purple-900/90 to-violet-900/90 rounded-md text-white">
                              {item.percentage}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-1 px-3 w-1/12 text-center">
                      {(item.type === 'item' && item.editable) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(item.id)}
                          className="h-6 w-6 text-rose-500 hover:bg-rose-100/50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      <AdminPasswordDialog
        open={adminPasswordDialogOpen}
        onOpenChange={setAdminPasswordDialogOpen}
        onConfirm={handleAdminConfirm}
      />
      
      {/* Tabela de Histórico */}
      <Card className="mt-6">
        <CardHeader className="bg-gradient-to-r from-[#A61B67]/10 to-[#D90B91]/10 dark:from-[#A61B67]/20 dark:to-[#D90B91]/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico Mensal</CardTitle>
              <CardDescription>
                Registro histórico dos balanços mensais
              </CardDescription>
            </div>
            <Button onClick={salvarHistorico} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Salvar Informações
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2 px-3 text-left font-medium text-slate-500 dark:text-slate-400 text-xs sticky left-0 bg-white dark:bg-slate-950 whitespace-nowrap">Data</th>
                {financialDataInitial
                  .filter(item => item.type !== 'spacer')
                  .map(item => {
                    // Determinar a cor de fundo com base na categoria
                    const getBgColor = () => {
                      switch(item.category) {
                        case 'RECEITA':
                          return 'bg-gradient-to-r from-emerald-900/90 to-teal-900/90';
                        case 'ENCERRAMENTO':
                          return 'border-t-4 border-rose-600';
                        case 'RESERVA':
                          return 'border-t-4 border-blue-600';
                        default:
                          return item.type === 'footer' ? 'bg-gradient-to-r from-purple-900/90 to-violet-900/90' : '';
                      }
                    };
                    
                    // Abreviar ou formatar o texto para ocupar menos espaço
                    const formatColumnTitle = (title: string | undefined) => {
                      if (!title) return '';
                      
                      // Abreviações específicas para títulos longos
                      if (title === 'Centro de Custo Certificado Digital') return 'Cert. Digital';
                      if (title === 'Centro de Custo Variável') return 'C. Variável';
                      if (title === 'Centro de Custo Fixo') return 'C. Fixo';
                      if (title === 'RESERVA PARA CONFRATERNIZ') return 'Confraterniz.';
                      if (title === 'RESERVA PARA ENCONTRO') return 'Encontro';
                      if (title === 'RESERVA PARA EVENTOS') return 'Eventos';
                      if (title === 'RESERVA PARA BRINDES') return 'Brindes';
                      if (title === 'Recrutamento e Seleção') return 'Recrutamento';
                      if (title === 'Tarifa Bancária') return 'Tarifa';
                      
                      // Retornar o título original para os demais casos
                      return title;
                    };
                    
                    return (
                                              <th 
                        key={item.id} 
                        className={cn(
                          "py-2 px-2 text-right font-medium text-xs whitespace-nowrap",
                          (item.type === 'header' && item.category !== 'ENCERRAMENTO' && item.category !== 'RESERVA') || item.type === 'footer' 
                            ? `${getBgColor()} text-white` 
                            : item.type === 'header' && (item.category === 'ENCERRAMENTO' || item.category === 'RESERVA')
                              ? `${getBgColor()} text-slate-700 dark:text-slate-200`
                              : "text-slate-500 dark:text-slate-400",
                          item.bold && "font-bold"
                        )}
                        title={item.description} // Adicionar tooltip com o nome completo
                      >
                        {formatColumnTitle(item.description)}
                      </th>
                    );
                  })
                }
              </tr>
            </thead>
            <tbody className="text-sm">
              {historicoBalanco.length === 0 ? (
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <td colSpan={financialDataInitial.filter(item => item.type !== 'spacer').length + 1} className="py-4 px-4 text-center text-slate-500 dark:text-slate-400">
                    Nenhum histórico registrado. Clique em "Salvar Informações" para registrar o balanço atual.
                  </td>
                </tr>
              ) : (
                historicoBalanco.map((historico) => (
                  <tr 
                    key={historico.id} 
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
                    onClick={() => abrirHistoricoSelecionado(historico)}
                  >
                    <td className="py-2 px-3 text-xs sticky left-0 bg-white dark:bg-slate-950 whitespace-nowrap">{new Date(historico.data).toLocaleDateString('pt-BR')}</td>
                    {financialDataInitial
                      .filter(item => item.type !== 'spacer')
                      .map(templateItem => {
                        // Encontrar o item correspondente no histórico
                        const finItem = historico.financialData.find(f => f.id === templateItem.id);
                        
                        if (!finItem) return <td key={`${historico.id}-${templateItem.id}`} className="py-2 px-2 text-right text-xs">-</td>;
                        
                        // Determinar a cor de fundo com base na categoria para linhas alternadas
                        const getRowBgColor = () => {
                          // Adicionar divisão vermelha específica entre PERDAS e ENCERRAMENTO no histórico
                          if (finItem.description === 'ENCERRAMENTO' && finItem.type === 'item') {
                            return 'border-t-2 border-red-600';
                          }
                          
                          switch(templateItem.category) {
                            case 'RECEITA':
                              return templateItem.type === 'header' ? 'bg-emerald-900/10' : '';
                            case 'ENCERRAMENTO':
                              return templateItem.type === 'header' ? 'border-t-2 border-rose-600' : '';
                            case 'RESERVA':
                              return templateItem.type === 'header' ? 'border-t-2 border-blue-600' : '';
                            default:
                              return templateItem.type === 'footer' ? 'bg-purple-900/10' : '';
                          }
                        };
                        
                        return (
                          <td 
                            key={`${historico.id}-${templateItem.id}`} 
                            className={cn(
                              "py-2 px-2 text-right text-xs whitespace-nowrap",
                              getRowBgColor(),
                              templateItem.type === 'header' || templateItem.type === 'footer' ? "font-semibold" : ""
                            )}
                          >
                            <div className="flex items-center justify-end">
                              <span className="tabular-nums">
                                {finItem.value < 0 ? '-' : ''}
                                R$ {Math.abs(finItem.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {finItem.percentage && (
                                <span className="ml-1 px-1 py-0.5 bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded text-xs">
                                  {finItem.percentage}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })
                    }
                  </tr>
                )).reverse()
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      {/* Espaço no final da página */}
      <div className="h-8 md:h-12"></div>
      
      {/* Modal para editar/excluir histórico */}
      <Dialog open={modalHistoricoAberto} onOpenChange={setModalHistoricoAberto}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Histórico</DialogTitle>
            <DialogDescription>
              Histórico de {historicoSelecionado ? new Date(historicoSelecionado.data).toLocaleDateString('pt-BR') : ''}
            </DialogDescription>
          </DialogHeader>
          
          {historicoSelecionado && (
            <div className="py-4">
              {/* Resumo dos totais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Receita Total:</p>
                  <p className="text-base font-semibold tabular-nums">
                    R$ {historicoSelecionado.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                  <p className="text-xs font-medium text-rose-700 dark:text-rose-300">Despesas:</p>
                  <p className="text-base font-semibold tabular-nums">
                    R$ {historicoSelecionado.despesasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Reservas:</p>
                  <p className="text-base font-semibold tabular-nums">
                    R$ {historicoSelecionado.reservasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Lucro:</p>
                  <div className="flex items-center">
                    <p className="text-base font-semibold tabular-nums">
                      R$ {Math.abs(historicoSelecionado.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {historicoSelecionado.financialData.find(item => item.id === 24)?.percentage && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-200 dark:bg-purple-800/40 text-purple-800 dark:text-purple-300 rounded text-xs">
                        {historicoSelecionado.financialData.find(item => item.id === 24)?.percentage}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabela detalhada */}
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-3 text-left font-medium text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">Descrição</th>
                      <th className="py-2 px-3 text-right font-medium text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* RECEITA */}
                    {historicoSelecionado.financialData
                      .filter(item => item.category === 'RECEITA')
                      .map(item => {
                        const getBgColor = () => {
                          return item.type === 'header' 
                            ? 'bg-gradient-to-r from-emerald-900/90 to-teal-900/90 text-white' 
                            : 'bg-emerald-50/50 dark:bg-emerald-900/10';
                        };
                        
                        return (
                          <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td 
                              className={cn(
                                "py-2 px-3 text-xs whitespace-nowrap",
                                getBgColor(),
                                item.bold && "font-bold"
                              )}
                            >
                              {item.description}
                            </td>
                            <td 
                              className={cn(
                                "py-2 px-3 text-right text-xs whitespace-nowrap",
                                getBgColor(),
                                item.bold && "font-bold"
                              )}
                            >
                              <div className="flex items-center justify-end">
                                <span className="tabular-nums">
                                  {item.value < 0 ? '-' : ''}
                                  R$ {Math.abs(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    }
                    
                    {/* Espaço */}
                    <tr className="h-2"></tr>
                    
                    {/* ENCERRAMENTO */}
                    {historicoSelecionado.financialData
                      .filter(item => item.category === 'ENCERRAMENTO')
                      .map(item => {
                        const getBgColor = () => {
                          // Adicionar divisão vermelha específica para o item ENCERRAMENTO no modal
                          if (item.description === 'ENCERRAMENTO' && item.type === 'item') {
                            return 'border-t-4 border-red-600 bg-rose-50/50 dark:bg-rose-900/10';
                          }
                          
                          return item.type === 'header' 
                            ? 'bg-gradient-to-r from-rose-900/90 to-pink-900/90 text-white' 
                            : 'bg-rose-50/50 dark:bg-rose-900/10';
                        };
                        
                        return (
                          <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td 
                              className={cn(
                                "py-2 px-3 text-xs whitespace-nowrap",
                                getBgColor(),
                                item.bold && "font-bold"
                              )}
                            >
                              {item.description}
                            </td>
                            <td 
                              className={cn(
                                "py-2 px-3 text-right text-xs whitespace-nowrap",
                                getBgColor(),
                                item.bold && "font-bold"
                              )}
                            >
                              <div className="flex items-center justify-end">
                                <span className="tabular-nums">
                                  {item.value < 0 ? '-' : ''}
                                  R$ {Math.abs(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    }
                    
                    {/* Espaço */}
                    <tr className="h-2"></tr>
                    
                    {/* RESERVA */}
                    {historicoSelecionado.financialData
                      .filter(item => item.category === 'RESERVA')
                      .map(item => {
                        const getBgColor = () => {
                          return item.type === 'header' 
                            ? 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90 text-white' 
                            : 'bg-blue-50/50 dark:bg-blue-900/10';
                        };
                        
                        return (
                          <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td 
                              className={cn(
                                "py-2 px-3 text-xs whitespace-nowrap",
                                getBgColor(),
                                item.bold && "font-bold"
                              )}
                            >
                              {item.description}
                            </td>
                            <td 
                              className={cn(
                                "py-2 px-3 text-right text-xs whitespace-nowrap",
                                getBgColor(),
                                item.bold && "font-bold"
                              )}
                            >
                              <div className="flex items-center justify-end">
                                <span className="tabular-nums">
                                  {item.value < 0 ? '-' : ''}
                                  R$ {Math.abs(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    }
                    
                    {/* Espaço */}
                    <tr className="h-2"></tr>
                    
                    {/* LUCRO */}
                    {historicoSelecionado.financialData
                      .filter(item => item.type === 'footer')
                      .map(item => (
                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td 
                            className="py-2 px-3 text-xs whitespace-nowrap bg-gradient-to-r from-purple-900/90 to-violet-900/90 text-white font-bold"
                          >
                            {item.description}
                          </td>
                          <td 
                            className="py-2 px-3 text-right text-xs whitespace-nowrap bg-gradient-to-r from-purple-900/90 to-violet-900/90 text-white font-bold"
                          >
                            <div className="flex items-center justify-end">
                              <span className="tabular-nums">
                                {item.value < 0 ? '-' : ''}
                                R$ {Math.abs(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {item.percentage && (
                                <span className="ml-1 px-1 py-0.5 bg-purple-200/30 text-white rounded text-xs">
                                  {item.percentage}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between mt-6">
            <div>
              <Button 
                variant="destructive" 
                onClick={() => historicoSelecionado && excluirHistorico(historicoSelecionado.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
            <div>
              <Button variant="outline" onClick={fecharModalHistorico}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
