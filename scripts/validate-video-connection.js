/**
 * Script de validación de conexión del Frontend con el servicio de video
 * 
 * Ejecutar desde la raíz del proyecto frontend:
 * node scripts/validate-video-connection.js
 */

const http = require('http');

const VIDEO_SERVICE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || 'http://localhost:3003';
const FRONTEND_PORT = process.env.PORT || 5000;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function checkVideoService() {
  return new Promise((resolve) => {
    logInfo(`Verificando servicio de video en ${VIDEO_SERVICE_URL}...`);
    
    const url = new URL(VIDEO_SERVICE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3003,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.status === 'ok' && json.service === 'video-service') {
              logSuccess(`Servicio de video está respondiendo correctamente`);
              resolve(true);
            } else {
              logError(`Respuesta inesperada del servicio: ${JSON.stringify(json)}`);
              resolve(false);
            }
          } catch (e) {
            logError(`Error parseando respuesta: ${e.message}`);
            resolve(false);
          }
        } else {
          logError(`Servicio respondió con status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      logError(`Error conectando al servicio: ${err.message}`);
      logWarning(`Asegúrate de que el servicio de video esté corriendo en ${VIDEO_SERVICE_URL}`);
      logInfo(`Ejecuta: cd nexun-backend/services/video-service && npm run dev`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      logError('Timeout esperando respuesta del servicio');
      resolve(false);
    });
    
    req.setTimeout(5000);
    req.end();
  });
}

function checkEnvironmentVariables() {
  logInfo('Verificando variables de entorno...');
  
  const videoServiceUrl = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (videoServiceUrl) {
    logSuccess(`NEXT_PUBLIC_VIDEO_SERVICE_URL=${videoServiceUrl}`);
  } else {
    logWarning(`NEXT_PUBLIC_VIDEO_SERVICE_URL no está configurado (usará: ${VIDEO_SERVICE_URL})`);
    logInfo('Agrega a tu .env.local: NEXT_PUBLIC_VIDEO_SERVICE_URL=http://localhost:3003');
  }
  
  if (apiUrl) {
    logSuccess(`NEXT_PUBLIC_API_URL=${apiUrl}`);
  } else {
    logWarning('NEXT_PUBLIC_API_URL no está configurado');
  }
  
  logInfo(`Frontend corriendo en puerto: ${FRONTEND_PORT}`);
  
  return true;
}

function checkCodeConfiguration() {
  logInfo('Verificando configuración en código...');
  
  const fs = require('fs');
  const path = require('path');
  
  const videoServicePath = path.join(__dirname, '../utils/services/videoService.ts');
  
  if (!fs.existsSync(videoServicePath)) {
    logError(`No se encontró el archivo: ${videoServicePath}`);
    return false;
  }
  
  const content = fs.readFileSync(videoServicePath, 'utf8');
  
  // Verificar que use la variable de entorno
  if (content.includes('NEXT_PUBLIC_VIDEO_SERVICE_URL')) {
    logSuccess('videoService.ts usa NEXT_PUBLIC_VIDEO_SERVICE_URL');
  } else {
    logWarning('videoService.ts podría no estar usando la variable de entorno');
  }
  
  // Verificar que tenga el valor por defecto correcto
  if (content.includes('localhost:3003')) {
    logSuccess('videoService.ts tiene el puerto por defecto correcto (3003)');
  } else {
    logWarning('Verifica que el puerto por defecto sea 3003');
  }
  
  return true;
}

function printConfigurationGuide() {
  log('\n📋 Configuración recomendada:', 'blue');
  log('\n1. Crea un archivo .env.local en la raíz del frontend:', 'cyan');
  log('   touch .env.local', 'yellow');
  
  log('\n2. Agrega estas variables:', 'cyan');
  log('   NEXT_PUBLIC_VIDEO_SERVICE_URL=http://localhost:3003', 'yellow');
  log('   NEXT_PUBLIC_API_URL=http://localhost:3000', 'yellow');
  
  log('\n3. Reinicia el servidor de desarrollo:', 'cyan');
  log('   npm run dev', 'yellow');
  
  log('\n4. Verifica en el navegador (DevTools → Console):', 'cyan');
  log('   - Deberías ver: "✅ Connected to video service"', 'yellow');
  log('   - En Network → WS deberías ver conexión a ws://localhost:3003', 'yellow');
}

async function main() {
  log('\n🔍 Validando configuración del Frontend para servicio de video\n', 'blue');
  
  let allChecksPassed = true;
  
  // 1. Verificar variables de entorno
  log('\n1️⃣ Verificando variables de entorno...', 'yellow');
  checkEnvironmentVariables();
  
  // 2. Verificar configuración en código
  log('\n2️⃣ Verificando configuración en código...', 'yellow');
  const codeOk = checkCodeConfiguration();
  if (!codeOk) {
    allChecksPassed = false;
  }
  
  // 3. Verificar que el servicio esté disponible
  log('\n3️⃣ Verificando disponibilidad del servicio...', 'yellow');
  const serviceOk = await checkVideoService();
  if (!serviceOk) {
    allChecksPassed = false;
  }
  
  // 4. Mostrar guía de configuración
  if (!process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL) {
    printConfigurationGuide();
  }
  
  // Resumen
  log('\n' + '='.repeat(60), 'blue');
  if (allChecksPassed && serviceOk) {
    logSuccess('\n✅ Configuración del frontend correcta!');
    logInfo('\nEl frontend está listo para conectarse al servicio de video.');
  } else {
    logError('\n❌ Algunas verificaciones fallaron.');
    if (!serviceOk) {
      logWarning('\nEl servicio de video no está disponible. Inícialo primero.');
    }
  }
  log('='.repeat(60) + '\n', 'blue');
  
  process.exit(allChecksPassed && serviceOk ? 0 : 1);
}

main().catch((error) => {
  logError(`Error inesperado: ${error.message}`);
  process.exit(1);
});

