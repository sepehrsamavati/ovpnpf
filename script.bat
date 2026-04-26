@echo off

:: Always switch to this script's directory
cd /d "%~dp0"

:: Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs -WorkingDirectory '%~dp0'"
    exit /b
)

echo Running as admin

start "OpenVPN (Auto connect)" node "%~dp0src\ovpn.mjs"
echo Waiting for OVPN
timeout /t 5 /nobreak >nul
start "Local Port forward SSH tunnel" node "%~dp0src\ssh\app.cjs"