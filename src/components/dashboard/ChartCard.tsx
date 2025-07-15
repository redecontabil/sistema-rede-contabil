import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface ChartCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  animateCharts?: boolean;
  error?: string;
}

const ChartCard = ({
  title,
  description,
  icon,
  children,
  animateCharts = true,
  error
}: ChartCardProps) => {
  return (
    <Card className="col-span-1 overflow-hidden hover:shadow-md transition-shadow h-[450px] flex flex-col bg-card dark:bg-[#0f172a] border border-[#F2F2F2] dark:border-[#03658C]/20">
      <CardHeader className={`bg-gradient-to-r ${error ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20' : 'from-[#A61B67]/5 to-[#D90B91]/5 dark:from-[#A61B67]/10 dark:to-[#D90B91]/10'} pb-2`}>
        <CardTitle className="flex justify-between items-center text-lg">
          <span>{title}</span>
          {error ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : icon}
        </CardTitle>
        <CardDescription>
          {error || description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 px-4 flex-1 flex items-center justify-center overflow-hidden">
        <div className={cn(
          "transition-opacity duration-1000 h-full w-full",
          animateCharts ? "opacity-100" : "opacity-0"
        )}>
          {children}
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-3 bg-muted/20 dark:bg-gray-800/50 text-xs font-medium flex items-center justify-center dark:text-gray-300 h-[40px] overflow-hidden">
        <span></span>
      </CardFooter>
    </Card>
  );
};

export default ChartCard;
