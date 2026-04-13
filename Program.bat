@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title VTP Coalizao — Dev Environment v2.0
cd /d "%~dp0"

:: ── ANSI colors (Windows 10+ VirtualTerminal) ────────────────────────────────
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
for %%a in (%*) do (
  if /i "%%a"=="/q"        set SKIP_BUILD=1
  if /i "%%a"=="/quick"    set SKIP_BUILD=1
  if /i "%%a"=="/nobuild"  set SKIP_BUILD=1
  if /i "%%a"=="/fresh"    set FORCE_INSTALL=1
)

cls
echo.
echo  %BLD%%CYN%================================================================%RST%
echo  %BLD%%WHT%      VTP COALIZAO  ^|  MESA VIRTUAL DE RPG%RST%
echo  %BLD%%CYN%      Inicializacao e Diagnostico  v2.0%RST%
echo  %BLD%%CYN%================================================================%RST%
if %SKIP_BUILD%==1 echo  %YEL%  [modo rapido]  verificacao de build ignorada  (/q)%RST%
echo.

:: ================================================================
::  [1/4] AMBIENTE
:: ================================================================
echo  %BLD%[1/4] AMBIENTE%RST%
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
set PKG_NAME=vtp
powershell -NoProfile -Command "$p=Get-Content package.json -Raw|ConvertFrom-Json;if($p.version){Write-Host $p.version};if($p.name){[System.IO.File]::WriteAllText('%TEMP%\vtp_name.txt',$p.name)}" > "%TEMP%\vtp_pkg_ver.txt" 2>nul
set /p PKG_VER=<"%TEMP%\vtp_pkg_ver.txt"
del "%TEMP%\vtp_pkg_ver.txt" >nul 2>&1
if exist "%TEMP%\vtp_name.txt" (set /p PKG_NAME=<"%TEMP%\vtp_name.txt") & del "%TEMP%\vtp_name.txt" >nul 2>&1
echo   %GRN%[OK]%RST%   Projeto   %CYN%%PKG_NAME% v%PKG_VER%%RST%

:: vite.config
if exist "vite.config.js" (
    echo   %GRN%[OK]%RST%   vite.config.js
) else if exist "vite.config.ts" (
    echo   %GRN%[OK]%RST%   vite.config.ts
) else (
    echo   %YEL%[AVISO]%RST% vite.config nao encontrado
)

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
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo   %RED%[ERRO]%RST%  npm install falhou. Verifique sua conexao.
        pause & exit /b 1
    )
    echo   %GRN%[OK]%RST%   Dependencias instaladas com sucesso.
) else (
    :: Count modules quickly
    for /f %%c in ('powershell -NoProfile -Command "(Get-ChildItem node_modules -Directory -ErrorAction SilentlyContinue).Count"') do set MOD_COUNT=%%c
    echo   %GRN%[OK]%RST%   node_modules  %DIM%(%MOD_COUNT% pacotes)%RST%
)
echo.

:: ================================================================
::  [2/4] ARQUIVOS DO PROJETO
:: ================================================================
echo  %BLD%[2/4] ARQUIVOS DO PROJETO%RST%
echo  %DIM%----------------------------------------------------------------%RST%

set MISS=0

call :chk "src\main.jsx"                                "main.jsx            (entry point)"
call :chk "src\App.jsx"                                 "App.jsx             (raiz da app)"
call :chk "src\services\database.js"                    "database.js         (IndexedDB schema)"
call :chk "src\services\dataSeeder.js"                  "dataSeeder.js       (seed de dados)"
call :chk "src\services\campaignIO.js"                  "campaignIO.js       (export/import JSON)"
call :chk "src\utils\characterUtils.js"                 "characterUtils.js"
call :chk "src\utils\combatUtils.js"                    "combatUtils.js"
call :chk "src\pages\MapPage.jsx"                       "MapPage.jsx         (mapa tatico)"
call :chk "src\pages\CharactersPage.jsx"                "CharactersPage.jsx"
call :chk "src\pages\BestiaryPage.jsx"                  "BestiaryPage.jsx"
call :chk "src\pages\CampaignPage.jsx"                  "CampaignPage.jsx"
call :chk "src\components\map\Token.jsx"                "Token.jsx"
call :chk "src\components\map\MapToolbar.jsx"           "MapToolbar.jsx"
call :chk "src\components\combat\InitiativeTracker.jsx" "InitiativeTracker.jsx"
call :chk "src\components\combat\CombatResolver.jsx"    "CombatResolver.jsx"
call :chk "src\components\layout\BottomBar.jsx"         "BottomBar.jsx"
call :chk "src\components\layout\DetailPanel.jsx"       "DetailPanel.jsx"
call :chk "src\components\characters\CharacterForm.jsx" "CharacterForm.jsx"
call :chk "src\data\creatures\index.js"                 "data/creatures"
call :chk "src\data\abilities\index.js"                 "data/abilities"
call :chk "src\data\heroes\index.js"                    "data/heroes"
call :chk "src\data\items\index.js"                     "data/items"
call :chk "src\data\npcs\index.js"                      "data/npcs"
call :chk "src\data\classes\index.js"                   "data/classes"
call :chk "public\manifest.json"                        "manifest.json       (PWA)"
call :chk "public\sw.js"                                "sw.js               (Service Worker)"

