# Quick Start: Download Instrument Previews

## 🚀 Fastest Method: FreeSound.org API (Already Configured!)

The FreeSound API credentials are already configured in the script!

### Step 1: Install Dependencies
```bash
npm install axios
```

### Step 2: Download All Previews
```bash
npm run download-previews
```

That's it! All 26 files will be downloaded automatically.

### Optional: Override Credentials
If you need to use different credentials:
```bash
# Windows (PowerShell)
$env:FREESOUND_CLIENT_ID="your-client-id"
$env:FREESOUND_CLIENT_SECRET="your-client-secret"
npm run download-previews

# Linux/Mac
export FREESOUND_CLIENT_ID="your-client-id"
export FREESOUND_CLIENT_SECRET="your-client-secret"
npm run download-previews
```

---

## 🎬 Alternative: YouTube (yt-dlp)

### Step 1: Install Tools
```bash
# Install yt-dlp
pip install yt-dlp

# Install ffmpeg
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: apt-get install ffmpeg
```

### Step 2: Run Script
```bash
# Windows (PowerShell)
.\scripts\download-previews-ytdlp.ps1

# Linux/Mac
chmod +x scripts/download-previews-ytdlp.sh
./scripts/download-previews-ytdlp.sh
```

---

## 📋 Manual Method

If automated methods don't work:

1. Visit each source URL from the list
2. Download a 5-10 second sample
3. Save to `client/public/audio-previews/[instrument-name].mp3`

See `download-previews-manual.md` for detailed instructions.

---

## ✅ Verify Installation

After downloading, check that all files exist:

```bash
# Windows (PowerShell)
Get-ChildItem client\public\audio-previews\*.mp3 | Measure-Object | Select-Object -ExpandProperty Count

# Linux/Mac
ls client/public/audio-previews/*.mp3 | wc -l
```

You should have 26 MP3 files.

---

## 🎵 Files Needed

All files should be in: `client/public/audio-previews/`

- sitar.mp3, tabla.mp3, bansuri.mp3, sarod.mp3, santoor.mp3
- shehnai.mp3, harmonium.mp3, pakhavaj.mp3, dholak.mp3, sarangi.mp3
- esraj.mp3, dilruba.mp3, surmandal.mp3, swarmandal.mp3
- rudra_veena.mp3, vichitra_veena.mp3, surbahar.mp3, surbahar_sitar.mp3
- violin.mp3, tanpura.mp3, flute.mp3, guitar.mp3, piano.mp3
- keyboard.mp3, cello.mp3, double_bass.mp3

