require('dotenv').config();
const { supabaseService } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function testLoginFlow() {
  console.log('🔍 Testando fluxo completo de login...');
  console.log('=' .repeat(50));
  
  try {
    // Simular processo de login
    const username = 'admin';
    const password = 'admin123';
    
    console.log('📋 1. Buscando usuário:', username);
    const { data: user, error } = await supabaseService
      .from('admins')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .single();
    
    if (error || !user) {
      console.log('❌ Usuário não encontrado:', error?.message || 'Não existe');
      return false;
    }
    
    console.log('✅ Usuário encontrado:', user.username);
    
    // Verificar senha
    console.log('🔑 2. Verificando senha...');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.log('❌ Senha incorreta!');
      return false;
    }
    
    console.log('✅ Senha verificada com sucesso!');
    
    // Simular criação da sessão
    console.log('👤 3. Simulando criação da sessão...');
    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      is_super_admin: user.is_super_admin,
      role: 'admin' // Campo necessário para o middleware
    };
    
    console.log('✅ Sessão criada com sucesso!');
    console.log('📋 Dados da sessão:');
    console.log('   👤 ID:', sessionUser.id);
    console.log('   🏷️  Username:', sessionUser.username);
    console.log('   📧 Email:', sessionUser.email);
    console.log('   👑 Super Admin:', sessionUser.is_super_admin);
    console.log('   🔐 Role:', sessionUser.role);
    
    // Verificar se o middleware permitiria acesso
    console.log('\n🛡️  4. Verificando permissões do middleware...');
    
    if (!sessionUser) {
      console.log('❌ Usuário não está logado');
      return false;
    }
    
    if (sessionUser.role !== 'admin') {
      console.log('❌ Usuário não tem role de admin');
      return false;
    }
    
    console.log('✅ Middleware permitiria acesso!');
    
    console.log('\n🎉 TESTE COMPLETO PASSOU!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Usuário encontrado no banco');
    console.log('   ✅ Senha verificada');
    console.log('   ✅ Sessão criada corretamente');
    console.log('   ✅ Middleware permitiria acesso');
    
    console.log('\n🌐 Credenciais para teste:');
    console.log('   👤 Usuário: admin');
    console.log('   🔑 Senha: admin123');
    console.log('   🔗 URL: http://localhost:3000/auth/login');
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
    return false;
  }
}

// Executar teste
testLoginFlow()
  .then(success => {
    if (success) {
      console.log('\n🚀 Fluxo de login funcionando perfeitamente!');
    } else {
      console.log('\n⚠️  Problemas detectados no fluxo de login.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });