@echo off
echo ========================================
echo    InteLeVision Backend - Iniciador
echo ========================================
echo.

REM Verificar si existe el archivo .env
if not exist ".env" (
    echo ⚠️  Archivo .env no encontrado
    echo 📝 Copiando env.example a .env...
    copy env.example .env
    echo.
    echo 🔑 IMPORTANTE: Edita el archivo .env y configura tu OPENAI_API_KEY
    echo.
    pause
    exit /b 1
)

echo ✅ Archivo .env encontrado
echo 🚀 Iniciando servidor InteLeVision...
echo.

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    echo.
)

REM Iniciar servidor
echo 🌐 Servidor iniciándose en http://localhost:3001
echo 📡 WebSocket disponible en ws://localhost:3001
echo.
echo 💡 Para probar el servidor:
echo    1. Abre otra terminal y ejecuta: node test-client.js
echo    2. O visita: http://localhost:3001/health
echo.
echo 🛑 Presiona Ctrl+C para detener el servidor
echo.

npm start 