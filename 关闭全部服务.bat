@echo off
chcp 65001
title 一键关闭所有系统服务
powershell -ExecutionPolicy Bypass -File "d:\DY\stop-all.ps1"
pause