import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface AdminPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AdminPasswordDialog({
  open,
  onOpenChange,
  onConfirm,
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setIsLoading(true);
    
    // Aqui você pode implementar a lógica real de verificação da senha
    // Por enquanto, vamos usar uma senha fixa "admin123" como exemplo
    if (password === "admin123") {
      onConfirm();
      setPassword("");
      onOpenChange(false);
      toast({
        title: "Sucesso",
        description: "Senha confirmada com sucesso",
      });
    } else {
      toast({
        title: "Erro",
        description: "Senha incorreta",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Autenticação de Administrador</DialogTitle>
          <DialogDescription>
            Digite a senha de administrador para fazer alterações na receita.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Input
            type="password"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
          />
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setPassword("");
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 