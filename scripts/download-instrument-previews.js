/**
 * Script to download instrument preview audio files
 * 
 * Usage:
 *   node scripts/download-instrument-previews.js
 * 
 * This script will download audio previews for all instruments.
 * You'll need to provide direct download URLs or use a service that provides them.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instrument preview configuration
const INSTRUMENTS = [
  { value: "sitar", url: null, source: "https://samplefocus.com/tag/sitar" },
  { value: "tabla", url: null, source: "https://samplefocus.com/tag/tabla" },
  { value: "bansuri", url: null, source: "https://samplefocus.com/tag/bansuri" },
  { value: "sarod", url: null, source: "https://freesound.org/search/?q=sarod" },
  { value: "santoor", url: null, source: "https://samplefocus.com/tag/santoor" },
  { value: "shehnai", url: null, source: "https://freesound.org/search/?q=shehnai" },
  { value: "harmonium", url: null, source: "https://samplefocus.com/tag/harmonium" },
  { value: "pakhavaj", url: null, source: "https://freesound.org/search/?q=pakhavaj" },
  { value: "dholak", url: null, source: "https://samplefocus.com/tag/dholak" },
  { value: "sarangi", url: null, source: "https://freesound.org/search/?q=sarangi" },
  { value: "esraj", url: null, source: "https://freesound.org/search/?q=esraj" },
  { value: "dilruba", url: null, source: "https://freesound.org/search/?q=dilruba+instrument" },
  { value: "surmandal", url: null, source: "https://freesound.org/search/?q=surmandal" },
  { value: "swarmandal", url: null, source: "https://freesound.org/search/?q=swarmandal" },
  { value: "rudra_veena", url: null, source: "https://freesound.org/search/?q=rudra+veena" },
  { value: "vichitra_veena", url: null, source: "https://freesound.org/search/?q=vichitra+veena" },
  { value: "surbahar", url: null, source: "https://freesound.org/search/?q=surbahar" },
  { value: "surbahar_sitar", url: null, source: "https://freesound.org/search/?q=surbahar+sitar" },
  { value: "violin", url: null, source: "https://samplefocus.com/tag/violin" },
  { value: "tanpura", url: null, source: "https://samplefocus.com/tag/tanpura" },
  { value: "flute", url: null, source: "https://samplefocus.com/tag/flute" },
  { value: "guitar", url: null, source: "https://samplefocus.com/tag/guitar" },
  { value: "piano", url: null, source: "https://samplefocus.com/tag/piano" },
  { value: "keyboard", url: null, source: "https://freesound.org/search/?q=keyboard+music" },
  { value: "cello", url: null, source: "https://samplefocus.com/tag/cello" },
  { value: "double_bass", url: null, source: "https://samplefocus.com/tag/double-bass" },
];

// Create output directory
const outputDir = path.join(__dirname, '../client/public/audio-previews');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ Created directory: ${outputDir}`);
}

/**
 * Download a file from a URL
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

/**
 * Main download function
 */
async function downloadPreviews() {
  console.log('🎵 Instrument Preview Downloader\n');
  console.log('⚠️  NOTE: This script requires direct download URLs.');
  console.log('   The sources provided are search pages, not direct download links.\n');
  console.log('📋 Options:\n');
  console.log('   1. Manual: Download files manually and place them in:');
  console.log(`      ${outputDir}\n`);
  console.log('   2. Direct URLs: Edit this script and add direct download URLs\n');
  console.log('   3. Use yt-dlp: Download from YouTube (see instructions below)\n');
  
  // Check if any URLs are provided
  const instrumentsWithUrls = INSTRUMENTS.filter(i => i.url);
  
  if (instrumentsWithUrls.length === 0) {
    console.log('❌ No direct download URLs configured.');
    console.log('\n📝 To add URLs, edit this script and add "url" property to each instrument.\n');
    console.log('Example:');
    console.log('  { value: "sitar", url: "https://example.com/sitar.mp3", source: "..." },\n');
    return;
  }
  
  console.log(`📥 Found ${instrumentsWithUrls.length} instruments with download URLs\n`);
  
  for (const instrument of instrumentsWithUrls) {
    const filepath = path.join(outputDir, `${instrument.value}.mp3`);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${instrument.value} (already exists)`);
      continue;
    }
    
    try {
      console.log(`⬇️  Downloading ${instrument.value}...`);
      await downloadFile(instrument.url, filepath);
      console.log(`✅ Downloaded ${instrument.value}`);
    } catch (error) {
      console.error(`❌ Failed to download ${instrument.value}:`, error.message);
    }
  }
  
  console.log('\n✨ Download complete!');
}

// Run the script
downloadPreviews().catch(console.error);

