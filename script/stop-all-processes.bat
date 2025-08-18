@echo off
echo Stopping all ChatDev processes to release file locks...
echo.

echo Terminating Node.js processes...
taskkill /f /im node.exe 2>nul
if %errorlevel% == 0 (
    echo Node.js processes terminated.
) else (
    echo No Node.js processes found.
)

echo.
echo Terminating Go processes...
taskkill /f /im go.exe 2>nul
if %errorlevel% == 0 (
    echo Go processes terminated.
) else (
    echo No Go processes found.
)

echo.
echo Terminating Java processes (possible file watchers)...
taskkill /f /im java.exe 2>nul
if %errorlevel% == 0 (
    echo Java processes terminated.
) else (
    echo No Java processes found.
)

echo.
echo Terminating common IDEs/editors that may lock files (VSCode/IntelliJ)...
taskkill /f /im Code.exe 2>nul
if %errorlevel% == 0 (
    echo VSCode terminated.
) else (
    echo VSCode not running.
)
taskkill /f /im idea64.exe 2>nul
if %errorlevel% == 0 (
    echo IntelliJ IDEA terminated.
) else (
    echo IntelliJ IDEA not running.
)

echo.
echo Terminating any running main.exe processes...
taskkill /f /im main.exe 2>nul
if %errorlevel% == 0 (
    echo main.exe processes terminated.
) else (
    echo No main.exe processes found.
)

echo.
echo Closing any command windows with ChatDev titles...
taskkill /fi "WindowTitle eq ChatDev*" /f 2>nul
if %errorlevel% == 0 (
    echo ChatDev windows closed.
) else (
    echo No ChatDev windows found.
)

echo.
echo Restarting Windows Explorer to release directory handles...
taskkill /f /im explorer.exe 2>nul
start explorer.exe 2>nul

echo.
echo Waiting 3 seconds for processes to fully terminate...
timeout /t 3 /nobreak

echo.
echo All processes stopped. File locks should now be released.
echo You can now safely rename the neuro-dev directory.
echo.
pause