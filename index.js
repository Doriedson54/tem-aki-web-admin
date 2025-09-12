#!/usr/bin/env node

/**
 * Tem Aki Admin - Launcher Principal
 * 
 * Este arquivo detecta automaticamente qual versão da aplicação executar
 * baseado na configuração DATABASE_TYPE no arquivo .env
 * 
 * - DATABASE_TYPE=sqlite -> Executa app.js (versão SQLite)
 * - DATABASE_TYPE=supabase -> Executa app_supabase.js (versão Supabase)
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Função para exibir banner de inicialização
function showBanner(version, dbType) {
  console.log('\n' + '='.repeat(60));
  console.log('🏪  TEM AKI NO BAIRRO - PAINEL ADMINISTRATIVO');
  console.log('='.repeat(60));
  console.log(`📊  Versão: ${version}`);
  console.log(`🗄️   Banco: ${dbType.toUpperCase()}`);
  console.log(`🌍  Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀  Porta: ${process.env.PORT || 3000}`);
  console.log('='.repeat(60) + '\n');
}

// Função principal
function main() {
  const databaseType = process.env.DATABASE_TYPE || 'sqlite';
  
  let appFile;
  let version;
  
  switch (databaseType.toLowerCase()) {
    case 'supabase':
      appFile = './app_supabase.js';
      version = '2.0.0 (Supabase)';
      break;
      
    case 'sqlite':
    default:
      appFile = './app.js';
      version = '1.0.0 (SQLite)';
      break;
  }
  
  // Verificar se o arquivo da aplicação existe
  const appPath = path.resolve(__dirname, appFile);
  if (!fileExists(appPath)) {
    console.error(`❌ Erro: Arquivo da aplicação não encontrado: ${appFile}`);
    console.error(`   Verifique se o arquivo existe no diretório do projeto.`);
    process.exit(1);
  }
  
  // Validações específicas para Supabase
  if (databaseType.toLowerCase() === 'supabase') {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`❌ Erro: Variáveis de ambiente do Supabase não configuradas:`);
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error(`\n📖 Consulte o arquivo SUPABASE_SETUP_GUIDE.md para instruções.`);
      process.exit(1);
    }
    
    // Verificar se as URLs do Supabase são válidas
    if (!process.env.SUPABASE_URL.includes('supabase.co')) {
      console.warn(`⚠️  Aviso: SUPABASE_URL pode estar incorreta: ${process.env.SUPABASE_URL}`);
    }
  }
  
  // Exibir banner
  showBanner(version, databaseType);
  
  // Informações adicionais para Supabase
  if (databaseType.toLowerCase() === 'supabase') {
    console.log(`🔗  Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`📦  Storage Bucket: ${process.env.SUPABASE_STORAGE_BUCKET || 'business-images'}`);
    console.log('');
  }
  
  // Executar a aplicação
  try {
    console.log(`🚀  Iniciando aplicação: ${appFile}\n`);
    require(appFile);
  } catch (error) {
    console.error(`❌ Erro ao iniciar a aplicação:`);
    console.error(error.message);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`\n💡 Dica: Execute 'npm install' para instalar as dependências.`);
    }
    
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Tratamento de sinais de sistema
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando aplicação...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Encerrando aplicação...');
  process.exit(0);
});

// Executar aplicação
if (require.main === module) {
  main();
}

module.exports = { main };