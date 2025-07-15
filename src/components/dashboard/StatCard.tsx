import React from 'react';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  className?: string;
};

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  isLoading = false,
  className
}: StatCardProps) => {
  return (
    <div className={cn(
      "group flex flex-col overflow-hidden transition-all duration-200 h-full rounded-xl border shadow-sm",
      "hover:shadow-lg hover:scale-[1.02]",
      "bg-gradient-to-br from-white to-slate-50/80",
      "dark:from-slate-900 dark:to-slate-900/50",
      "border-slate-200 dark:border-slate-800",
      className
    )}>
      {/* Cabeçalho com ícone e título */}
      <div className="p-4 flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center",
          "bg-white shadow-sm transition-colors duration-200",
          "dark:bg-slate-800 group-hover:shadow-md",
          "border border-slate-200 dark:border-slate-700"
        )}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold tracking-tight">
          {title}
        </h3>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex-1 p-4 pt-2 flex flex-col">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex items-center mt-auto">
              <Skeleton className="h-6 w-36" />
            </div>
          </>
        ) : (
          <>
            <div className="text-[26px] font-bold mb-1">{value}</div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default StatCard;
