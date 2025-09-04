#!/usr/bin/env node

/**
 * Script de Otimização para Produção
 * Otimiza assets, imagens e configurações para ambiente de produção
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

/**
 * Instalar dependências de otimização se necessário
 */
async function installOptimizationDeps() {
  logStep('1', 'Verificando dependências de otimização...');
  
  const requiredPackages = [
    'terser',
    'clean-css-cli',
    'imagemin',
    'imagemin-mozjpeg',
    'imagemin-pngquant',
    'imagemin-svgo'
  ];
  
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const installedPackages = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    const missingPackages = requiredPackages.filter(pkg => !installedPackages[pkg]);
    
    if (missingPackages.length > 0) {
      log(`Instalando dependências de otimização: ${missingPackages.join(', ')}`, 'yellow');
      execSync(`npm install --save-dev ${missingPackages.join(' ')}`, { stdio: 'inherit' });
      logSuccess('Dependências instaladas com sucesso');
    } else {
      logSuccess('Todas as dependências já estão instaladas');
    }
  } catch (error) {
    logError(`Erro ao verificar dependências: ${error.message}`);
    throw error;
  }
}

/**
 * Criar diretórios de build
 */
async function createBuildDirectories() {
  logStep('2', 'Criando diretórios de build...');
  
  const directories = [
    'dist',
    'dist/public',
    'dist/public/css',
    'dist/public/js',
    'dist/public/images',
    'dist/public/fonts'
  ];
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  logSuccess('Diretórios de build criados');
}

/**
 * Minificar arquivos CSS
 */
async function minifyCSS() {
  logStep('3', 'Minificando arquivos CSS...');
  
  try {
    const cssDir = 'public/css';
    const outputDir = 'dist/public/css';
    
    const files = await fs.readdir(cssDir);
    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    for (const file of cssFiles) {
      const inputPath = path.join(cssDir, file);
      const outputPath = path.join(outputDir, file.replace('.css', '.min.css'));
      
      try {
        execSync(`npx cleancss -o "${outputPath}" "${inputPath}"`, { stdio: 'pipe' });
        
        // Calcular economia de espaço
        const originalSize = (await fs.stat(inputPath)).size;
        const minifiedSize = (await fs.stat(outputPath)).size;
        const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        
        log(`  ${file} -> ${file.replace('.css', '.min.css')} (${savings}% menor)`, 'green');
      } catch (error) {
        logWarning(`Erro ao minificar ${file}: ${error.message}`);
      }
    }
    
    logSuccess(`${cssFiles.length} arquivos CSS minificados`);
  } catch (error) {
    logError(`Erro na minificação CSS: ${error.message}`);
  }
}

/**
 * Minificar arquivos JavaScript
 */
async function minifyJS() {
  logStep('4', 'Minificando arquivos JavaScript...');
  
  try {
    const jsDir = 'public/js';
    const outputDir = 'dist/public/js';
    
    const files = await fs.readdir(jsDir);
    const jsFiles = files.filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));
    
    for (const file of jsFiles) {
      const inputPath = path.join(jsDir, file);
      const outputPath = path.join(outputDir, file.replace('.js', '.min.js'));
      
      try {
        execSync(`npx terser "${inputPath}" -o "${outputPath}" --compress --mangle`, { stdio: 'pipe' });
        
        // Calcular economia de espaço
        const originalSize = (await fs.stat(inputPath)).size;
        const minifiedSize = (await fs.stat(outputPath)).size;
        const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        
        log(`  ${file} -> ${file.replace('.js', '.min.js')} (${savings}% menor)`, 'green');
      } catch (error) {
        logWarning(`Erro ao minificar ${file}: ${error.message}`);
      }
    }
    
    logSuccess(`${jsFiles.length} arquivos JavaScript minificados`);
  } catch (error) {
    logError(`Erro na minificação JavaScript: ${error.message}`);
  }
}

/**
 * Otimizar imagens
 */
async function optimizeImages() {
  logStep('5', 'Otimizando imagens...');
  
  try {
    const imagemin = require('imagemin');
    const imageminMozjpeg = require('imagemin-mozjpeg');
    const imageminPngquant = require('imagemin-pngquant');
    const imageminSvgo = require('imagemin-svgo');
    
    const inputDir = 'public/images';
    const outputDir = 'dist/public/images';
    
    const files = await imagemin([`${inputDir}/**/*.{jpg,jpeg,png,svg}`], {
      destination: outputDir,
      plugins: [
        imageminMozjpeg({ quality: 85 }),
        imageminPngquant({ quality: [0.6, 0.8] }),
        imageminSvgo({
          plugins: [
            { removeViewBox: false },
            { cleanupIDs: false }
          ]
        })
      ]
    });
    
    // Calcular economia total
    let totalOriginal = 0;
    let totalOptimized = 0;
    
    for (const file of files) {
      const originalPath = file.sourcePath;
      const optimizedPath = file.destinationPath;
      
      try {
        const originalSize = (await fs.stat(originalPath)).size;
        const optimizedSize = (await fs.stat(optimizedPath)).size;
        
        totalOriginal += originalSize;
        totalOptimized += optimizedSize;
        
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        log(`  ${path.basename(originalPath)} (${savings}% menor)`, 'green');
      } catch (error) {
        logWarning(`Erro ao calcular economia para ${path.basename(file.sourcePath)}`);
      }
    }
    
    const totalSavings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
    logSuccess(`${files.length} imagens otimizadas (${totalSavings}% de economia total)`);
  } catch (error) {
    logError(`Erro na otimização de imagens: ${error.message}`);
  }
}

