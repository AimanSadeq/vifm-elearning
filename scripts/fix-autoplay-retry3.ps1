# Retry fix for the 3 remaining files
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"
$script = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\scripts\fix-autoplay-single.ps1"

$files = @("lesson-1-3.pptx", "lesson-2-1.pptx", "lesson-2-4.pptx")

foreach ($f in $files) {
    $fullPath = Join-Path $courseDir $f
    Write-Host -NoNewline "${f}: "
    $result = & powershell -ExecutionPolicy Bypass -File $script -FilePath $fullPath 2>&1
    Write-Host $result
    Get-Process POWERPNT -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 5
}

Write-Host "Done!"
