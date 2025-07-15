import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, ArrowUpCircle, ArrowDownCircle, Filter, Search, Download, Plus, FileText, XCircle, Clock, Upload, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { TableActionMenu } from "@/components/TableActionMenu";
import { Popover as ShadPopover, PopoverContent as ShadPopoverContent, PopoverTrigger as ShadPopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import StatCard from "@/components/dashboard/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

// Função para formatar valores monetários no padrão brasileiro (BRL)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Interface para os custos
interface Custo {
  id: string;
  vencimento: string | null;
  competencia: string | null;
  previsto_para: string | null;
  data_pagamento: string | null;
  cpf_cnpj: string;
  nome: string;
  descricao: string;
  referencia: string;
  categoria: string;
  detalhamento: string;
  centro_custo: string;
  valor_categoria: number;
  identificador: string;
  conta: string;
  excel_id: string | null;
}

interface CustoFormData {
  vencimento: string | null;
  competencia: string | null;
  previsto_para: string | null;
  data_pagamento: string | null;
  cpf_cnpj: string;
  nome: string;
  descricao: string;
  referencia: string;
  categoria: string;
  detalhamento: string;
  centro_custo: string;
  valor_categoria: number;
  identificador: string;
  conta: string;
  excel_id: string | null;
}

export default function Custo() {
  const [custosData, setCustosData] = useState<Custo[]>([]);
  const [filteredCustos, setFilteredCustos] = useState<Custo[]>([]);
  const [openNewCusto, setOpenNewCusto] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCusto, setSelectedCusto] = useState<Custo | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [custoFormStep, setCustoFormStep] = useState(1); // Estado para controlar a etapa do formulário
  const [lastUpdate, setLastUpdate] = useState<string | null>(() => {
    // Recupera a última data de atualização do localStorage ao inicializar
    return localStorage.getItem('lastCustoUpdate');
  });
  const [showUpdateAlert, setShowUpdateAlert] = useState(true);

  // Estado para filtros adicionais
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filtroDescricao, setFiltroDescricao] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroCentroCusto, setFiltroCentroCusto] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date | undefined>(undefined);
  const [filtroDataFim, setFiltroDataFim] = useState<Date | undefined>(undefined);

  // Configuração da paginação
  const itemsPerPage = 5; // Igual à página de Proposta
  const totalPages = Math.ceil(filteredCustos.length / itemsPerPage);
  const paginatedCustos = filteredCustos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Type for form values
  type FormValues = {
    vencimento: string;
    competencia: string;
    previsto_para: string;
    data_pagamento: string;
    cpf_cnpj: string;
    nome: string;
    descricao: string;
    referencia: string;
    categoria: string;
    detalhamento: string;
    centro_custo: string;
    valor_categoria: number;
    identificador: string;
    conta: string;
    excel_id: string;
  };

  // Define field names type
  type FieldName = keyof FormValues;

  // Formulário para criar novo custo
  const form = useForm<FormValues>({
    defaultValues: {
      vencimento: new Date().toISOString().split('T')[0],
      competencia: new Date().toISOString().split('T')[0].substring(0, 7),
      previsto_para: "",
      data_pagamento: "",
      cpf_cnpj: "",
      nome: "",
      descricao: "",
      referencia: "",
      categoria: "",
      detalhamento: "",
      centro_custo: "",
      valor_categoria: 0,
      identificador: "",
      conta: "",
      excel_id: ""
    },
    mode: "onChange"
  });

  // Função para atualizar o timestamp
  const updateTimestamp = () => {
    const newTimestamp = new Date().toLocaleString('pt-BR');
    setLastUpdate(newTimestamp);
    localStorage.setItem('lastCustoUpdate', newTimestamp);
  };

  // Função para aplicar todos os filtros
  const aplicarFiltros = () => {
    let custos = [...custosData];

    // Aplicar filtros adicionais se preenchidos
    if (filtroDescricao) {
      custos = custos.filter(custo => custo.descricao.toLowerCase().includes(filtroDescricao.toLowerCase()));
    }
    if (filtroCategoria) {
      custos = custos.filter(custo => custo.categoria.toLowerCase().includes(filtroCategoria.toLowerCase()));
    }
    if (filtroCentroCusto) {
      custos = custos.filter(custo => custo.centro_custo.toLowerCase().includes(filtroCentroCusto.toLowerCase()));
    }
    if (filtroDataInicio) {
      custos = custos.filter(custo => {
        const dataVencimento = new Date(custo.vencimento || "");
        return dataVencimento >= filtroDataInicio;
      });
    }
    if (filtroDataFim) {
      custos = custos.filter(custo => {
        const dataVencimento = new Date(custo.vencimento || "");
        return dataVencimento <= filtroDataFim;
      });
    }
    setFilteredCustos(custos);
    setFilterDialogOpen(false);
    setCurrentPage(1); // Reset para primeira página
  };

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setFiltroDescricao("");
    setFiltroCategoria("");
    setFiltroCentroCusto("");
    setFiltroDataInicio(undefined);
    setFiltroDataFim(undefined);
    setFilteredCustos(custosData);
    setFilterDialogOpen(false);
    setCurrentPage(1); // Reset para primeira página
  };

  // Função para gerar novo ID
  const generateNewId = () => {
    const lastId = custosData.length > 0 ? parseInt(custosData[custosData.length - 1].id.replace("CUSTO-", "")) : 0;
    return `CUSTO-${String(lastId + 1).padStart(3, "0")}`;
  };

  // Função para buscar custos do Supabase
  const fetchCustos = async (shouldUpdateTimestamp: boolean = false) => {
    try {
      setIsImporting(true);
      
      // Iniciar a consulta base
      let query = supabase.from('custos').select('*');
      
      // Aplicar filtros se houver
      if (filtroCategoria) {
        query = query.eq('categoria', filtroCategoria);
      }
      
      if (filtroCentroCusto) {
        query = query.eq('centro_custo', filtroCentroCusto);
      }
      
      if (filtroDataInicio) {
        query = query.gte('vencimento', filtroDataInicio.toISOString().slice(0, 10));
      }
      
      if (filtroDataFim) {
        query = query.lte('vencimento', filtroDataFim.toISOString().slice(0, 10));
      }
      
      if (filtroDescricao) {
        query = query.ilike('descricao', `%${filtroDescricao}%`);
      }
      
      // Ordenar por excel_id (se existir) ou por vencimento
      const { data, error } = await query
        .order('excel_id', { ascending: true })
        .order('vencimento', { ascending: true });

    if (error) {
        throw error;
    }

    setCustosData(data || []);
    
    if (shouldUpdateTimestamp) {
      updateTimestamp();
      }
    } catch (error) {
      console.error('Erro ao buscar custos:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os custos. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Carregar dados iniciais sem atualizar o timestamp
  useEffect(() => {
    fetchCustos(false);
    // eslint-disable-next-line
  }, []);

  // Atualizar filteredCustos sempre que custosData mudar
  useEffect(() => {
    setFilteredCustos(custosData);
  }, [custosData]);

  // Funções para manipulação de custos (visualizar, editar, excluir)
  const handleViewCusto = (custo: Custo) => {
    setSelectedCusto(custo);
    setOpenViewDialog(true);
  };

  const handleEditCusto = async (custo: Custo) => {
    try {
      if (!custo || !custo.id) {
        toast({
          title: "Erro ao editar",
          description: "Não foi possível identificar o custo para edição.",
          variant: "destructive"
        });
        return;
      }
      setSelectedCusto(custo);

      // Preencher o form com os dados do custo selecionado
      form.reset({
        vencimento: custo.vencimento || "",
        competencia: custo.competencia || "",
        previsto_para: custo.previsto_para || "",
        data_pagamento: custo.data_pagamento || "",
        cpf_cnpj: custo.cpf_cnpj || "",
        nome: custo.nome || "",
        descricao: custo.descricao || "",
        referencia: custo.referencia || "",
        categoria: custo.categoria || "",
        detalhamento: custo.detalhamento || "",
        centro_custo: custo.centro_custo || "",
        valor_categoria: custo.valor_categoria || 0,
        identificador: custo.identificador || "",
        conta: custo.conta || "",
        excel_id: custo.excel_id || ""
      });

      setOpenNewCusto(true);
    } catch (error) {
      console.error("Erro ao editar custo:", error);
      toast({
        title: "Erro ao editar",
        description: "Ocorreu um problema ao carregar os dados para edição. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCusto = async (id: string) => {
    try {
      // Primeiro, vamos verificar se o custo existe
      const { data: custoExistente, error: erroConsulta } = await supabase
        .from("custos")
        .select("id")
        .eq('id', id)
        .single();

      if (erroConsulta || !custoExistente) {
        toast({
          title: "Erro ao deletar custo",
          description: "Custo não encontrado no banco de dados.",
          variant: "destructive"
        });
        return;
      }

      // Agora vamos deletar o custo
      const { error: erroDelete } = await supabase
        .from("custos")
        .delete()
        .eq('id', id);

      if (erroDelete) {
        console.error("Erro ao deletar:", erroDelete);
        toast({
          title: "Erro ao deletar custo",
          description: "Não foi possível deletar o custo do banco de dados.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Custo deletado",
        description: "O custo foi deletado com sucesso!"
      });

      fetchCustos(true); // Atualiza timestamp ao deletar
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast({
        title: "Erro ao deletar custo",
        description: "Ocorreu um erro inesperado ao tentar deletar o custo.",
        variant: "destructive"
      });
    }
  };

  // Função para atualizar custo
  const handleUpdateCusto = async (data: CustoFormData) => {
    if (!selectedCusto?.id) return;

    const { error } = await supabase
      .from("custos")
      .update(data)
      .eq('id', selectedCusto.id);

    if (error) {
      toast({
        title: "Erro ao atualizar custo",
        description: "Não foi possível atualizar o custo no banco de dados.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Custo atualizado",
      description: "O custo foi atualizado com sucesso!"
    });

    setSelectedCusto(null);
    fetchCustos(true); // Atualiza timestamp ao editar
  };

  // Modificar a função onSubmitNewCusto para lidar com criação e atualização
  const onSubmitNewCusto = async (values: FormValues) => {
    if (selectedCusto) {
      // Se existe um custo selecionado, é uma atualização
      await handleUpdateCusto(values);
    } else {
      // Se não existe custo selecionado, é uma nova criação
      try {
        const novoCusto = {
          vencimento: values.vencimento || new Date().toISOString().split('T')[0],
          competencia: values.competencia || new Date().toISOString().split('T')[0].substring(0, 7),
          previsto_para: values.previsto_para || null,
          data_pagamento: values.data_pagamento || null,
          cpf_cnpj: values.cpf_cnpj || "",
          nome: values.nome || "",
          descricao: values.descricao || "",
          referencia: values.referencia || "",
          categoria: values.categoria || "",
          detalhamento: values.detalhamento || "",
          centro_custo: values.centro_custo || "",
          valor_categoria: Number(values.valor_categoria) || 0,
          identificador: values.identificador || "",
          conta: values.conta || "",
          excel_id: values.excel_id || ""
        };

        const { error } = await supabase
          .from("custos")
          .insert([novoCusto]);

        if (error) throw error;

        // Atualizar a interface e o timestamp porque houve inserção
        await fetchCustos(true);
        setCustoFormStep(1);
        setOpenNewCusto(false);
        setCurrentPage(1);

        toast({
          title: "Custo adicionado",
          description: "O custo foi adicionado com sucesso."
        });
      } catch (error) {
        console.error("Erro ao adicionar custo:", error);
        toast({
          title: "Erro ao adicionar custo",
          description: "Ocorreu um problema ao adicionar o novo custo. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  // Função para importar dados do Excel
  const handleImportXLS = () => {
    setOpenImportDialog(true);
  };

  // Funções para processamento de dados do Excel
  // Converter datas para o formato correto (YYYY-MM-DD)
  const formatDate = (dateValue: any) => {
    if (!dateValue) return null;
    
    console.log('Tentando formatar data:', dateValue, 'tipo:', typeof dateValue);
    
    // Se for uma data do Excel (número), converter para data JS
    if (typeof dateValue === 'number') {
      try {
        const excelDate = XLSX.SSF.parse_date_code(dateValue);
        console.log('Data Excel convertida:', excelDate);
        return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
      } catch (e) {
        console.error('Erro ao converter data Excel:', e);
        return null;
      }
    }
    
    // Se for uma string, tentar converter para formato ISO
    if (typeof dateValue === 'string') {
      try {
        // Verificar se é uma string vazia ou traço
        if (!dateValue.trim() || dateValue.trim() === '-') {
          return null;
        }
        
        // Normalizar a string (remover espaços extras, etc.)
        const normalizedValue = dateValue.trim();
        
        // Verificar se é uma data no formato brasileiro (DD/MM/YYYY)
        const brDateMatch = normalizedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (brDateMatch) {
          const day = String(parseInt(brDateMatch[1])).padStart(2, '0');
          const month = String(parseInt(brDateMatch[2])).padStart(2, '0');
          const year = brDateMatch[3];
          return `${year}-${month}-${day}`;
        }
        
        // Verificar se é uma data no formato brasileiro com traço (DD-MM-YYYY)
        const brDateDashMatch = normalizedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (brDateDashMatch) {
          const day = String(parseInt(brDateDashMatch[1])).padStart(2, '0');
          const month = String(parseInt(brDateDashMatch[2])).padStart(2, '0');
          const year = brDateDashMatch[3];
          return `${year}-${month}-${day}`;
        }
        
        // Verificar se é uma data no formato americano (MM/DD/YYYY)
        const usDateMatch = normalizedValue.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
        if (usDateMatch) {
          // Assumir que é MM/DD/YYYY se o primeiro número for <= 12
          if (parseInt(usDateMatch[1]) <= 12) {
            const month = String(parseInt(usDateMatch[1])).padStart(2, '0');
            const day = String(parseInt(usDateMatch[2])).padStart(2, '0');
            const year = usDateMatch[3];
            return `${year}-${month}-${day}`;
          }
        }
        
        // Verificar se é uma data no formato ISO (YYYY-MM-DD)
        const isoDateMatch = normalizedValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoDateMatch) {
          const year = isoDateMatch[1];
          const month = String(parseInt(isoDateMatch[2])).padStart(2, '0');
          const day = String(parseInt(isoDateMatch[3])).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // Verificar se é uma data no formato YYYY/MM/DD
        const isoSlashDateMatch = normalizedValue.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        if (isoSlashDateMatch) {
          const year = isoSlashDateMatch[1];
          const month = String(parseInt(isoSlashDateMatch[2])).padStart(2, '0');
          const day = String(parseInt(isoSlashDateMatch[3])).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // Verificar se é apenas mês e ano (MM/YYYY ou MM-YYYY)
        const monthYearMatch = normalizedValue.match(/^(\d{1,2})[-\/](\d{4})$/);
        if (monthYearMatch) {
          const month = String(parseInt(monthYearMatch[1])).padStart(2, '0');
          const year = monthYearMatch[2];
          // Para vencimento, precisamos de um dia específico, então usamos o dia 01
          return `${year}-${month}-01`;
        }
        
        // Verificar se é apenas ano e mês (YYYY/MM ou YYYY-MM)
        const yearMonthMatch = normalizedValue.match(/^(\d{4})[-\/](\d{1,2})$/);
        if (yearMonthMatch) {
          const year = yearMonthMatch[1];
          const month = String(parseInt(yearMonthMatch[2])).padStart(2, '0');
          // Para vencimento, precisamos de um dia específico, então usamos o dia 01
          return `${year}-${month}-01`;
        }
        
        // Verificar se é uma data no formato texto (ex: "15 de maio de 2025")
        const ptBrTextDateMatch = normalizedValue.toLowerCase().match(/(\d{1,2})\s+(?:de\s+)?(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+)?(\d{4})/);
        if (ptBrTextDateMatch) {
          const day = String(parseInt(ptBrTextDateMatch[1])).padStart(2, '0');
          const monthText = ptBrTextDateMatch[2].toLowerCase();
          const year = ptBrTextDateMatch[3];
          
          const monthMap = {
            'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
            'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
            'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
          };
          
          const month = monthMap[monthText] || '01';
          return `${year}-${month}-${day}`;
        }
        
        // Tentar converter para data usando o objeto Date
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          // Garantir que o formato seja YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // Último recurso: tentar extrair números que pareçam uma data
        const numbersOnly = normalizedValue.replace(/[^\d]/g, '');
        if (numbersOnly.length >= 8) {
          // Assumir que é no formato DDMMYYYY ou YYYYMMDD
          if (numbersOnly.length === 8) {
            // Verificar se os primeiros 4 dígitos parecem um ano
            if (parseInt(numbersOnly.substring(0, 4)) > 1900 && parseInt(numbersOnly.substring(0, 4)) < 2100) {
              // Formato YYYYMMDD
              const year = numbersOnly.substring(0, 4);
              const month = numbersOnly.substring(4, 6);
              const day = numbersOnly.substring(6, 8);
              
              // Validar mês e dia
              if (parseInt(month) >= 1 && parseInt(month) <= 12 && parseInt(day) >= 1 && parseInt(day) <= 31) {
                return `${year}-${month}-${day}`;
              }
            } else {
              // Formato DDMMYYYY
              const day = numbersOnly.substring(0, 2);
              const month = numbersOnly.substring(2, 4);
              const year = numbersOnly.substring(4, 8);
              
              // Validar mês e dia
              if (parseInt(month) >= 1 && parseInt(month) <= 12 && parseInt(day) >= 1 && parseInt(day) <= 31) {
                return `${year}-${month}-${day}`;
              }
            }
          }
        }
        
        console.log('Não foi possível converter a string de data:', dateValue);
        return null;
      } catch (e) {
        console.error('Erro ao converter string de data:', e);
        return null;
      }
    }
    
    // Tentar como objeto Date
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error('Erro ao converter objeto de data:', e);
    }
    
    console.log('Formato de data não reconhecido:', dateValue);
    return null;
  };
  
  // Extrair competência no formato YYYY-MM
  const extractCompetencia = (dateValue: any) => {
    if (!dateValue) return null;
    
    console.log('Tentando extrair competência:', dateValue, 'tipo:', typeof dateValue);
    
    try {
      // Se for uma string no formato YYYY-MM ou MM/YYYY
      if (typeof dateValue === 'string') {
        // Formato YYYY-MM ou YYYY/MM
        const yearMonthMatch = dateValue.match(/(\d{4})[-\/](\d{1,2})/);
        if (yearMonthMatch) {
          // Retornar no formato YYYY-MM-01 para padronizar com outras datas
          return `${yearMonthMatch[1]}-${String(yearMonthMatch[2]).padStart(2, '0')}-01`;
        }
        
        // Formato MM/YYYY ou MM-YYYY
        const monthYearMatch = dateValue.match(/(\d{1,2})[-\/](\d{4})/);
        if (monthYearMatch) {
          // Retornar no formato YYYY-MM-01 para padronizar com outras datas
          return `${monthYearMatch[2]}-${String(monthYearMatch[1]).padStart(2, '0')}-01`;
        }
        
        // Formato texto (ex: "Janeiro 2023", "Jan/2023")
        const monthNames = {
          'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
          'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
          'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
          'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
        };
        
        const textMatch = dateValue.toLowerCase().match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)[^\d]*(\d{4})/);
        if (textMatch) {
          const month = monthNames[textMatch[1]];
          const year = textMatch[2];
          // Retornar no formato YYYY-MM-01 para padronizar com outras datas
          return `${year}-${month}-01`;
        }
        
        // Verificar se é uma data completa (DD/MM/YYYY ou YYYY-MM-DD)
        // Formato brasileiro DD/MM/YYYY
        const brDateMatch = dateValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (brDateMatch) {
          return `${brDateMatch[3]}-${String(brDateMatch[2]).padStart(2, '0')}-01`;
        }
        
        // Formato ISO YYYY-MM-DD ou YYYY/MM/DD
        const isoDateMatch = dateValue.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (isoDateMatch) {
          return `${isoDateMatch[1]}-${String(isoDateMatch[2]).padStart(2, '0')}-01`;
        }
      }
      
      // Se for uma data do Excel (número), converter para YYYY-MM-01
      if (typeof dateValue === 'number') {
        try {
          const excelDate = XLSX.SSF.parse_date_code(dateValue);
          console.log('Data Excel convertida para competência:', excelDate);
          // Retornar no formato YYYY-MM-01 para padronizar com outras datas
          return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-01`;
        } catch (e) {
          console.error('Erro ao converter data Excel para competência:', e);
          return null;
        }
      }
      
      // Se for uma data completa, extrair ano e mês
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          // Retornar no formato YYYY-MM-01 para padronizar com outras datas
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        }
      } catch (e) {
        console.error('Erro ao extrair competência de data:', e);
      }
      
      console.log('Não foi possível extrair competência:', dateValue);
      return null;
    } catch (e) {
      console.error('Erro ao processar competência:', e);
      return null;
    }
  };
  
  // Converter valor para número
  const parseValue = (value: any) => {
    if (value === undefined || value === null) return 0;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      // Verificar se é um valor negativo (com sinal de menos ou entre parênteses)
      const isNegative = value.trim().startsWith('-') || 
                         (value.includes('(') && value.includes(')')) ||
                         value.toLowerCase().includes('negativo');
      
      // Remover formatação de moeda e converter para número
      let cleanValue = value
        .replace(/[()]/g, '') // Remove parênteses (formato negativo em Excel)
        .replace(/[^\d,-\.]/g, '') // Remove tudo exceto dígitos, vírgula, ponto e sinal negativo
        .replace(/,/g, '.'); // Substitui TODAS as vírgulas por pontos
      
      // Se houver múltiplos pontos decimais, manter apenas o último
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        cleanValue = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
      }
      
      // Se o valor original indicava número negativo mas o sinal foi perdido
      if (isNegative && !cleanValue.startsWith('-')) {
        cleanValue = '-' + cleanValue;
      }
      
      const parsedValue = parseFloat(cleanValue);
      console.log(`Valor monetário convertido: "${value}" -> ${parsedValue}`);
      return isNaN(parsedValue) ? 0 : parsedValue;
    }
    
    return 0;
  };

  // Função para processar o arquivo Excel e importar os dados
  const processExcelFile = async (file: File) => {
    try {
      setIsImporting(true);
      
      // Ler o arquivo Excel
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          console.log('Tipo de dados lido:', typeof data);
          
          // Determinar o tipo de dados com base no método de leitura usado
          const type = typeof data === 'string' ? 'binary' : 'array';
          console.log('Usando tipo de leitura:', type);
          
          const workbook = XLSX.read(data, { 
            type, 
            cellDates: true,
            dateNF: 'yyyy-mm-dd'  // Formato de data para saída
          });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          console.log('Planilha lida com sucesso. Nome da folha:', sheetName);
          
          // Converter para JSON com cabeçalhos reais
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,  // Retorna strings em vez de valores formatados
            dateNF: 'yyyy-mm-dd',
            defval: '',  // Valor padrão para células vazias
            blankrows: false, // Ignorar linhas em branco
            header: 1 // Usar a primeira linha como cabeçalho
          }) as any[];
          
          // Verificar se temos dados
          if (jsonData.length <= 1) { // Apenas cabeçalho ou vazio
            throw new Error('O arquivo não contém dados válidos');
          }
          
          // Obter cabeçalhos da primeira linha
          const headers = (jsonData[0] as any[]).map(h => String(h).toLowerCase());
          console.log('Cabeçalhos encontrados:', headers);
          
          // Mapear os cabeçalhos para as colunas
          const columnMappings = {
            id: headers.findIndex(h => 
              h.includes('id') || h === '#' || h === 'n' || h === 'num' || h === 'número' || h === 'numero'),
            vencimento: headers.findIndex(h => 
              h.includes('vencimento') || h.includes('venc')),
            competencia: headers.findIndex(h => 
              h.includes('competencia') || h.includes('competência') || h.includes('mês de competência') || h.includes('mes')),
            previsto_para: headers.findIndex(h => 
              h.includes('previsto para') || h.includes('previsão') || h.includes('previsto')),
            data_pagamento: headers.findIndex(h => 
              h.includes('data pagamento') || h.includes('pagamento') || h.includes('pago em') || h.includes('data de pagamento')),
            cpf_cnpj: headers.findIndex(h => 
              h.includes('cpf') || h.includes('cnpj') || h.includes('cpf/cnpj') || h.includes('documento')),
            nome: headers.findIndex(h => 
              h.includes('nome') || h.includes('fornecedor')),
            descricao: headers.findIndex(h => 
              h.includes('descricao') || h.includes('descrição') || h.includes('desc')),
            referencia: headers.findIndex(h => 
              h.includes('referencia') || h.includes('referência') || h.includes('ref')),
            categoria: headers.findIndex(h => 
              h.includes('categoria') || h.includes('tipo')),
            detalhamento: headers.findIndex(h => 
              h.includes('detalhamento') || h.includes('detalhe')),
            centro_custo: headers.findIndex(h => 
              h.includes('centro') || h.includes('custo') || h.includes('centro de custo')),
            valor_categoria: headers.findIndex(h => 
              h.includes('valor') || h.includes('total') || h.includes('valor categoria') || h.includes('valor_categoria') || h.includes('valor categoria/centro de custo')),
            identificador: headers.findIndex(h => 
              h.includes('identificador')),
            conta: headers.findIndex(h => 
              h.includes('conta'))
          };
          
          console.log('Mapeamento de colunas:', columnMappings);
          
          // Mapear os dados para o formato da tabela custos (pular a primeira linha que é o cabeçalho)
          const custosData = [];
          const erros = [];
          
          // Começar do índice 1 para pular o cabeçalho
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            const rowNumber = i + 1; // +1 porque os arrays começam em 0 e já estamos pulando o cabeçalho
            
            try {
              // Verificar se a linha tem dados
              if (!row || row.length === 0 || !row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                console.log(`Linha ${rowNumber} vazia, pulando...`);
                continue;
              }
              
              // Obter valores das células com base no mapeamento de colunas
              const getColumnValue = (columnIndex: number) => {
                if (columnIndex >= 0 && columnIndex < row.length) {
                  return row[columnIndex];
                }
                return null;
              };
              
              // Capturar o ID da planilha
              const excelId = getColumnValue(columnMappings.id) || String(rowNumber);
              console.log(`Linha ${rowNumber}: ID da planilha = "${excelId}"`);
              
              // Obter o valor de vencimento da planilha
              const vencimentoRaw = getColumnValue(columnMappings.vencimento);
              
              console.log(`Linha ${rowNumber}: Vencimento original = "${vencimentoRaw}", tipo: ${typeof vencimentoRaw}`);
              
              // Verificar se temos uma data do Excel (número serializado)
              let vencimento;
              if (typeof vencimentoRaw === 'number' || (typeof vencimentoRaw === 'string' && !isNaN(Number(vencimentoRaw)))) {
                try {
                  // Tentar converter como número serial do Excel
                  const excelDate = XLSX.SSF.parse_date_code(Number(vencimentoRaw));
                  vencimento = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                  console.log(`Linha ${rowNumber}: Vencimento convertido de número Excel = "${vencimento}"`);
                } catch (e) {
                  // Se falhar, tentar o formatador normal
                  vencimento = formatDate(vencimentoRaw);
                  console.log(`Linha ${rowNumber}: Vencimento formatado normalmente = "${vencimento}"`);
                }
              } else {
                // Formatar o vencimento para o formato correto (YYYY-MM-DD)
                vencimento = formatDate(vencimentoRaw);
                console.log(`Linha ${rowNumber}: Vencimento formatado = "${vencimento}"`);
              }
              
              // Obter e formatar a competência
              const competenciaRaw = getColumnValue(columnMappings.competencia) || vencimentoRaw;
              
              console.log(`Tentando extrair competência: ${competenciaRaw} tipo: ${typeof competenciaRaw}`);
              const competencia = extractCompetencia(competenciaRaw);
              console.log(`Linha ${rowNumber}: Competência original = "${competenciaRaw}", formatada = "${competencia}"`);
              
              // Obter e formatar previsto_para
              const previsto_paraRaw = getColumnValue(columnMappings.previsto_para);
              const previsto_para = formatDate(previsto_paraRaw);
              console.log(`Linha ${rowNumber}: Previsto para original = "${previsto_paraRaw}", formatado = "${previsto_para}"`);
              
              // Obter e formatar data_pagamento
              const data_pagamentoRaw = getColumnValue(columnMappings.data_pagamento);
              const data_pagamento = formatDate(data_pagamentoRaw);
              console.log(`Linha ${rowNumber}: Data pagamento original = "${data_pagamentoRaw}", formatado = "${data_pagamento}"`);
              
              // Obter e formatar valor_categoria (valor monetário)
              const valor_categoriaRaw = getColumnValue(columnMappings.valor_categoria);
              const valor_categoria = parseValue(valor_categoriaRaw);
              console.log(`Linha ${rowNumber}: Valor categoria original = "${valor_categoriaRaw}", formatado = ${valor_categoria}`);
              
              // Verificar campos obrigatórios
              if (!vencimento) {
                throw new Error(`Campo 'vencimento' é obrigatório e não pôde ser formatado corretamente: "${vencimentoRaw}"`);
              }
              
              if (!competencia) {
                throw new Error(`Campo 'competencia' é obrigatório e não pôde ser formatado corretamente: "${competenciaRaw}"`);
              }
              
              const custoItem = {
                vencimento,
                competencia,
                previsto_para,
                data_pagamento,
                cpf_cnpj: String(getColumnValue(columnMappings.cpf_cnpj) || ''),
                nome: String(getColumnValue(columnMappings.nome) || ''),
                descricao: String(getColumnValue(columnMappings.descricao) || ''),
                referencia: String(getColumnValue(columnMappings.referencia) || ''),
                categoria: String(getColumnValue(columnMappings.categoria) || ''),
                detalhamento: String(getColumnValue(columnMappings.detalhamento) || ''),
                centro_custo: String(getColumnValue(columnMappings.centro_custo) || ''),
                valor_categoria,
                identificador: String(getColumnValue(columnMappings.identificador) || ''),
                conta: String(getColumnValue(columnMappings.conta) || ''),
                excel_id: String(excelId)
              };
              
              console.log(`Linha ${rowNumber}: Item processado:`, custoItem);
              custosData.push(custoItem);
            } catch (error) {
              console.error(`Erro ao processar linha ${rowNumber}:`, error);
              erros.push(`Linha ${rowNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            }
          }
          
          // Verificar se temos dados válidos para inserir
          if (custosData.length === 0) {
            throw new Error(`Nenhum dado válido para importar. Erros: ${erros.join(', ')}`);
          }
          
          console.log('Dados a serem inseridos:', custosData);
          
          // Inserir os dados no Supabase em lotes de 50 registros
          const BATCH_SIZE = 50;
          let sucessos = 0;
          let falhas = 0;
          
          for (let i = 0; i < custosData.length; i += BATCH_SIZE) {
            const batch = custosData.slice(i, i + BATCH_SIZE);
            
            try {
              const { data, error } = await supabase
                .from('custos')
                .insert(batch);
              
              if (error) {
                console.error('Erro ao inserir lote:', error);
                falhas += batch.length;
                throw error;
              } else {
                sucessos += batch.length;
              }
            } catch (error) {
              console.error('Erro ao processar lote:', error);
              falhas += batch.length;
            }
          }
          
          // Mostrar resultado da importação
          if (sucessos > 0) {
    toast({
              title: "Importação concluída",
              description: `${sucessos} registros importados com sucesso${falhas > 0 ? ` (${falhas} falhas)` : ''}${erros.length > 0 ? '. Alguns registros foram ignorados devido a erros.' : ''}`
            });
            
            // Atualizar a lista de custos
            fetchCustos(true);
          } else {
            toast({
              title: "Falha na importação",
              description: "Nenhum registro foi importado. Verifique o formato dos dados.",
              variant: "destructive"
            });
          }
          
          // Exibir erros específicos se houver
          if (erros.length > 0) {
            console.error('Erros durante a importação:', erros);
            
            // Limitar a quantidade de erros exibidos para não sobrecarregar o toast
            const errosExibidos = erros.slice(0, 3);
            if (erros.length > 3) {
              errosExibidos.push(`... e mais ${erros.length - 3} erros. Verifique o console para detalhes.`);
            }
            
            toast({
              title: "Erros na importação",
              description: errosExibidos.join('\n'),
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Erro ao processar arquivo:', error);
          toast({
            title: "Erro na importação",
            description: `Não foi possível processar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            variant: "destructive"
          });
        } finally {
          setIsImporting(false);
          setOpenImportDialog(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Erro na leitura",
          description: "Não foi possível ler o arquivo.",
          variant: "destructive"
        });
        setIsImporting(false);
        setOpenImportDialog(false);
      };
      
      // Iniciar a leitura do arquivo
      try {
        if (typeof reader.readAsBinaryString === 'function') {
          // Método mais compatível com versões antigas
          reader.readAsBinaryString(file);
        } else {
          // Método moderno
          reader.readAsArrayBuffer(file);
        }
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        toast({
          title: "Erro na leitura",
          description: "Não foi possível ler o arquivo. Tente novamente com um arquivo menor ou em formato diferente.",
          variant: "destructive"
        });
        setIsImporting(false);
        setOpenImportDialog(false);
      }
      
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao tentar importar o arquivo.",
        variant: "destructive"
      });
      setIsImporting(false);
      setOpenImportDialog(false);
    }
  };

  // Função para testar o processamento do arquivo Excel sem salvar no banco de dados
  const testarProcessamentoExcel = async (file: File) => {
    try {
      setIsImporting(true);
      toast({
        title: "Modo de teste",
        description: "Testando processamento do arquivo sem salvar no banco de dados."
      });
      
      // Ler o arquivo Excel
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          console.log('[TESTE] Tipo de dados lido:', typeof data);
          
          // Determinar o tipo de dados com base no método de leitura usado
          const type = typeof data === 'string' ? 'binary' : 'array';
          console.log('[TESTE] Usando tipo de leitura:', type);
          
          const workbook = XLSX.read(data, { 
            type, 
            cellDates: true,
            dateNF: 'yyyy-mm-dd'  // Formato de data para saída
          });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          console.log('[TESTE] Planilha lida com sucesso. Nome da folha:', sheetName);
          
          // Converter para JSON com cabeçalhos reais
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,  // Retorna strings em vez de valores formatados
            dateNF: 'yyyy-mm-dd',
            defval: '',  // Valor padrão para células vazias
            blankrows: false, // Ignorar linhas em branco
            header: 1 // Usar a primeira linha como cabeçalho
          }) as any[];
          
          // Verificar se temos dados
          if (jsonData.length <= 1) { // Apenas cabeçalho ou vazio
            throw new Error('O arquivo não contém dados válidos');
          }
          
          // Obter cabeçalhos da primeira linha
          const headers = (jsonData[0] as any[]).map(h => String(h).toLowerCase());
          console.log('[TESTE] Cabeçalhos encontrados:', headers);
          
          // Mapear os cabeçalhos para as colunas
          const columnMappings = {
            id: headers.findIndex(h => 
              h.includes('id') || h === '#' || h === 'n' || h === 'num' || h === 'número' || h === 'numero'),
            vencimento: headers.findIndex(h => 
              h.includes('vencimento') || h.includes('venc')),
            competencia: headers.findIndex(h => 
              h.includes('competencia') || h.includes('competência') || h.includes('mês de competência') || h.includes('mes')),
            previsto_para: headers.findIndex(h => 
              h.includes('previsto para') || h.includes('previsão') || h.includes('previsto')),
            data_pagamento: headers.findIndex(h => 
              h.includes('data pagamento') || h.includes('pagamento') || h.includes('pago em') || h.includes('data de pagamento')),
            cpf_cnpj: headers.findIndex(h => 
              h.includes('cpf') || h.includes('cnpj') || h.includes('cpf/cnpj') || h.includes('documento')),
            nome: headers.findIndex(h => 
              h.includes('nome') || h.includes('fornecedor')),
            descricao: headers.findIndex(h => 
              h.includes('descricao') || h.includes('descrição') || h.includes('desc')),
            referencia: headers.findIndex(h => 
              h.includes('referencia') || h.includes('referência') || h.includes('ref')),
            categoria: headers.findIndex(h => 
              h.includes('categoria') || h.includes('tipo')),
            detalhamento: headers.findIndex(h => 
              h.includes('detalhamento') || h.includes('detalhe')),
            centro_custo: headers.findIndex(h => 
              h.includes('centro') || h.includes('custo') || h.includes('centro de custo')),
            valor_categoria: headers.findIndex(h => 
              h.includes('valor') || h.includes('total') || h.includes('valor categoria') || h.includes('valor_categoria') || h.includes('valor categoria/centro de custo')),
            identificador: headers.findIndex(h => 
              h.includes('identificador')),
            conta: headers.findIndex(h => 
              h.includes('conta'))
          };
          
          console.log('[TESTE] Mapeamento de colunas:', columnMappings);
          
          // Mapear os dados para o formato da tabela custos
          const custosData = [];
          const erros = [];
          
          // Começar do índice 1 para pular o cabeçalho
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            const rowNumber = i + 1; // +1 porque os arrays começam em 0 e já estamos pulando o cabeçalho
            
            try {
              // Verificar se a linha tem dados
              if (!row || row.length === 0 || !row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                console.log(`[TESTE] Linha ${rowNumber} vazia, pulando...`);
                continue;
              }
              
              // Obter valores das células com base no mapeamento de colunas
              const getColumnValue = (columnIndex: number) => {
                if (columnIndex >= 0 && columnIndex < row.length) {
                  return row[columnIndex];
                }
                return null;
              };
              
              // Capturar o ID da planilha
              const excelId = getColumnValue(columnMappings.id) || String(rowNumber);
              console.log(`[TESTE] Linha ${rowNumber}: ID da planilha = "${excelId}"`);
              
              // Obter o valor de vencimento da planilha
              const vencimentoRaw = getColumnValue(columnMappings.vencimento);
              
              console.log(`[TESTE] Linha ${rowNumber}: Vencimento original = "${vencimentoRaw}", tipo: ${typeof vencimentoRaw}`);
              
              // Verificar se temos uma data do Excel (número serializado)
              let vencimento;
              if (typeof vencimentoRaw === 'number' || (typeof vencimentoRaw === 'string' && !isNaN(Number(vencimentoRaw)))) {
                try {
                  // Tentar converter como número serial do Excel
                  const excelDate = XLSX.SSF.parse_date_code(Number(vencimentoRaw));
                  vencimento = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                  console.log(`[TESTE] Linha ${rowNumber}: Vencimento convertido de número Excel = "${vencimento}"`);
                } catch (e) {
                  // Se falhar, tentar o formatador normal
                  vencimento = formatDate(vencimentoRaw);
                  console.log(`[TESTE] Linha ${rowNumber}: Vencimento formatado normalmente = "${vencimento}"`);
                }
              } else {
                // Formatar o vencimento para o formato correto (YYYY-MM-DD)
                vencimento = formatDate(vencimentoRaw);
                console.log(`[TESTE] Linha ${rowNumber}: Vencimento formatado = "${vencimento}"`);
              }
              
              // Obter e formatar a competência
              const competenciaRaw = getColumnValue(columnMappings.competencia) || vencimentoRaw;
              
              console.log(`[TESTE] Tentando extrair competência: ${competenciaRaw} tipo: ${typeof competenciaRaw}`);
              const competencia = extractCompetencia(competenciaRaw);
              console.log(`[TESTE] Linha ${rowNumber}: Competência original = "${competenciaRaw}", formatada = "${competencia}"`);
              
              // Obter e formatar previsto_para
              const previsto_paraRaw = getColumnValue(columnMappings.previsto_para);
              const previsto_para = formatDate(previsto_paraRaw);
              console.log(`[TESTE] Linha ${rowNumber}: Previsto para original = "${previsto_paraRaw}", formatado = "${previsto_para}"`);
              
              // Obter e formatar data_pagamento
              const data_pagamentoRaw = getColumnValue(columnMappings.data_pagamento);
              const data_pagamento = formatDate(data_pagamentoRaw);
              console.log(`[TESTE] Linha ${rowNumber}: Data pagamento original = "${data_pagamentoRaw}", formatado = "${data_pagamento}"`);
              
              // Obter e formatar valor_categoria (valor monetário)
              const valor_categoriaRaw = getColumnValue(columnMappings.valor_categoria);
              const valor_categoria = parseValue(valor_categoriaRaw);
              console.log(`[TESTE] Linha ${rowNumber}: Valor categoria original = "${valor_categoriaRaw}", formatado = ${valor_categoria}`);
              
              // Verificar campos obrigatórios
              if (!vencimento) {
                throw new Error(`Campo 'vencimento' é obrigatório e não pôde ser formatado corretamente: "${vencimentoRaw}"`);
              }
              
              if (!competencia) {
                throw new Error(`Campo 'competencia' é obrigatório e não pôde ser formatado corretamente: "${competenciaRaw}"`);
              }
              
              const custoItem = {
                vencimento,
                competencia,
                previsto_para,
                data_pagamento,
                cpf_cnpj: String(getColumnValue(columnMappings.cpf_cnpj) || ''),
                nome: String(getColumnValue(columnMappings.nome) || ''),
                descricao: String(getColumnValue(columnMappings.descricao) || ''),
                referencia: String(getColumnValue(columnMappings.referencia) || ''),
                categoria: String(getColumnValue(columnMappings.categoria) || ''),
                detalhamento: String(getColumnValue(columnMappings.detalhamento) || ''),
                centro_custo: String(getColumnValue(columnMappings.centro_custo) || ''),
                valor_categoria,
                identificador: String(getColumnValue(columnMappings.identificador) || ''),
                conta: String(getColumnValue(columnMappings.conta) || ''),
                excel_id: String(excelId)
              };
              
              console.log(`[TESTE] Linha ${rowNumber}: Item processado:`, custoItem);
              custosData.push(custoItem);
            } catch (error) {
              console.error(`[TESTE] Erro ao processar linha ${rowNumber}:`, error);
              erros.push(`Linha ${rowNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            }
          }
          
          // Exibir resultado do teste
          toast({
            title: "Teste concluído",
            description: `${custosData.length} registros processados com sucesso${erros.length > 0 ? ` (${erros.length} erros)` : ''}`
          });
          
          console.log('[TESTE] Total de registros processados:', custosData.length);
          console.log('[TESTE] Registros processados:', custosData);
          console.log('[TESTE] Erros encontrados:', erros);
          
        } catch (error) {
          console.error('[TESTE] Erro ao processar arquivo:', error);
          toast({
            title: "Erro no teste",
            description: `Não foi possível processar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            variant: "destructive"
          });
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Erro na leitura",
          description: "Não foi possível ler o arquivo.",
          variant: "destructive"
        });
        setIsImporting(false);
      };
      
      // Iniciar a leitura do arquivo
      try {
        if (typeof reader.readAsBinaryString === 'function') {
          reader.readAsBinaryString(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      } catch (error) {
        console.error('[TESTE] Erro ao ler arquivo:', error);
        toast({
          title: "Erro na leitura",
          description: "Não foi possível ler o arquivo.",
          variant: "destructive"
        });
        setIsImporting(false);
      }
      
    } catch (error) {
      console.error('[TESTE] Erro geral:', error);
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro ao tentar testar o arquivo.",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  };

  // Função para lidar com o upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log('Arquivo selecionado:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);
      
      // Verificar se é um arquivo Excel
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        
        // Verificar tamanho do arquivo (limite de 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: "O arquivo selecionado é muito grande. O tamanho máximo é 10MB.",
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Arquivo selecionado",
          description: "Arquivo pronto para importação."
        });
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls).",
          variant: "destructive"
        });
        setSelectedFile(null);
      }
    }
  };
  
  // Estado para o diálogo de confirmação de importação
  const [openImportConfirmDialog, setOpenImportConfirmDialog] = useState(false);

  // Função para confirmar a importação
  const handleImportConfirm = () => {
    if (selectedFile) {
      // Abrir diálogo de confirmação em vez de processar imediatamente
      setOpenImportConfirmDialog(true);
    } else {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para importar.",
        variant: "destructive"
      });
    }
  };
  
  // Função para confirmar e processar a importação após confirmação
  const handleConfirmAndProcess = async () => {
    if (selectedFile) {
      setOpenImportConfirmDialog(false);
      
      toast({
        title: "Processando arquivo",
        description: "O arquivo está sendo processado. Isso pode levar alguns segundos."
      });
      
      // Primeiro deletar todos os dados existentes
      try {
        await handleDeleteAllCustos();
        // Após deletar com sucesso, importar os novos dados
        processExcelFile(selectedFile);
      } catch (error) {
        console.error('Erro ao limpar dados existentes:', error);
        toast({
          title: "Erro ao limpar dados",
          description: "Não foi possível limpar os dados existentes antes da importação.",
          variant: "destructive"
        });
      }
    }
  };

  // Função para avançar para a próxima etapa do formulário
  const handleNextStep = () => {
    // Validar os campos da etapa atual antes de avançar
    const fieldsToValidate: FieldName[] = custoFormStep === 1 ? ["vencimento", "competencia", "previsto_para", "data_pagamento", "cpf_cnpj", "nome", "descricao"] : [];
    const isValid = fieldsToValidate.every(field => !!form.getValues(field));
    if (isValid) {
      setCustoFormStep(2);
    } else {
      // Informar o usuário para preencher todos os campos necessários
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive"
      });

      // Acionar validação manual nos campos
      fieldsToValidate.forEach(field => form.trigger(field));
    }
  };

  // Função para voltar para a etapa anterior do formulário
  const handlePreviousStep = () => {
    setCustoFormStep(1);
  };

  // Função para limpar o formulário e fechar o modal
  const handleCloseForm = () => {
    form.reset();
    setCustoFormStep(1);
    setOpenNewCusto(false);
  };

  // Função para adicionar novo custo
  const handleAddCusto = async (data: CustoFormData) => {
    const { error } = await supabase
      .from("custos")
      .insert([data]);

    if (error) {
      toast({
        title: "Erro ao adicionar custo",
        description: "Não foi possível adicionar o custo ao banco de dados.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Custo adicionado",
      description: "O custo foi adicionado com sucesso!"
    });

    setOpenNewCusto(false);
    fetchCustos(true); // Atualiza timestamp ao adicionar
  };

  // Novo estado para o modal de confirmação de exclusão
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função para abrir o modal de confirmação de exclusão
  const confirmDeleteAll = () => {
    setOpenDeleteConfirmDialog(true);
  };

  // Função para deletar todos os dados da tabela de custos
  const handleDeleteAllCustos = async (showToast: boolean = true) => {
    try {
      setIsDeleting(true);
      
      // Primeiro, buscar todos os IDs
      const { data: allIds, error: fetchError } = await supabase
        .from('custos')
        .select('id');
        
      if (fetchError) {
        throw fetchError;
      }
      
      if (allIds && allIds.length > 0) {
        // Deletar em lotes de 1000 registros para evitar problemas com limites de API
        const batchSize = 1000;
        for (let i = 0; i < allIds.length; i += batchSize) {
          const batch = allIds.slice(i, i + batchSize);
          const ids = batch.map(item => item.id);
          
          const { error: deleteError } = await supabase
            .from('custos')
            .delete()
            .in('id', ids);
            
          if (deleteError) {
            throw deleteError;
          }
        }
      }
      
      // Atualiza a lista após deletar
      setCustosData([]);
      setFilteredCustos([]);
      
      if (showToast) {
        toast({
          title: "Sucesso!",
          description: `Todos os ${allIds?.length || 0} registros da tabela de custos foram removidos.`,
          variant: "default"
        });
      }
      
      // Fecha o modal de confirmação
      setOpenDeleteConfirmDialog(false);
      
      return allIds?.length || 0;
    } catch (error) {
      console.error('Erro ao deletar custos:', error);
      if (showToast) {
        toast({
          title: "Erro ao deletar dados",
          description: "Não foi possível remover todos os registros. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Centro de Custos</h1>
        <p className="text-muted-foreground">
          Análise e gerenciamento de custos por departamento
        </p>
      </div>

      <div className="w-full bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Última atualização da planilha: <span className="font-medium text-foreground">{lastUpdate || "Ainda não atualizado"}</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-6 md:px-10 mx-auto max-w-7xl">
        <StatCard
          title="Total de Custos"
          value={`R$ ${custosData.reduce((sum, custo) => sum + Number(custo.valor_categoria ?? 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Período atual"
          icon={<BadgeDollarSign className="h-4 w-4 text-emerald-500" />}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900/30"
        />

        <StatCard
          title="Principal Centro de Custo"
          value={(() => {
              type CentroCustoMap = {
                [key: string]: number;
              };
            const centrosCusto = custosData.reduce<CentroCustoMap>((acc, custo) => {
                const centroCusto = custo.centro_custo || "Não categorizado";
                acc[centroCusto] = (acc[centroCusto] || 0) + Number(custo.valor_categoria ?? 0);
                return acc;
              }, {});
              type Entry = [string, number];
              const topCentroCusto = Object.entries(centrosCusto) as Entry[];
              if (topCentroCusto.length === 0) return "N/A";
              topCentroCusto.sort((a, b) => b[1] - a[1]);
              return topCentroCusto[0][0];
            })()}
          description="Maior consumo de recursos"
          icon={<BadgeDollarSign className="h-4 w-4 text-blue-500" />}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900/30"
        />

        <StatCard
          title="Principal Categoria"
          value={(() => {
              type CategoriaMap = {
                [key: string]: number;
              };
            const categorias = custosData.reduce<CategoriaMap>((acc, custo) => {
                const categoria = custo.categoria || "Não categorizado";
                acc[categoria] = (acc[categoria] || 0) + Number(custo.valor_categoria ?? 0);
                return acc;
              }, {});
              type Entry = [string, number];
              const topCategoria = Object.entries(categorias) as Entry[];
              if (topCategoria.length === 0) return "N/A";
              topCategoria.sort((a, b) => b[1] - a[1]);
              return topCategoria[0][0];
            })()}
          description="Maior despesa por categoria"
          icon={<BadgeDollarSign className="h-4 w-4 text-purple-500" />}
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-100 dark:border-purple-900/30"
        />
      </div>
      
      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Detalhamento de Custos</CardTitle>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar..." className="w-full pl-8 md:w-[200px] lg:w-[300px]" />
              </div>
              <ShadPopover open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <ShadPopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filtros
                  </Button>
                </ShadPopoverTrigger>
                <ShadPopoverContent className="w-[300px] p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filtrar Custos</h4>
                    <div className="space-y-2">
                      <Label htmlFor="filter-vencimento">Vencimento</Label>
                      <Input
                        id="filter-vencimento"
                        type="date"
                        value={filtroDataInicio instanceof Date ? filtroDataInicio.toISOString().slice(0, 10) : ""}
                        onChange={e => {
                        if (e.target.value) {
                          setFiltroDataInicio(new Date(e.target.value));
                        } else {
                          setFiltroDataInicio(undefined);
                        }
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-categoria">Categoria</Label>
                      <Input
                        id="filter-categoria"
                        value={filtroCategoria || ""}
                        onChange={e => setFiltroCategoria(e.target.value || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-centro-custo">Centro de Custo</Label>
                      <Input
                        id="filter-centro-custo"
                        value={filtroCentroCusto || ""}
                        onChange={e => setFiltroCentroCusto(e.target.value || null)}
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={limparFiltros}>
                        Limpar
                      </Button>
                      <Button size="sm" onClick={aplicarFiltros}>
                        Aplicar Filtros
                      </Button>
                    </div>
                  </div>
                </ShadPopoverContent>
              </ShadPopover>
              <Button variant="destructive" size="sm" onClick={confirmDeleteAll}>
                <Trash2 className="h-4 w-4 mr-1" />
                Deletar Todos os Custos
              </Button>
              <Button variant="outline" size="sm" onClick={() => setOpenImportDialog(true)}>
                <Upload className="h-4 w-4 mr-1" />
                Importar
              </Button>
              <Dialog open={openImportDialog} onOpenChange={setOpenImportDialog}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Importar Custos</DialogTitle>
                    <DialogDescription>
                      Selecione um arquivo Excel (.xlsx) para importar custos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="file-upload" className="block mb-2">
                      Arquivo Excel
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Arquivo selecionado: {selectedFile.name}
                      </div>
                    )}
                    {importError && (
                      <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {importError}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenImportDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImportConfirm}
                      disabled={isImporting || !selectedFile}
                    >
                      {isImporting ? "Importando..." : "Importar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold first:rounded-tl-lg">#</TableHead>
                      <TableHead className="font-semibold">Vencimento</TableHead>
                      <TableHead className="font-semibold">Competência</TableHead>
                      <TableHead className="font-semibold">Previsto Para</TableHead>
                      <TableHead className="font-semibold">Data Pagamento</TableHead>
                      <TableHead className="font-semibold">CPF/CNPJ</TableHead>
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold min-w-[180px]">Descrição</TableHead>
                      <TableHead className="font-semibold">Referência</TableHead>
                      <TableHead className="font-semibold">Categoria</TableHead>
                      <TableHead className="font-semibold">Centro de Custo</TableHead>
                      <TableHead className="font-semibold text-right">Valor</TableHead>
                      <TableHead className="font-semibold">Identificador</TableHead>
                      <TableHead className="font-semibold">Conta</TableHead>
                      <TableHead className="font-semibold w-[80px] text-center last:rounded-tr-lg">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustos.length > 0 ? paginatedCustos.map((custo, index) => <TableRow key={custo.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-center">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {custo.vencimento ? format(new Date(custo.vencimento), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {custo.competencia ? format(new Date(custo.competencia), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {custo.previsto_para ? format(new Date(custo.previsto_para), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {custo.data_pagamento ? format(new Date(custo.data_pagamento), "dd/MM/yyyy") : "-"}
                          </TableCell>
                          <TableCell className="max-w-[140px]">
                            <div className="truncate" title={custo.cpf_cnpj || "-"}> {custo.cpf_cnpj || "-"}</div>
                          </TableCell>
                          <TableCell className="max-w-[160px]">
                            <div className="truncate font-medium" title={custo.nome || "-"}> {custo.nome || "-"}</div>
                          </TableCell>
                          <TableCell className="min-w-[180px] max-w-[220px]">
                            <ShadPopover>
                              <ShadPopoverTrigger asChild>
                                <div className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" title="Clique para ver descrição completa">
                                  <div className="line-clamp-2 text-sm leading-relaxed">
                                    {custo.descricao && custo.descricao.length > 60 ? `${custo.descricao.substring(0, 60)}...` : custo.descricao || "-"}
                                  </div>
                                </div>
                              </ShadPopoverTrigger>
                              <ShadPopoverContent className="max-w-sm p-3">
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {custo.descricao || "-"}
                                </div>
                              </ShadPopoverContent>
                            </ShadPopover>
                          </TableCell>
                          <TableCell className="max-w-[120px]">
                            <div className="truncate" title={custo.referencia || "-"}> {custo.referencia || "-"}</div>
                          </TableCell>
                          <TableCell className="max-w-[120px]">
                            <div className="truncate" title={custo.categoria || "-"}> {custo.categoria || "-"}</div>
                          </TableCell>
                          <TableCell className="max-w-[120px]">
                            <div className="truncate" title={custo.centro_custo || "-"}> {custo.centro_custo || "-"}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                            {formatCurrency(Number(custo.valor_categoria ?? 0))}
                          </TableCell>
                          <TableCell className="max-w-[120px]">
                            <div className="truncate" title={custo.identificador || "-"}> {custo.identificador || "-"}</div>
                          </TableCell>
                          <TableCell className="max-w-[120px]">
                            <div className="truncate" title={custo.conta || "-"}> {custo.conta || "-"}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <TableActionMenu row={custo} onView={handleViewCusto} onEdit={handleEditCusto} onDelete={handleDeleteCusto} />
                          </TableCell>
                        </TableRow>) : <TableRow>
                        <TableCell colSpan={15} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                            <span>Nenhum custo encontrado para os filtros selecionados.</span>
                          </div>
                        </TableCell>
                      </TableRow>}
                  </TableBody>
                </Table>
              </div>
              {filteredCustos.length > 0 && 
                <div className="border-t bg-white dark:bg-gray-950 p-2">
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCustos.length)} de {filteredCustos.length} registros
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Primeira página</span>
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Página anterior</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium">Página</p>
                          <Input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                              const page = parseInt(e.target.value);
                              if (page >= 1 && page <= totalPages) {
                                setCurrentPage(page);
                              }
                            }}
                            className="h-8 w-[70px] text-center"
                          />
                          <p className="text-sm font-medium">de {totalPages}</p>
                        </div>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Próxima página</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Última página</span>
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo para visualizar detalhes de um custo */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Custo</DialogTitle>
            <DialogDescription>
              Informações detalhadas do custo selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCusto && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-1">ID</h4>
                <p className="text-sm break-words">{selectedCusto.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Vencimento</h4>
                <p className="text-sm">{format(new Date(selectedCusto.vencimento || ""), "dd/MM/yyyy", {
                locale: ptBR
              })}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Competência</h4>
                <p className="text-sm">{selectedCusto.competencia ? format(new Date(selectedCusto.competencia), "dd/MM/yyyy") : "-"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Previsto Para</h4>
                <p className="text-sm">{selectedCusto.previsto_para ? format(new Date(selectedCusto.previsto_para), "dd/MM/yyyy", {
                locale: ptBR
              }) : "-"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Data de Pagamento</h4>
                <p className="text-sm">{selectedCusto.data_pagamento ? format(new Date(selectedCusto.data_pagamento), "dd/MM/yyyy", {
                locale: ptBR
              }) : "-"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">CPF/CNPJ</h4>
                <p className="text-sm break-words">{selectedCusto.cpf_cnpj}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Nome</h4>
                <p className="text-sm break-words">{selectedCusto.nome}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium mb-1">Descrição</h4>
                <p className="text-sm break-words whitespace-pre-wrap">{selectedCusto.descricao}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Referência</h4>
                <p className="text-sm break-words">{selectedCusto.referencia}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Categoria</h4>
                <p className="text-sm break-words">{selectedCusto.categoria}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium mb-1">Detalhamento</h4>
                <p className="text-sm break-words whitespace-pre-wrap">{selectedCusto.detalhamento}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Centro de Custo</h4>
                <p className="text-sm break-words">{selectedCusto.centro_custo}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Valor Categoria</h4>
                <p className="text-sm font-medium text-green-600">{formatCurrency(Number(selectedCusto.valor_categoria ?? 0))}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Identificador</h4>
                <p className="text-sm break-words">{selectedCusto.identificador}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Conta</h4>
                <p className="text-sm break-words">{selectedCusto.conta}</p>
              </div>
            </div>}
          
          <DialogFooter>
            <Button onClick={() => setOpenViewDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para deletar todos os custos */}
      <Dialog open={openDeleteConfirmDialog} onOpenChange={setOpenDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmação de exclusão</DialogTitle>
            <DialogDescription>
              ATENÇÃO: Esta ação irá deletar TODOS os dados da tabela de custos. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Todos os registros de custos serão permanentemente removidos do sistema.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteConfirmDialog(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteAllCustos(true)} disabled={isDeleting}>
              {isDeleting ? "Deletando..." : "Deletar Todos os Dados"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para importação */}
      <Dialog open={openImportConfirmDialog} onOpenChange={setOpenImportConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmação de importação</DialogTitle>
            <DialogDescription>
              ATENÇÃO: Esta ação irá deletar TODOS os dados existentes antes de importar os novos dados da planilha.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Os dados atuais serão substituídos pelos dados da planilha selecionada.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenImportConfirmDialog(false)} disabled={isImporting}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAndProcess} disabled={isImporting}>
              {isImporting ? "Importando..." : "Confirmar Importação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Espaço no final da página */}
      <div className="h-8 md:h-12"></div>
    </div>;
}