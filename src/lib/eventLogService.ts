import { supabase } from "./supabaseClient";

export type EventType = "criacao" | "edicao" | "exclusao" | "login" | "logout" | "visualizacao" | "outro";
export type EntityType = "proposta" | "proposta_saida" | "usuario" | "custo" | "balanco" | "fechamento" | "sistema";

export interface EventLogData {
  usuario_email: string;
  usuario_id: string;
  tipo_evento: EventType;
  entidade: EntityType;
  entidade_id?: string;
  descricao: string;
  dados?: any;
}

/**
 * Serviço para registrar eventos do sistema
 */
export const eventLogService = {
  /**
   * Verifica se a tabela eventos_log existe e a cria se não existir
   * @returns Promise com o resultado da operação
   */
  async verificarECriarTabela() {
    try {
      console.log("Verificando se a tabela eventos_log existe...");
      
      // Primeiro verifica se a tabela existe
      const { data: tableExists, error: checkError } = await supabase
        .from('eventos_log')
        .select('id')
        .limit(1);
      
      // Se não houver erro, a tabela existe
      if (!checkError) {
        console.log("Tabela eventos_log já existe");
        return { success: true };
      }
      
      console.log("Erro ao verificar tabela:", checkError);
      console.log("Código do erro:", checkError.code);
      console.log("Mensagem do erro:", checkError.message);
      
      // Se o erro não for porque a tabela não existe, retorna erro
      if (checkError.code !== '42P01') { // 42P01 = relation does not exist
        console.log("Erro diferente de 'tabela não existe'. Retornando erro.");
        return { success: false, error: checkError };
      }
      
      console.log("Tabela não existe. Tentando criar...");
      
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
            console.error("Erro no método alternativo:", insertError);
            return { success: false, error: insertError };
          }
          
          // Verificar novamente se a tabela foi criada
          const { error: verifyError } = await supabase
            .from('eventos_log')
            .select('id')
            .limit(1);
          
          if (verifyError) {
            console.error("Erro ao verificar se a tabela foi criada:", verifyError);
            return { success: false, error: verifyError };
          }
          
          console.log("Tabela eventos_log criada com sucesso!");
          return { success: true };
        } catch (altError) {
          console.error("Erro no método alternativo:", altError);
          return { success: false, error: altError };
        }
      }
      
      console.log("Tabela eventos_log criada com sucesso!");
      return { success: true };
    } catch (error) {
      console.error("Erro ao verificar/criar tabela eventos_log:", error);
      return { success: false, error };
    }
  },

  /**
   * Registra um evento no sistema
   * @param eventData Dados do evento a ser registrado
   * @returns Promise com o resultado da operação
   */
  async registrarEvento(eventData: EventLogData) {
    try {
      // Verificar se a tabela existe antes de tentar registrar
      await this.verificarECriarTabela();
      
      const { error } = await supabase.from("eventos_log").insert([eventData]);
      
      if (error) {
        console.error("Erro ao registrar evento:", error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao registrar evento:", error);
      return { success: false, error };
    }
  },

  /**
   * Busca eventos com filtros opcionais
   * @param filters Filtros para a busca (opcional)
   * @param page Página atual para paginação (opcional, padrão: 1)
   * @param pageSize Tamanho da página (opcional, padrão: 50)
   * @returns Promise com os eventos encontrados
   */
  async buscarEventos({
    usuario_email,
    tipo_evento,
    entidade,
    dataInicio,
    dataFim,
    page = 1,
    pageSize = 50
  }: {
    usuario_email?: string;
    tipo_evento?: EventType;
    entidade?: EntityType;
    dataInicio?: Date;
    dataFim?: Date;
    page?: number;
    pageSize?: number;
  } = {}) {
    try {
      // Verificar se a tabela existe antes de tentar buscar
      await this.verificarECriarTabela();
      
      let query = supabase
        .from("eventos_log")
        .select("*", { count: "exact" });
      
      // Aplicar filtros se fornecidos
      if (usuario_email) {
        query = query.eq("usuario_email", usuario_email);
      }
      
      if (tipo_evento) {
        query = query.eq("tipo_evento", tipo_evento);
      }
      
      if (entidade) {
        query = query.eq("entidade", entidade);
      }
      
      if (dataInicio) {
        query = query.gte("criado_em", dataInicio.toISOString());
      }
      
      if (dataFim) {
        query = query.lte("criado_em", dataFim.toISOString());
      }
      
      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order("criado_em", { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error("Erro ao buscar eventos:", error);
        return { success: false, error };
      }
      
      return { 
        success: true, 
        data, 
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      return { success: false, error };
    }
  }
};

/**
 * Obtém o usuário logado do localStorage
 * @returns Objeto com id e email do usuário ou null se não estiver logado
 */
export function getUsuarioLogado() {
  try {
    const usuarioJSON = localStorage.getItem("usuario_logado");
    if (!usuarioJSON) return null;
    
    const usuario = JSON.parse(usuarioJSON);
    return {
      id: usuario.id,
      email: usuario.email
    };
  } catch (error) {
    console.error("Erro ao obter usuário logado:", error);
    return null;
  }
} 