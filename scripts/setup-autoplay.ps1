# Setup auto-play audio for all slides in a PPTX file
param(
    [string]$PptxPath
)

if (-not $PptxPath) {
    Write-Host "Usage: powershell -File setup-autoplay.ps1 -PptxPath <path>"
    exit 1
}

$pptxFull = Resolve-Path $PptxPath
Write-Host "Setting up auto-play for: $pptxFull"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1

$pres = $ppt.Presentations.Open($pptxFull)

foreach ($slide in $pres.Slides) {
    # Find audio shape on this slide
    foreach ($shape in $slide.Shapes) {
        if ($shape.Type -eq 13) {  # msoMedia = 13
            Write-Host "  Slide $($slide.SlideIndex): Found media shape '$($shape.Name)'"
            
            # Get the animation timeline
            $timeline = $slide.TimeLine
            
            # Add effect: play media automatically (with previous)
            $effect = $timeline.MainSequence.AddEffect(
                $shape,
                1,    # msoAnimEffectMediaPlay
                0,    # no subtype
                2     # msoAnimTriggerWithPrevious
            )
            
            # Set to play from start
            $effect.EffectInformation.PlaySettings.PlayOnEntry = $true
            
            Write-Host "    -> Auto-play configured"
        }
    }
    
    # Set slide advance timing based on audio duration if available
    # We'll also set the slide to advance automatically
    $slide.SlideShowTransition.AdvanceOnClick = 0
    $slide.SlideShowTransition.AdvanceOnTime = 1
    
    # If there's an animation, set advance time to match
    if ($slide.TimeLine.MainSequence.Count -gt 0) {
        # Default 30s if we can't determine duration
        $slide.SlideShowTransition.AdvanceTime = 30
    }
}

$pres.Save()
$pres.Close()
$ppt.Quit()

Write-Host "Done! Auto-play configured for all slides."
