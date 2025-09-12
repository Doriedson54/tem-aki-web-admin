#!/usr/bin/env node

/**
 * Script de Verificação de Domínio
 * Verifica se o domínio está configurado corretamente
 */

const dns = require('dns');
const https = require('https');
const http = require('http');
const { promisify } = require('util');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

class DomainVerifier {
  constructor(domain) {
    this.domain = domain;
    this.results = {
      dns: {},
      ssl: {},
      http: {},
      performance: {},
      security: {}
    };
  }

  async verifyAll() {
    console.log(`🔍 Verificando domínio: ${this.domain}\n`);
    
    try {
      await this.verifyDNS();
      await this.verifyHTTP();
      await this.verifyHTTPS();
      await this.verifySSL();
      await this.verifyRedirects();
      await this.verifyPerformance();
      await this.verifySecurity();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Erro durante verificação:', error.message);
    }
  }

  async verifyDNS() {
    console.log('📡 Verificando configurações DNS...');
    
    try {
      // Verificar registro A
      const aRecord = await dnsLookup(this.domain);
      this.results.dns.a_record = {
        status: 'success',
        ip: aRecord.address,
        family: aRecord.family
      };
      console.log(`   ✅ Registro A: ${aRecord.address}`);
    } catch (error) {
      this.results.dns.a_record = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ Registro A: ${error.message}`);
    }

    try {
      // Verificar www
      const wwwRecord = await dnsLookup(`www.${this.domain}`);
      this.results.dns.www_record = {
        status: 'success',
        ip: wwwRecord.address
      };
      console.log(`   ✅ Registro WWW: ${wwwRecord.address}`);
    } catch (error) {
      this.results.dns.www_record = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ Registro WWW: ${error.message}`);
    }

    try {
      // Verificar registros MX
      const mxRecords = await dnsResolveMx(this.domain);
      this.results.dns.mx_records = {
        status: 'success',
        records: mxRecords
      };
      console.log(`   ✅ Registros MX: ${mxRecords.length} encontrados`);
    } catch (error) {
      this.results.dns.mx_records = {
        status: 'warning',
        error: 'Nenhum registro MX encontrado'
      };
      console.log(`   ⚠️  Registros MX: Não configurados`);
    }

