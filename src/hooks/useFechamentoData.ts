import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Fechamento {
  id: string;
  mes: string;
  data_fechamento: string;
  responsavel: string;
  status: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useFechamentoData() {
  const [ultimoFechamento, setUltimoFechamento] = useState<Fechamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUltimoFechamento = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('fechamento')
        .select('*')
        .order('data_fechamento', { ascending: false })
        .limit(1)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      setUltimoFechamento(data);
    } catch (err) {
      console.error('Erro ao buscar último fechamento:', err);
      setError('Falha ao carregar dados de fechamento');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUltimoFechamento();

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
          fetchUltimoFechamento();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ultimoFechamento,
    isLoading,
    error,
    refetch: fetchUltimoFechamento
  };
} 