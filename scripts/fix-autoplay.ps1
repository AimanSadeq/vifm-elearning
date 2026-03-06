# Fix auto-play audio for all slides in a PPTX
param(
    [string]$PptxPath = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl\lesson-1-1.pptx"
)

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
$pres = $ppt.Presentations.Open($PptxPath)

# ppMediaTypeSound = 2
# msoAnimTriggerWithPrevious = 3
# msoAnimEffectMediaPlay = 83

foreach ($slide in $pres.Slides) {
    $slideIdx = $slide.SlideIndex

    # Remove existing animations first
    while ($slide.TimeLine.MainSequence.Count -gt 0) {
        $slide.TimeLine.MainSequence.Item(1).Delete()
    }

    # Find audio shape
    $audioShape = $null
    foreach ($shape in $slide.Shapes) {
        if ($shape.Type -eq 16 -and $shape.MediaType -eq 2) {
            $audioShape = $shape
            break
        }
    }

    if ($audioShape) {
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

        Write-Host "Slide $slideIdx : Auto-play configured (AdvanceTime=$($slide.SlideShowTransition.AdvanceTime)s)"
    } else {
        Write-Host "Slide $slideIdx : No audio found"
    }
}

$pres.Save()
$pres.Close()
$ppt.Quit()

Write-Host "`nDone! Open the PPTX and press F5 to test."
