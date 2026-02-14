$Action = New-ScheduledTaskAction -Execute "D:\DEVILTOWN\start_server.bat"
$Trigger = New-ScheduledTaskTrigger -AtLogon
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit 0

$TaskName = "DevilTownServerAutoStart"
$Description = "Auto-starts Devil Town Backend and Cloudflare Tunnel on user logon."

Register-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -TaskName $TaskName -Description $Description -Force

Write-Host "Scheduled Task '$TaskName' has been created successfully."
Write-Host "The server will now start automatically when you log in."
