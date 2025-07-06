const io = require('socket.io-client');

// Cliente de prueba para InteLeVision Backend
const socket = io('http://localhost:3001');

console.log('🔌 Conectando al servidor InteLeVision...');

let sentCount = 0;
const maxRequests = 3;

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  console.log('🆔 ID del cliente:', socket.id);
  
  // Enviar solo 3 datos de prueba, uno cada 500ms
  const interval = setInterval(() => {
    if (sentCount >= maxRequests) {
      clearInterval(interval);
      console.log('⏹️  Deteniendo envío de datos');
      return;
    }
    const testData = generateTestData();
    socket.emit('sensor-data', testData);
    console.log('📤 Enviando datos:', JSON.stringify(testData, null, 2));
    sentCount++;
  }, 500);
});

socket.on('ai-description', (response) => {
  console.log('🤖 Respuesta completa del LLM:', JSON.stringify(response, null, 2));
  console.log('---');
});

socket.on('error', (error) => {
  console.error('❌ Error del servidor:', error.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado del servidor');
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

// Función para generar datos de prueba con blendshapes
function generateTestData() {
  const personas = [];
  const objetos = [];
  
  // Simular detección de personas (50% de probabilidad)
  if (Math.random() > 0.5) {
    const posiciones = ['frente', 'izquierda', 'derecha'];
    const expresiones = ['feliz', 'triste', 'sorprendido', 'enojado', 'neutral'];
    const gestos = ['saludo', 'manos_arriba', 'mano_levantada', 'brazo_extendido', 'brazos_abajo', 'ninguno'];
    const distancias = ['0.8m', '1.2m', '2.1m', '3.0m+'];
    
    const expresion = expresiones[Math.floor(Math.random() * expresiones.length)];
    const blendshapes = generateBlendshapesForExpression(expresion);
    
    personas.push({
      posicion: posiciones[Math.floor(Math.random() * posiciones.length)],
      distancia: distancias[Math.floor(Math.random() * distancias.length)],
      expresion: expresion,
      gesto: gestos[Math.floor(Math.random() * gestos.length)],
      blendshapes: blendshapes
    });
  }
  
  // Simular detección de objetos (30% de probabilidad)
  if (Math.random() > 0.7) {
    const tipos = ['car', 'bicycle', 'dog', 'cat', 'chair', 'table']; // En inglés como vendrá del frontend
    const movimientos = ['se_acerca', 'se_aleja', 'estatico', 'cruzando'];
    const direcciones = ['izquierda', 'derecha', 'frente', 'atras'];
    const velocidades = ['1.2 m/s', 'lento', 'rapido'];
    const distancias = ['0.5m', '1.0m', '2.0m', '3.0m+'];
    
    objetos.push({
      tipo: tipos[Math.floor(Math.random() * tipos.length)],
      movimiento: movimientos[Math.floor(Math.random() * movimientos.length)],
      direccion: direcciones[Math.floor(Math.random() * direcciones.length)],
      velocidad: velocidades[Math.floor(Math.random() * velocidades.length)],
      distancia: distancias[Math.floor(Math.random() * distancias.length)]
    });
  }
  
  return {
    timestamp: Date.now(),
    personas: personas,
    objetos: objetos
  };
}

// Función para generar blendshapes según la expresión
function generateBlendshapesForExpression(expresion) {
  const blendshapes = [];
  
  switch (expresion) {
    case 'feliz':
      blendshapes.push(
        { name: 'mouthSmile_L', score: 0.7 + Math.random() * 0.3 },
        { name: 'mouthSmile_R', score: 0.7 + Math.random() * 0.3 },
        { name: 'browInnerUp', score: 0.3 + Math.random() * 0.4 },
        { name: 'cheekSquint_L', score: 0.2 + Math.random() * 0.3 },
        { name: 'cheekSquint_R', score: 0.2 + Math.random() * 0.3 }
      );
      break;
      
    case 'triste':
      blendshapes.push(
        { name: 'mouthFrown_L', score: 0.6 + Math.random() * 0.4 },
        { name: 'mouthFrown_R', score: 0.6 + Math.random() * 0.4 },
        { name: 'browDown_L', score: 0.5 + Math.random() * 0.3 },
        { name: 'browDown_R', score: 0.5 + Math.random() * 0.3 },
        { name: 'eyeSquint_L', score: 0.3 + Math.random() * 0.3 }
      );
      break;
      
    case 'sorprendido':
      blendshapes.push(
        { name: 'browInnerUp', score: 0.8 + Math.random() * 0.2 },
        { name: 'browOuterUp_L', score: 0.7 + Math.random() * 0.3 },
        { name: 'browOuterUp_R', score: 0.7 + Math.random() * 0.3 },
        { name: 'mouthOpen', score: 0.4 + Math.random() * 0.4 },
        { name: 'eyeWide_L', score: 0.6 + Math.random() * 0.3 },
        { name: 'eyeWide_R', score: 0.6 + Math.random() * 0.3 }
      );
      break;
      
    case 'enojado':
      blendshapes.push(
        { name: 'browDown_L', score: 0.7 + Math.random() * 0.3 },
        { name: 'browDown_R', score: 0.7 + Math.random() * 0.3 },
        { name: 'mouthFrown_L', score: 0.5 + Math.random() * 0.3 },
        { name: 'mouthFrown_R', score: 0.5 + Math.random() * 0.3 },
        { name: 'noseSneer_L', score: 0.4 + Math.random() * 0.3 },
        { name: 'noseSneer_R', score: 0.4 + Math.random() * 0.3 }
      );
      break;
      
    case 'neutral':
      blendshapes.push(
        { name: 'eyeBlink_L', score: 0.1 + Math.random() * 0.2 },
        { name: 'eyeBlink_R', score: 0.1 + Math.random() * 0.2 },
        { name: 'mouthSmile_L', score: 0.1 + Math.random() * 0.2 },
        { name: 'mouthSmile_R', score: 0.1 + Math.random() * 0.2 }
      );
      break;
  }
  
  // Agregar algunos blendshapes aleatorios
  const randomBlendshapes = [
    'eyeBlink_L', 'eyeBlink_R', 'jawOpen', 'tongueOut', 'cheekPuff'
  ];
  
  if (Math.random() > 0.7) {
    const randomBlend = randomBlendshapes[Math.floor(Math.random() * randomBlendshapes.length)];
    blendshapes.push({
      name: randomBlend,
      score: 0.2 + Math.random() * 0.3
    });
  }
  
  return blendshapes;
}

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando cliente de prueba...');
  socket.disconnect();
  process.exit(0);
});

console.log('📋 Cliente de prueba iniciado');
console.log('💡 Presiona Ctrl+C para detener'); 