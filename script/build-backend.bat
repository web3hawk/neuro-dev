@echo off
echo Starting ChatDev Go Backend...
cd /d "%~dp0\..\apps\backend"

echo Installing Go dependencies...
go mod tidy

