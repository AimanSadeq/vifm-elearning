# Fix auto-play for each audio lesson file, one PowerPoint instance per file
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"
$script = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\scripts\fix-autoplay-single.ps1"

$files = @(
    "lesson-1-1.pptx", "lesson-1-2.pptx", "lesson-1-3.pptx", "lesson-1-4.pptx",
    "lesson-2-1.pptx", "lesson-2-2.pptx", "lesson-2-3.pptx", "lesson-2-4.pptx"
)

foreach ($f in $files) {
    $fullPath = Join-Path $courseDir $f
    Write-Host -NoNewline "${f}: "

    # Run in a separate PowerShell process for isolation
    $result = & powershell -ExecutionPolicy Bypass -File $script -FilePath $fullPath 2>&1
    Write-Host $result

    # Kill any leftover PowerPoint
    Get-Process POWERPNT -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 3
}

Write-Host "`nAll done!"
