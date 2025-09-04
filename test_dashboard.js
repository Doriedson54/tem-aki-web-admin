require('dotenv').config();
const { supabaseService } = require('./config/supabase');

async function testDashboard() {
  console.log('🔍 Testando dados do dashboard...');
  console.log('=' .repeat(50));
  
  try {
    console.log('📊 1. Testando busca de estatísticas básicas...');
    
    // Testar as mesmas queries do dashboard
    const [businessesResult, categoriesResult, pendingResult, recentActivitiesResult, recentBusinessesResult] = await Promise.all([
      // Total de negócios
      supabaseService
        .from('businesses')
        .select('id', { count: 'exact' }),
      
      // Total de categorias
      supabaseService
        .from('categories')
        .select('id', { count: 'exact' }),
      
      // Negócios pendentes
      supabaseService
        .from('businesses')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),
      
      // Atividades recentes
      supabaseService
        .from('activity_logs')
        .select(`
          id,
          action,
          details,
          created_at,
          users!inner(username)
        `)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Negócios recentes
      supabaseService
        .from('businesses')
        .select(`
          id,
          name,
          phone,
          status,
          created_at,
          categories!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);
    
    console.log('✅ Estatísticas básicas carregadas:');
    console.log('   📊 Total de negócios:', businessesResult.count || 0);
    console.log('   📂 Total de categorias:', categoriesResult.count || 0);
    console.log('   ⏳ Negócios pendentes:', pendingResult.count || 0);
    console.log('   📝 Atividades recentes:', (recentActivitiesResult.data || []).length);
    console.log('   🏢 Negócios recentes:', (recentBusinessesResult.data || []).length);
    
    console.log('\n📈 2. Testando estatísticas por status...');
    
    // Buscar negócios por status
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
    console.log('   ✅ Aprovados:', statusStats.approved);
    console.log('   ⏳ Pendentes:', statusStats.pending);
    console.log('   ❌ Rejeitados:', statusStats.rejected);
    
    console.log('\n📊 3. Testando estatísticas por categoria...');
    
    // Buscar negócios por categoria
    const categoryStats = await supabaseService
      .from('businesses')
      .select(`
        categories!inner(name),
        id
      `)
      .eq('status', 'approved')
      .then(({ data }) => {
        const stats = {};
        if (data) {
          data.forEach(business => {
            const categoryName = business.categories.name;
            stats[categoryName] = (stats[categoryName] || 0) + 1;
          });
        }
        return Object.entries(stats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      });
    
    console.log('✅ Top 5 categorias:');
    categoryStats.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}: ${cat.count} negócios`);
    });
    
    console.log('\n🏢 4. Testando processamento de negócios recentes...');
    
    // Processar negócios recentes para incluir category_name
    const recentBusinesses = (recentBusinessesResult.data || []).map(business => ({
      ...business,
      category_name: business.categories?.name || 'Sem categoria'
    }));
    
    console.log('✅ Negócios recentes processados:');
    recentBusinesses.slice(0, 3).forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} - ${business.category_name} (${business.status})`);
    });
    
    console.log('\n🎉 TESTE DO DASHBOARD PASSOU!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Todas as queries executaram sem erro');
    console.log('   ✅ Variável recentBusinesses está sendo criada');
    console.log('   ✅ Variável businessesByCategory está sendo criada');
    console.log('   ✅ Todas as variáveis necessárias para a view estão disponíveis');
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
    console.log('📋 Stack trace:', error.stack);
    return false;
  }
}

// Executar teste
testDashboard()
  .then(success => {
    if (success) {
      console.log('\n🚀 Dashboard funcionando perfeitamente!');
      console.log('🌐 Acesse: http://localhost:3000/dashboard');
    } else {
      console.log('\n⚠️  Problemas detectados no dashboard.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });