@echo off
setlocal
where python >nul 2>nul
if %errorlevel% equ 0 (
    python "%~dp0infra\scripts\vtt_cli.py" %*
    exit /b %errorlevel%
)
where py >nul 2>nul
if %errorlevel% equ 0 (
    py "%~dp0infra\scripts\vtt_cli.py" %*
    exit /b %errorlevel%
)
node "%~dp0infra\scripts\vtt_cli.js" %*
exit /b %errorlevel%
