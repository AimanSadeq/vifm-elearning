# Inspect shapes in a PPTX to understand what PowerPoint sees
$pptxPath = "C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl\lesson-1-1.pptx"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
$pres = $ppt.Presentations.Open($pptxPath)

foreach ($slide in $pres.Slides) {
    Write-Host "=== Slide $($slide.SlideIndex) ==="
    foreach ($shape in $slide.Shapes) {
        Write-Host "  Shape: '$($shape.Name)' Type=$($shape.Type) HasMediaFormat=$($shape.MediaType)"
    }
    Write-Host "  Transition: AdvanceOnClick=$($slide.SlideShowTransition.AdvanceOnClick) AdvanceOnTime=$($slide.SlideShowTransition.AdvanceOnTime) AdvanceTime=$($slide.SlideShowTransition.AdvanceTime)"
    Write-Host "  Animations: $($slide.TimeLine.MainSequence.Count)"
}

$pres.Close()
$ppt.Quit()
