const io = require('socket.io-client');

// Prueba final del sistema de filtrado con mensajes vacíos
const socket = io('http://localhost:3001');

console.log('🎯 Iniciando prueba FINAL del sistema de filtrado...');

let responseCount = 0;
let filteredCount = 0;

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  console.log('🆔 ID del cliente:', socket.id);
  
  runFinalTest();
});

socket.on('ai-description', (response) => {
  responseCount++;
  console.log(`📨 Respuesta #${responseCount}: "${response.description}"`);
  
  if (response.description === '' || response.description === '""') {
    console.log('   ⚠️  Mensaje vacío detectado (esto NO debería llegar al cliente)');
  }
});

socket.on('error', (error) => {
  console.error('❌ Error del servidor:', error.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado del servidor');
});

async function runFinalTest() {
  console.log('\n🧪 PRUEBA FINAL: Mixta con situaciones reales');
  
  // Escenario 1: Datos vacíos (debería filtrarse)
  console.log('\n📤 Escenario 1: Datos completamente vacíos');
  await sendTestData({
    timestamp: Date.now(),
    personas: [],
    objetos: []
  });
  
  await sleep(3000);
  
  // Escenario 2: Persona estática neutral (debería filtrarse)
  console.log('\n📤 Escenario 2: Persona estática neutral');
  const staticPerson = {
    timestamp: Date.now(),
    personas: [{
      posicion: 'frente',
      distancia: '3.0m+',
      expresion: 'neutral',
      gesto: 'ninguno',
      blendshapes: []
    }],
    objetos: []
  };
  
  await sendTestData(staticPerson);
  await sleep(600);
  await sendTestData(staticPerson); // Repetir (debería filtrarse)
  await sleep(600);
  await sendTestData(staticPerson); // Repetir (debería filtrarse)
  
  await sleep(3000);
  
  // Escenario 3: Cambio emocional importante (debería procesarse)
  console.log('\n📤 Escenario 3: Cambio emocional importante');
  await sendTestData({
    timestamp: Date.now(),
    personas: [{
      posicion: 'frente',
      distancia: '1.2m', // Cambio de distancia
      expresion: 'triste', // Cambio de expresión
      gesto: 'manos_arriba', // Cambio de gesto
      blendshapes: [
        { name: 'mouthFrown_L', score: 0.8 },
        { name: 'browDown_L', score: 0.7 }
      ]
    }],
    objetos: []
  });
  
  await sleep(3000);
  
  // Escenario 4: Vehículo peligroso (debería procesarse)
  console.log('\n📤 Escenario 4: Vehículo peligroso');
  await sendTestData({
    timestamp: Date.now(),
    personas: [],
    objetos: [{
      tipo: 'car',
      movimiento: 'se_acerca',
      direccion: 'frente',
      velocidad: 'rapido',
      distancia: '0.5m'
    }]
  });
  
  await sleep(3000);
  
  // Escenario 5: Objeto estático irrelevante (debería filtrarse)
  console.log('\n📤 Escenario 5: Objeto estático irrelevante');
  const staticObject = {
    timestamp: Date.now(),
    personas: [],
    objetos: [{
      tipo: 'chair',
      movimiento: 'estatico',
      direccion: 'derecha',
      velocidad: 'lento',
      distancia: '2.0m'
    }]
  };
  
  await sendTestData(staticObject);
  await sleep(600);
  await sendTestData(staticObject); // Repetir (debería filtrarse)
  
  await sleep(4000);
  
  // Mostrar resumen final
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`- Total de respuestas recibidas: ${responseCount}`);
  console.log(`- Respuestas esperadas: 2-3 (si el filtrado funciona bien)`);
  console.log('- Escenarios que DEBERÍAN ser procesados:');
  console.log('  ✅ Cambio emocional importante');
  console.log('  ✅ Vehículo peligroso');
  console.log('- Escenarios que DEBERÍAN ser filtrados:');
  console.log('  🚫 Datos vacíos');
  console.log('  🚫 Persona estática repetitiva');
  console.log('  🚫 Objeto estático repetitivo');
  
  if (responseCount <= 3) {
    console.log('🎉 ¡FILTRADO FUNCIONANDO CORRECTAMENTE!');
  } else {
    console.log('⚠️  Filtrado necesita ajustes');
  }
  
  socket.disconnect();
  process.exit(0);
}

async function sendTestData(data) {
  socket.emit('sensor-data', data);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando prueba final...');
  socket.disconnect();
  process.exit(0);
});

console.log('📋 Prueba final iniciada');
console.log('💡 Presiona Ctrl+C para detener'); 