:: Contagem de arquivos JSON de dados
echo.
powershell -NoProfile -Command "
    $creatures = (Get-ChildItem 'src\data\creatures' -Filter '*.json' -ErrorAction SilentlyContinue).Count
    $abilities = (Get-ChildItem 'src\data\abilities' -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    $items     = (Get-ChildItem 'src\data\items'     -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    $npcs      = (Get-ChildItem 'src\data\npcs'      -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    $heroes    = (Get-ChildItem 'src\data\heroes'    -Filter '*.json' -ErrorAction SilentlyContinue).Count
    $mods      = (Get-ChildItem 'src\data\modifications' -Filter '*.json' -Recurse -ErrorAction SilentlyContinue).Count
    $classes   = (Get-ChildItem 'src\data\classes'   -Filter '*.js'   -ErrorAction SilentlyContinue).Count
    Write-Host '  Banco de dados pre-populado:'
    Write-Host \"    Criaturas  : $creatures  | Herois  : $heroes\"
    Write-Host \"    Habilidades: $abilities  | Itens   : $items\"
    Write-Host \"    NPCs       : $npcs       | Modif.  : $mods  | Classes: $classes\"
" 2>nul

if %MISS% GTR 0 (
    echo.
    echo   %RED%[AVISO] %MISS% arquivo(s) AUSENTE(S) — pode causar erros no app!%RST%
) else (
    echo.
    echo   %GRN%[OK]%RST%   Todos os arquivos criticos presentes.
)
echo.

:: ================================================================
::  [3/4] VERIFICACAO DE BUILD
:: ================================================================
echo  %BLD%[3/4] VERIFICACAO DE BUILD%RST%
echo  %DIM%----------------------------------------------------------------%RST%

if %SKIP_BUILD%==1 (
    echo   %YEL%[SKIP]%RST%  Build ignorado  (use sem /q para verificar erros de compilacao)
    echo.
    goto :start_server
)

echo   Compilando o projeto para detectar erros...
echo   %DIM%(aguarde ~5-20 segundos)%RST%
echo.

npm run build > "%TEMP%\vtp_build.txt" 2>&1
set BUILD_EC=%errorlevel%

:: Strip ANSI codes, exibir resultado e extrair erros
powershell -NoProfile -Command "
    $raw = Get-Content '%TEMP%\vtp_build.txt' -Raw -ErrorAction SilentlyContinue
    if (-not $raw) { Write-Host '  (sem saida)'; exit }
    `$clean = `$raw -replace '\x1B\[[0-9;]*[mGKHF]', ''
    `$lines = `$clean -split '\r?\n' | Where-Object { `$_.Trim() -ne '' }
    `$show  = if (`$lines.Count -gt 25) { `$lines[-25..-1] } else { `$lines }
    foreach (`$l in `$show) { Write-Host \"  `$l\" }

    # Resumo de erros se falhou
    if ($env:BUILD_EC -ne '0') {
        Write-Host ''
        `$errors = `$lines | Where-Object { `$_ -match '(error|PARSE_ERROR|Cannot find|is not exported|already been decl)' }
        if (`$errors.Count -gt 0) {
            Write-Host '  ERROS ENCONTRADOS:'
            foreach (`$e in `$errors | Select-Object -First 10) {
                Write-Host \"    > `$e\"
            }
        }
    }
" 2>nul

:: Se build OK, mostra tamanho do dist
if %BUILD_EC% EQU 0 (
    powershell -NoProfile -Command "
        `$dist = Get-ChildItem 'dist' -Recurse -File -ErrorAction SilentlyContinue
        `$totalKB = [math]::Round((`$dist | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        `$jsKB    = [math]::Round((`$dist | Where-Object {`$_.Extension -eq '.js'} | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        `$cssKB   = [math]::Round((`$dist | Where-Object {`$_.Extension -eq '.css'} | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        `$buildTime = if ((`$dist | Select-Object -First 1).LastWriteTime) { (`$dist | Select-Object -First 1).LastWriteTime.ToString('HH:mm:ss') } else { '?' }
        Write-Host ''
        Write-Host \"  dist/  Total: `${totalKB} KB  |  JS: `${jsKB} KB  |  CSS: `${cssKB} KB  |  Build: `$buildTime\"
    " 2>nul
)

echo.

if %BUILD_EC% EQU 0 (
    echo   %DIM%--------------------------------------------------------%RST%
    echo   %GRN%%BLD%[OK]   BUILD BEM-SUCEDIDO  ^|  sem erros de compilacao%RST%
    echo   %DIM%--------------------------------------------------------%RST%
) else (
    echo   %DIM%--------------------------------------------------------%RST%
    echo   %RED%%BLD%[ERRO] BUILD FALHOU  ^|  erros de compilacao encontrados%RST%
    echo   %DIM%--------------------------------------------------------%RST%
    echo.
    echo   Como interpretar os erros:
    echo     %YEL%- [PARSE_ERROR]%RST%       : sintaxe invalida no arquivo indicado
    echo     %YEL%- already been decl.%RST%  : importacao duplicada de mesmo simbolo
    echo     %YEL%- Cannot find module%RST%  : importacao de arquivo inexistente
    echo     %YEL%- is not exported%RST%     : exportacao incorreta no modulo alvo
    echo.
    echo   O servidor de dev sera iniciado assim mesmo (HMR exibe
    echo   o erro diretamente no navegador com stack trace).
    echo.
    echo   %DIM%Pressione qualquer tecla para continuar ou feche para abortar.%RST%
    pause >nul
)

del "%TEMP%\vtp_build.txt" >nul 2>&1
echo.

:: ================================================================
::  [4/4] SERVIDOR DE DESENVOLVIMENTO
:: ================================================================
:start_server
echo  %BLD%[4/4] SERVIDOR DE DESENVOLVIMENTO%RST%
echo  %DIM%----------------------------------------------------------------%RST%

:: Detecta porta configurada no vite.config (fallback: 5173)
set DEV_PORT=5173
powershell -NoProfile -Command "
    `$cfg = Get-Content 'vite.config.js' -ErrorAction SilentlyContinue
    if (`$cfg -match 'port\s*:\s*(\d+)') { Write-Host `$matches[1] }
" > "%TEMP%\vtp_port.txt" 2>nul
set /p DETECTED_PORT=<"%TEMP%\vtp_port.txt"
del "%TEMP%\vtp_port.txt" >nul 2>&1
if defined DETECTED_PORT if not "!DETECTED_PORT!"=="" set DEV_PORT=%DETECTED_PORT%

set DEV_URL=http://localhost:%DEV_PORT%

:: Verifica se a porta ja esta em uso
netstat -ano 2>nul | findstr ":%DEV_PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo   %YEL%[AVISO]%RST%  Porta %DEV_PORT% ja esta em uso!
    powershell -NoProfile -Command "
        `$proc = netstat -ano 2>`$null | Select-String ':%DEV_PORT% .*LISTENING'
        if (`$proc) {
            `$pid = (`$proc[0] -split '\s+')[-1]
            `$name = (Get-Process -Id `$pid -ErrorAction SilentlyContinue).ProcessName
            if (`$name) { Write-Host \"          Em uso por: `$name (PID `$pid)\" }
        }
    " 2>nul
    echo.
    echo   Opcoes:
    echo     %GRN%[S]%RST%  Abrir o navegador direto (servidor ja rodando)
    echo     %YEL%[N]%RST%  Iniciar outro servidor mesmo assim
    echo     %RED%[Q]%RST%  Cancelar
    echo.
    choice /c SNQ /m "Escolha" >nul
    if errorlevel 3 exit /b 0
    if errorlevel 2 goto :launch_server
    :: Opção S - abrir direto
    goto :open_browser
)

:launch_server
echo.
echo  %BLD%================================================================%RST%
echo.
echo    %BLD%%CYN%URL DO APLICATIVO:%RST%
echo.
echo         %BLD%%GRN% >>>   %UL%%DEV_URL%%RST%%BLD%%GRN%   <<<   %RST%
echo.
echo    O servidor esta iniciando em uma nova janela.
echo    O navegador abrira automaticamente em ~4 segundos.
echo.
echo    %DIM%Feche a janela "VTP Dev Server" para parar o servidor.%RST%
echo  %BLD%================================================================%RST%
echo.

:: Inicia servidor em nova janela cmd
set "STARTCMD=cd /d "%~dp0" && npm run dev"
start "VTP Dev Server  (feche esta janela para parar)" cmd /k "%STARTCMD%"

:: Aguarda o servidor subir (~4s) e abre o navegador
echo   %DIM%Aguardando o servidor inicializar...%RST%
ping -n 5 127.0.0.1 >nul 2>&1

:open_browser
echo   Abrindo %CYN%%DEV_URL%%RST% no navegador...
start "" "%DEV_URL%"

echo.
echo  %BLD%================================================================%RST%
echo  %GRN%%BLD%  Pronto! VTP Coalizao esta rodando em:%RST%
echo  %BLD%%CYN%  %DEV_URL%%RST%
echo.
echo  %DIM%  Esta janela de diagnostico pode ser fechada.%RST%
echo  %DIM%  O servidor continua na janela "VTP Dev Server".%RST%
echo.
echo  %DIM%  Flags disponiveis ao re-executar este .bat:%RST%
echo  %DIM%    /q ou /quick   — pula a verificacao de build (inicio rapido)%RST%
echo  %DIM%    /fresh         — reinstala node_modules do zero%RST%
echo  %BLD%================================================================%RST%
echo.
pause
exit /b 0

:: ================================================================
::  SUBROTINAS
:: ================================================================
:chk
if exist "%~1" (
    echo   %GRN%[OK]%RST%   %~2
) else (
    echo   %RED%[FALTA]%RST% %~2
    echo          %DIM%Esperado em: %~1%RST%
    set /a MISS+=1
)
exit /b
