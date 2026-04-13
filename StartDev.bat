@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title VTP Coalizao — Dev Environment v2.1
cd /d "%~dp0"

:: ── ANSI colors (Windows 10+) ─────────────────────────────────────────────────
for /f %%e in ('powershell -NoProfile -Command "[char]27"') do set "ESC=%%e"
set "GRN=%ESC%[92m"
set "RED=%ESC%[91m"
set "YEL=%ESC%[93m"
set "CYN=%ESC%[96m"
set "WHT=%ESC%[97m"
set "DIM=%ESC%[2m"
set "BLD=%ESC%[1m"
set "RST=%ESC%[0m"
set "UL=%ESC%[4m"

:: ── Parse flags ───────────────────────────────────────────────────────────────
set SKIP_BUILD=0
set FORCE_INSTALL=0
set START_SERVER=0
for  %%a in (%*) do (
  if /i "%%a"=="/q"        set SKIP_BUILD=1
  if /i "%%a"=="/quick"    set SKIP_BUILD=1
  if /i "%%a"=="/nobuild"  set SKIP_BUILD=1
  if /i "%%a"=="/fresh"    set FORCE_INSTALL=1
  if /i "%%a"=="/server"   set START_SERVER=1
  if /i "%%a"=="/s"        set START_SERVER=1
)

cls
echo.
echo  %BLD%%CYN%================================================================%RST%
echo  %BLD%%WHT%      VTP COALIZAO  ^|  VIRTUAL TABLETOP%RST%
echo  %BLD%%CYN%      Initialization and Diagnostics  v2.1%RST%
echo  %BLD%%CYN%================================================================%RST%
if %SKIP_BUILD%==1  echo  %YEL%  [/q]       build verification skipped%RST%
if %START_SERVER%==1 echo  %CYN%  [/s]       Node.js server will be started%RST%
echo.

:: ================================================================
::  [1/5] ENVIRONMENT
:: ================================================================
echo  %BLD%[1/5] ENVIRONMENT%RST%
echo  %DIM%----------------------------------------------------------------%RST%

:: Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo   %RED%[ERROR]%RST%  Node.js NOT found.
    echo          Download at: %UL%https://nodejs.org%RST%
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
echo   %GRN%[OK]%RST%   Node.js   %CYN%%NODE_VER%%RST%

:: npm
for /f "tokens=*" %%v in ('npm --version 2^>nul') do set NPM_VER=%%v
echo   %GRN%[OK]%RST%   npm       %CYN%v%NPM_VER%%RST%

:: Project Version
set PKG_VER=unknown
powershell -NoProfile -Command "$p=Get-Content package.json -Raw|ConvertFrom-Json;if($p.version){Write-Host $p.version}" > "%TEMP%\vtp_ver.txt" 2>nul
set /p PKG_VER=<"%TEMP%\vtp_ver.txt"
del "%TEMP%\vtp_ver.txt" >nul 2>&1
echo   %GRN%[OK]%RST%   Project   %CYN%v%PKG_VER%%RST%

:: vite.config
if exist "vite.config.js" (echo   %GRN%[OK]%RST%   vite.config.js) else (
if exist "vite.config.ts" (echo   %GRN%[OK]%RST%   vite.config.ts) else (
    echo   %YEL%[WARNING]%RST% vite.config not found))

:: node_modules
if %FORCE_INSTALL%==1 (
    echo.
    echo   %YEL%[INFO]%RST%  /fresh — reinstalling dependencies...
    rmdir /s /q node_modules >nul 2>&1
    del package-lock.json >nul 2>&1
)
if not exist "node_modules" (
    echo.
    echo   %YEL%[INFO]%RST%  node_modules missing — installing dependencies...
    call npm install
    if errorlevel 1 (
        echo   %RED%[ERROR]%RST%  npm install failed. Check your connection.
        pause & exit /b 1
    )
    echo   %GRN%[OK]%RST%   Dependencies installed.
) else (
    for /f %%c in ('powershell -NoProfile -Command "(Get-ChildItem node_modules -Directory -ErrorAction SilentlyContinue).Count"') do set MOD_COUNT=%%c
    echo   %GRN%[OK]%RST%   node_modules  %DIM%(%MOD_COUNT% packages)%RST%
)
echo.

:: ================================================================
::  [2/5] PROJECT FILES
:: ================================================================
echo  %BLD%[2/5] PROJECT FILES%RST%
echo  %DIM%----------------------------------------------------------------%RST%

set MISS=0

:: Frontend
call :chk "src\main.jsx"                                "main.jsx            (entry)"
call :chk "src\App.jsx"                                 "App.jsx             (raiz)"
call :chk "src\services\database.js"                    "database.js"
call :chk "src\services\dataSeeder.js"                  "dataSeeder.js"
call :chk "src\services\campaignIO.js"                  "campaignIO.js"
call :chk "src\pages\MapPage.jsx"                       "MapPage.jsx"
call :chk "src\pages\CharactersPage.jsx"                "CharactersPage.jsx"
call :chk "src\pages\ServerPage.jsx"                    "ServerPage.jsx      (Phase 7A)"
call :chk "src\pages\PlayerLoginPage.jsx"               "PlayerLoginPage.jsx (Phase 7A)"
call :chk "src\pages\PlayerDashboard.jsx"               "PlayerDashboard.jsx (Phase 7A)"
call :chk "src\context\ServerContext.jsx"               "ServerContext.jsx   (Phase 7A)"
call :chk "src\hooks\useWebSocket.js"                   "useWebSocket.js     (Phase 7A)"
call :chk "src\components\combat\InitiativeTracker.jsx" "InitiativeTracker.jsx"
call :chk "src\components\combat\CombatResolver.jsx"    "CombatResolver.jsx"
call :chk "src\components\layout\BottomBar.jsx"         "BottomBar.jsx"
call :chk "src\components\layout\DetailPanel.jsx"       "DetailPanel.jsx"
call :chk "src\components\characters\CharacterForm.jsx" "CharacterForm.jsx"
call :chk "src\data\classes\index.js"                   "data/classes"
call :chk "public\manifest.json"                        "manifest.json (PWA)"
call :chk "public\sw.js"                                "sw.js (Service Worker)"
:: Server
call :chk "server\index.js"                             "server/index.js     (Phase 7A)"
call :chk "server\sessionManager.js"                    "server/sessionManager.js"

echo.
powershell -NoProfile -Command "
    $creatures = (Get-ChildItem 'src\data\creatures' -Filter '*.json' -ErrorAction SilentlyContinue).Count
    $abilities = (Get-ChildItem 'src\data\abilities' -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    $items     = (Get-ChildItem 'src\data\items'     -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    $npcs      = (Get-ChildItem 'src\data\npcs'      -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    $heroes    = (Get-ChildItem 'src\data\heroes'    -Filter '*.json' -ErrorAction SilentlyContinue).Count
    Write-Host \"    Creatures:$creatures  Heroes:$heroes  Abilities:$abilities  Items:$items  NPCs:$npcs\"
" 2>nul

if %MISS% GTR 0 (
    echo.
    echo   %RED%[WARNING] %MISS% file(s) MISSING!%RST%
) else (
    echo.
    echo   %GRN%[OK]%RST%   All critical files present.
)
echo.

:: ================================================================
::  [3/5] BUILD VERIFICATION
:: ================================================================
echo  %BLD%[3/5] BUILD VERIFICATION%RST%
echo  %DIM%----------------------------------------------------------------%RST%

if %SKIP_BUILD%==1 (
    echo   %YEL%[SKIP]%RST%  Build ignored  (use without /q to compile)
    echo.
    goto :start_server_section
)

echo   Compiling...  %DIM%(wait ~5-20s)%RST%
echo.
npm run build > "%TEMP%\vtp_build.txt" 2>&1
set BUILD_EC=%errorlevel%

powershell -NoProfile -Command "
    $raw  = Get-Content '%TEMP%\vtp_build.txt' -Raw -ErrorAction SilentlyContinue
    if (-not $raw) { Write-Host '  (no output)'; exit }
    $clean = $raw -replace '\x1B\[[0-9;]*[mGKHF]', ''
    $lines = $clean -split '\r?\n' | Where-Object { $_.Trim() -ne '' }
    $show  = if ($lines.Count -gt 22) { $lines[-22..-1] } else { $lines }
    foreach ($l in $show) { Write-Host \"  $l\" }
    if ('%BUILD_EC%' -ne '0') {
        $errs = $lines | Where-Object { $_ -match '(error|PARSE_ERROR|Cannot find|already been decl|is not exported)' }
        if ($errs.Count -gt 0) {
            Write-Host ''; Write-Host '  ERRORS DETECTED:'
            foreach ($e in $errs | Select-Object -First 8) { Write-Host \"    > $e\" }
        }
    } else {
        $dist = Get-ChildItem 'dist' -Recurse -File -ErrorAction SilentlyContinue
        $kb   = [math]::Round(($dist | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        $js   = [math]::Round(($dist | Where-Object { $_.Extension -eq '.js'  } | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        $css  = [math]::Round(($dist | Where-Object { $_.Extension -eq '.css' } | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        Write-Host ''; Write-Host \"  dist/  Total:${kb}KB  JS:${js}KB  CSS:${css}KB\"
    }
" 2>nul

echo.
if %BUILD_EC% EQU 0 (
    echo   %GRN%%BLD%[OK]   BUILD SUCCESSFUL%RST%
) else (
    echo   %RED%%BLD%[ERROR] BUILD FAILED — see errors above%RST%
    echo.
    echo   %DIM%Tips:%RST%
    echo     %YEL%PARSE_ERROR%RST%       = invalid syntax
    echo     %YEL%already been decl.%RST% = duplicated import
    echo     %YEL%Cannot find module%RST% = missing file
    echo.
    echo   Starting the server anyway for live debugging...
    echo   %DIM%Press any key to continue or close window.%RST%
    pause >nul
)
del "%TEMP%\vtp_build.txt" >nul 2>&1
echo.

:: ================================================================
::  [4/5] NODE.JS SERVER (Phase 7A) — OPTIONAL
:: ================================================================
:start_server_section
echo  %BLD%[4/5] NODE.JS SERVER%RST%
echo  %DIM%----------------------------------------------------------------%RST%

:: Checks if server/index.js exists
if not exist "server\index.js" (
    echo   %YEL%[SKIP]%RST%  server/index.js not found
    echo.
    goto :start_vite
)

if %START_SERVER%==1 (
    echo   Starting Node.js server on port 3001...
    start "VTP Node Server  (players)" cmd /k "cd /d "%~dp0" && npm run server"
    ping -n 3 127.0.0.1 >nul 2>&1

    :: Get session code and IPs
    powershell -NoProfile -Command "
        try {
            $r = Invoke-WebRequest 'http://localhost:3001/api/status' -UseBasicParsing -TimeoutSec 4
            $j = $r.Content | ConvertFrom-Json
            Write-Host \"  Server online  |  Code: $($j.sessionCode)\"
            $j.ips | ForEach-Object { Write-Host \"  Players: http://$_:3001/#/player\" }
        } catch {
            Write-Host '  Server still starting (check the server window)'
        }
    " 2>nul
) else (
    echo   %DIM%[INFO]%RST%  Server not started.
    echo          Use %CYN%/s%RST% or %CYN%/server%RST% to start automatically.
    echo          Or run manually:  %CYN%npm run server%RST%
)
echo.

:: ================================================================
::  [5/5] VITE SERVER (DEVELOPMENT)
:: ================================================================
:start_vite
echo  %BLD%[5/5] VITE SERVER%RST%
echo  %DIM%----------------------------------------------------------------%RST%

:: Extract port from vite.config
set DEV_PORT=5173
powershell -NoProfile -Command "
    $cfg = Get-Content 'vite.config.js' -ErrorAction SilentlyContinue
    if ($cfg -match 'port\s*:\s*(\d+)') { Write-Host $matches[1] }
" > "%TEMP%\vtp_port.txt" 2>nul
set /p DETECTED_PORT=<"%TEMP%\vtp_port.txt"
del "%TEMP%\vtp_port.txt" >nul 2>&1
if defined DETECTED_PORT if not "!DETECTED_PORT!"=="" set DEV_PORT=%DETECTED_PORT%

set DEV_URL=http://localhost:%DEV_PORT%

:: Check if port is in use
netstat -ano 2>nul | findstr ":%DEV_PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo   %YEL%[WARNING]%RST%  Port %DEV_PORT% is already in use!
    powershell -NoProfile -Command "
        $m = (netstat -ano 2>$null) -match ':%DEV_PORT%.*LISTENING'
        if ($m) {
            $pid = ($m[0].Trim() -split '\s+')[-1]
            $name = (Get-Process -Id $pid -EA SilentlyContinue).ProcessName
            if ($name) { Write-Host \"  Used by: $name (PID $pid)\" }
        }
    " 2>nul
    echo.
    choice /c SAQ /m "   [S] Open browser (server running)  [A] Start another  [Q] Cancel" >nul
    if errorlevel 3 exit /b 0
    if errorlevel 2 goto :launch_vite
    goto :open_browser
)

:launch_vite
echo.
echo  %BLD%================================================================%RST%
echo.
echo    %BLD%%CYN%GM URL (Vite):%RST%
echo    %BLD%%GRN%  >>>  %UL%%DEV_URL%%RST%%BLD%%GRN%  <<<  %RST%
if %START_SERVER%==1 (
    echo.
    echo    %BLD%%CYN%PLAYER URL (Node):%RST%
    echo    %BLD%%GRN%  >>>  %UL%http://{ip}:3001/#/player%RST%%BLD%%GRN%  <<<  %RST%
)
echo.
echo  %BLD%================================================================%RST%
echo.

start "VTP Dev Server  (Vite — close to stop)" cmd /k "cd /d "%~dp0" && npm run dev"
echo   %DIM%Waiting for Vite to initialize...%RST%
ping -n 5 127.0.0.1 >nul 2>&1

:open_browser
echo   Opening %CYN%%DEV_URL%%RST%...
start "" "%DEV_URL%"

echo.
echo  %BLD%================================================================%RST%
echo  %GRN%%BLD%  Done!  VTP Coalizao running on: %DEV_URL%%RST%
echo.
if %START_SERVER%==1 (
echo  %CYN%%BLD%  Player server: npm run server  (port 3001)%RST%
)
echo  %DIM%  Available Flags:%RST%
echo  %DIM%    /q or /quick  — skips build (quick start)%RST%
echo  %DIM%    /s or /server — starts Node.js server (Phase 7A)%RST%
echo  %DIM%    /fresh        — reinstalls node_modules%RST%
echo  %BLD%================================================================%RST%
echo.
pause
exit /b 0

:: ================================================================
:chk
if exist "%~1" (
    echo   %GRN%[OK]%RST%   %~2
) else (
    echo   %RED%[MISSING]%RST% %~2  %DIM%(expected: %~1)%RST%
    set /a MISS+=1
)
exit /b
