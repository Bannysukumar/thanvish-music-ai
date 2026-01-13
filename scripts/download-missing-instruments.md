# Missing Instrument Previews

## Status: 23/26 Downloaded ✅

### Still Missing (3 files):
1. **shehnai.mp3** - Indian oboe/wind instrument
2. **rudra_veena.mp3** - Ancient Indian string instrument
3. **vichitra_veena.mp3** - Slide veena

## Manual Download Options

### Option 1: FreeSound.org Manual Search
1. Go to https://freesound.org
2. Search for each missing instrument
3. Download a 5-10 second sample
4. Save to `client/public/audio-previews/` with exact filename

### Option 2: Use Similar Instruments
For now, you can use placeholder files or similar instruments:
- **shehnai** → Use a generic wind instrument or oboe sound
- **rudra_veena** → Use veena.mp3 (if you have one) or sitar.mp3
- **vichitra_veena** → Use veena.mp3 (if you have one) or sitar.mp3

### Option 3: YouTube Download
Use yt-dlp to download from YouTube:
```bash
# Install yt-dlp first
pip install yt-dlp

# Download shehnai
yt-dlp --extract-audio --audio-format mp3 --postprocessor-args "ffmpeg:-ss 0 -t 8" -o "client/public/audio-previews/shehnai.mp3" "ytsearch1:shehnai indian classical"

# Download rudra veena
yt-dlp --extract-audio --audio-format mp3 --postprocessor-args "ffmpeg:-ss 0 -t 8" -o "client/public/audio-previews/rudra_veena.mp3" "ytsearch1:rudra veena indian classical"

# Download vichitra veena
yt-dlp --extract-audio --audio-format mp3 --postprocessor-args "ffmpeg:-ss 0 -t 8" -o "client/public/audio-previews/vichitra_veena.mp3" "ytsearch1:vichitra veena indian classical"
```

### Option 4: Create Placeholder Files
If you can't find exact matches, you can:
1. Use similar instruments temporarily
2. Create silent 5-second MP3 files as placeholders
3. Replace them later when you find better samples

## Current Status
✅ 23 files successfully downloaded
⚠️ 3 files need manual download or alternative sources

