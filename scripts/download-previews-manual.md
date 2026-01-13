# Manual Download Instructions for Instrument Previews

## Option 1: Using FreeSound.org (Recommended for Free Samples)

FreeSound.org provides free audio samples. Here's how to download in bulk:

### Step 1: Create FreeSound Account
1. Go to https://freesound.org
2. Sign up for a free account
3. Get your API key from https://freesound.org/apiv2/apply/

### Step 2: Use FreeSound API Script

```bash
# Install dependencies
npm install axios

# Run the script (after adding your API key)
node scripts/download-freesound-previews.js
```

### Step 3: Manual Download from FreeSound
1. Visit each search URL
2. Click on a sample
3. Click "Download" (requires login)
4. Save as `[instrument-name].mp3` in `client/public/audio-previews/`

## Option 2: Using SampleFocus.com

SampleFocus requires account and may have download limits:

1. Visit each tag URL: https://samplefocus.com/tag/[instrument]
2. Browse samples
3. Download preview or full sample
4. Trim to 5-10 seconds using audio editor
5. Save as `[instrument-name].mp3`

## Option 3: Using YouTube with yt-dlp

```bash
# Install yt-dlp
pip install yt-dlp
# or
brew install yt-dlp

# Install ffmpeg
brew install ffmpeg
# or
apt-get install ffmpeg

# Run the script
chmod +x scripts/download-previews-ytdlp.sh
./scripts/download-previews-ytdlp.sh
```

## Option 4: Using curl/wget with Direct URLs

If you have direct download URLs:

```bash
# Create directory
mkdir -p client/public/audio-previews

# Download each file
cd client/public/audio-previews

# Example downloads (replace with actual URLs)
curl -L -o sitar.mp3 "https://example.com/sitar-preview.mp3"
curl -L -o tabla.mp3 "https://example.com/tabla-preview.mp3"
# ... repeat for all instruments
```

## Option 5: Batch Download Script

Create a file `download-urls.txt` with one URL per line:

```
https://example.com/sitar.mp3
https://example.com/tabla.mp3
...
```

Then run:

```bash
cd client/public/audio-previews
wget -i ../../../download-urls.txt
```

## Required Files

Place all files in: `client/public/audio-previews/`

Required filenames:
- sitar.mp3
- tabla.mp3
- bansuri.mp3
- sarod.mp3
- santoor.mp3
- shehnai.mp3
- harmonium.mp3
- pakhavaj.mp3
- dholak.mp3
- sarangi.mp3
- esraj.mp3
- dilruba.mp3
- surmandal.mp3
- swarmandal.mp3
- rudra_veena.mp3
- vichitra_veena.mp3
- surbahar.mp3
- surbahar_sitar.mp3
- violin.mp3
- tanpura.mp3
- flute.mp3
- guitar.mp3
- piano.mp3
- keyboard.mp3
- cello.mp3
- double_bass.mp3

## Audio Requirements

- Format: MP3
- Duration: 5-10 seconds
- Quality: 128kbps or higher
- Sample Rate: 44.1kHz recommended

