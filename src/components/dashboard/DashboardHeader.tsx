import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface DashboardHeaderProps {
  greeting: string;
  motivationalMessage: string;
  selectedPeriod: string;
  setSelectedPeriod: (value: string) => void;
  filterDialogOpen: boolean;
  setFilterDialogOpen: (open: boolean) => void;
  filtroDataInicio?: Date;
  setFiltroDataInicio: (date: Date | undefined) => void;
  filtroDataFim?: Date;
  setFiltroDataFim: (date: Date | undefined) => void;
  filtroDataInicioEmpresa: string;
  setFiltroDataInicioEmpresa: (date: string) => void;
  filtroDataFimEmpresa: string;
  setFiltroDataFimEmpresa: (date: string) => void;
  filtroSemDataInicio: boolean;
  setFiltroSemDataInicio: (checked: boolean) => void;
  aplicarFiltros: () => void;
  limparFiltros: () => void;
  userName?: string;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

const DashboardHeader = ({
  greeting,
  motivationalMessage,
  selectedPeriod,
  setSelectedPeriod,
  filterDialogOpen,
  setFilterDialogOpen,
  filtroDataInicio,
  setFiltroDataInicio,
  filtroDataFim,
  setFiltroDataFim,
  filtroDataInicioEmpresa,
  setFiltroDataInicioEmpresa,
  filtroDataFimEmpresa,
  setFiltroDataFimEmpresa,
  filtroSemDataInicio,
  setFiltroSemDataInicio,
  aplicarFiltros,
  limparFiltros,
  userName = "Contador",
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear
}: DashboardHeaderProps) => {

  const handleLimparFiltros = () => {
    console.log('Botão de limpar filtros clicado');
    
    // Limpar os estados locais diretamente para garantir uma resposta imediata
    setFiltroDataInicioEmpresa("");
    setFiltroDataFimEmpresa("");
    setFiltroSemDataInicio(false);
    setSelectedMonth(0);
    setSelectedYear(0);
    
    // Chamar a função de limpar filtros passada como prop
    limparFiltros();
  };

  // Nova função para aplicar filtros e fechar o popup
  const handleAplicarFiltros = () => {
    // Aplicar filtros
    aplicarFiltros();
    
    // Fechar o popup
    setFilterDialogOpen(false);
  };

  // Determinar se os filtros estão ativos
  const filtrosAtivos = selectedMonth !== 0 && selectedYear !== 0 || 
                       filtroDataInicioEmpresa !== "" || 
                       filtroDataFimEmpresa !== "" || 
                       filtroSemDataInicio;

  return (
    <>
      {/* Header com gradient e saudação */}
      <div className="bg-gradient-to-r from-[#A61B67] to-[#D90B91] mx-4 md:mx-8 px-6 md:px-8 py-6 mb-6 rounded-lg shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-white">{greeting}</h1>
          <p className="text-white/90 text-base">
            {motivationalMessage}
          </p>
        </div>
      </div>
      
      {/* Título da seção e filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-4 md:px-8 gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Visão Geral</h2>
          {!filtrosAtivos && (
            <span className="text-sm text-muted-foreground">(Mostrando todos os dados)</span>
          )}
        </div>
        
        {/* Filtros temporais */}
        <div className="flex items-center gap-4">
          <Popover open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 hover:bg-primary hover:text-white transition-colors">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[600px] max-w-[600px] p-6 shadow-lg" align="start" side="bottom">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </h4>
                  <div className="space-y-4">
                    <h5 className="text-md font-medium mb-2">Período</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dataInicioEmpresa" className="text-sm font-medium">
                          Data Início
                        </Label>
                        <Input
                          type="date"
                          id="dataInicioEmpresa"
                          value={filtroDataInicioEmpresa}
                          onChange={(e) => setFiltroDataInicioEmpresa(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataFimEmpresa" className="text-sm font-medium">
                          Data Fim
                        </Label>
                        <Input
                          type="date"
                          id="dataFimEmpresa"
                          value={filtroDataFimEmpresa}
                          onChange={(e) => setFiltroDataFimEmpresa(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Removendo o checkbox "Sem data de início"
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="semDataInicio"
                            checked={filtroSemDataInicio}
                            onCheckedChange={(checked) => setFiltroSemDataInicio(checked as boolean)}
                          />
                          <Label htmlFor="semDataInicio" className="text-sm font-medium">
                            Sem data de início
                          </Label>
                        </div>
                      </div>
                      */}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={handleLimparFiltros}
                    className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    Limpar
                  </Button>
                  <Button 
                    onClick={handleAplicarFiltros}
                    className="hover:bg-primary/90 transition-colors"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Removidos os botões de atualização e limpar filtros */}
        </div>
      </div>
    </>
  );
};

export default DashboardHeader;
