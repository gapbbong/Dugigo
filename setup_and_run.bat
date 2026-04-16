@echo off
set "PORTABLE_NODE=E:\1cl\node_tmp\node22\node-v22.14.0-win-x64"
set "PATH=%PORTABLE_NODE%;%PATH%"

echo [1/3] Navigating to client directory...
cd /d "e:\DuKiGo\client"

echo [2/3] Installing dependencies (pdf-parse)...
"%PORTABLE_NODE%\npm.cmd" install pdf-parse

echo [3/3] Starting Next.js Dev Server...
"%PORTABLE_NODE%\npm.cmd" run dev
