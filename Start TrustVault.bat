@echo off
title TrustVault
cd /d "%~dp0"

rem First run on a new PC: install everything and create server\.env
if not exist "server\node_modules" call npm run setup

rem Open the website once the servers have had a few seconds to start
start "" cmd /c "timeout /t 6 >nul & start http://localhost:5173"

echo Starting TrustVault... keep this window open. Close it to stop the app.
call npm run dev
pause
