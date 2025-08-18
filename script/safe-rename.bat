@echo off
setlocal enabledelayedexpansion

echo Safe Rename Script for neuro-dev directory
echo ==========================================
echo.

if "%~1"=="" (
    echo Usage: safe-rename.bat [new_directory_name]
    echo Example: safe-rename.bat my-new-project
    echo.
    pause
    exit /b 1
)

set "NEW_NAME=%~1"
set "CURRENT_DIR=%~dp0.."
set "PARENT_DIR=%~dp0..\.."

echo Current directory: %CURRENT_DIR%
echo New name will be: %NEW_NAME%
echo.

echo Step 1: Stopping all running processes...
call "%~dp0stop-all-processes.bat"

echo.
echo Step 2: Attempting to rename directory...
echo.

pushd "%PARENT_DIR%"

echo Trying direct rename first...
move "neuro-dev" "%NEW_NAME%" 2>nul
if !errorlevel! EQU 0 (
    echo Direct rename succeeded.
) else (
    echo Direct rename failed. Checking for nested structure...
    if exist "neuro-dev\neuro-dev" (
        echo Found nested neuro-dev structure. Flattening first...
        
        echo Creating temporary directory...
        if exist "temp-neuro-dev" (
            echo Removing existing temp directory...
            rd /s /q "temp-neuro-dev" 2>nul
        )
        
        echo Moving nested content to temp location...
        move "neuro-dev\neuro-dev" "temp-neuro-dev" 2>nul
        if !errorlevel! neq 0 (
            echo WARN: Standard move failed. Attempting ROBUST copy+move via ROBOCOPY...
            if not exist "temp-neuro-dev" md "temp-neuro-dev"
            robocopy "neuro-dev\neuro-dev" "temp-neuro-dev" /E /MOVE /R:3 /W:1 >nul
            if !errorlevel! GEQ 8 (
                echo ERROR: ROBOCOPY failed to move nested directory contents.
                echo Another process may still be using some files.
                echo Please close any IDEs, file explorers, or terminals accessing the directory and retry.
                pause
                exit /b 1
            ) else (
                echo ROBOCOPY move completed (some locked files may have been skipped).
            )
        )
        
        echo Moving other content from neuro-dev...
        for /d %%d in ("neuro-dev\*") do (
            if /i not "%%~nxd"=="neuro-dev" (
                move "neuro-dev\%%~nxd" "temp-neuro-dev\" 2>nul
            )
        )
        
        for %%f in ("neuro-dev\*") do (
            move "neuro-dev\%%~nxf" "temp-neuro-dev\" 2>nul
        )
        
        echo Removing old neuro-dev directory...
        rd /s /q "neuro-dev" 2>nul
        if !errorlevel! neq 0 (
            echo ERROR: Failed to remove old neuro-dev directory.
            echo Restoring from temp...
            move "temp-neuro-dev" "neuro-dev" 2>nul
            pause
            exit /b 1
        )
        
        echo Renaming temp directory to new name...
        move "temp-neuro-dev" "%NEW_NAME%" 2>nul
        if !errorlevel! neq 0 (
            echo ERROR: Failed to rename to new name. Restoring...
            move "temp-neuro-dev" "neuro-dev" 2>nul
            pause
            exit /b 1
        )
    ) else (
        echo ERROR: neuro-dev directory could not be renamed and nested structure not found.
        echo Please close applications accessing the directory and try again.
        pause
        exit /b 1
    )
)

popd

echo.
echo SUCCESS: Directory successfully renamed to %NEW_NAME%
echo.
echo You may need to update:
echo - IDE project settings
echo - Any scripts or shortcuts pointing to the old directory
echo - Git remote URLs if applicable
echo.
pause