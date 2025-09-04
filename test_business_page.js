const http = require('http');

// Função para testar se a página de negócios está carregando
function testBusinessPage() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/businesses',
    method: 'GET',
    headers: {
      'Cookie': 'connect.sid=test' // Cookie de sessão simulado
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 302) {
        console.log('✅ Redirecionamento para login (esperado sem autenticação)');
        console.log('🔗 Location:', res.headers.location);
      } else if (res.statusCode === 200) {
        console.log('✅ Página carregada com sucesso!');
        if (data.includes('ReferenceError')) {
          console.log('❌ Erro encontrado na página:');
          const errorMatch = data.match(/ReferenceError[^<]*/g);
          if (errorMatch) {
            console.log('🐛 Erro:', errorMatch[0]);
          }
        } else {
          console.log('✅ Nenhum erro ReferenceError encontrado!');
        }
      } else {
        console.log('❌ Status inesperado:', res.statusCode);
        console.log('📄 Resposta:', data.substring(0, 500));
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Erro na requisição:', e.message);
  });
  
  req.end();
}

console.log('🧪 Testando página de negócios...');
testBusinessPage();