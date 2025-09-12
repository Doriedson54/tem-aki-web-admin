require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createAdminsTable() {
  console.log('🔧 Criando tabela "admins" no Supabase...');
  console.log('=' .repeat(50));
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ ERRO: Credenciais do Supabase não configuradas!');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // SQL para criar a tabela admins
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        is_super_admin BOOLEAN DEFAULT false,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('📋 Executando SQL para criar tabela...');
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      // Tentar método alternativo usando a API REST
      console.log('⚠️  Método RPC não disponível, tentando método alternativo...');
      
      // Verificar se a tabela já existe
      const { data: existingTable, error: checkError } = await supabase
        .from('admins')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === 'PGRST116') {
        console.log('❌ Tabela "admins" não existe. Criando via SQL direto...');
        
        // Criar a tabela usando uma abordagem diferente
        const { data: sqlResult, error: sqlError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'admins')
          .eq('table_schema', 'public');
        
        if (sqlError || !sqlResult || sqlResult.length === 0) {
          console.log('📝 Criando tabela "admins" manualmente...');
          
          // Como não podemos executar DDL diretamente, vamos orientar o usuário
          console.log('\n📋 Execute o seguinte SQL no painel do Supabase:');
          console.log('🌐 https://supabase.com/dashboard > SQL Editor');
          console.log('');
          console.log('```sql');
          console.log(createTableSQL.trim());
          console.log('```');
          console.log('');
          
          // Criar políticas RLS
          const rlsPolicies = `
-- Habilitar RLS na tabela admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Política para permitir que admins vejam todos os registros
CREATE POLICY "Admins can view all admins" ON public.admins
  FOR SELECT USING (true);

-- Política para permitir que admins insiram novos registros
CREATE POLICY "Admins can insert admins" ON public.admins
  FOR INSERT WITH CHECK (true);

-- Política para permitir que admins atualizem registros
CREATE POLICY "Admins can update admins" ON public.admins
  FOR UPDATE USING (true);

-- Política para permitir que admins deletem registros
CREATE POLICY "Admins can delete admins" ON public.admins
  FOR DELETE USING (true);
          `;
          
          console.log('🔒 Políticas RLS para a tabela:');
          console.log('```sql');
          console.log(rlsPolicies.trim());
          console.log('```');
          console.log('');
          
          // Inserir admin padrão
          const defaultAdminSQL = `
-- Inserir admin padrão (senha: admin123)
INSERT INTO public.admins (username, email, password_hash, full_name, is_super_admin)
VALUES (
  'admin',
  'admin@temakinobairro.com.br',
  '$2b$12$LQv3c1yqBwEHxPiLnPZOQOsA3PQ7khFHFx6hxIrOHqHQVQhHrm6Mi', -- admin123
  'Administrador do Sistema',
  true
)
ON CONFLICT (username) DO NOTHING;
          `;
          
          console.log('👤 Admin padrão:');
          console.log('```sql');
          console.log(defaultAdminSQL.trim());
          console.log('```');
          console.log('');
          
          console.log('📝 Instruções:');
          console.log('1. Acesse o painel do Supabase');
          console.log('2. Vá para SQL Editor');
          console.log('3. Cole e execute os SQLs acima na ordem');
          console.log('4. Execute novamente: node validate_supabase.js');
          
          return false;
        }
      } else {
        console.log('✅ Tabela "admins" já existe!');
        return true;
      }
    } else {
      console.log('✅ Tabela "admins" criada com sucesso!');
    }
    
    // Verificar se a tabela foi criada
    const { data: verifyData, error: verifyError } = await supabase
      .from('admins')
      .select('count', { count: 'exact', head: true });
    
    if (verifyError) {
      console.log('❌ Erro ao verificar tabela:', verifyError.message);
      return false;
    }
    
    console.log('✅ Tabela "admins" verificada com sucesso!');
    console.log('🎉 Estrutura da tabela criada!');
    
    return true;
    
  } catch (error) {
    console.log('❌ ERRO durante a criação:', error.message);
    return false;
  }
}

// Executar criação
createAdminsTable()
  .then(success => {
    if (success) {
      console.log('\n🚀 Tabela "admins" pronta para uso!');
    } else {
      console.log('\n⚠️  Siga as instruções acima para criar a tabela manualmente.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });