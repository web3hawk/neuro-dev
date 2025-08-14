@echo off
echo Starting ChatDev Full Stack Application...
echo.

echo Starting Backend Server in a new window...
start "ChatDev Backend" cmd /k "cd /d "%~dp0" && start-backend.bat"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak

echo Starting Frontend Server in a new window...
start "ChatDev Frontend" cmd /k "cd /d "%~dp0" && start-frontend.bat"

echo.
echo Both services are starting up...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause