# 🚀 ALEGENT ORGANIZER - Quick Start Script
Write-Host "Iniciando sistema AliAgent..." -ForegroundColor Cyan

$FRONTEND_PATH = "$PSScriptRoot/frontend"

if (-not (Test-Path $FRONTEND_PATH)) {
    Write-Host "❌ Error: No se encuentra la carpeta frontend." -ForegroundColor Red
    exit
}

Set-Location $FRONTEND_PATH

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias por primera vez (esto puede tardar)..." -ForegroundColor Yellow
    npm install --force
}

Write-Host "⚡ Levantando servidor de desarrollo con túnel..." -ForegroundColor Green
Write-Host "📱 Asegúrate de tener Expo Go abierto en tu teléfono." -ForegroundColor Gray

# Iniciar Expo con túnel para máxima compatibilidad de red
npx expo start --tunnel
