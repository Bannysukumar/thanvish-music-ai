# Instrument Preview Download Scripts

This directory contains scripts to help download instrument preview audio files.

## Quick Start

### Option 1: FreeSound.org (Recommended - Free & Legal)

```bash
# 1. Get API key from https://freesound.org/apiv2/apply/
# 2. Install axios
npm install axios

# 3. Set API key and run
export FREESOUND_API_KEY="your-api-key-here"
node scripts/download-freesound-previews.js
```

### Option 2: YouTube (Using yt-dlp)

```bash
# 1. Install yt-dlp and ffmpeg
pip install yt-dlp
brew install ffmpeg  # or apt-get install ffmpeg

# 2. Make script executable and run
chmod +x scripts/download-previews-ytdlp.sh
./scripts/download-previews-ytdlp.sh
```

### Option 3: Manual Download

See `download-previews-manual.md` for detailed instructions.

## Scripts Overview

- **download-freesound-previews.js** - Automated download from FreeSound.org API
- **download-previews-ytdlp.sh** - Download from YouTube using yt-dlp
- **download-instrument-previews.js** - Generic downloader (requires direct URLs)
- **download-previews-manual.md** - Manual download instructions

## Output Location

All files will be saved to: `client/public/audio-previews/`

## Required Files

The following 26 files are needed:
- sitar.mp3, tabla.mp3, bansuri.mp3, sarod.mp3, santoor.mp3
- shehnai.mp3, harmonium.mp3, pakhavaj.mp3, dholak.mp3, sarangi.mp3
- esraj.mp3, dilruba.mp3, surmandal.mp3, swarmandal.mp3
- rudra_veena.mp3, vichitra_veena.mp3, surbahar.mp3, surbahar_sitar.mp3
- violin.mp3, tanpura.mp3, flute.mp3, guitar.mp3, piano.mp3
- keyboard.mp3, cello.mp3, double_bass.mp3

## Audio Requirements

- Format: MP3
- Duration: 5-10 seconds
- Quality: 128kbps or higher
- Sample Rate: 44.1kHz recommended

