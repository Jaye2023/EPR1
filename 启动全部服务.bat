@echo off
chcp 65001 >nul
title 启动所有系统服务 - 美临报价系统

echo ==========================================
echo          一键启动所有系统服务
echo ==========================================
echo.

powershell -ExecutionPolicy Bypass -File "d:\DY\start-all.ps1"

pause
