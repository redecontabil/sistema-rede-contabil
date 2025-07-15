import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface HistoricoFechamento {
  id: string;
  mes: string;
  data_fechamento: string;
  status: string;
  responsavel: string;
  observacoes: string;
}

export function useHistoricoFechamento() {
  const [historicos, setHistoricos] = useState<HistoricoFechamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('fechamento')
        .select('*')
        .order('data_fechamento', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setHistoricos(data || []);
    } catch (err) {
      console.error('Erro ao buscar histórico de fechamento:', err);
      setError('Falha ao carregar dados do histórico de fechamento');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricos();

    // Inscrever-se para atualizações em tempo real
    const channel = supabase
      .channel('fechamento-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fechamento'
        },
        () => {
          // Atualizar dados quando houver mudanças
          fetchHistoricos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    historicos,
    isLoading,
    error,
    refetch: fetchHistoricos
  };
} 