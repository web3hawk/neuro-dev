@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Ensure node_modules are installed under the project's lib directory
REM Paths
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set FRONTEND_DIR=%ROOT_DIR%\apps\frontend
set LIB_DIR=%ROOT_DIR%\lib
set LIB_NODE_DIR=%LIB_DIR%\node_modules
set FRONTEND_NODE_DIR=%FRONTEND_DIR%\node_modules

echo Preparing npm install for ChatDev Frontend with node_modules in lib directory...

REM 1) Ensure lib and lib\node_modules exist
if not exist "%LIB_DIR%" (
    echo Creating lib directory: %LIB_DIR%
    mkdir "%LIB_DIR%"
)
if not exist "%LIB_NODE_DIR%" (
    echo Creating lib\node_modules directory: %LIB_NODE_DIR%
    mkdir "%LIB_NODE_DIR%"
)

REM 2) Remove existing node_modules in frontend (folder or junction), then create junction to lib\node_modules
if exist "%FRONTEND_NODE_DIR%" (
    echo Removing existing frontend node_modules (if any) to create junction...
    rmdir /S /Q "%FRONTEND_NODE_DIR%"
)

echo Creating junction from frontend\node_modules to lib\node_modules ...
mklink /J "%FRONTEND_NODE_DIR%" "%LIB_NODE_DIR%" >nul
if errorlevel 1 (
    echo Warning: Failed to create junction. You might need sufficient permissions. Continuing anyway...
) else (
    echo Junction created: "%FRONTEND_NODE_DIR%" -> "%LIB_NODE_DIR%"
)

REM 3) Run npm install in the frontend directory
pushd "%FRONTEND_DIR%"
echo Running npm install in %CD% ...
npm install
set EXIT_CODE=%ERRORLEVEL%
popd

if %EXIT_CODE% NEQ 0 (
    echo npm install failed with exit code %EXIT_CODE%.
    exit /b %EXIT_CODE%
) else (
    echo npm install completed successfully. node_modules are located at: %LIB_NODE_DIR%
)

endlocal