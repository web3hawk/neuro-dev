@echo off
echo Starting ChatDev Go Backend...
cd /d "%~dp0\..\backend"

echo Installing Go dependencies...
go mod tidy

echo Starting Go server on port 8080...
go run main.go

pause