# PowerShell script to download instrument previews using yt-dlp
# 
# Prerequisites:
#   1. Install yt-dlp: pip install yt-dlp
#   2. Install ffmpeg: choco install ffmpeg (or download from https://ffmpeg.org)
#
# Usage:
#   .\scripts\download-previews-ytdlp.ps1

$OUTPUT_DIR = "client\public\audio-previews"
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

# YouTube search terms for each instrument
$INSTRUMENTS = @{
    "sitar" = "indian classical sitar solo"
    "tabla" = "tabla solo performance"
    "bansuri" = "bansuri flute indian classical"
    "sarod" = "sarod indian classical"
    "santoor" = "santoor indian classical"
    "shehnai" = "shehnai indian classical"
    "harmonium" = "harmonium indian classical"
    "pakhavaj" = "pakhavaj indian classical"
    "dholak" = "dholak indian classical"
    "sarangi" = "sarangi indian classical"
    "violin" = "indian classical violin"
    "tanpura" = "tanpura drone"
    "flute" = "indian classical flute"
    "guitar" = "acoustic guitar solo"
    "piano" = "piano solo"
    "cello" = "cello solo"
}

Write-Host "🎵 Downloading instrument previews using yt-dlp" -ForegroundColor Cyan
Write-Host "⚠️  This will search YouTube and download short clips" -ForegroundColor Yellow
Write-Host ""

foreach ($instrument in $INSTRUMENTS.Keys) {
    $searchTerm = $INSTRUMENTS[$instrument]
    $outputFile = Join-Path $OUTPUT_DIR "$instrument.mp3"
    
    if (Test-Path $outputFile) {
        Write-Host "⏭️  Skipping $instrument (already exists)" -ForegroundColor Gray
        continue
    }
    
    Write-Host "⬇️  Downloading $instrument..." -ForegroundColor Green
    
    # Search and download first result, extract 5-10 seconds
    $ytSearch = "ytsearch1:$searchTerm"
    
    yt-dlp `
        --extract-audio `
        --audio-format mp3 `
        --audio-quality 128K `
        --postprocessor-args "ffmpeg:-ss 0 -t 8" `
        --output $outputFile `
        $ytSearch 2>$null
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outputFile)) {
        Write-Host "✅ Downloaded $instrument" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to download $instrument" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Download complete!" -ForegroundColor Cyan

