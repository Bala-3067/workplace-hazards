@echo off
title Hazard Reporting App
cd /d "%~dp0"

echo ============================================
echo  Hazard Reporting - Local Dev Startup
echo ============================================
echo.

:: ── Java 21 (required by Firebase Firestore emulator) ────────────────────────
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
set "PATH=%JAVA_HOME%\bin;C:\Users\DELL\AppData\Roaming\npm;C:\Program Files\nodejs;%PATH%"

:: ── Check Node is available ───────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

:: ── Check Firebase CLI is available ──────────────────────────────────────────
where firebase >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Firebase CLI not found.
    echo         Run:  npm install -g firebase-tools
    pause
    exit /b 1
)

:: ── Check .env exists ─────────────────────────────────────────────────────────
if not exist ".env" (
    echo [ERROR] .env file not found.
    echo         Copy .env.example to .env and fill in your Firebase config.
    pause
    exit /b 1
)

echo [1/2] Starting Firebase emulators in a new window...
echo       Auth    ^> http://localhost:9099
echo       Firestore ^> http://localhost:8080
echo       Storage ^> http://localhost:9199
echo       UI      ^> http://localhost:4000
echo.

start "Firebase Emulators" cmd /k "set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot && set PATH=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin;C:\Users\DELL\AppData\Roaming\npm;%PATH% && cd /d %~dp0 && firebase emulators:start --only firestore,auth,storage"

:: ── Wait for emulators to be ready (auth port 9099) ──────────────────────────
echo Waiting for emulators to start...
:wait_loop
timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient('localhost', 9099); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto wait_loop
echo Emulators are ready.
echo.

echo [2/2] Starting Vite dev server...
echo       App ^> http://localhost:5173
echo.
echo Press Ctrl+C to stop the dev server.
echo Close the "Firebase Emulators" window to stop the emulators.
echo.

npm.cmd run dev
