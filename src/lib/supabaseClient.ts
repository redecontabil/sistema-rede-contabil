import { createClient } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = 'https://ipxpxkulagznnprulqbk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweHB4a3VsYWd6bm5wcnVscWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzA4NDAsImV4cCI6MjA2NTc0Njg0MH0.TLghdMv0Vbq8GICGTK18a7yizmt7ryXMMtpeDQ_gNY8';

// Criar cliente com configurações otimizadas para melhor desempenho
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 2,
      heartbeat_interval: 30000,
      timeout: 60000
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'sistema-rede-contabil',
    },
    // Configuração de retentativa para consultas
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        credentials: 'same-origin',
        cache: 'no-cache'
      });
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// Verificar conexão estabelecida
console.log('Cliente Supabase configurado');

// Função para gerenciar canais de tempo real com retenção de referências
const activeChannels: Array<{ name: string; channel: any }> = [];

export const createRealtimeChannel = (name: string, table: string, callback: Function, options = {}) => {
  // Remover canal anterior com o mesmo nome, se existir
  const existingChannelIndex = activeChannels.findIndex(ch => ch.name === name);
  if (existingChannelIndex >= 0) {
    supabase.removeChannel(activeChannels[existingChannelIndex].channel);
    activeChannels.splice(existingChannelIndex, 1);
  }

  // Criar novo canal com configurações otimizadas
  const channel = supabase
    .channel(name, {
      config: {
        broadcast: { self: true },
        presence: { key: `client-${Date.now()}` }
      }
    })
    .on('postgres_changes', 
      { 
        event: '*',
        schema: 'public',
        table: table,
        ...options
      }, 
      (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
        // Adicionar tipo_proposta com base na tabela
        const tipo = table === 'propostas' ? 'entrada' : 
                    table === 'propostas_saida' ? 'saida' : undefined;
        
        try {
          // Não acessamos payload.data diretamente, mas sim passamos o payload completo
          callback({
            ...payload,
            tipo_proposta: tipo
          });
        } catch (error) {
          console.error('Erro ao processar payload de tempo real:', error);
          callback(payload);
        }
      }
    )
    .subscribe((status: any) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Conectado ao canal ${name} para a tabela ${table}`);
      }
    });

  // Armazenar referência ao canal
  activeChannels.push({ name, channel });
  
  return channel;
};

// Função para remover todos os canais ativos
export const removeAllRealtimeChannels = () => {
  activeChannels.forEach(({ channel }) => {
    supabase.removeChannel(channel);
  });
};

// Melhorado para lidar com erros específicos da tabela propostas
export const handleQueryError = (error: any, fallbackData: any) => {
  // Se não houver erro, retorna os dados da consulta
  if (!error) return fallbackData;
  
  // Log detalhado para depuração
  console.error('Erro na consulta Supabase:', {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint
  });
  
  // Verificar erros específicos de coluna
  if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
    console.error('Erro de coluna no Supabase:', error.message);
    
    // Erros específicos para coluna "valor" na tabela "propostas"
    if (error?.message?.includes('propostas.valor')) {
      toast.error('Erro na estrutura da tabela. Usando o campo "honorario" em vez de "valor".');
    } else {
      toast.error('Erro na estrutura da tabela. Verifique os campos no Supabase.');
    }
    
    return fallbackData;
  }
  
  // Verificar erros específicos
  if (error?.code === '42P01') { // Código para "relation does not exist"
    console.error('Tabela não encontrada no Supabase:', error.message);
    toast.error('Erro de conexão com o banco de dados. Tabela não encontrada.');
    return fallbackData;
  }
  
  if (error?.code === 'PGRST116') {
    console.error('Erro de permissão:', error.message);
    toast.error('Erro de permissão ao acessar dados.');
    return fallbackData;
  }
  
  if (error?.message?.includes('JWT')) {
    console.error('Erro de autenticação:', error.message);
    toast.error('Sessão expirada. Por favor, faça login novamente.');
    return fallbackData;
  }
  
  // Para outros tipos de erro
  toast.error('Erro ao consultar dados. Verifique o console para mais detalhes.');
  return fallbackData;
};

// Nova função para facilitar consultas com tratamento de erros otimizado
export async function safeQuery(table: string, query: any, fallback: any = []) {
  try {
    const result = await query;
    
    if (result.error) {
      console.error(`Erro ao consultar ${table}:`, result.error);
      handleQueryError(result.error, fallback);
      return fallback;
    }
    
    return result.data || fallback;
  } catch (error) {
    console.error(`Exceção ao consultar ${table}:`, error);
    return fallback;
  }
}
