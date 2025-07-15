
import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusProps = () => {
    switch (status) {
      case "aprovado":
        return {
          className: "bg-green-100 text-green-800",
          label: "Aprovado"
        };
      case "em_analise":
        return {
          className: "bg-orange-100 text-orange-800",
          label: "Em Análise"
        };
      case "reprovado":
        return {
          className: "bg-red-100 text-red-800",
          label: "Reprovado"
        };
      case "em_definicao":
        return {
          className: "bg-yellow-100 text-yellow-800",
          label: "Em Definição"
        };
      case "aprovada":
        return {
          className: "bg-green-100 text-green-800",
          label: "Aprovada"
        };
      case "pendente":
        return {
          className: "bg-amber-100 text-amber-800",
          label: "Pendente"
        };
      case "recusada":
      case "cancelada":
        return {
          className: "bg-red-100 text-red-800",
          label: status === "recusada" ? "Recusada" : "Cancelada"
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800",
          label: status
        };
    }
  };

  const { className, label } = getStatusProps();

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${className}`}>
      {label}
    </span>
  );
};
