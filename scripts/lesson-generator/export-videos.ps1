<#
.SYNOPSIS
  Exports PPTX lessons to MP4 video using PowerPoint (slide images) + ffmpeg (compose).
  Each slide becomes a video segment with its matching audio narration.

.USAGE
  powershell -ExecutionPolicy Bypass -File scripts/lesson-generator/export-videos.ps1 -Course capa
  powershell -ExecutionPolicy Bypass -File scripts/lesson-generator/export-videos.ps1 -Course capa -Lesson lesson-1-1
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$Course,

  [string]$Lesson = ""
)

$ffmpeg = "C:\Users\AimanSadeq\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe"
$pptxDir = "C:\Projects\elearning courses pptx\$Course"
$audioDir = "$pptxDir\audio"
$videoDir = "$pptxDir\videos"
$tempDir = "$pptxDir\_temp_slides"

if (-not (Test-Path $ffmpeg)) {
  Write-Error "ffmpeg not found at: $ffmpeg"
  exit 1
}

if (-not (Test-Path $pptxDir)) {
  Write-Error "Directory not found: $pptxDir"
  exit 1
}

# Create output directories
foreach ($d in @($videoDir, $tempDir)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# Shell for audio duration
$shell = New-Object -ComObject Shell.Application

function Get-AudioDurationSeconds {
  param([string]$FilePath)
  $folder = $shell.Namespace((Split-Path $FilePath))
  $file = $folder.ParseName((Split-Path $FilePath -Leaf))
  $durationStr = $folder.GetDetailsOf($file, 27)
  if ($durationStr -and $durationStr -match '(\d+):(\d+):(\d+)') {
    return ([int]$matches[1] * 3600 + [int]$matches[2] * 60 + [int]$matches[3])
  }
  return 5
}

# Get PPTX files
if ($Lesson) {
  $pptxFiles = @(Get-ChildItem -Path $pptxDir -Filter "$Lesson.pptx")
} else {
  $pptxFiles = Get-ChildItem -Path $pptxDir -Filter "lesson-*.pptx" | Sort-Object Name
}

if ($pptxFiles.Count -eq 0) {
  Write-Error "No PPTX files found."
  exit 1
}

Write-Host ""
Write-Host "Exporting $($pptxFiles.Count) lessons to MP4 (slides + audio -> ffmpeg)"
Write-Host ""

# Launch PowerPoint for slide image export
$ppt = New-Object -ComObject PowerPoint.Application

$exported = 0
$failed = 0

try {
  foreach ($file in $pptxFiles) {
    $videoFile = [System.IO.Path]::ChangeExtension($file.Name, ".mp4")
    $videoPath = Join-Path $videoDir $videoFile

    # Skip if already exported
    if (Test-Path $videoPath) {
      $videoSize = (Get-Item $videoPath).Length
      if ($videoSize -gt 1000000) {
        Write-Host "  [skip] $videoFile - already exists ($([math]::Round($videoSize / 1024 / 1024))MB)"
        $exported++
        continue
      }
    }

    # Extract module/lesson numbers
    if ($file.Name -match 'lesson-(\d+)-(\d+)\.pptx') {
      $mNum = [int]$matches[1]
      $lNum = [int]$matches[2]
    } else { continue }

    Write-Host "  [export] $($file.Name) ..." -NoNewline

    # Create temp directory for this lesson's slide images
    $lessonTempDir = Join-Path $tempDir "$mNum-$lNum"
    if (Test-Path $lessonTempDir) { Remove-Item $lessonTempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $lessonTempDir -Force | Out-Null

    # Export slides as PNG images (1920x1080)
    $pres = $ppt.Presentations.Open($file.FullName, $true, $false, $false)
    $slideCount = $pres.Slides.Count

    try {
      $pres.Export($lessonTempDir, "png", 1920, 1080)
    }
    finally {
      $pres.Close()
    }

    # Build ffmpeg segments: each slide image + matching audio
    $segmentFiles = @()
    $hasError = $false

    for ($s = 0; $s -lt $slideCount; $s++) {
      $slideIdx = $s + 1
      $slideImage = Join-Path $lessonTempDir "Slide$slideIdx.PNG"

      if (-not (Test-Path $slideImage)) {
        Write-Host " [warn] Slide$slideIdx.PNG not found"
        continue
      }

      $audioFile = "m$mNum-l$lNum-s$s.mp3"
      $audioPath = Join-Path $audioDir $audioFile
      $segmentFile = Join-Path $lessonTempDir "segment_$slideIdx.mp4"

      if (Test-Path $audioPath) {
        $duration = Get-AudioDurationSeconds -FilePath $audioPath
        $totalDur = $duration + 1

        # Create video segment: static image + audio
        & $ffmpeg -y -loop 1 -i $slideImage -i $audioPath -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t $totalDur -shortest $segmentFile 2>$null
      } else {
        # Slide without audio: 5 second static image with silent audio
        & $ffmpeg -y -loop 1 -i $slideImage -f lavfi -i "anullsrc=r=44100:cl=stereo" -c:v libx264 -tune stillimage -c:a aac -pix_fmt yuv420p -t 5 $segmentFile 2>$null
      }

      if ($LASTEXITCODE -ne 0) {
        $hasError = $true
        continue
      }

      $segmentFiles += $segmentFile
    }

    if ($segmentFiles.Count -eq 0) {
      Write-Host " FAILED (no segments)"
      $failed++
      continue
    }

    # Write concat file
    $concatFile = Join-Path $lessonTempDir "concat.txt"
    $concatLines = $segmentFiles | ForEach-Object { "file '$($_ -replace "\\","/"  -replace "'","'\''")'" }
    [System.IO.File]::WriteAllLines($concatFile, $concatLines)

    # Concatenate all segments into final video
    & $ffmpeg -y -f concat -safe 0 -i $concatFile -c copy $videoPath 2>$null

    if ((Test-Path $videoPath) -and (Get-Item $videoPath).Length -gt 100000) {
      $finalSizeMB = [math]::Round((Get-Item $videoPath).Length / 1024 / 1024, 1)
      Write-Host "`r  [done] $videoFile (${finalSizeMB}MB, $slideCount slides)              "
      $exported++
    } else {
      Write-Host "`r  [FAILED] $videoFile                                     "
      $failed++
    }

    # Clean up temp segments
    Remove-Item $lessonTempDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
finally {
  $ppt.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($shell) | Out-Null

  # Clean up temp directory
  if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
}

Write-Host ""
Write-Host "Done! Exported: $exported, Failed: $failed"
Write-Host "Output: $videoDir"
Write-Host ""
