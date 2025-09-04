const http = require('http');
const querystring = require('querystring');

// Função para fazer login
function login(callback) {
  const loginData = querystring.stringify({
    username: 'admin',
    password: 'admin123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(loginData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    console.log(`Login Status: ${res.statusCode}`);
    
    // Extrair cookies da resposta
    const cookies = res.headers['set-cookie'];
    let sessionCookie = '';
    
    if (cookies) {
      cookies.forEach(cookie => {
        if (cookie.includes('connect.sid')) {
          sessionCookie = cookie.split(';')[0];
        }
      });
    }
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 302 && res.headers.location === '/dashboard') {
        console.log('✅ Login realizado com sucesso!');
        callback(sessionCookie);
      } else {
        console.log('❌ Falha no login');
        console.log('Response:', data);
      }
    });
  });

  loginReq.on('error', (e) => {
    console.error(`Erro no login: ${e.message}`);
  });

  loginReq.write(loginData);
  loginReq.end();
}

// Função para acessar a página de negócios
function checkBusinessPage(sessionCookie) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/businesses',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': sessionCookie
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nBusiness Page Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n=== VERIFICANDO MUDANÇAS VISUAIS ===');
      
      // Verificar se contém os novos estilos
      if (data.includes('business-stat-card')) {
        console.log('✅ Novos estilos de cartões encontrados');
      } else {
        console.log('❌ Novos estilos de cartões NÃO encontrados');
      }
      
      if (data.includes('counter')) {
        console.log('✅ Contadores animados encontrados');
      } else {
        console.log('❌ Contadores animados NÃO encontrados');
      }
      
      if (data.includes('stat-progress')) {
        console.log('✅ Barras de progresso encontradas');
      } else {
        console.log('❌ Barras de progresso NÃO encontradas');
      }
      
      if (data.includes('animateCounter')) {
        console.log('✅ JavaScript de animação encontrado');
      } else {
        console.log('❌ JavaScript de animação NÃO encontrado');
      }
      
      if (data.includes('tem_aki_logo.png')) {
        console.log('✅ Logo no cabeçalho encontrado');
      } else {
        console.log('❌ Logo no cabeçalho NÃO encontrado');
      }
      
      if (data.includes('linear-gradient')) {
        console.log('✅ Gradientes CSS encontrados');
      } else {
        console.log('❌ Gradientes CSS NÃO encontrados');
      }
      
      console.log('\n=== RESUMO ===');
      console.log(`Tamanho da resposta: ${data.length} caracteres`);
      console.log(`Status da resposta: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('\n🎉 Página carregada com sucesso! As mudanças visuais devem estar visíveis.');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.end();
}

// Executar o teste
console.log('🔐 Fazendo login...');
login(checkBusinessPage);