
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActionMenu } from "@/components/TableActionMenu";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { toast } from "@/components/ui/use-toast";

interface PropostaData {
  id: string;
  cliente: string;
  tipo: string;
  origem: string;
  responsavel: string;
  tributacao: string;
  honorario: number;
  status: string;
  data: string;
  tipo_proposta: string;
}

interface PropostasKanbanViewProps {
  propostas: PropostaData[];
  onView?: (proposta: PropostaData) => void;
  onEdit?: (proposta: PropostaData) => void;
  onDelete?: (proposta: PropostaData) => void;
  onStatusChange?: (propostaId: string, newStatus: string) => void;
}

export function PropostasKanbanView({ 
  propostas, 
  onView,
  onEdit,
  onDelete,
  onStatusChange
}: PropostasKanbanViewProps) {
  // Estado local para gerenciar as propostas durante o drag and drop
  const [localPropostas, setLocalPropostas] = useState<PropostaData[]>([]);

  // Atualizar o estado local quando as props mudarem
  useEffect(() => {
    setLocalPropostas([...propostas]);
  }, [propostas]);

  // Group proposals by status
  const getStatusGroups = () => {
    return {
      pendente: localPropostas.filter(p => p.status === "pendente"),
      aprovada: localPropostas.filter(p => p.status === "aprovada"),
      recusada: localPropostas.filter(p => p.status === "recusada"),
      cancelada: localPropostas.filter(p => p.status === "cancelada")
    };
  };

  const statusGroups = getStatusGroups();

  const columnTitles = {
    pendente: "Pendentes",
    aprovada: "Aprovadas",
    recusada: "Recusadas",
    cancelada: "Canceladas"
  };

  // Função para lidar com o fim do drag and drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não houver destino ou se o item for solto no mesmo lugar, não fazemos nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Encontrar a proposta que foi arrastada
    const propostaArrastada = localPropostas.find(p => p.id === draggableId);

    if (!propostaArrastada) return;

    // Criar uma cópia do array de propostas
    const novasPropostas = localPropostas.map(p => ({...p}));
    
    // Atualizar apenas a proposta que foi arrastada
    const propostaIndex = novasPropostas.findIndex(p => p.id === draggableId);
    if (propostaIndex !== -1) {
      novasPropostas[propostaIndex] = {
        ...novasPropostas[propostaIndex],
        status: destination.droppableId
      };
    }

    // Atualizar o estado local com a nova lista
    setLocalPropostas(novasPropostas);

    // Notificar o componente pai sobre a mudança de status
    if (onStatusChange) {
      onStatusChange(draggableId, destination.droppableId);
      
      // Mostrar toast informando sobre a mudança de status
      const statusName = columnTitles[destination.droppableId as keyof typeof columnTitles];
      toast({
        title: "Status atualizado",
        description: `Proposta ${propostaArrastada.id} movida para ${statusName}`,
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusGroups).map(([status, items]) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{columnTitles[status as keyof typeof columnTitles]}</h3>
              <StatusBadge status={status} />
              <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
            </div>
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[150px] p-2 rounded-md ${
                    snapshot.isDraggingOver ? "bg-muted/50" : ""
                  }`}
                >
                  {items.length === 0 ? (
                    <div className="flex items-center justify-center h-40 border border-dashed rounded-md bg-muted/30">
                      <p className="text-sm text-muted-foreground">Nenhuma proposta</p>
                    </div>
                  ) : (
                    items.map((proposta, index) => (
                      <Draggable 
                        key={proposta.id} 
                        draggableId={proposta.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <CardHeader className="p-3 pb-0 flex flex-row justify-between items-start">
                              <div>
                                <CardTitle className="text-sm font-medium">{proposta.cliente}</CardTitle>
                                <p className="text-xs text-muted-foreground">{proposta.id}</p>
                              </div>
                              <TableActionMenu 
                                row={proposta}
                                onView={onView}
                                onEdit={onEdit}
                                onDelete={onDelete}
                              />
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                                <span className="text-muted-foreground">Honorário:</span>
                                <span className="font-medium text-right">R$ {proposta.honorario.toFixed(2)}</span>
                                
                                <span className="text-muted-foreground">Tributação:</span>
                                <span className="text-right">{proposta.tributacao}</span>
                                
                                <span className="text-muted-foreground">Responsável:</span>
                                <span className="text-right">{proposta.responsavel}</span>
                                
                                <span className="text-muted-foreground">Data:</span>
                                <span className="text-right">{proposta.data}</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
