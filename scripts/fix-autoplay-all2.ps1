# Fix auto-play audio for all PPTX lesson files - one at a time with fresh COM
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"

$pptxFiles = Get-ChildItem -Path $courseDir -Filter "lesson-*.pptx" | Sort-Object Name

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
Start-Sleep -Seconds 2

foreach ($file in $pptxFiles) {
    try {
        $pres = $ppt.Presentations.Open($file.FullName)
        Start-Sleep -Milliseconds 500
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
                # Remove existing animations
                while ($slide.TimeLine.MainSequence.Count -gt 0) {
                    $slide.TimeLine.MainSequence.Item(1).Delete()
                }

                # Add auto-play effect
                $effect = $slide.TimeLine.MainSequence.AddEffect(
                    $audioShape, 83, 0, 3
                )
                $audioShape.AnimationSettings.PlaySettings.PlayOnEntry = $true
                $audioShape.AnimationSettings.PlaySettings.HideWhileNotPlaying = $true

                # Set slide to auto-advance
                $slide.SlideShowTransition.AdvanceOnClick = 0
                $slide.SlideShowTransition.AdvanceOnTime = -1
                $audioCount++
            }
        }

        if ($audioCount -gt 0) {
            $pres.Save()
            Write-Host "$($file.Name) - Auto-play: $audioCount slides"
        } else {
            Write-Host "$($file.Name) - No audio"
        }
        $pres.Close()
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "$($file.Name) - ERROR: $($_.Exception.Message)"
        try { $pres.Close() } catch {}
    }
}

$ppt.Quit()
Write-Host "`nDone!"
