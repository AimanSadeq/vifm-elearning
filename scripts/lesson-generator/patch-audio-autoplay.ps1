<#
.SYNOPSIS
  Patches PPTX files to add audio autoplay timing using .NET ZipArchive.
  Uses the exact XML structure proven to work in CAIFL course.

.USAGE
  powershell -ExecutionPolicy Bypass -File scripts/lesson-generator/patch-audio-autoplay.ps1 -Course capa
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$Course,

  [string]$Lesson = ""
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$pptxDir = "C:\Projects\elearning courses pptx\$Course"
$audioDir = "$pptxDir\audio"

if (-not (Test-Path $pptxDir)) {
  Write-Error "Directory not found: $pptxDir"
  exit 1
}

function Get-AudioDurationMs {
  param([string]$AudioPath)
  # Read MP3 header to estimate duration (simplified: use file size / bitrate)
  # For accurate results we'd need a proper MP3 parser, but for timing XML
  # we use 0 (indefinite) which works fine for autoplay
  return 0
}

function Build-TimingXml {
  param([string]$Spid, [int]$DurationMs)

  $dur = if ($DurationMs -gt 0) { $DurationMs.ToString() } else { "indefinite" }

  return @"
<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst><p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="5" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="afterEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="6" dur="$dur" fill="hold"/><p:tgtEl><p:spTgt spid="$Spid"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq><p:audio><p:cMediaNode vol="80000" showWhenStopped="0"><p:cTn id="7" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:endCondLst><p:cond evt="onStopAudio" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:endCondLst></p:cTn><p:tgtEl><p:spTgt spid="$Spid"/></p:tgtEl></p:cMediaNode></p:audio></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>
"@
}

function Find-AudioShapeId {
  param([string]$SlideXml)

  if (-not $SlideXml.Contains('ppaction://media')) { return $null }

  # Split on <p:pic and find the block with media action
  $blocks = $SlideXml -split '<p:pic\b'
  for ($i = 1; $i -lt $blocks.Count; $i++) {
    if ($blocks[$i].Contains('ppaction://media')) {
      if ($blocks[$i] -match '<p:cNvPr\s+id="(\d+)"') {
        return $matches[1]
      }
    }
  }
  return $null
}

function Patch-PptxFile {
  param([string]$PptxPath)

  $patchedCount = 0
  $slideCount = 0

  # Open ZIP archive in Update mode
  $zip = [System.IO.Compression.ZipFile]::Open($PptxPath, [System.IO.Compression.ZipArchiveMode]::Update)

  try {
    # Find slide entries
    $slideEntries = $zip.Entries | Where-Object { $_.FullName -match '^ppt/slides/slide\d+\.xml$' }
    $slideCount = @($slideEntries).Count

    foreach ($entry in $slideEntries) {
      # Read slide XML
      $stream = $entry.Open()
      $reader = New-Object System.IO.StreamReader($stream)
      $xml = $reader.ReadToEnd()
      $reader.Close()
      $stream.Close()

      # Find audio shape
      $spid = Find-AudioShapeId -SlideXml $xml
      if (-not $spid) { continue }

      # Skip if already has timing
      if ($xml.Contains('<p:timing')) { continue }

      # Build timing XML
      $timingXml = Build-TimingXml -Spid $spid -DurationMs 0

      # Inject before </p:sld>
      $xml = $xml.Replace('</p:sld>', "$timingXml</p:sld>")

      # Write back
      $stream = $entry.Open()
      $stream.SetLength(0)  # Clear existing content
      $writer = New-Object System.IO.StreamWriter($stream, [System.Text.Encoding]::UTF8)
      $writer.Write($xml)
      $writer.Flush()
      $writer.Close()
      $stream.Close()

      $patchedCount++
    }
  }
  finally {
    $zip.Dispose()
  }

  return @{ Patched = $patchedCount; Total = $slideCount }
}

# ── Main ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "PPTX Audio Autoplay Patcher (.NET ZipArchive)"
Write-Host ""

# Get PPTX files
if ($Lesson) {
  $pptxFiles = @($Lesson)
} else {
  $pptxFiles = Get-ChildItem -Path $pptxDir -Filter "lesson-*.pptx" | Sort-Object Name | Select-Object -ExpandProperty Name
}

if ($pptxFiles.Count -eq 0) {
  Write-Error "No PPTX files found."
  exit 1
}

$totalPatched = 0
$totalSlides = 0

foreach ($file in $pptxFiles) {
  $filePath = Join-Path $pptxDir $file
  if (-not (Test-Path $filePath)) {
    Write-Host "  [skip] $file - not found"
    continue
  }

  $result = Patch-PptxFile -PptxPath $filePath
  $totalPatched += $result.Patched
  $totalSlides += $result.Total

  if ($result.Patched -gt 0) {
    Write-Host "  [patched] $file - $($result.Patched)/$($result.Total) slides with autoplay"
  } else {
    Write-Host "  [skip] $file - no audio or already patched"
  }
}

Write-Host ""
Write-Host "Done! Patched $totalPatched/$totalSlides slides across $($pptxFiles.Count) files."
Write-Host "   Output: $pptxDir"
Write-Host ""
