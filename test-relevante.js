const io = require('socket.io-client');

// Prueba con datos específicamente RELEVANTES
const socket = io('https://backend-intelivision-production.up.railway.app');

console.log('🚨 Probando con datos CRÍTICOS y RELEVANTES...');

let responseCount = 0;

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  console.log('🆔 ID del cliente:', socket.id);
  
  runCriticalTests();
});

socket.on('ai-description', (response) => {
  responseCount++;
  console.log(`🤖 RESPUESTA #${responseCount}:`, response.description);
  console.log('🎯 ¡El LLM SÍ consideró esto relevante!');
  console.log('---');
});

socket.on('error', (error) => {
  console.error('❌ Error del servidor:', error.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado del servidor');
});

async function runCriticalTests() {
  console.log('\n🚨 TEST 1: Vehículo acercándose rápidamente');
  await sendTestData({
    timestamp: Date.now(),
    personas: [],
    objetos: [{
      tipo: 'car',
      movimiento: 'se_acerca',
      direccion: 'frente',
      velocidad: 'rapido',
      distancia: '0.5m' // ¡MUY CERCA!
    }]
  });
  
  await sleep(5000);
  
  console.log('\n😢 TEST 2: Persona triste pidiendo ayuda');
  await sendTestData({
    timestamp: Date.now(),
    personas: [{
      posicion: 'frente',
      distancia: '0.8m', // Muy cerca
      expresion: 'triste',
      gesto: 'manos_arriba', // Pidiendo ayuda
      blendshapes: [
        { name: 'mouthFrown_L', score: 0.9 },
        { name: 'mouthFrown_R', score: 0.9 },
        { name: 'browDown_L', score: 0.8 },
        { name: 'browDown_R', score: 0.8 }
      ]
    }],
    objetos: []
  });
  
  await sleep(5000);
  
  console.log('\n🆘 TEST 3: Emergencia - Persona en peligro');
  await sendTestData({
    timestamp: Date.now(),
    personas: [{
      posicion: 'frente',
      distancia: '1.2m',
      expresion: 'enojado',
      gesto: 'brazo_extendido', // Señalando/alertando
      blendshapes: [
        { name: 'browDown_L', score: 0.9 },
        { name: 'browDown_R', score: 0.9 },
        { name: 'noseSneer_L', score: 0.7 },
        { name: 'mouthFrown_L', score: 0.8 }
      ]
    }],
    objetos: [{
      tipo: 'bicycle',
      movimiento: 'cruzando',
      direccion: 'izquierda',
      velocidad: 'rapido',
      distancia: '1.0m'
    }]
  });
  
  await sleep(5000);
  
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`- Respuestas relevantes recibidas: ${responseCount}`);
  console.log('- Estas situaciones DEBERÍAN generar respuestas');
  console.log('- Si responseCount = 0: El filtrado está muy estricto');
  console.log('- Si responseCount > 0: ¡Sistema funcionando perfectamente!');
  
  socket.disconnect();
  process.exit(0);
}

async function sendTestData(data) {
  socket.emit('sensor-data', data);
  console.log('📤 Datos enviados:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando prueba crítica...');
  socket.disconnect();
  process.exit(0);
});

console.log('💡 Enviando situaciones que SÍ deberían ser relevantes...'); 