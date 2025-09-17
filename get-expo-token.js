#!/usr/bin/env node

/**
 * Script para obter o token do Expo para configurar no GitHub Actions
 * Execute: node get-expo-token.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getExpoToken() {
  try {
    // Caminho do arquivo de token do Expo
    const tokenPath = path.join(os.homedir(), '.expo', 'state.json');
    
    if (!fs.existsSync(tokenPath)) {
      console.log('❌ Arquivo de estado do Expo não encontrado.');
      console.log('📝 Execute primeiro: npx expo login');
      return null;
    }

    const stateContent = fs.readFileSync(tokenPath, 'utf8');
    const state = JSON.parse(stateContent);
    
    if (state.auth && state.auth.sessionSecret) {
      console.log('✅ Token do Expo encontrado!');
      console.log('📋 Copie o token abaixo e configure como EXPO_TOKEN no GitHub:');
      console.log('');
      console.log('🔑 Token:');
      console.log(state.auth.sessionSecret);
      console.log('');
      console.log('📖 Instruções:');
      console.log('1. Vá para seu repositório no GitHub');
      console.log('2. Settings > Secrets and variables > Actions');
      console.log('3. New repository secret');
      console.log('4. Name: EXPO_TOKEN');
      console.log('5. Value: (cole o token acima)');
      
      return state.auth.sessionSecret;
    } else {
      console.log('❌ Token não encontrado no arquivo de estado.');
      console.log('📝 Execute: npx expo login');
      return null;
    }
  } catch (error) {
    console.log('❌ Erro ao ler arquivo de estado do Expo:', error.message);
    console.log('📝 Execute: npx expo login');
    return null;
  }
}

function checkExpoLogin() {
  try {
    const { execSync } = require('child_process');
    const result = execSync('npx expo whoami', { encoding: 'utf8' });
    
    if (result.trim() && !result.includes('Not logged in')) {
      console.log('✅ Logado no Expo como:', result.trim());
      return true;
    } else {
      console.log('❌ Não está logado no Expo');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar login do Expo');
    return false;
  }
}

console.log('🔍 Verificando login do Expo...');
if (checkExpoLogin()) {
  console.log('');
  getExpoToken();
} else {
  console.log('');
  console.log('📝 Para fazer login no Expo, execute:');
  console.log('   npx expo login');
  console.log('');
  console.log('📝 Depois execute novamente este script:');
  console.log('   node get-expo-token.js');
}