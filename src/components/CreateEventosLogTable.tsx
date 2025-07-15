import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

interface CreateEventosLogTableProps {
  onSuccess?: () => void;
}

/**
 * Componente para criar a tabela eventos_log diretamente no banco de dados
 */
export function CreateEventosLogTable({ onSuccess }: CreateEventosLogTableProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTable = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // SQL para criar a tabela
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS eventos_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_email TEXT NOT NULL,
          usuario_id UUID NOT NULL,
          tipo_evento TEXT NOT NULL,
          entidade TEXT NOT NULL,
          entidade_id TEXT,
          descricao TEXT NOT NULL,
          dados JSONB,
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Adiciona índices para melhorar a performance das consultas
        CREATE INDEX IF NOT EXISTS eventos_log_usuario_id_idx ON eventos_log(usuario_id);
        CREATE INDEX IF NOT EXISTS eventos_log_tipo_evento_idx ON eventos_log(tipo_evento);
        CREATE INDEX IF NOT EXISTS eventos_log_entidade_idx ON eventos_log(entidade);
        CREATE INDEX IF NOT EXISTS eventos_log_criado_em_idx ON eventos_log(criado_em);
      `;
      
      // Tentar criar a tabela usando SQL
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (sqlError) {
        console.error("Erro ao criar tabela com SQL:", sqlError);
        
        // Tentar método alternativo - inserir um registro para forçar a criação
        try {
          console.log("Tentando método alternativo para criar a tabela...");
          
          // Primeiro, verificar se a extensão uuid-ossp está habilitada
          await supabase.rpc('exec_sql', { 
            sql: "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 
          });
          
          // Tentar criar a tabela com outro método
          const { error: insertError } = await supabase
            .from('eventos_log')
            .insert([{
              usuario_email: 'sistema@redecontabil.com',
              usuario_id: '00000000-0000-0000-0000-000000000000',
              tipo_evento: 'outro',
              entidade: 'sistema',
              descricao: 'Inicialização da tabela de eventos',
              dados: { info: 'Registro inicial para criar a tabela' }
            }]);
          
          if (insertError) {
            if (insertError.code === '42P01') { // relation does not exist
              setError("A tabela não existe e não foi possível criá-la automaticamente. Contate o administrador do sistema.");
            } else {
              setError(`Erro ao criar tabela: ${insertError.message}`);
            }
            console.error("Erro no método alternativo:", insertError);
          } else {
            setSuccess(true);
            toast({
              title: "Tabela criada com sucesso",
              description: "A tabela de eventos foi criada com sucesso."
            });
            onSuccess?.();
          }
        } catch (altError) {
          console.error("Erro no método alternativo:", altError);
          setError(`Não foi possível criar a tabela: ${altError instanceof Error ? altError.message : 'Erro desconhecido'}`);
        }
      } else {
        setSuccess(true);
        toast({
          title: "Tabela criada com sucesso",
          description: "A tabela de eventos foi criada com sucesso."
        });
        onSuccess?.();
      }
    } catch (e) {
      console.error("Exceção ao criar tabela:", e);
      setError(`Erro ao criar tabela: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success ? (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>A tabela de eventos foi criada com sucesso.</AlertDescription>
        </Alert>
      ) : (
        <Button 
          onClick={handleCreateTable} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Criando tabela..." : "Criar Tabela de Eventos"}
        </Button>
      )}
      
      <div className="text-sm text-muted-foreground">
        <p>
          Este botão tentará criar a tabela de eventos diretamente no banco de dados.
          Se você não tiver permissões suficientes, será necessário contatar o administrador do sistema.
        </p>
      </div>
    </div>
  );
} 