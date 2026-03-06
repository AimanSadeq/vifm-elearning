# Test which PPTX files COM can open
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
Start-Sleep -Seconds 2

$files = @(
    "lesson-1-1.pptx", "lesson-1-2.pptx", "lesson-1-3.pptx", "lesson-1-4.pptx",
    "lesson-2-1.pptx", "lesson-2-2.pptx", "lesson-2-3.pptx", "lesson-2-4.pptx"
)

foreach ($f in $files) {
    $fullPath = Join-Path $courseDir $f
    Write-Host -NoNewline "${f}: "
    try {
        $pres = $ppt.Presentations.Open($fullPath)
        Write-Host "OK ($($pres.Slides.Count) slides)"
        $pres.Close()
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "FAIL"
    }
}

$ppt.Quit()
Start-Sleep -Seconds 2
Get-Process POWERPNT -ErrorAction SilentlyContinue | Stop-Process -Force
