const io = require('socket.io-client');

// Conectar al servidor
const socket = io('http://localhost:3001');

console.log('🔥 Iniciando prueba de detección de objeto nuevo...');

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  
  // Simular datos sin objetos primero
  console.log('\n📤 Enviando datos sin objetos...');
  socket.emit('sensor-data', {
    timestamp: Date.now(),
    personas: [
      {
        posicion: "frente",
        distancia: "2.5m",
        expresion: "neutral",
        gesto: "ninguno",
        blendshapes: []
      }
    ],
    objetos: []
  });
  
  // Después de 3 segundos, simular aparición de PC
  setTimeout(() => {
    console.log('\n📤 Enviando datos con PC nueva...');
    socket.emit('sensor-data', {
      timestamp: Date.now(),
      personas: [
        {
          posicion: "frente",
          distancia: "2.5m",
          expresion: "neutral",
          gesto: "ninguno",
          blendshapes: []
        }
      ],
      objetos: [
        {
          tipo: "pc",
          movimiento: "estatico",
          direccion: "derecha",
          distancia: "1.2m"
        }
      ]
    });
  }, 3000);
  
  // Después de 6 segundos, simular otro objeto
  setTimeout(() => {
    console.log('\n📤 Enviando datos con monitor adicional...');
    socket.emit('sensor-data', {
      timestamp: Date.now(),
      personas: [
        {
          posicion: "frente",
          distancia: "2.5m",
          expresion: "neutral",
          gesto: "ninguno",
          blendshapes: []
        }
      ],
      objetos: [
        {
          tipo: "pc",
          movimiento: "estatico",
          direccion: "derecha",
          distancia: "1.2m"
        },
        {
          tipo: "monitor",
          movimiento: "estatico",
          direccion: "frente",
          distancia: "0.8m"
        }
      ]
    });
  }, 6000);
  
  // Desconectar después de 10 segundos
  setTimeout(() => {
    console.log('\n⏹️  Cerrando conexión...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
});

socket.on('ai-description', (response) => {
  console.log('\n🤖 Respuesta recibida:', response.description);
  console.log('📊 Datos usados:', JSON.stringify(response.dataUsed, null, 2));
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
}); 