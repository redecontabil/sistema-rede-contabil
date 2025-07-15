import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Fechar sidebar quando mudar para modo desktop
  useEffect(() => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <ThemeProvider defaultTheme="light">
      <div className={cn(
        "app-container h-screen flex",
        pageLoaded ? "animate-fade-in" : "opacity-0"
      )}>
        {isMobile && (
          <div className="sticky top-0 z-20 flex items-center justify-between p-3 bg-gradient-to-r from-[#A61B67] to-[#D90B91] text-white shadow-md">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              <span className="sr-only">Toggle menu</span>
            </Button>
            <div className="flex items-center">
              <h1 className="text-lg font-semibold">Rede Contábil - Sistema de Gestão de Propostas</h1>
            </div>
            <div className="w-10"></div>
          </div>
        )}
        
        <div 
          className={cn(
            isMobile 
              ? `fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out w-3/4 max-w-xs` 
              : "w-auto h-screen",
            isMobile && sidebarOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "",
          )}
        >
          <Sidebar />
        </div>
        
        <div 
          className={cn(
            "flex-1 overflow-auto transition-all duration-300", 
            isMobile ? "pt-[3.25rem]" : "",
          )}
          onClick={() => isMobile && sidebarOpen && setSidebarOpen(false)}
        >
          <main className="page-container h-full">
            <Outlet />
          </main>
          <div className="h-8 md:h-12"></div>
        </div>
        
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
