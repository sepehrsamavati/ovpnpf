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

start "OpenVPN + Port Forward (Auto connect)" node "%~dp0src\ovpnWithSsh.mjs"