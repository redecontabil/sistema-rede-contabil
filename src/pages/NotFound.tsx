import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <div className="h-20 w-32 flex items-center justify-center mb-4">
              <div className="bg-gradient-to-tr from-primary to-primary/80 text-white font-semibold flex items-center justify-center rounded-lg h-16 w-16 text-2xl">
                RC
              </div>
            </div>
            <div className="h-24 w-24 bg-muted rounded-xl flex items-center justify-center">
              <span className="text-5xl font-bold text-primary">404</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
          <div className="pt-4">
            <Button asChild>
              <Link to="/dashboard">
                Voltar para o Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default NotFound;
