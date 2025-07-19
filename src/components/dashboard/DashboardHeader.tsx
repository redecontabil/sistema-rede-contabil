import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eraser, Filter } from "lucide-react";
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
    // Chamar a função de limpar filtros passada como prop
    limparFiltros();
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
          <Popover>
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
                  <Tabs defaultValue="periodo" className="w-full">
                    <TabsList className="w-full mb-4 grid grid-cols-2">
                      <TabsTrigger value="periodo">Período</TabsTrigger>
                      <TabsTrigger value="dataEmpresa">Data Empresa</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="periodo" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mes" className="text-sm font-medium">
                            Mês
                          </Label>
                          <Select
                            value={selectedMonth !== 0 ? selectedMonth.toString() : ""}
                            onValueChange={(value) => {
                              const monthValue = parseInt(value);
                              if (selectedYear === 0) {
                                const currentYear = new Date().getFullYear();
                                setSelectedMonth(monthValue);
                                setSelectedYear(currentYear);
                              } else {
                                setSelectedMonth(monthValue);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {MONTHS.map((month) => (
                                  <SelectItem key={month.value} value={month.value.toString()}>
                                    {month.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="ano" className="text-sm font-medium">
                            Ano
                          </Label>
                          <Select
                            value={selectedYear !== 0 ? selectedYear.toString() : ""}
                            onValueChange={(value) => {
                              const yearValue = parseInt(value);
                              if (selectedMonth === 0) {
                                const currentMonth = new Date().getMonth() + 1;
                                setSelectedYear(yearValue);
                                setSelectedMonth(currentMonth);
                              } else {
                                setSelectedYear(yearValue);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {YEARS.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="dataEmpresa" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dataInicioEmpresa" className="text-sm font-medium">
                            Data Início Empresa
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
                            Data Fim Empresa
                          </Label>
                          <Input
                            type="date"
                            id="dataFimEmpresa"
                            value={filtroDataFimEmpresa}
                            onChange={(e) => setFiltroDataFimEmpresa(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
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
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={limparFiltros}
                    className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    Limpar
                  </Button>
                  <Button 
                    onClick={aplicarFiltros}
                    className="hover:bg-primary/90 transition-colors"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={selectedMonth !== 0 ? selectedMonth.toString() : ""}
            onValueChange={(value) => {
              console.log('Selecionando mês:', value);
              // Primeiro atualizamos o estado
              const monthValue = parseInt(value);
              
              // Se o ano não estiver definido, usar o ano atual
              if (selectedYear === 0) {
                const currentYear = new Date().getFullYear();
                console.log('Definindo ano atual:', currentYear);
                
                // Atualizar ambos os estados de uma vez
                setSelectedMonth(monthValue);
                setSelectedYear(currentYear);
                
                // Aplicar filtros após um pequeno delay
                setTimeout(() => {
                  console.log('Aplicando filtros após selecionar mês e definir ano:', { 
                    selectedMonth: monthValue, 
                    selectedYear: currentYear 
                  });
                  aplicarFiltros();
                }, 50);
              } else {
                // Apenas atualizar o mês e aplicar filtros
                setSelectedMonth(monthValue);
                
                // Aplicar filtros após um pequeno delay
                setTimeout(() => {
                  console.log('Aplicando filtros após selecionar apenas mês:', { 
                    selectedMonth: monthValue, 
                    selectedYear 
                  });
                  aplicarFiltros();
                }, 50);
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={selectedYear !== 0 ? selectedYear.toString() : ""}
            onValueChange={(value) => {
              console.log('Selecionando ano:', value);
              // Primeiro atualizamos o estado
              const yearValue = parseInt(value);
              
              // Se o mês não estiver definido, usar o mês atual
              if (selectedMonth === 0) {
                const currentMonth = new Date().getMonth() + 1;
                console.log('Definindo mês atual:', currentMonth);
                
                // Atualizar ambos os estados de uma vez
                setSelectedYear(yearValue);
                setSelectedMonth(currentMonth);
                
                // Aplicar filtros após um pequeno delay
                setTimeout(() => {
                  console.log('Aplicando filtros após selecionar ano e definir mês:', { 
                    selectedMonth: currentMonth, 
                    selectedYear: yearValue 
                  });
                  aplicarFiltros();
                }, 50);
              } else {
                // Apenas atualizar o ano e aplicar filtros
                setSelectedYear(yearValue);
                
                // Aplicar filtros após um pequeno delay
                setTimeout(() => {
                  console.log('Aplicando filtros após selecionar apenas ano:', { 
                    selectedMonth, 
                    selectedYear: yearValue 
                  });
                  aplicarFiltros();
                }, 50);
              }
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleLimparFiltros}
            title="Limpar filtros"
            className={`hover:bg-muted transition-colors ${!filtrosAtivos ? 'text-muted-foreground' : ''}`}
            disabled={!filtrosAtivos}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default DashboardHeader;
