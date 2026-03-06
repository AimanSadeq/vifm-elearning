# Fix auto-play for a single PPTX file
param([string]$FilePath)

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
Start-Sleep -Seconds 1

try {
    $pres = $ppt.Presentations.Open($FilePath)
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
} catch {
    Write-Host "ERROR:$($_.Exception.Message)"
    try { $pres.Close() } catch {}
} finally {
    Start-Sleep -Seconds 1
    $ppt.Quit()
    Start-Sleep -Seconds 2
}
