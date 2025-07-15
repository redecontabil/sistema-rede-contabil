
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import { eventLogService } from "@/lib/eventLogService";

// Schema para validação do formulário de alteração de senha
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z.string().min(8, { message: "A nova senha deve ter pelo menos 8 caracteres" }),
  confirmPassword: z.string().min(8, { message: "Confirme sua nova senha" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Função para alteração de senha
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      setLoading(true);
      
      // Obter dados do usuário logado
      const usuarioLogadoStr = localStorage.getItem("usuario_logado");
      if (!usuarioLogadoStr) {
        toast({
          title: "Erro",
          description: "Usuário não está logado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }
      
      const usuarioLogado = JSON.parse(usuarioLogadoStr);
      
      // Verificar se a senha atual está correta
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select("senha_hash")
        .eq("id", usuarioLogado.id)
        .single();
        
      if (userError || !userData) {
        toast({
          title: "Erro",
          description: "Não foi possível verificar sua senha atual.",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se a senha atual está correta
      const senhaCorreta = await bcrypt.compare(data.currentPassword, userData.senha_hash);
      if (!senhaCorreta) {
        toast({
          title: "Senha atual incorreta",
          description: "A senha atual informada não está correta.",
          variant: "destructive",
        });
        return;
      }
      
      // Gerar hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const novaSenhaHash = await bcrypt.hash(data.newPassword, salt);
      
      // Atualizar a senha no banco de dados
      const { error: updateError } = await supabase
        .from("usuario")
        .update({ senha_hash: novaSenhaHash })
        .eq("id", usuarioLogado.id);
        
      if (updateError) {
        toast({
          title: "Erro ao atualizar senha",
          description: "Não foi possível atualizar sua senha. Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }
      
      // Registrar o evento de alteração de senha
      await eventLogService.registrarEvento({
        usuario_email: usuarioLogado.email,
        usuario_id: usuarioLogado.id,
        tipo_evento: "edicao",
        entidade: "usuario",
        entidade_id: usuarioLogado.id,
        descricao: "Alteração de senha realizada com sucesso",
      });
      
      toast({
        title: "Senha alterada com sucesso",
        description: "Sua senha foi atualizada com sucesso.",
      });
      
      passwordForm.reset();
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...passwordForm}>
      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
        <FormField
          control={passwordForm.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha Atual *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Digite sua senha atual" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={passwordForm.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Digite sua nova senha" required {...field} />
              </FormControl>
              <FormDescription>
                Sua senha deve ter pelo menos 8 caracteres.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={passwordForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nova Senha *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirme sua nova senha" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="flex items-center gap-2" disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? "Processando..." : "Salvar Nova Senha"}
        </Button>
      </form>
    </Form>
  );
}
