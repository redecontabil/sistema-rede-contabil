import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface TributacaoData {
  name: string;
  value: number;
}

interface PropostaTributacao {
  tributacao: string;
}

export function useTributacaoData() {
  const [tributacaoData, setTributacaoData] = useState<TributacaoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularPercentuais = (dados: PropostaTributacao[]) => {
    const total = dados.length;
    const contagem = dados.reduce((acc: { [key: string]: number }, item) => {
      const tipo = item.tributacao || 'Não especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(contagem).map(([name, count]): TributacaoData => ({
      name,
      value: Math.round((count / total) * 100)
    }));
  };

  const fetchTributacaoData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('propostas')
        .select('tributacao')
        .not('tributacao', 'is', null);

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data || data.length === 0) {
        setTributacaoData([{
          name: "Sem dados",
          value: 100
        }]);
        return;
      }

      const percentuais = calcularPercentuais(data as PropostaTributacao[]);
      setTributacaoData(percentuais);
    } catch (err) {
      console.error('Erro ao buscar dados de tributação:', err);
      setError('Falha ao carregar dados de tributação');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTributacaoData();

    // Inscrever-se para atualizações em tempo real
    const channel = supabase
      .channel('propostas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'propostas'
        },
        () => {
          // Atualizar dados quando houver mudanças
          fetchTributacaoData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    tributacaoData,
    isLoading,
    error,
    refetch: fetchTributacaoData
  };
} 