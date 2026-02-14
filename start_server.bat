@echo off
cd /d "D:\DEVILTOWN"

:: Start Backend Server
echo Starting Devil Town Backend...
start /min cmd /c "python main.py"

:: Wait for backend to initialize
timeout /t 5 /nobreak >nul

:: Start Cloudflare Tunnel (if installed and configured)
echo Starting Cloudflare Tunnel...
start /min cmd /c "cloudflared tunnel run deviltown-server"

echo Devil Town Server is running!
exit
