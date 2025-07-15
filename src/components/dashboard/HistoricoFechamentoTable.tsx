import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Clock, History, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useHistoricoFechamento, HistoricoFechamento } from '@/hooks/useHistoricoFechamento';

interface HistoricoFechamentoTableProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
}

const HistoricoFechamentoTable = ({
  title = "Histórico de Fechamento",
  description = "Histórico dos fechamentos contábeis realizados",
  icon = <Clock className="h-5 w-5 text-[#A61B67]" />,
  emptyMessage = "Nenhum histórico de fechamento disponível",
  isLoading: externalIsLoading,
}: HistoricoFechamentoTableProps) => {
  // Usar o hook personalizado
  const { historicos, isLoading: internalIsLoading, error } = useHistoricoFechamento();
  
  // Combinar o estado de carregamento externo e interno
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  
  // Estado para controlar o diálogo de visualização
  const [selectedHistorico, setSelectedHistorico] = useState<HistoricoFechamento | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Limitar para apenas 4 registros mais recentes
  const displayData = historicos.slice(0, 4);

  // Função para formatar a data
  const formatarData = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return data;
    }
  };

  // Função para abrir o diálogo de visualização
  const handleViewHistorico = (historico: HistoricoFechamento) => {
    if (isLoading) return;
    setSelectedHistorico(historico);
    setDialogOpen(true);
  };

  if (error) {
    return (
      <Card className="col-span-1 overflow-hidden h-[500px] flex flex-col dark:bg-[#0f172a] border border-[#F2F2F2] dark:border-[#03658C]/20">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardTitle className="text-red-600 dark:text-red-400">Erro ao carregar histórico</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 overflow-hidden hover:shadow-md transition-shadow h-[500px] flex flex-col dark:bg-[#0f172a] border border-[#F2F2F2] dark:border-[#03658C]/20">
      <CardHeader className="bg-gradient-to-r from-[#A61B67]/5 to-[#D90B91]/5 dark:from-[#A61B67]/10 dark:to-[#D90B91]/10 pb-2">
        <CardTitle className="flex justify-between items-center text-lg">
          <span>{title}</span>
          {icon}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 overflow-hidden flex-1">
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 animate-pulse">
                    <Skeleton className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <Skeleton className="h-3 w-1/5" />
                      <Skeleton className="h-3 w-1/6" />
                    </div>
                  </div>
                  <div className="self-center">
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))
            ) : displayData.length > 0 ? displayData.map((historico) => (
              <div 
                key={historico.id} 
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/10 p-3 rounded-lg border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:shadow-sm"
                onClick={() => handleViewHistorico(historico)}
              >
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{historico.mes}</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                      Resp: {historico.responsavel}
                    </p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {formatarData(historico.data_fechamento)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="truncate max-w-[150px] text-muted-foreground">
                      {historico.observacoes}
                    </div>
                    <Badge 
                      variant="outline" 
                      className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 text-xs"
                    >
                      {historico.status}
                    </Badge>
                  </div>
                </div>
                <div className="self-center">
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Footer vazio */}
      <CardFooter className="border-t px-6 py-3 bg-muted/20 dark:bg-gray-800/50 text-xs font-medium flex items-center justify-center dark:text-gray-300 h-[40px] overflow-hidden">
        <span></span>
      </CardFooter>

      {/* Diálogo de visualização detalhada */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Fechamento</DialogTitle>
            <DialogDescription>
              Informações detalhadas do fechamento contábil
            </DialogDescription>
          </DialogHeader>
          {selectedHistorico && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm">Mês de Referência</h4>
                  <p className="text-sm text-muted-foreground">{selectedHistorico.mes}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Data do Fechamento</h4>
                  <p className="text-sm text-muted-foreground">{formatarData(selectedHistorico.data_fechamento)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Responsável</h4>
                  <p className="text-sm text-muted-foreground">{selectedHistorico.responsavel}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Status</h4>
                  <Badge variant="outline" className="mt-1">
                    {selectedHistorico.status}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm">Observações</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedHistorico.observacoes}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default HistoricoFechamentoTable;