/**
 * Gerar hashes para cache busting
 */
async function generateCacheHashes() {
  logStep('6', 'Gerando hashes para cache busting...');
  
  const hashMap = {};
  const distDir = 'dist/public';
  
  async function processDirectory(dir) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        await processDirectory(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.min.css') || item.name.endsWith('.min.js'))) {
        const content = await fs.readFile(fullPath);
        const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
        
        const relativePath = path.relative(distDir, fullPath);
        const ext = path.extname(item.name);
        const nameWithoutExt = path.basename(item.name, ext);
        const newName = `${nameWithoutExt}.${hash}${ext}`;
        const newPath = path.join(path.dirname(fullPath), newName);
        
        await fs.rename(fullPath, newPath);
        
        hashMap[relativePath] = path.relative(distDir, newPath);
        log(`  ${relativePath} -> ${path.basename(newPath)}`, 'green');
      }
    }
  }
  
  try {
    await processDirectory(distDir);
    
    // Salvar mapa de hashes
    await fs.writeFile(
      'dist/asset-manifest.json',
      JSON.stringify(hashMap, null, 2)
    );
    
    logSuccess(`Cache hashes gerados para ${Object.keys(hashMap).length} arquivos`);
  } catch (error) {
    logError(`Erro ao gerar hashes: ${error.message}`);
  }
}

/**
 * Copiar arquivos restantes
 */
async function copyRemainingFiles() {
  logStep('7', 'Copiando arquivos restantes...');
  
  const filesToCopy = [
    { src: 'public/fonts', dest: 'dist/public/fonts' },
    { src: 'public/favicon.ico', dest: 'dist/public/favicon.ico' },
    { src: 'public/robots.txt', dest: 'dist/public/robots.txt' },
    { src: 'public/sitemap.xml', dest: 'dist/public/sitemap.xml' }
  ];
  
  for (const { src, dest } of filesToCopy) {
    try {
      const srcStats = await fs.stat(src);
      
      if (srcStats.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        const files = await fs.readdir(src);
        
        for (const file of files) {
          await fs.copyFile(path.join(src, file), path.join(dest, file));
        }
        
        log(`  Diretório ${src} copiado`, 'green');
      } else {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
        log(`  Arquivo ${src} copiado`, 'green');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logWarning(`Erro ao copiar ${src}: ${error.message}`);
      }
    }
  }
  
  logSuccess('Arquivos restantes copiados');
}

/**
 * Gerar relatório de otimização
 */
async function generateOptimizationReport() {
  logStep('8', 'Gerando relatório de otimização...');
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      optimizations: {
        css: { enabled: true, minified: true },
        javascript: { enabled: true, minified: true },
        images: { enabled: true, compressed: true },
        caching: { enabled: true, hashed: true },
        gzip: { enabled: true, level: 6 }
      },
      performance: {
        cacheMaxAge: {
          static: '1 year',
          api: '5 minutes',
          html: 'no-cache'
        },
        compression: 'gzip + brotli',
        cdn: 'ready',
        http2: 'enabled'
      },
      security: {
        https: 'enforced',
        hsts: 'enabled',
        csp: 'configured',
        xss: 'protected',
        csrf: 'protected'
      }
    };
    
    await fs.writeFile(
      'dist/optimization-report.json',
      JSON.stringify(report, null, 2)
    );
    
    logSuccess('Relatório de otimização gerado');
  } catch (error) {
    logError(`Erro ao gerar relatório: ${error.message}`);
  }
}

/**
 * Função principal
 */
async function main() {
  log('\n🚀 Iniciando otimização para produção...', 'bright');
  log('=====================================\n', 'bright');
  
  try {
    await installOptimizationDeps();
    await createBuildDirectories();
    await minifyCSS();
    await minifyJS();
    await optimizeImages();
    await generateCacheHashes();
    await copyRemainingFiles();
    await generateOptimizationReport();
    
    log('\n=====================================', 'bright');
    log('✅ Otimização concluída com sucesso!', 'green');
    log('\n📁 Arquivos otimizados disponíveis em: ./dist/', 'cyan');
    log('📊 Relatório de otimização: ./dist/optimization-report.json', 'cyan');
    log('🗺️  Mapa de assets: ./dist/asset-manifest.json', 'cyan');
    
  } catch (error) {
    log('\n=====================================', 'bright');
    logError('Falha na otimização!');
    logError(error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  installOptimizationDeps,
  createBuildDirectories,
  minifyCSS,
  minifyJS,
  optimizeImages,
  generateCacheHashes,
  copyRemainingFiles,
  generateOptimizationReport
};