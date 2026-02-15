@echo off
REM Devil Town Server Execution Script
REM 역할: FastAPI 서버와 Cloudflare Tunnel을 동시에 실행함
REM 호출 관계: 시스템 시작 시 또는 사용자 실행 시 호출됨
REM 수정 시 주의사항: Python 인터프리터 경로 및 터널 이름(deviltown) 확인

cd /d "D:\DEVILTOWN"

:: Start Backend Server
echo 🏃 Starting Devil Town Backend...
start /min cmd /c "python main.py"

:: Wait for backend to initialize
timeout /t 5 /nobreak >nul

:: Start Cloudflare Tunnel (if installed and configured)
echo Starting Cloudflare Tunnel...
start /min cmd /c "cloudflared tunnel run deviltown-server"

echo Devil Town Server is running!
exit
