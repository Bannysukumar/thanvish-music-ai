/**
 * Download instrument previews from FreeSound.org using their API
 * 
 * Prerequisites:
 *   1. Install axios: npm install axios
 * 
 * Usage:
 *   npm run download-previews
 * 
 * Or with custom credentials:
 *   FREESOUND_CLIENT_ID=your-id FREESOUND_CLIENT_SECRET=your-secret npm run download-previews
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
// Note: Install axios first: npm install axios
// Using dynamic import to handle optional dependency

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FreeSound API Credentials (can be overridden with environment variables)
// Note: FreeSound supports both Token and OAuth2 authentication
// If you have an API Token, use FREESOUND_API_TOKEN
// If you have Client ID/Secret, use FREESOUND_CLIENT_ID and FREESOUND_CLIENT_SECRET
const API_TOKEN = process.env.FREESOUND_API_TOKEN || process.env.FREESOUND_CLIENT_SECRET || '7AyLnIdW2xoXaa7gCRE7SMNHDut71oYfo0RUWhsX';
const CLIENT_ID = process.env.FREESOUND_CLIENT_ID || 'TsYmpKNCanWb8oqhStu4';
const CLIENT_SECRET = process.env.FREESOUND_CLIENT_SECRET || '7AyLnIdW2xoXaa7gCRE7SMNHDut71oYfo0RUWhsX';
const REDIRECT_URI = process.env.FREESOUND_REDIRECT_URI || 'http://localhost:5000';

const OUTPUT_DIR = path.join(__dirname, '../client/public/audio-previews');
let ACCESS_TOKEN = null;
let USE_OAUTH2 = false;

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Instrument search terms for FreeSound
// Some instruments have alternative search terms to find better matches
const INSTRUMENTS = [
  { value: "sitar", search: "sitar" },
  { value: "tabla", search: "tabla" },
  { value: "bansuri", search: "bansuri", alternatives: ["indian flute", "bamboo flute"] },
  { value: "sarod", search: "sarod" },
  { value: "santoor", search: "santoor" },
  { value: "shehnai", search: "shehnai", alternatives: ["indian oboe", "nadaswaram"] },
  { value: "harmonium", search: "harmonium" },
  { value: "pakhavaj", search: "pakhavaj", alternatives: ["mridangam", "indian drum"] },
  { value: "dholak", search: "dholak" },
  { value: "sarangi", search: "sarangi" },
  { value: "esraj", search: "esraj", alternatives: ["dilruba", "indian string"] },
  { value: "dilruba", search: "dilruba" },
  { value: "surmandal", search: "surmandal" },
  { value: "swarmandal", search: "swarmandal" },
  { value: "rudra_veena", search: "rudra veena", alternatives: ["veena", "indian veena"] },
  { value: "vichitra_veena", search: "vichitra veena", alternatives: ["veena", "indian veena"] },
  { value: "surbahar", search: "surbahar", alternatives: ["bass sitar", "sitar"] },
  { value: "surbahar_sitar", search: "surbahar sitar", alternatives: ["bass sitar", "sitar"] },
  { value: "violin", search: "violin" },
  { value: "tanpura", search: "tanpura" },
  { value: "flute", search: "flute" },
  { value: "guitar", search: "guitar" },
  { value: "piano", search: "piano" },
  { value: "keyboard", search: "keyboard" },
  { value: "cello", search: "cello" },
  { value: "double_bass", search: "double bass" },
  // Carnatic Instruments
  { value: "veena", search: "veena carnatic", alternatives: ["veena", "indian veena", "saraswati veena"] },
  { value: "mridangam", search: "mridangam", alternatives: ["mridangam carnatic", "indian drum"] },
  { value: "ghatam", search: "ghatam", alternatives: ["ghatam carnatic", "clay pot"] },
  { value: "kanjira", search: "kanjira", alternatives: ["kanjira carnatic", "frame drum"] },
  { value: "morsing", search: "morsing", alternatives: ["jaw harp", "jew's harp", "morsing carnatic"] },
  { value: "nadaswaram", search: "nadaswaram", alternatives: ["nadaswaram carnatic", "indian oboe", "shehnai"] },
  { value: "thavil", search: "thavil", alternatives: ["thavil carnatic", "indian drum"] },
  { value: "gottuvadhyam", search: "gottuvadhyam", alternatives: ["chitravina", "gottuvadyam", "veena"] },
  { value: "venu", search: "venu", alternatives: ["carnatic flute", "bamboo flute", "indian flute"] },
  { value: "nagaswaram", search: "nagaswaram", alternatives: ["nadaswaram", "indian oboe"] },
  { value: "tavil", search: "tavil", alternatives: ["thavil", "indian drum"] },
  { value: "udukkai", search: "udukkai", alternatives: ["udukkai carnatic", "hourglass drum"] },
  { value: "pambai", search: "pambai", alternatives: ["pambai carnatic", "indian drum"] },
];

/**
 * Get OAuth2 access token using client credentials
 * FreeSound API uses OAuth2 with client credentials flow
 */
async function getAccessToken() {
  try {
    const axios = (await import('axios')).default;
    
    // FreeSound API requires form-urlencoded format
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');
    
    const response = await axios.post(
      'https://freesound.org/apiv2/oauth2/access_token/',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      return response.data.access_token;
    }
    throw new Error('No access token received');
  } catch (error) {
    if (error.response) {
      console.error('Error getting access token:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Error getting access token:', error.message);
    }
    throw error;
  }
}

/**
 * Search FreeSound for instrument samples
 */
async function searchFreeSound(query, accessToken) {
  try {
    const axios = (await import('axios')).default;
    
    // Use Bearer token for OAuth2, or Token for API key
    const authHeader = USE_OAUTH2 ? `Bearer ${accessToken}` : `Token ${accessToken}`;
    
    const response = await axios.get('https://freesound.org/apiv2/search/text/', {
      params: {
        query: query,
        fields: 'id,name,previews',
        page_size: 5, // Get more results to find good matches
        filter: 'duration:[5 TO 10]', // 5-10 second clips
        sort: 'rating_desc', // Sort by rating to get best quality
      },
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (response.data.results && response.data.results.length > 0) {
      // Return the first result (highest rated)
      return response.data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Error searching for ${query}:`, error.response?.data || error.message);
    return null;
  }
}

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
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

async function downloadPreviews() {
  console.log('🎵 Downloading instrument previews from FreeSound.org\n');
  console.log('🔐 Authenticating with FreeSound API...\n');

  // Try OAuth2 first, fallback to Token authentication
  try {
    // Try OAuth2 authentication
    ACCESS_TOKEN = await getAccessToken();
    USE_OAUTH2 = true;
    console.log('✅ OAuth2 authentication successful!\n');
  } catch (oauthError) {
    console.log('⚠️  OAuth2 authentication failed, trying Token authentication...\n');
    
    // Fallback to Token authentication (simpler, uses API key directly)
    if (API_TOKEN) {
      ACCESS_TOKEN = API_TOKEN;
      USE_OAUTH2 = false;
      console.log('✅ Using Token authentication\n');
    } else {
      console.error('❌ Failed to authenticate with FreeSound API!');
      console.error('   OAuth2 failed and no API token found.\n');
      console.log('📝 Options:');
      console.log('   1. Use Token auth: Set FREESOUND_API_TOKEN="your-token"');
      console.log('   2. Use OAuth2: Set FREESOUND_CLIENT_ID and FREESOUND_CLIENT_SECRET');
      console.log('   3. Get API token from: https://freesound.org/apiv2/apply/\n');
      process.exit(1);
    }
  }

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const instrument of INSTRUMENTS) {
    const filepath = path.join(OUTPUT_DIR, `${instrument.value}.mp3`);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${instrument.value} (already exists)`);
      skipCount++;
      continue;
    }

    try {
      console.log(`🔍 Searching for ${instrument.value}...`);
      let result = await searchFreeSound(instrument.search, ACCESS_TOKEN);
      
      // Try alternative search terms if first search fails
      if (!result && instrument.alternatives) {
        for (const altSearch of instrument.alternatives) {
          console.log(`   Trying alternative: ${altSearch}...`);
          result = await searchFreeSound(altSearch, ACCESS_TOKEN);
          if (result) break;
        }
      }
      
      if (!result || !result.previews) {
        console.log(`⚠️  No preview found for ${instrument.value}`);
        failCount++;
        continue;
      }

      // Try different preview quality levels
      const previewUrl = result.previews['preview-hq-mp3'] || 
                        result.previews['preview-mp3'] || 
                        result.previews['preview-lq-mp3'];
      
      if (!previewUrl) {
        console.log(`⚠️  No preview URL available for ${instrument.value}`);
        failCount++;
        continue;
      }

      console.log(`⬇️  Downloading ${instrument.value} from "${result.name}"...`);
      
      await downloadFile(previewUrl, filepath);
      console.log(`✅ Downloaded ${instrument.value}\n`);
      successCount++;
      
      // Rate limiting - be nice to the API (1 second between requests)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to download ${instrument.value}:`, error.message);
      failCount++;
    }
  }

  console.log('\n✨ Download complete!');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Files saved to: ${OUTPUT_DIR}\n`);
}

downloadPreviews().catch(console.error);

