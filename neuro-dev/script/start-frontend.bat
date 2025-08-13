@echo off
echo Starting ChatDev React Frontend...
cd /d "%~dp0\..\frontend"

echo Installing Node.js dependencies...
npm install

echo Starting React development server...
npm start

pause