require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function validateSupabaseCredentials() {
  console.log('🔍 Validando credenciais do Supabase...');
  console.log('=' .repeat(50));
  
  // Verificar se as variáveis de ambiente estão definidas
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📋 Configurações:');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Anon Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);
  console.log(`Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);
  console.log('');
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.log('❌ ERRO: Credenciais do Supabase não estão completamente configuradas!');
    return false;
  }
  
  try {
    // Testar com chave anônima
    console.log('🔑 Testando conexão com chave anônima...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('categories')
      .select('count', { count: 'exact', head: true });
    
    if (anonError) {
      console.log('❌ Erro com chave anônima:', anonError.message);
      return false;
    } else {
      console.log('✅ Chave anônima funcionando corretamente');
    }
    
    // Testar com chave de serviço
    console.log('🔑 Testando conexão com chave de serviço...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('businesses')
      .select('count', { count: 'exact', head: true });
    
    if (serviceError) {
      console.log('❌ Erro com chave de serviço:', serviceError.message);
      return false;
    } else {
      console.log('✅ Chave de serviço funcionando corretamente');
    }
    
    // Testar estrutura das tabelas
    console.log('\n📊 Verificando estrutura das tabelas...');
    
    const tables = ['categories', 'subcategories', 'businesses', 'admins'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseService
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela '${table}': ${error.message}`);
        } else {
          console.log(`✅ Tabela '${table}': OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela '${table}': ${err.message}`);
      }
    }
    
    console.log('\n🎉 Validação concluída com sucesso!');
    console.log('✅ Todas as credenciais do Supabase estão funcionando corretamente.');
    
    return true;
    
  } catch (error) {
    console.log('❌ ERRO durante a validação:', error.message);
    return false;
  }
}

// Executar validação
validateSupabaseCredentials()
  .then(success => {
    if (success) {
      console.log('\n🚀 Sistema pronto para uso!');
    } else {
      console.log('\n⚠️  Verifique as configurações no painel do Supabase.');
      console.log('📖 Consulte: https://supabase.com/dashboard');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });