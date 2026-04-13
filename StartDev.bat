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
for %%a in (%*) do (
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
echo  %BLD%%WHT%      VTP COALIZAO  ^|  MESA VIRTUAL DE RPG%RST%
echo  %BLD%%CYN%      Inicializacao e Diagnostico  v2.1%RST%
echo  %BLD%%CYN%================================================================%RST%
if %SKIP_BUILD%==1  echo  %YEL%  [/q]       verificacao de build ignorada%RST%
if %START_SERVER%==1 echo  %CYN%  [/s]       servidor Node.js sera iniciado%RST%
echo.

:: ================================================================
::  [1/5] AMBIENTE
:: ================================================================
echo  %BLD%[1/5] AMBIENTE%RST%
echo  %DIM%----------------------------------------------------------------%RST%

:: Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo   %RED%[ERRO]%RST%  Node.js NAO encontrado.
    echo          Baixe em: %UL%https://nodejs.org%RST%
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
echo   %GRN%[OK]%RST%   Node.js   %CYN%%NODE_VER%%RST%

:: npm
for /f "tokens=*" %%v in ('npm --version 2^>nul') do set NPM_VER=%%v
echo   %GRN%[OK]%RST%   npm       %CYN%v%NPM_VER%%RST%

:: Versao do projeto
set PKG_VER=desconhecida
powershell -NoProfile -Command "$p=Get-Content package.json -Raw|ConvertFrom-Json;if($p.version){Write-Host $p.version}" > "%TEMP%\vtp_ver.txt" 2>nul
set /p PKG_VER=<"%TEMP%\vtp_ver.txt"
del "%TEMP%\vtp_ver.txt" >nul 2>&1
echo   %GRN%[OK]%RST%   Projeto   %CYN%v%PKG_VER%%RST%

:: vite.config
if exist "vite.config.js" (echo   %GRN%[OK]%RST%   vite.config.js) else (
if exist "vite.config.ts" (echo   %GRN%[OK]%RST%   vite.config.ts) else (
    echo   %YEL%[AVISO]%RST% vite.config nao encontrado))

:: node_modules
if %FORCE_INSTALL%==1 (
    echo.
    echo   %YEL%[INFO]%RST%  /fresh — reinstalando dependencias...
    rmdir /s /q node_modules >nul 2>&1
    del package-lock.json >nul 2>&1
)
if not exist "node_modules" (
    echo.
    echo   %YEL%[INFO]%RST%  node_modules ausente — instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo   %RED%[ERRO]%RST%  npm install falhou. Verifique sua conexao.
        pause & exit /b 1
    )
    echo   %GRN%[OK]%RST%   Dependencias instaladas.
) else (
    for /f %%c in ('powershell -NoProfile -Command "(Get-ChildItem node_modules -Directory -ErrorAction SilentlyContinue).Count"') do set MOD_COUNT=%%c
    echo   %GRN%[OK]%RST%   node_modules  %DIM%(%MOD_COUNT% pacotes)%RST%
)
echo.

:: ================================================================
::  [2/5] ARQUIVOS DO PROJETO
:: ================================================================
echo  %BLD%[2/5] ARQUIVOS DO PROJETO%RST%
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
call :chk "src\pages\ServerPage.jsx"                    "ServerPage.jsx      (Fase 7A)"
call :chk "src\pages\PlayerLoginPage.jsx"               "PlayerLoginPage.jsx (Fase 7A)"
call :chk "src\pages\PlayerDashboard.jsx"               "PlayerDashboard.jsx (Fase 7A)"
call :chk "src\context\ServerContext.jsx"               "ServerContext.jsx   (Fase 7A)"
call :chk "src\hooks\useWebSocket.js"                   "useWebSocket.js     (Fase 7A)"
call :chk "src\components\combat\InitiativeTracker.jsx" "InitiativeTracker.jsx"
call :chk "src\components\combat\CombatResolver.jsx"    "CombatResolver.jsx"
call :chk "src\components\layout\BottomBar.jsx"         "BottomBar.jsx"
call :chk "src\components\layout\DetailPanel.jsx"       "DetailPanel.jsx"
call :chk "src\components\characters\CharacterForm.jsx" "CharacterForm.jsx"
call :chk "src\data\classes\index.js"                   "data/classes"
call :chk "public\manifest.json"                        "manifest.json (PWA)"
call :chk "public\sw.js"                                "sw.js (Service Worker)"
:: Server
call :chk "server\index.js"                             "server/index.js     (Fase 7A)"
call :chk "server\sessionManager.js"                    "server/sessionManager.js"

echo.
powershell -NoProfile -Command "
    `$creatures = (Get-ChildItem 'src\data\creatures' -Filter '*.json' -ErrorAction SilentlyContinue).Count
    `$abilities = (Get-ChildItem 'src\data\abilities' -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    `$items     = (Get-ChildItem 'src\data\items'     -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    `$npcs      = (Get-ChildItem 'src\data\npcs'      -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    `$heroes    = (Get-ChildItem 'src\data\heroes'    -Filter '*.json' -ErrorAction SilentlyContinue).Count
    Write-Host \"    Criaturas:`$creatures  Heroes:`$heroes  Habilidades:`$abilities  Itens:`$items  NPCs:`$npcs\"
" 2>nul

if %MISS% GTR 0 (
    echo.
    echo   %RED%[AVISO] %MISS% arquivo(s) AUSENTE(S)!%RST%
) else (
    echo.
    echo   %GRN%[OK]%RST%   Todos os arquivos criticos presentes.
)
echo.

:: ================================================================
::  [3/5] VERIFICACAO DE BUILD
:: ================================================================
echo  %BLD%[3/5] VERIFICACAO DE BUILD%RST%
echo  %DIM%----------------------------------------------------------------%RST%

if %SKIP_BUILD%==1 (
    echo   %YEL%[SKIP]%RST%  Build ignorado  (use sem /q para compilar)
    echo.
    goto :start_server_section
)

echo   Compilando...  %DIM%(aguarde ~5-20s)%RST%
echo.
npm run build > "%TEMP%\vtp_build.txt" 2>&1
set BUILD_EC=%errorlevel%

powershell -NoProfile -Command "
    `$raw  = Get-Content '%TEMP%\vtp_build.txt' -Raw -ErrorAction SilentlyContinue
    if (-not `$raw) { Write-Host '  (sem saida)'; exit }
    `$clean = `$raw -replace '\x1B\[[0-9;]*[mGKHF]', ''
    `$lines = `$clean -split '\r?\n' | Where-Object { `$_.Trim() -ne '' }
    `$show  = if (`$lines.Count -gt 22) { `$lines[-22..-1] } else { `$lines }
    foreach (`$l in `$show) { Write-Host \"  `$l\" }
    if ('%BUILD_EC%' -ne '0') {
        `$errs = `$lines | Where-Object { `$_ -match '(error|PARSE_ERROR|Cannot find|already been decl|is not exported)' }
        if (`$errs.Count -gt 0) {
            Write-Host ''; Write-Host '  ERROS DETECTADOS:'
            foreach (`$e in `$errs | Select-Object -First 8) { Write-Host \"    > `$e\" }
        }
    } else {
        `$dist = Get-ChildItem 'dist' -Recurse -File -ErrorAction SilentlyContinue
        `$kb   = [math]::Round((`$dist | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        `$js   = [math]::Round((`$dist | Where-Object { `$_.Extension -eq '.js'  } | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        `$css  = [math]::Round((`$dist | Where-Object { `$_.Extension -eq '.css' } | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        Write-Host ''; Write-Host \"  dist/  Total:`${kb}KB  JS:`${js}KB  CSS:`${css}KB\"
    }
" 2>nul

echo.
if %BUILD_EC% EQU 0 (
    echo   %GRN%%BLD%[OK]   BUILD BEM-SUCEDIDO%RST%
) else (
    echo   %RED%%BLD%[ERRO] BUILD FALHOU — veja erros acima%RST%
    echo.
    echo   %DIM%Dicas:%RST%
    echo     %YEL%PARSE_ERROR%RST%       = sintaxe invalida
    echo     %YEL%already been decl.%RST% = importacao duplicada
    echo     %YEL%Cannot find module%RST% = arquivo inexistente
    echo.
    echo   Iniciando o servidor mesmo assim para depuracao ao vivo...
    echo   %DIM%Pressione qualquer tecla para continuar ou feche.%RST%
    pause >nul
)
del "%TEMP%\vtp_build.txt" >nul 2>&1
echo.

:: ================================================================
::  [4/5] SERVIDOR NODE.JS (Fase 7A) — OPCIONAL
:: ================================================================
:start_server_section
echo  %BLD%[4/5] SERVIDOR NODE.JS%RST%
echo  %DIM%----------------------------------------------------------------%RST%

:: Verifica se server/index.js existe
if not exist "server\index.js" (
    echo   %YEL%[SKIP]%RST%  server/index.js nao encontrado
    echo.
    goto :start_vite
)

if %START_SERVER%==1 (
    echo   Iniciando servidor Node.js na porta 3001...
    start "VTP Node Server  (jogadores)" cmd /k "cd /d "%~dp0" && npm run server"
    ping -n 3 127.0.0.1 >nul 2>&1

    :: Pega o codigo de sessao e IPs
    powershell -NoProfile -Command "
        try {
            `$r = Invoke-WebRequest 'http://localhost:3001/api/status' -UseBasicParsing -TimeoutSec 4
            `$j = `$r.Content | ConvertFrom-Json
            Write-Host \"  Servidor online  |  Codigo: `$(`$j.sessionCode)\"
            `$j.ips | ForEach-Object { Write-Host \"  Jogadores: http://`$_:3001/#/player\" }
        } catch {
            Write-Host '  Servidor ainda iniciando (verifique a janela do servidor)'
        }
    " 2>nul
) else (
    echo   %DIM%[INFO]%RST%  Servidor nao iniciado.
    echo          Use %CYN%/s%RST% ou %CYN%/server%RST% para iniciar automaticamente.
    echo          Ou execute manualmente:  %CYN%npm run server%RST%
)
echo.

:: ================================================================
::  [5/5] SERVIDOR VITE (DESENVOLVIMENTO)
:: ================================================================
:start_vite
echo  %BLD%[5/5] SERVIDOR VITE%RST%
echo  %DIM%----------------------------------------------------------------%RST%

:: Detecta porta do vite.config
set DEV_PORT=5173
powershell -NoProfile -Command "
    `$cfg = Get-Content 'vite.config.js' -ErrorAction SilentlyContinue
    if (`$cfg -match 'port\s*:\s*(\d+)') { Write-Host `$matches[1] }
" > "%TEMP%\vtp_port.txt" 2>nul
set /p DETECTED_PORT=<"%TEMP%\vtp_port.txt"
del "%TEMP%\vtp_port.txt" >nul 2>&1
if defined DETECTED_PORT if not "!DETECTED_PORT!"=="" set DEV_PORT=%DETECTED_PORT%

set DEV_URL=http://localhost:%DEV_PORT%

:: Verifica porta em uso
netstat -ano 2>nul | findstr ":%DEV_PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo   %YEL%[AVISO]%RST%  Porta %DEV_PORT% ja esta em uso!
    powershell -NoProfile -Command "
        `$m = (netstat -ano 2>`$null) -match ':%DEV_PORT%.*LISTENING'
        if (`$m) {
            `$pid = (`$m[0].Trim() -split '\s+')[-1]
            `$name = (Get-Process -Id `$pid -EA SilentlyContinue).ProcessName
            if (`$name) { Write-Host \"  Em uso por: `$name (PID `$pid)\" }
        }
    " 2>nul
    echo.
    choice /c SAQ /m "   [S] Abrir navegador (server ja rodando)  [A] Iniciar outro  [Q] Cancelar" >nul
    if errorlevel 3 exit /b 0
    if errorlevel 2 goto :launch_vite
    goto :open_browser
)

:launch_vite
echo.
echo  %BLD%================================================================%RST%
echo.
echo    %BLD%%CYN%URL MESTRE (Vite):%RST%
echo    %BLD%%GRN%  >>>  %UL%%DEV_URL%%RST%%BLD%%GRN%  <<<  %RST%
if %START_SERVER%==1 (
    echo.
    echo    %BLD%%CYN%URL JOGADOR (Node):%RST%
    echo    %BLD%%GRN%  >>>  %UL%http://{ip}:3001/#/player%RST%%BLD%%GRN%  <<<  %RST%
)
echo.
echo  %BLD%================================================================%RST%
echo.

start "VTP Dev Server  (Vite — feche para parar)" cmd /k "cd /d "%~dp0" && npm run dev"
echo   %DIM%Aguardando Vite inicializar...%RST%
ping -n 5 127.0.0.1 >nul 2>&1

:open_browser
echo   Abrindo %CYN%%DEV_URL%%RST%...
start "" "%DEV_URL%"

echo.
echo  %BLD%================================================================%RST%
echo  %GRN%%BLD%  Pronto!  VTP Coalizao rodando em: %DEV_URL%%RST%
echo.
if %START_SERVER%==1 (
echo  %CYN%%BLD%  Servidor de jogadores: npm run server  (porta 3001)%RST%
)
echo  %DIM%  Flags disponíveis:%RST%
echo  %DIM%    /q ou /quick  — pula build (inicio rapido)%RST%
echo  %DIM%    /s ou /server — inicia o servidor Node.js (Fase 7A)%RST%
echo  %DIM%    /fresh        — reinstala node_modules%RST%
echo  %BLD%================================================================%RST%
echo.
pause
exit /b 0

:: ================================================================
:chk
if exist "%~1" (
    echo   %GRN%[OK]%RST%   %~2
) else (
    echo   %RED%[FALTA]%RST% %~2  %DIM%(esperado: %~1)%RST%
    set /a MISS+=1
)
exit /b
