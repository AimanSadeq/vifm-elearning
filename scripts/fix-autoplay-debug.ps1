# Debug: try opening PPTX from temp with various flags
param([string]$FilePath)

$tempDir = "$env:TEMP\pptx-debug"
if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Force -Path $tempDir | Out-Null }

$fileName = [System.IO.Path]::GetFileName($FilePath)
$tmpPath = Join-Path $tempDir $fileName

# Copy to temp to avoid OneDrive locks
Copy-Item $FilePath $tmpPath -Force
Write-Host "Copied to: $tmpPath"
Write-Host "File size: $((Get-Item $tmpPath).Length) bytes"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = 1
Start-Sleep -Seconds 2

try {
    Write-Host "Attempting Open with ReadOnly..."
    # Open(FileName, ReadOnly, Untitled, WithWindow)
    $pres = $ppt.Presentations.Open($tmpPath, [Microsoft.Office.Interop.PowerPoint.MsoTriState]::msoTrue)
    Write-Host "SUCCESS! Slides: $($pres.Slides.Count)"
    $pres.Close()
} catch {
    Write-Host "ReadOnly failed: $($_.Exception.Message)"

    try {
        Write-Host "Attempting Open2 with repair..."
        # Try OpenOld method
        $pres = $ppt.Presentations.Open($tmpPath, 0, 0, 0)
        Write-Host "SUCCESS with no-window! Slides: $($pres.Slides.Count)"
        $pres.Close()
    } catch {
        Write-Host "No-window failed: $($_.Exception.Message)"
    }
}

$ppt.Quit()
Start-Sleep -Seconds 2
Get-Process POWERPNT -ErrorAction SilentlyContinue | Stop-Process -Force
