require('dotenv').config();
const { supabaseService } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('🔍 Testando sistema de login...');
  console.log('=' .repeat(50));
  
  try {
    // Testar busca do admin padrão
    console.log('📋 Buscando admin padrão...');
    const { data: user, error } = await supabaseService
      .from('admins')
      .select('*')
      .or('username.eq.admin,email.eq.admin')
      .single();
    
    if (error) {
      console.log('❌ Erro ao buscar admin:', error.message);
      return false;
    }
    
    if (!user) {
      console.log('❌ Admin padrão não encontrado!');
      console.log('💡 Execute o SQL no painel do Supabase para criar o admin.');
      return false;
    }
    
    console.log('✅ Admin encontrado:');
    console.log('   👤 Username:', user.username);
    console.log('   📧 Email:', user.email);
    console.log('   👑 Super Admin:', user.is_super_admin);
    console.log('   🟢 Ativo:', user.is_active);
    
    // Testar verificação de senha
    console.log('\n🔑 Testando verificação de senha...');
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    
    if (isMatch) {
      console.log('✅ Senha verificada com sucesso!');
      console.log('\n🎉 Sistema de login funcionando corretamente!');
      console.log('\n📋 Credenciais para teste:');
      console.log('   👤 Usuário: admin');
      console.log('   🔑 Senha: admin123');
      return true;
    } else {
      console.log('❌ Senha não confere!');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
    return false;
  }
}

// Executar teste
testLogin()
  .then(success => {
    if (success) {
      console.log('\n🚀 Teste concluído com sucesso!');
      console.log('🌐 Acesse: http://localhost:3000/auth/login');
    } else {
      console.log('\n⚠️  Teste falhou. Verifique as configurações.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });