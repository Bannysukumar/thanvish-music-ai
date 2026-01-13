#!/bin/bash

# Script to download instrument previews using yt-dlp
# This script downloads short audio clips from YouTube for each instrument
# 
# Prerequisites:
#   1. Install yt-dlp: pip install yt-dlp (or brew install yt-dlp)
#   2. Install ffmpeg: brew install ffmpeg (or apt-get install ffmpeg)
#
# Usage:
#   chmod +x scripts/download-previews-ytdlp.sh
#   ./scripts/download-previews-ytdlp.sh

OUTPUT_DIR="client/public/audio-previews"
mkdir -p "$OUTPUT_DIR"

# YouTube search terms for each instrument (you'll need to find good videos)
declare -A INSTRUMENTS=(
    ["sitar"]="indian classical sitar solo"
    ["tabla"]="tabla solo performance"
    ["bansuri"]="bansuri flute indian classical"
    ["sarod"]="sarod indian classical"
    ["santoor"]="santoor indian classical"
    ["shehnai"]="shehnai indian classical"
    ["harmonium"]="harmonium indian classical"
    ["pakhavaj"]="pakhavaj indian classical"
    ["dholak"]="dholak indian classical"
    ["sarangi"]="sarangi indian classical"
    ["violin"]="indian classical violin"
    ["tanpura"]="tanpura drone"
    ["flute"]="indian classical flute"
    ["guitar"]="acoustic guitar solo"
    ["piano"]="piano solo"
    ["cello"]="cello solo"
)

echo "🎵 Downloading instrument previews using yt-dlp"
echo "⚠️  This will search YouTube and download short clips"
echo ""

for instrument in "${!INSTRUMENTS[@]}"; do
    search_term="${INSTRUMENTS[$instrument]}"
    output_file="$OUTPUT_DIR/${instrument}.mp3"
    
    if [ -f "$output_file" ]; then
        echo "⏭️  Skipping $instrument (already exists)"
        continue
    fi
    
    echo "⬇️  Downloading $instrument..."
    
    # Search and download first result, extract 5-10 seconds
    yt-dlp \
        --extract-audio \
        --audio-format mp3 \
        --audio-quality 128K \
        --postprocessor-args "ffmpeg:-ss 0 -t 8" \
        --output "$output_file" \
        "ytsearch1:${search_term}" 2>/dev/null
    
    if [ $? -eq 0 ] && [ -f "$output_file" ]; then
        echo "✅ Downloaded $instrument"
    else
        echo "❌ Failed to download $instrument"
    fi
done

echo ""
echo "✨ Download complete!"

