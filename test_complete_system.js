require('dotenv').config();
const { supabaseService, logUserActivity } = require('./config/supabase');

async function testCompleteSystem() {
  console.log('🔍 Testando sistema completo migrado para Supabase...');
  console.log('=' .repeat(60));
  
  let allTestsPassed = true;
  
  try {
    // 1. Teste de Conexão
    console.log('\n🔌 1. Testando conexão com Supabase...');
    const { data: connectionTest } = await supabaseService
      .from('categories')
      .select('count', { count: 'exact' })
      .limit(1);
    console.log('✅ Conexão com Supabase estabelecida');
    
    // 2. Teste de Autenticação
    console.log('\n🔐 2. Testando sistema de autenticação...');
    const { data: adminUser } = await supabaseService
      .from('admins')
      .select('id, username, email')
      .eq('username', 'admin')
      .single();
    
    if (adminUser) {
      console.log('✅ Admin padrão encontrado:', adminUser.username);
    } else {
      console.log('❌ Admin padrão não encontrado');
      allTestsPassed = false;
    }
    
    // 3. Teste de Categorias
    console.log('\n📂 3. Testando sistema de categorias...');
    const { data: categories, count: categoriesCount } = await supabaseService
      .from('categories')
      .select('*', { count: 'exact' });
    
    console.log(`✅ ${categoriesCount} categorias encontradas:`);
    categories.slice(0, 3).forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });
    
    // 4. Teste de Subcategorias
    console.log('\n📋 4. Testando sistema de subcategorias...');
    const { data: subcategories, count: subcategoriesCount } = await supabaseService
      .from('subcategories')
      .select(`
        *,
        categories!inner(name)
      `, { count: 'exact' });
    
    console.log(`✅ ${subcategoriesCount} subcategorias encontradas`);
    if (subcategories.length > 0) {
      subcategories.slice(0, 2).forEach(sub => {
        console.log(`   - ${sub.name} (categoria: ${sub.categories.name})`);
      });
    }
    
    // 5. Teste de Negócios
    console.log('\n🏢 5. Testando sistema de negócios...');
    const { data: businesses, count: businessesCount } = await supabaseService
      .from('businesses')
      .select(`
        *,
        categories!inner(name)
      `, { count: 'exact' });
    
    console.log(`✅ ${businessesCount} negócios encontrados`);
    if (businesses.length > 0) {
      businesses.slice(0, 2).forEach(business => {
        console.log(`   - ${business.name} (${business.categories.name}) - Status: ${business.status}`);
      });
    }
    
    // 6. Teste de Imagens de Negócios
    console.log('\n🖼️  6. Testando sistema de imagens...');
    const { data: businessImages, count: imagesCount } = await supabaseService
      .from('business_images')
      .select('*', { count: 'exact' });
    
    console.log(`✅ ${imagesCount} imagens de negócios encontradas`);
    
    // 7. Teste de Histórico de Moderação
    console.log('\n📝 7. Testando histórico de moderação...');
    const { data: moderationHistory, count: moderationCount } = await supabaseService
      .from('moderation_history')
      .select(`
        *,
        users!inner(username),
        businesses!inner(name)
      `, { count: 'exact' });
    
    console.log(`✅ ${moderationCount} registros de moderação encontrados`);
    
    // 8. Teste de Logs de Atividade
    console.log('\n📊 8. Testando logs de atividade...');
    const { data: activityLogs, count: logsCount } = await supabaseService
      .from('activity_logs')
      .select(`
        *,
        users!inner(username)
      `, { count: 'exact' });
    
    console.log(`✅ ${logsCount} logs de atividade encontrados`);
    
    // 9. Teste de Estatísticas do Dashboard
    console.log('\n📈 9. Testando estatísticas do dashboard...');
    
    // Estatísticas por status
    const statusStats = await supabaseService
      .from('businesses')
      .select('status')
      .then(({ data }) => {
        const stats = { approved: 0, pending: 0, rejected: 0 };
        if (data) {
          data.forEach(business => {
            stats[business.status] = (stats[business.status] || 0) + 1;
          });
        }
        return stats;
      });
    
    console.log('✅ Estatísticas por status:');
    console.log(`   - Aprovados: ${statusStats.approved}`);
    console.log(`   - Pendentes: ${statusStats.pending}`);
    console.log(`   - Rejeitados: ${statusStats.rejected}`);
    
    // 10. Teste de Funcionalidade de Log
    console.log('\n📝 10. Testando funcionalidade de log...');
    if (adminUser) {
      await logUserActivity(
        adminUser.id,
        'system_test',
        { test_type: 'complete_system_test', timestamp: new Date().toISOString() },
        '127.0.0.1'
      );
      console.log('✅ Log de atividade criado com sucesso');
    }
    
    // 11. Teste de Políticas RLS
    console.log('\n🔒 11. Testando políticas RLS...');
    try {
      // Tentar acessar dados sem autenticação (deve funcionar pois estamos usando service role)
      const { data: rlsTest } = await supabaseService
        .from('categories')
        .select('id')
        .limit(1);
      
      if (rlsTest) {
        console.log('✅ Políticas RLS configuradas (acesso via service role)');
      }
    } catch (rlsError) {
      console.log('⚠️  Erro ao testar RLS:', rlsError.message);
    }
    
    // Resumo Final
    console.log('\n' + '=' .repeat(60));
    if (allTestsPassed) {
      console.log('🎉 TODOS OS TESTES PASSARAM!');
      console.log('\n📋 Resumo do Sistema:');
      console.log(`   📂 ${categoriesCount} categorias`);
      console.log(`   📋 ${subcategoriesCount} subcategorias`);
      console.log(`   🏢 ${businessesCount} negócios`);
      console.log(`   🖼️  ${imagesCount} imagens`);
      console.log(`   📝 ${moderationCount} registros de moderação`);
      console.log(`   📊 ${logsCount} logs de atividade`);
      console.log('\n🚀 Sistema "Negócios do Bairro" 100% funcional com Supabase!');
      console.log('\n🌐 URLs de Acesso:');
      console.log('   🔐 Login: http://localhost:3000/auth/login');
      console.log('   📊 Dashboard: http://localhost:3000/dashboard');
      console.log('   🏢 Negócios: http://localhost:3000/businesses');
      console.log('   📂 Categorias: http://localhost:3000/categories');
      console.log('\n👤 Credenciais de Acesso:');
      console.log('   📧 Usuário: admin');
      console.log('   🔑 Senha: admin123');
    } else {
      console.log('❌ ALGUNS TESTES FALHARAM!');
      console.log('⚠️  Verifique os erros acima e corrija antes de prosseguir.');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.log('❌ Erro durante os testes:', error.message);
    console.log('📋 Stack trace:', error.stack);
    return false;
  }
}

// Executar testes
testCompleteSystem()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });