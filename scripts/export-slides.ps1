$pptxDir = 'C:\Users\AimanSadeq\OneDrive - Virginia Institute of Finance\VIFM eLearning Portal\vifm-elearning\public\courses\caifl'
$slidesDir = Join-Path $pptxDir 'slides'
if (Test-Path $slidesDir) { Remove-Item -Recurse -Force $slidesDir }
New-Item -ItemType Directory -Force -Path $slidesDir | Out-Null

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Interop.PowerPoint.MsoTriState]::msoTrue

$pptxFile = Join-Path $pptxDir 'lesson-1-1.pptx'
$pres = $ppt.Presentations.Open($pptxFile)
$pres.Export($slidesDir, 'jpg')
$pres.Close()

$ppt.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null

Write-Host 'Done exporting slides'
Get-ChildItem $slidesDir | ForEach-Object { Write-Host $_.Name }
