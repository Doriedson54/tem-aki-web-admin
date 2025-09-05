const axios = require('axios');

// Teste para verificar se a API está funcionando
async function testApi() {
  try {
    console.log('🧪 Testando API...');
    
    // Teste 1: Verificar se o servidor está rodando
    console.log('\n1. Testando conexão com o servidor...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Servidor está rodando:', healthResponse.status);
    
    // Teste 2: Obter categorias
    console.log('\n2. Testando endpoint de categorias...');
    const categoriesResponse = await axios.get('http://localhost:3000/api/categories');
    console.log('✅ Categorias obtidas:', categoriesResponse.data.length, 'categorias');
    console.log('📋 Primeira categoria:', categoriesResponse.data[0]);
    
    // Teste 3: Criar um negócio de teste
    console.log('\n3. Testando criação de negócio...');
    const testBusiness = {
      name: 'Teste API Business',
      description: 'Negócio de teste para verificar a API',
      category: 'Restaurantes', // String que deve ser convertida para category_id
      address: 'Rua de Teste, 123',
      neighborhood: 'Bairro Teste',
      city: 'Cidade Teste',
      state: 'SP',
      zipCode: '12345-678',
      phone: '(11) 99999-9999',
      email: 'teste@teste.com',
      operatingHours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      socialMedia: {
        whatsapp: '11999999999',
        instagram: '@teste',
        facebook: 'facebook.com/teste'
      }
    };
    
    const createResponse = await axios.post('http://localhost:3000/api/businesses', testBusiness);
    console.log('✅ Negócio criado com sucesso!');
    console.log('📄 Resposta:', createResponse.data);
    
    console.log('\n🎉 Todos os testes passaram! A API está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('📄 Resposta do servidor:', error.response.status, error.response.data);
    }
    process.exit(1);
  }
}

// Executar os testes
testApi();