const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Cliente público (para operações básicas)
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente com service role (para operações administrativas)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

class SupabaseService {
  constructor() {
    this.client = supabase;
    this.admin = supabaseAdmin;
  }

  // Método para obter cliente público
  getClient() {
    return this.client;
  }

  // Método para obter cliente admin
  getAdmin() {
    if (!this.admin) {
      throw new Error('Service role key não configurada');
    }
    return this.admin;
  }

  // Método para executar queries com tratamento de erro
  async executeQuery(queryFunction) {
    try {
      const result = await queryFunction();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result;
    } catch (error) {
      console.error('Erro na query Supabase:', error.message);
      throw error;
    }
  }

  // Métodos para operações comuns
  async select(table, columns = '*', filters = {}) {
    return this.executeQuery(async () => {
      let query = this.client.from(table).select(columns);
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
      
      return await query;
    });
  }

  async insert(table, data) {
    return this.executeQuery(async () => {
      return await this.client.from(table).insert(data).select();
    });
  }

  async update(table, id, data) {
    return this.executeQuery(async () => {
      return await this.client.from(table).update(data).eq('id', id).select();
    });
  }

  async delete(table, id) {
    return this.executeQuery(async () => {
      return await this.client.from(table).delete().eq('id', id);
    });
  }

  // Método para busca com texto
  async search(table, column, searchTerm, columns = '*') {
    return this.executeQuery(async () => {
      return await this.client
        .from(table)
        .select(columns)
        .ilike(column, `%${searchTerm}%`);
    });
  }

  // Método para paginação
  async paginate(table, page = 1, limit = 20, columns = '*', filters = {}, orderBy = 'created_at', ascending = false) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return this.executeQuery(async () => {
      let query = this.client.from(table).select(columns, { count: 'exact' });
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
      
      return await query
        .order(orderBy, { ascending })
        .range(from, to);
    });
  }

  // Método para joins
  async selectWithJoin(table, columns, joinConfig = {}) {
    return this.executeQuery(async () => {
      let query = this.client.from(table).select(columns);
      
      // Aplicar filtros se fornecidos
      if (joinConfig.filters) {
        Object.entries(joinConfig.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Aplicar ordenação
      if (joinConfig.orderBy) {
        query = query.order(joinConfig.orderBy, { ascending: joinConfig.ascending || false });
      }
      
      // Aplicar limite
      if (joinConfig.limit) {
        query = query.limit(joinConfig.limit);
      }
      
      return await query;
    });
  }

  // Método para upload de arquivos
  async uploadFile(bucket, path, file) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Erro no upload:', error.message);
      throw error;
    }
  }

  // Método para obter URL pública de arquivo
  getPublicUrl(bucket, path) {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Método para deletar arquivo
  async deleteFile(bucket, path) {
    try {
      const { error } = await this.client.storage
        .from(bucket)
        .remove([path]);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error.message);
      throw error;
    }
  }

  // Método para acessar diretamente o cliente (compatibilidade)
  from(table) {
    return this.client.from(table);
  }
}

// Instância do serviço
const supabaseService = new SupabaseService();

// Função para log de atividade do usuário
async function logUserActivity(userId, action, details = {}, ipAddress = null) {
  try {
    const { data, error } = await supabaseService.client
      .from('user_activities')
      .insert({
        user_id: userId,
        action,
        details,
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Erro ao registrar atividade:', error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao registrar atividade:', error.message);
    return null;
  }
}

module.exports = {
  supabaseService,
  logUserActivity,
  supabase,
  supabaseAdmin
};