    try {
      // Verificar registros TXT
      const txtRecords = await dnsResolveTxt(this.domain);
      this.results.dns.txt_records = {
        status: 'success',
        records: txtRecords
      };
      console.log(`   ✅ Registros TXT: ${txtRecords.length} encontrados`);
    } catch (error) {
      this.results.dns.txt_records = {
        status: 'warning',
        error: 'Nenhum registro TXT encontrado'
      };
      console.log(`   ⚠️  Registros TXT: Não configurados`);
    }
  }

  async verifyHTTP() {
    console.log('\n🌐 Verificando conectividade HTTP...');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = http.get(`http://${this.domain}`, (res) => {
        const responseTime = Date.now() - startTime;
        
        this.results.http = {
          status: 'success',
          statusCode: res.statusCode,
          headers: res.headers,
          responseTime: responseTime
        };
        
        console.log(`   ✅ HTTP Status: ${res.statusCode}`);
        console.log(`   ✅ Tempo de resposta: ${responseTime}ms`);
        
        if (res.statusCode >= 300 && res.statusCode < 400) {
          console.log(`   ✅ Redirecionamento para: ${res.headers.location}`);
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        this.results.http = {
          status: 'error',
          error: error.message
        };
        console.log(`   ❌ HTTP: ${error.message}`);
        resolve();
      });
      
      req.setTimeout(10000, () => {
        this.results.http = {
          status: 'error',
          error: 'Timeout'
        };
        console.log(`   ❌ HTTP: Timeout`);
        req.destroy();
        resolve();
      });
    });
  }

  async verifyHTTPS() {
    console.log('\n🔒 Verificando conectividade HTTPS...');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = https.get(`https://${this.domain}`, (res) => {
        const responseTime = Date.now() - startTime;
        
        this.results.ssl.https = {
          status: 'success',
          statusCode: res.statusCode,
          responseTime: responseTime
        };
        
        console.log(`   ✅ HTTPS Status: ${res.statusCode}`);
        console.log(`   ✅ Tempo de resposta: ${responseTime}ms`);
        
        resolve();
      });
      
      req.on('error', (error) => {
        this.results.ssl.https = {
          status: 'error',
          error: error.message
        };
        console.log(`   ❌ HTTPS: ${error.message}`);
        resolve();
      });
      
      req.setTimeout(10000, () => {
        this.results.ssl.https = {
          status: 'error',
          error: 'Timeout'
        };
        console.log(`   ❌ HTTPS: Timeout`);
        req.destroy();
        resolve();
      });
    });
  }

  async verifySSL() {
    console.log('\n🔐 Verificando certificado SSL...');
    
    return new Promise((resolve) => {
      const req = https.get(`https://${this.domain}`, (res) => {
        const cert = res.socket.getPeerCertificate();
        
        if (cert && Object.keys(cert).length > 0) {
          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const now = new Date();
          const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
          
          this.results.ssl.certificate = {
            status: 'success',
            issuer: cert.issuer.CN,
            subject: cert.subject.CN,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            daysUntilExpiry: daysUntilExpiry,
            algorithm: cert.sigalg
          };
          
          console.log(`   ✅ Certificado válido`);
          console.log(`   ✅ Emissor: ${cert.issuer.CN}`);
          console.log(`   ✅ Válido até: ${validTo.toLocaleDateString()}`);
          console.log(`   ✅ Dias até expirar: ${daysUntilExpiry}`);
          
          if (daysUntilExpiry < 30) {
            console.log(`   ⚠️  Certificado expira em menos de 30 dias!`);
          }
        } else {
          this.results.ssl.certificate = {
            status: 'error',
            error: 'Certificado não encontrado'
          };
          console.log(`   ❌ Certificado não encontrado`);
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        this.results.ssl.certificate = {
          status: 'error',
          error: error.message
        };
        console.log(`   ❌ SSL: ${error.message}`);
        resolve();
      });
    });
  }

  async verifyRedirects() {
    console.log('\n🔄 Verificando redirecionamentos...');
    
    const urlsToTest = [
      `http://${this.domain}`,
      `http://www.${this.domain}`,
      `https://www.${this.domain}`
    ];
    
    for (const url of urlsToTest) {
      await this.checkRedirect(url);
    }
  }

  async checkRedirect(url) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          console.log(`   ✅ ${url} → ${res.headers.location}`);
        } else {
          console.log(`   ✅ ${url} → ${res.statusCode}`);
        }
        resolve();
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ ${url} → ${error.message}`);
        resolve();
      });
      
      req.setTimeout(5000, () => {
        console.log(`   ❌ ${url} → Timeout`);
        req.destroy();
        resolve();
      });
    });
  }

  async verifyPerformance() {
    console.log('\n⚡ Verificando performance...');
    
    const tests = [
      { path: '/', name: 'Página inicial' },
      { path: '/directory', name: 'Diretório' },
      { path: '/health', name: 'Health check' }
    ];
    
    for (const test of tests) {
      await this.measurePerformance(test.path, test.name);
    }
  }

  async measurePerformance(path, name) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = https.get(`https://${this.domain}${path}`, (res) => {
        const responseTime = Date.now() - startTime;
        const contentLength = res.headers['content-length'] || 0;
        
        console.log(`   ✅ ${name}: ${responseTime}ms (${contentLength} bytes)`);
        
        if (responseTime > 3000) {
          console.log(`   ⚠️  ${name}: Resposta lenta (>3s)`);
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ ${name}: ${error.message}`);
        resolve();
      });
      
      req.setTimeout(10000, () => {
        console.log(`   ❌ ${name}: Timeout`);
        req.destroy();
        resolve();
      });
    });
  }

  async verifySecurity() {
    console.log('\n🛡️  Verificando cabeçalhos de segurança...');
    
    return new Promise((resolve) => {
      const req = https.get(`https://${this.domain}`, (res) => {
        const headers = res.headers;
        
        const securityHeaders = {
          'strict-transport-security': 'HSTS',
          'x-frame-options': 'X-Frame-Options',
          'x-content-type-options': 'X-Content-Type-Options',
          'x-xss-protection': 'X-XSS-Protection',
          'content-security-policy': 'CSP'
        };
        
        this.results.security.headers = {};
        
        for (const [header, name] of Object.entries(securityHeaders)) {
          if (headers[header]) {
            this.results.security.headers[header] = headers[header];
            console.log(`   ✅ ${name}: ${headers[header]}`);
          } else {
            console.log(`   ⚠️  ${name}: Não configurado`);
          }
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ Erro ao verificar segurança: ${error.message}`);
        resolve();
      });
    });
  }

  generateReport() {
    console.log('\n📊 RELATÓRIO DE VERIFICAÇÃO');
    console.log('=' .repeat(50));
    
    // Resumo geral
    const issues = this.countIssues();
    console.log(`\n🎯 Resumo:`);
    console.log(`   Domínio: ${this.domain}`);
    console.log(`   Status geral: ${issues.errors === 0 ? '✅ Funcionando' : '❌ Com problemas'}`);
    console.log(`   Erros: ${issues.errors}`);
    console.log(`   Avisos: ${issues.warnings}`);
    
    // Recomendações
    console.log(`\n💡 Recomendações:`);
    
    if (this.results.dns.mx_records?.status !== 'success') {
      console.log(`   - Configurar registros MX para email`);
    }
    
    if (!this.results.security.headers?.['strict-transport-security']) {
      console.log(`   - Configurar HSTS para segurança`);
    }
    
    if (!this.results.security.headers?.['content-security-policy']) {
      console.log(`   - Implementar Content Security Policy`);
    }
    
    if (this.results.ssl.certificate?.daysUntilExpiry < 30) {
      console.log(`   - Renovar certificado SSL em breve`);
    }
    
    // Salvar relatório
    const reportPath = `./domain-report-${this.domain}-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
  }

  countIssues() {
    let errors = 0;
    let warnings = 0;
    
    const checkObject = (obj) => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          if (value.status === 'error') errors++;
          if (value.status === 'warning') warnings++;
          checkObject(value);
        }
      }
    };
    
    checkObject(this.results);
    return { errors, warnings };
  }
}

async function main() {
  console.log('🔍 Verificador de Domínio - Site Institucional\n');
  
  try {
    const domain = await question('Digite o domínio para verificar (ex: meusite.com.br): ');
    
    if (!domain) {
      console.log('❌ Domínio é obrigatório');
      process.exit(1);
    }
    
    const verifier = new DomainVerifier(domain.trim());
    await verifier.verifyAll();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    rl.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { DomainVerifier };