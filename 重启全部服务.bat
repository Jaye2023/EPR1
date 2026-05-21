@echo off
chcp 65001 >nul
title 重启所有系统服务 - 报价系统

echo ==========================================
echo          重新启动所有系统服务
echo ==========================================
echo.

echo [INFO] 正在停止所有服务...
echo.

powershell -ExecutionPolicy Bypass -File "d:\DY\start-all.ps1" -Restart

pause
