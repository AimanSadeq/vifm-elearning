# Fix auto-play audio for all PPTX lesson files that contain audio
$courseDir = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl"

$pptxFiles = Get-ChildItem -Path $courseDir -Filter "lesson-*.pptx" | Sort-Object Name

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1

foreach ($file in $pptxFiles) {
    $pres = $ppt.Presentations.Open($file.FullName)
    $hasAudio = $false

    foreach ($slide in $pres.Slides) {
        $slideIdx = $slide.SlideIndex

        # Find audio shape
        $audioShape = $null
        foreach ($shape in $slide.Shapes) {
            if ($shape.Type -eq 16 -and $shape.MediaType -eq 2) {
                $audioShape = $shape
                break
            }
        }

        if ($audioShape) {
            $hasAudio = $true

            # Remove existing animations
            while ($slide.TimeLine.MainSequence.Count -gt 0) {
                $slide.TimeLine.MainSequence.Item(1).Delete()
            }

            # Add play effect with "With Previous" trigger (auto-play)
            $effect = $slide.TimeLine.MainSequence.AddEffect(
                $audioShape,
                83,   # msoAnimEffectMediaPlay
                0,    # no subtype
                3     # msoAnimTriggerWithPrevious
            )

            # Configure playback
            $audioShape.AnimationSettings.PlaySettings.PlayOnEntry = $true
            $audioShape.AnimationSettings.PlaySettings.HideWhileNotPlaying = $true
        }
    }

    if ($hasAudio) {
        $pres.Save()
        Write-Host "$($file.Name) - Auto-play configured"
    } else {
        Write-Host "$($file.Name) - No audio (skipped)"
    }

    $pres.Close()
}

$ppt.Quit()
Write-Host "`nDone! All lessons with audio now have auto-play configured."
