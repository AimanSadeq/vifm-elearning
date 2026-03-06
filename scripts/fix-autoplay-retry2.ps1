# Fix auto-play for lesson-1-3 and lesson-2-1
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
Start-Sleep -Seconds 2

$filesToFix = @("lesson-1-3.pptx", "lesson-2-1.pptx")

foreach ($fileName in $filesToFix) {
    $filePath = Join-Path $courseDir $fileName

    try {
        $pres = $ppt.Presentations.Open($filePath)
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

                $effect = $slide.TimeLine.MainSequence.AddEffect(
                    $audioShape, 83, 0, 3
                )
                $audioShape.AnimationSettings.PlaySettings.PlayOnEntry = $true
                $audioShape.AnimationSettings.PlaySettings.HideWhileNotPlaying = $true
                $audioCount++
            }
        }

        $pres.Save()
        Write-Host "$fileName - Auto-play configured ($audioCount slides with audio)"
        $pres.Close()
        Start-Sleep -Seconds 1
    } catch {
        Write-Host "$fileName - ERROR: $($_.Exception.Message)"
    }
}

$ppt.Quit()
Write-Host "Done!"
