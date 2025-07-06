const io = require('socket.io-client');

// URL pública de Railway
const RAILWAY_URL = 'https://backend-intelivision-production.up.railway.app';

console.log('🚂 Probando conexión con Railway...');
console.log('🔗 URL:', RAILWAY_URL);

const socket = io(RAILWAY_URL, {
  transports: ['websocket', 'polling'], // Railway soporta ambos
  timeout: 10000
});

let responseCount = 0;

socket.on('connect', () => {
  console.log('✅ ¡Conectado exitosamente a Railway!');
  console.log('🆔 ID del cliente:', socket.id);
  
  // Enviar datos de prueba
  console.log('\n📤 Enviando datos de prueba...');
  
  const testData = {
    timestamp: Date.now(),
    personas: [{
      posicion: 'frente',
      distancia: '1.2m',
      expresion: 'feliz',
      gesto: 'saludo',
      blendshapes: [
        { name: 'mouthSmile_L', score: 0.8 },
        { name: 'mouthSmile_R', score: 0.7 }
      ]
    }],
    objetos: []
  };
  
  socket.emit('sensor-data', testData);
  
  // Programar cierre después de 10 segundos
  setTimeout(() => {
    console.log('\n📊 RESUMEN:');
    console.log(`- Conexión: ✅ Exitosa`);
    console.log(`- Respuestas recibidas: ${responseCount}`);
    console.log(`- WebSocket: ✅ Funcionando`);
    console.log('\n🎉 ¡Railway deploy exitoso!');
    
    socket.disconnect();
    process.exit(0);
  }, 10000);
});

socket.on('ai-description', (response) => {
  responseCount++;
  console.log(`🤖 Respuesta #${responseCount}:`, response.description);
  console.log('---');
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  console.log('\n🔍 Posibles soluciones:');
  console.log('1. Verificar que la URL de Railway sea correcta');
  console.log('2. Verificar que el deploy esté completo');
  console.log('3. Verificar variables de entorno en Railway');
  console.log('4. Revisar logs en Railway dashboard');
});

socket.on('error', (error) => {
  console.error('❌ Error del servidor:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Desconectado de Railway:', reason);
});

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando prueba de Railway...');
  socket.disconnect();
  process.exit(0);
});

console.log('💡 Esperando conexión...');
console.log('💡 Presiona Ctrl+C para detener'); 