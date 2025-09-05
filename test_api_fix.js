const axios = require('axios');

// Teste para verificar se a correção do campo 'category' funcionou
async function testBusinessCreation() {
  try {
    console.log('Testando criação de negócio com dados corrigidos...');
    
    // Primeiro, fazer login para obter o token
     const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
       email: 'admin@temaki.com',
       password: 'admin123'
     });
    
    const token = loginResponse.data.token;
    console.log('Login realizado com sucesso');
    
    // Dados de teste sem o campo 'category' problemático
    const businessData = {
      name: 'Teste Negócio API',
      description: 'Descrição do teste',
      category_id: null, // Será definido após buscar categorias
      phone: '(98) 99999-9999',
      whatsapp: '(98) 99999-9999',
      email: 'teste@teste.com',
      address: 'Rua Teste, 123',
      neighborhood: 'Bairro Teste',
      city: 'São Luís',
      state: 'MA',
      zip_code: '65000-000',
      status: 'pending'
    };
    
    // Buscar categorias primeiro
    const categoriesResponse = await axios.get('http://192.168.3.195:3000/api/categories');
    const categories = categoriesResponse.data.data;
    
    if (categories && categories.length > 0) {
      businessData.category_id = categories[0].id;
      console.log('Categoria definida:', categories[0].name);
    }
    
    console.log('Dados que serão enviados:', JSON.stringify(businessData, null, 2));
    
    // Tentar criar o negócio
    const response = await axios.post('http://192.168.3.195:3000/api/businesses', businessData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Negócio criado com sucesso!');
    console.log('Resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro ao criar negócio:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testBusinessCreation();