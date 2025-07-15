import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type StatCardProps = {
  title: string;
  value: string;
  secondaryValue?: string;
  description: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  showSecondary?: boolean;
  secondaryLabel?: string;
  primaryLabel?: string;
};

const StatCard = ({ 
  title, 
  value, 
  secondaryValue,
  description, 
  icon, 
  isLoading = false,
  className,
  showSecondary = false,
  secondaryLabel = "Anual",
  primaryLabel = "Mensal"
}: StatCardProps) => {
  const [activeView, setActiveView] = useState<'primary' | 'secondary'>('primary');
  
  return (
    <div className={cn(
      "group flex flex-col overflow-hidden transition-all duration-200 h-full rounded-xl border shadow-sm",
      "hover:shadow-lg hover:scale-[1.02]",
      "bg-gradient-to-br from-white to-slate-50/80",
      "dark:from-slate-900 dark:to-slate-900/50",
      "border-slate-200 dark:border-slate-800",
      className
    )}>
      {/* Cabeçalho com ícone, título e seletor de abas */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        
        {/* Seletor de abas com bolinhas */}
        {showSecondary && (
          <div className="flex items-center gap-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 p-0.5">
            <button
              onClick={() => setActiveView('primary')}
              className={cn(
                "text-xs px-2.5 py-0.5 rounded-full transition-all",
                "flex items-center gap-1",
                activeView === 'primary' 
                  ? "bg-white dark:bg-slate-700 shadow-sm text-primary font-medium" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                activeView === 'primary' ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
              )}></div>
              {primaryLabel}
            </button>
            <button
              onClick={() => setActiveView('secondary')}
              className={cn(
                "text-xs px-2.5 py-0.5 rounded-full transition-all",
                "flex items-center gap-1",
                activeView === 'secondary' 
                  ? "bg-white dark:bg-slate-700 shadow-sm text-primary font-medium" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                activeView === 'secondary' ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
              )}></div>
              {secondaryLabel}
            </button>
          </div>
        )}
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex-1 p-4 pt-2 flex flex-col">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-3" />
          </>
        ) : (
          <>
            {showSecondary ? (
              <div className="flex flex-col space-y-2">
                <div className="text-[26px] font-bold mb-1 transition-all duration-300 ease-in-out">
                  {activeView === 'primary' ? value : secondaryValue}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ) : (
              <>
                <div className="text-[26px] font-bold mb-1">{value}</div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StatCard;
