$minGit = "$env:LOCALAPPDATA\MinGit\cmd\git.exe"
Write-Host "Starting FinTrack Git Push..." -ForegroundColor Cyan
& $minGit push -u origin main
