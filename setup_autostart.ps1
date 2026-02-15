# Devil Town Auto-start Setup Script
# 역할: Windows 작업 스케줄러에 서버 실행 앱(start_server.bat)을 등록함
# 호출 관계: 사용자가 수동 실행하거나 설치 시 자동 실행됨
# 수정 시 주의사항: 작업 이름 및 실행 경로(Working Directory) 정확성 확인 필수

$Action = New-ScheduledTaskAction -Execute "D:\DEVILTOWN\start_server.bat"
$Trigger = New-ScheduledTaskTrigger -AtLogon
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit 0

$TaskName = "DevilTownServerAutoStart"
$Description = "Auto-starts Devil Town Backend and Cloudflare Tunnel on user logon."

Register-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -TaskName $TaskName -Description $Description -Force

Write-Host "Scheduled Task '$TaskName' has been created successfully."
Write-Host "The server will now start automatically when you log in."
