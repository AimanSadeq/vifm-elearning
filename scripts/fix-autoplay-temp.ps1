# Fix auto-play by copying to temp dir first (avoids OneDrive locks)
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"
$tempDir = "$env:TEMP\pptx-fix"

if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Force -Path $tempDir | Out-Null }

$files = @("lesson-1-3.pptx", "lesson-2-1.pptx")

foreach ($f in $files) {
    $srcPath = Join-Path $courseDir $f
    $tmpPath = Join-Path $tempDir $f

    # Copy to temp
    Copy-Item $srcPath $tmpPath -Force
    Write-Host -NoNewline "${f}: "

    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = 1
    Start-Sleep -Seconds 2

    try {
        $pres = $ppt.Presentations.Open($tmpPath)
        Start-Sleep -Seconds 1
        $audioCount = 0

        foreach ($slide in $pres.Slides) {
            $audioShape = $null
            foreach ($shape in $slide.Shapes) {
                if ($shape.Type -eq 16 -and $shape.MediaType -eq 2) {
                    $audioShape = $shape
                    break
                }
            }

            if ($audioShape) {
                while ($slide.TimeLine.MainSequence.Count -gt 0) {
                    $slide.TimeLine.MainSequence.Item(1).Delete()
                }
                $effect = $slide.TimeLine.MainSequence.AddEffect($audioShape, 83, 0, 3)
                $audioShape.AnimationSettings.PlaySettings.PlayOnEntry = $true
                $audioShape.AnimationSettings.PlaySettings.HideWhileNotPlaying = $true
                $slide.SlideShowTransition.AdvanceOnClick = 0
                $slide.SlideShowTransition.AdvanceOnTime = -1
                $audioCount++
            }
        }

        if ($audioCount -gt 0) {
            $pres.Save()
            Write-Host "OK:$audioCount"
        } else {
            Write-Host "SKIP"
        }
        $pres.Close()

        # Copy back
        Start-Sleep -Seconds 1
        Copy-Item $tmpPath $srcPath -Force
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)"
        try { $pres.Close() } catch {}
    }

    $ppt.Quit()
    Start-Sleep -Seconds 3
    Get-Process POWERPNT -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "Done!"
