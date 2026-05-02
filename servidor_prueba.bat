@echo off
echo ============================================
echo   SERVIDOR DE PRUEBA - REPORTES MANTENIMIENTO
echo ============================================
echo.

REM Puerto por defecto: 8080 (puedes cambiarlo aqui)
set PORT=8080

echo Iniciando servidor en http://localhost:%PORT%
echo Presiona Ctrl+C para detener el servidor
echo.

python -m http.server %PORT% --bind 127.0.0.1

pause
