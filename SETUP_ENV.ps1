# Run this script as Administrator to configure the server environment

try {
    # Set GOOGLE_API_KEY globally
    [System.Environment]::SetEnvironmentVariable('GOOGLE_API_KEY', 'AIzaSyBFYF0NCwi_pG-kbIRxIIX14quL_fgovl0', 'Machine')
    Write-Host "✅ GOOGLE_API_KEY set globally." -ForegroundColor Green

    # Add Python to global PATH if not present
    $currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    if ($currentPath -notlike "*C:\Program Files\Python313*") {
        $newPath = $currentPath + ";C:\Program Files\Python313;C:\Program Files\Python313\Scripts"
        [System.Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
        Write-Host "✅ Python added to global PATH." -ForegroundColor Green
    } else {
        Write-Host "ℹ️ Python is already in global PATH." -ForegroundColor Cyan
    }

    Write-Host "`n🎉 Setup Complete! Please restart your terminal/IDE to apply changes." -ForegroundColor Yellow
} catch {
    Write-Error "❌ Error: $_"
    Write-Host "Make sure you are running this script as Administrator!" -ForegroundColor Red
}

Read-Host -Prompt "Press Enter to exit"
