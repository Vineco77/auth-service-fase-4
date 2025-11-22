const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building auth-lib...');

// Limpa a dist anterior
if (fs.existsSync('./dist')) {
  fs.rmSync('./dist', { recursive: true });
}

// Compila TypeScript
execSync('npx tsc', { stdio: 'inherit' });

// Copia package.json para dist (se necessário)
fs.copyFileSync('./package.json', './dist/package.json');

console.log('✅ auth-lib built successfully!');