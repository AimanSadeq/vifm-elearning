<#
.SYNOPSIS
  Uses PowerPoint COM automation to set embedded audio to autoplay on each slide.
  Sets trigger to "With Previous" (auto-play on slide show) and sets correct duration.
  PowerPoint writes its own file format, so no ZIP corruption.

.USAGE
  powershell -ExecutionPolicy Bypass -File scripts/lesson-generator/set-audio-autoplay.ps1 -Course capa
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$Course
)

$pptxDir = "C:\Projects\elearning courses pptx\$Course"
$audioDir = "$pptxDir\audio"

if (-not (Test-Path $pptxDir)) {
  Write-Error "Directory not found: $pptxDir"
  exit 1
}

# Get all lesson PPTX files
$pptxFiles = Get-ChildItem -Path $pptxDir -Filter "lesson-*.pptx" | Sort-Object Name

if ($pptxFiles.Count -eq 0) {
  Write-Error "No PPTX files found in $pptxDir"
  exit 1
}

# Load Shell.Application for getting audio duration
$shell = New-Object -ComObject Shell.Application

function Get-AudioDurationSeconds {
  param([string]$FilePath)

  $folder = $shell.Namespace((Split-Path $FilePath))
  $file = $folder.ParseName((Split-Path $FilePath -Leaf))

  # Property 27 = Duration (format: "HH:MM:SS")
  $durationStr = $folder.GetDetailsOf($file, 27)

  if ($durationStr -and $durationStr -match '(\d+):(\d+):(\d+)') {
    $hours = [int]$matches[1]
    $minutes = [int]$matches[2]
    $seconds = [int]$matches[3]
    return ($hours * 3600 + $minutes * 60 + $seconds)
  }

  return 0
}

Write-Host ""
Write-Host "Setting audio autoplay via PowerPoint COM ($($pptxFiles.Count) files)"
Write-Host ""

# Launch PowerPoint
$ppt = New-Object -ComObject PowerPoint.Application

$msoMedia = 16
$msoAnimTriggerWithPrevious = 2

$totalPatched = 0

try {
  foreach ($file in $pptxFiles) {
    $filePath = $file.FullName
    $slidesPatched = 0

    # Extract module/lesson numbers from filename (lesson-M-L.pptx)
    if ($file.Name -match 'lesson-(\d+)-(\d+)\.pptx') {
      $mNum = [int]$matches[1]
      $lNum = [int]$matches[2]
    } else {
      Write-Host "  [skip] $($file.Name) - invalid filename format"
      continue
    }

    # Open presentation
    $presentation = $ppt.Presentations.Open($filePath, $false, $false, $false)

    try {
      foreach ($slide in $presentation.Slides) {
        foreach ($shape in $slide.Shapes) {
          if ($shape.Type -eq $msoMedia) {
            $slideIdx = $slide.SlideIndex - 1  # 0-indexed for audio filename

            # Get audio duration from matching MP3
            $audioFile = "m$mNum-l$lNum-s$slideIdx.mp3"
            $audioPath = Join-Path $audioDir $audioFile
            $durationSec = 0

            if (Test-Path $audioPath) {
              $durationSec = Get-AudioDurationSeconds -FilePath $audioPath
            }

            # Default to 300 seconds (5 min) if we can't read the duration
            if ($durationSec -le 0) { $durationSec = 300 }

            # Step 1: Set PlayOnEntry (creates animation effect in timeline)
            $shape.AnimationSettings.PlaySettings.PlayOnEntry = $true
            $shape.AnimationSettings.PlaySettings.HideWhileNotPlaying = $true
            $shape.AnimationSettings.PlaySettings.PauseAnimation = $false

            # Step 2: Find the effect in timeline and change trigger + duration
            $effectCount = $slide.TimeLine.MainSequence.Count
            for ($i = 1; $i -le $effectCount; $i++) {
              $effect = $slide.TimeLine.MainSequence.Item($i)
              try {
                if ($effect.Shape.Id -eq $shape.Id) {
                  # Change trigger from OnClick to WithPrevious (auto-play)
                  $effect.Timing.TriggerType = $msoAnimTriggerWithPrevious
                  # Set duration to actual audio length (in seconds, float)
                  $effect.Timing.Duration = $durationSec
                }
              } catch {}
            }

            $slidesPatched++
          }
        }
      }

      if ($slidesPatched -gt 0) {
        $presentation.Save()
        Write-Host "  [done] $($file.Name) - $slidesPatched slides"
        $totalPatched += $slidesPatched
      } else {
        Write-Host "  [skip] $($file.Name) - no audio found"
      }
    }
    finally {
      $presentation.Close()
    }
  }
}
finally {
  $ppt.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($shell) | Out-Null
}

Write-Host ""
Write-Host "Done! Set autoplay on $totalPatched slides across $($pptxFiles.Count) files."
Write-Host ""
