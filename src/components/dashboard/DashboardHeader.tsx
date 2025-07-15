import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eraser } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const filtrosAtivos = selectedMonth !== 0 && selectedYear !== 0;

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
