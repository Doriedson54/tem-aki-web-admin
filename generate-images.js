#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Gerando novas imagens PNG válidas com CRC correto...');

// Função para calcular CRC32
function crc32(data) {
    const table = [];
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Criar PNG válido de 1x1 pixel transparente
function createValidPNG() {
    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk data
    const ihdrData = Buffer.from([
        0x00, 0x00, 0x00, 0x01, // Width: 1
        0x00, 0x00, 0x00, 0x01, // Height: 1
        0x08, 0x06, 0x00, 0x00, 0x00 // 8-bit RGBA, no compression, no filter, no interlace
    ]);
    
    // Calculate IHDR CRC
    const ihdrType = Buffer.from('IHDR');
    const ihdrCrcData = Buffer.concat([ihdrType, ihdrData]);
    const ihdrCrc = crc32(ihdrCrcData);
    
    // IHDR chunk
    const ihdrChunk = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x0D]), // Length: 13
        ihdrType,
        ihdrData,
        Buffer.from([
            (ihdrCrc >>> 24) & 0xFF,
            (ihdrCrc >>> 16) & 0xFF,
            (ihdrCrc >>> 8) & 0xFF,
            ihdrCrc & 0xFF
        ])
    ]);
    
    // IDAT chunk data (compressed image data for 1x1 transparent pixel)
    const idatData = Buffer.from([
        0x78, 0x9C, // zlib header
        0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
        0x0D, 0x0A, 0x2D, 0xB4 // zlib checksum
    ]);
    
    // Calculate IDAT CRC
    const idatType = Buffer.from('IDAT');
    const idatCrcData = Buffer.concat([idatType, idatData]);
    const idatCrc = crc32(idatCrcData);
    
    // IDAT chunk
    const idatChunk = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, idatData.length]), // Length
        idatType,
        idatData,
        Buffer.from([
            (idatCrc >>> 24) & 0xFF,
            (idatCrc >>> 16) & 0xFF,
            (idatCrc >>> 8) & 0xFF,
            idatCrc & 0xFF
        ])
    ]);
    
    // IEND chunk
    const iendType = Buffer.from('IEND');
    const iendCrc = crc32(iendType);
    const iendChunk = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x00]), // Length: 0
        iendType,
        Buffer.from([
            (iendCrc >>> 24) & 0xFF,
            (iendCrc >>> 16) & 0xFF,
            (iendCrc >>> 8) & 0xFF,
            iendCrc & 0xFF
        ])
    ]);
    
    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

try {
    const assetsDir = './assets';
    const images = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
    const validPNG = createValidPNG();
    
    for (const imageName of images) {
        const filepath = path.join(assetsDir, imageName);
        fs.writeFileSync(filepath, validPNG);
        console.log(`✅ ${imageName} criado (${validPNG.length} bytes)`);
    }
    
    console.log('🎉 Todas as imagens PNG válidas foram geradas!');
    console.log('📝 Nota: São imagens PNG de 1x1 pixel transparente com CRC correto.');
    console.log('💡 Substitua por suas imagens personalizadas depois do build funcionar.');
    
} catch (error) {
    console.error('❌ Erro ao gerar imagens:', error.message);
    process.exit(1);
}