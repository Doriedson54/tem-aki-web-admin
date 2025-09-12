require('dotenv').config();
const { supabaseService } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
  console.log('🔧 Corrigindo senha do admin padrão...');
  console.log('=' .repeat(50));
  
  try {
    // Gerar novo hash para a senha 'admin123'
    const password = 'admin123';
    console.log('🔑 Gerando hash para senha:', password);
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Hash gerado com sucesso');
    
    // Atualizar a senha do admin
    console.log('📝 Atualizando senha do admin...');
    const { data, error } = await supabaseService
      .from('admins')
      .update({ password_hash: hashedPassword })
      .eq('username', 'admin')
      .select();
    
    if (error) {
      console.log('❌ Erro ao atualizar senha:', error.message);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ Admin não encontrado para atualização!');
      return false;
    }
    
    console.log('✅ Senha atualizada com sucesso!');
    console.log('👤 Admin atualizado:', data[0].username);
    
    // Testar a nova senha
    console.log('\n🔍 Testando nova senha...');
    const { data: testUser, error: testError } = await supabaseService
      .from('admins')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (testError) {
      console.log('❌ Erro ao buscar admin para teste:', testError.message);
      return false;
    }
    
    const isMatch = await bcrypt.compare(password, testUser.password_hash);
    
    if (isMatch) {
      console.log('✅ Teste de senha bem-sucedido!');
      console.log('\n🎉 Senha corrigida com sucesso!');
      console.log('\n📋 Credenciais atualizadas:');
      console.log('   👤 Usuário: admin');
      console.log('   🔑 Senha: admin123');
      console.log('   📧 Email: admin@temakinobairro.com.br');
      return true;
    } else {
      console.log('❌ Teste de senha falhou!');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro durante a correção:', error.message);
    return false;
  }
}

// Executar correção
fixAdminPassword()
  .then(success => {
    if (success) {
      console.log('\n🚀 Correção concluída com sucesso!');
      console.log('🌐 Teste o login em: http://localhost:3000/auth/login');
    } else {
      console.log('\n⚠️  Correção falhou. Verifique as configurações.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });