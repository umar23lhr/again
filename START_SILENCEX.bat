@echo off
TITLE SilenceX Pro - Desktop Launcher
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    S I L E N C E X    P R O    V 1.4
echo ==========================================
echo.

:: 1. Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from nodejs.org
    pause
    exit /b
)

:: 2. Check for FFmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] FFmpeg is not in your PATH. 
    echo Please download FFmpeg and add it to your system environment variables.
    pause
    exit /b
)

echo [INFO] Dependencies verified.
echo [INFO] Starting SilenceX Backend...
echo.

:: 3. Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [INFO] Installing required packages...
    call npm install
)

:: 4. Start the app
echo [STATUS] SilenceX is now running!
echo [URL] Open: http://localhost:3000
echo.
echo [!] Keep this window open while using the software.
echo ==========================================
echo.

call npm run dev
pause
