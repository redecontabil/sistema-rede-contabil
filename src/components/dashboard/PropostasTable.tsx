import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle2, XCircle, Activity, ArrowUpCircle, ArrowDownCircle, Eye } from "lucide-react";
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

interface Proposta {
  id: string | number;
  cliente: string;
  tipo?: string;
  responsavel: string;
  valor: number;
  data: string;
  status: string;
  origem?: string;
  observacoes?: string;
  tipo_proposta?: 'entrada' | 'saida';
  evento?: string;
}

interface PropostasTableProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  propostas: Proposta[];
  emptyMessage: string;
  tipo?: 'entrada' | 'saida' | 'misto';
  isLoading?: boolean;
}

const PropostasTable = ({
  title,
  description,
  icon,
  propostas = [],
  emptyMessage,
  tipo = 'misto',
  isLoading = false
}: PropostasTableProps) => {
  // Estado para controlar o diálogo de visualização
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Limitar para apenas 4 propostas mais recentes
  const displayData = Array.isArray(propostas) ? propostas.slice(0, 4) : [];

  // Função para abrir o diálogo de visualização
  const handleViewProposta = (proposta: Proposta) => {
    setSelectedProposta(proposta);
    setDialogOpen(true);
  };

  // Função para obter a classe de background baseada no status para propostas de entrada
  const getStatusBackgroundClass = (status: string) => {
    switch (status) {
      case "aprovado":
        return "bg-green-100 dark:bg-green-900/20";
      case "em_analise":
        return "bg-orange-100 dark:bg-orange-900/20";
      case "reprovado":
        return "bg-red-100 dark:bg-red-900/20";
      case "em_definicao":
        return "bg-yellow-100 dark:bg-yellow-900/20";
      default:
        return "bg-gray-100 dark:bg-gray-900/20";
    }
  };

  // Função para obter a classe de background para o badge baseada no status para propostas de entrada
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "aprovado":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
      case "em_analise":
        return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700";
      case "reprovado":
        return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
      case "em_definicao":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700";
    }
  };

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
        <ScrollArea className="h-[280px]">
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex items-start gap-4 p-2 rounded-md">
                  <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20 animate-pulse">
                    <Skeleton className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-1/5" />
                      <Skeleton className="h-3 w-1/6" />
                    </div>
                  </div>
                  <div className="self-center">
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))
            ) : displayData.length > 0 ? displayData.map((proposta) => (
              <div 
                key={proposta.id} 
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/10 p-3 rounded-lg border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:shadow-sm mb-3"
                onClick={() => handleViewProposta(proposta)}
              >
                <div className={`p-2 rounded-md ${
                  proposta.tipo_proposta === 'entrada' 
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-red-100 dark:bg-red-900/20"
                }`}>
                  {/* Ícones diferenciados com base no tipo de proposta */}
                  {proposta.tipo_proposta === 'entrada' || (tipo === 'entrada' && !proposta.tipo_proposta) ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{proposta.cliente}</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                      Resp: {proposta.responsavel}
                    </p>
                    <p className="text-sm font-medium">
                      R$ {proposta.valor.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{proposta.data}</span>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${proposta.tipo_proposta === 'entrada' 
                          ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                          : "bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"}
                        text-xs
                      `}
                    >
                      {proposta.tipo_proposta === 'entrada' 
                        ? "Entrada" 
                        : "Saída"}
                    </Badge>
                  </div>
                </div>
                <div className="self-center">
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t px-6 py-3 bg-muted/20 dark:bg-gray-800/50 text-xs font-medium flex items-center justify-center dark:text-gray-300 h-[40px] overflow-hidden">
        <span></span>
      </CardFooter>

      {/* Diálogo de visualização da proposta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Proposta</DialogTitle>
            <DialogDescription>
              {selectedProposta?.tipo_proposta === 'saida' ? 'Proposta de Saída' : 'Proposta de Entrada'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposta && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h4>
                  <p>{selectedProposta.cliente}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Responsável</h4>
                  <p>{selectedProposta.responsavel}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Valor</h4>
                  <p>R$ {selectedProposta.valor.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Data</h4>
                  <p>{selectedProposta.data}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge variant="outline" className={`
                    ${selectedProposta.tipo_proposta === 'entrada' 
                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"}
                  `}>
                    {selectedProposta.tipo_proposta === 'entrada' 
                      ? "Entrada" 
                      : "Saída"}
                  </Badge>
                </div>
                {selectedProposta.tipo_proposta === 'entrada' && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status da Proposta</h4>
                    <p>{selectedProposta.status}</p>
                  </div>
                )}
                {selectedProposta.tipo_proposta === 'saida' && selectedProposta.evento && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Evento</h4>
                    <p>{selectedProposta.evento}</p>
                  </div>
                )}
                {selectedProposta.origem && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Origem</h4>
                    <p>{selectedProposta.origem}</p>
                  </div>
                )}
              </div>
              
              {selectedProposta.observacoes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                  <p className="text-sm">{selectedProposta.observacoes}</p>
                </div>
              )}
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

export default PropostasTable;
