# Fix auto-play for specific lesson files that were missed
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"
$filesToFix = @("lesson-1-3.pptx", "lesson-2-1.pptx")

foreach ($fileName in $filesToFix) {
    $filePath = Join-Path $courseDir $fileName
    if (-not (Test-Path $filePath)) {
        Write-Host "$fileName - File not found"
        continue
    }

    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = 1
    Start-Sleep -Seconds 2

    try {
        $pres = $ppt.Presentations.Open($filePath)
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

                $effect = $slide.TimeLine.MainSequence.AddEffect(
                    $audioShape, 83, 0, 3
                )
                $audioShape.AnimationSettings.PlaySettings.PlayOnEntry = $true
                $audioShape.AnimationSettings.PlaySettings.HideWhileNotPlaying = $true
                $audioCount++
            }
        }

        $pres.Save()
        $pres.Close()
        Write-Host "$fileName - Auto-play configured ($audioCount slides)"
    } catch {
        Write-Host "$fileName - ERROR: $($_.Exception.Message)"
    }

    $ppt.Quit()
    Start-Sleep -Seconds 2
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    [System.GC]::Collect()
}

Write-Host "`nDone!"
