import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as crypto from "crypto";

// Source Firebase project (thanvishmusic)
const sourceServiceAccountPath = path.join(
  process.cwd(),
  "thanvishmusic-firebase-adminsdk-fbsvc-589edaa25b.json"
);

// Target Firebase project (thanvish-ai-52bd9)
const targetServiceAccountPath = path.join(
  process.cwd(),
  "thanvish-ai-52bd9-firebase-adminsdk-fbsvc-6facf5ed67.json"
);

// Get project IDs
if (!fs.existsSync(sourceServiceAccountPath)) {
  console.error(`❌ Source service account file not found: ${sourceServiceAccountPath}`);
  process.exit(1);
}

if (!fs.existsSync(targetServiceAccountPath)) {
  console.error(`❌ Target service account file not found: ${targetServiceAccountPath}`);
  process.exit(1);
}

const sourceServiceAccount = JSON.parse(fs.readFileSync(sourceServiceAccountPath, "utf8"));
const targetServiceAccount = JSON.parse(fs.readFileSync(targetServiceAccountPath, "utf8"));

const sourceProjectId = sourceServiceAccount.project_id;
const targetProjectId = targetServiceAccount.project_id;

// Helper function to convert base64 to base64url
function base64urlEncode(str: string): string {
  return str
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Initialize source Firebase Admin SDK
const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(sourceServiceAccount),
  },
  "source"
);

// Check if Firebase CLI is installed
function checkFirebaseCLI(): boolean {
  try {
    execSync("firebase --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Get access token from service account using JWT
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Create JWT header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  // Create JWT claim set
  const claimSet = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  // Encode header and claim set (base64 then convert to base64url)
  const encodedHeader = base64urlEncode(
    Buffer.from(JSON.stringify(header)).toString("base64")
  );
  const encodedClaimSet = base64urlEncode(
    Buffer.from(JSON.stringify(claimSet)).toString("base64")
  );
  
  // Create signature
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;
  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signatureInput), privateKey);
  const encodedSignature = base64urlEncode(signature.toString("base64"));

  // Create JWT
  const jwt = `${encodedHeader}.${encodedClaimSet}.${encodedSignature}`;

  // Exchange JWT for access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Fetch all indexes from source project using REST API
async function fetchIndexesFromSource(): Promise<string | null> {
  console.log("\n📥 Fetching indexes from source project...\n");
  console.log(`Source Project: ${sourceProjectId}\n`);

  try {
    // Get access token
    console.log("Getting access token...");
    const accessToken = await getAccessToken(sourceServiceAccount);

    // Try using Firebase Management API first
    // The correct endpoint for Firestore indexes
    let url = `https://firestore.googleapis.com/v1/projects/${sourceProjectId}/databases/(default)/indexes`;
    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // If that fails, try alternative endpoint format
    if (!response.ok && response.status === 404) {
      console.log("Trying alternative API endpoint...");
      // Try using the Firestore Admin API with different format
      url = `https://firestore.googleapis.com/v1/projects/${sourceProjectId}/databases/-/indexes`;
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    }

    if (!response.ok) {
      // If API fails, try using Firebase CLI or local file
      console.log("⚠️  API request failed, trying Firebase CLI method...");
      
      // Try using Firebase CLI to get indexes
      try {
        console.log("Attempting to use Firebase CLI to fetch indexes...");
        // Switch to source project temporarily
        const output = execSync(
          `firebase firestore:indexes --project ${sourceProjectId} 2>&1`,
          { encoding: "utf8", cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }
        );
        
        // Try to parse the output as JSON
        try {
          const indexesData = JSON.parse(output.trim());
          if (indexesData.indexes) {
            console.log(`✅ Found ${indexesData.indexes.length} indexes via Firebase CLI`);
            const tempDir = path.join(process.cwd(), ".temp-firestore-export");
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }
            const tempIndexesPath = path.join(tempDir, "firestore.indexes.json");
            fs.writeFileSync(tempIndexesPath, JSON.stringify(indexesData, null, 2));
            return tempIndexesPath;
          }
        } catch {
          // Output is not JSON, continue to local file fallback
        }
      } catch (cliError: any) {
        console.log("⚠️  Firebase CLI method also failed, using local file...");
      }
      
      // Final fallback: use local file
      const localIndexesPath = path.join(process.cwd(), "firestore.indexes.json");
      if (fs.existsSync(localIndexesPath)) {
        console.log("📋 Using local firestore.indexes.json file as fallback");
        const indexesContent = fs.readFileSync(localIndexesPath, "utf8");
        const tempDir = path.join(process.cwd(), ".temp-firestore-export");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempIndexesPath = path.join(tempDir, "firestore.indexes.json");
        fs.writeFileSync(tempIndexesPath, indexesContent);
        return tempIndexesPath;
      }
      
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    const indexes = data.indexes || [];

    if (indexes.length === 0) {
      console.log("⚠️  No indexes found in source project");
      return null;
    }

    console.log(`✅ Found ${indexes.length} indexes in source project`);

    // Convert to firestore.indexes.json format
    const indexesConfig = {
      indexes: indexes.map((index: any) => {
        const fields = (index.fields || []).map((field: any) => {
          const fieldConfig: any = {
            fieldPath: field.fieldPath,
          };

          if (field.order) {
            fieldConfig.order = field.order === "ASCENDING" ? "ASCENDING" : "DESCENDING";
          } else if (field.arrayConfig) {
            fieldConfig.arrayConfig = field.arrayConfig === "CONTAINS" ? "CONTAINS" : undefined;
          }

          return fieldConfig;
        });

        return {
          collectionGroup: index.collectionId || index.collectionGroup || "unknown",
          queryScope: index.queryScope || "COLLECTION",
          fields: fields,
        };
      }),
      fieldOverrides: [],
    };

    // Save to temporary file
    const tempDir = path.join(process.cwd(), ".temp-firestore-export");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempIndexesPath = path.join(tempDir, "firestore.indexes.json");
    fs.writeFileSync(tempIndexesPath, JSON.stringify(indexesConfig, null, 2));

    console.log(`✅ Indexes saved to temporary file`);
    return tempIndexesPath;
  } catch (error: any) {
    console.error("❌ Error fetching indexes:", error.message);
    return null;
  }
}

// Deploy indexes to target project
async function deployIndexesToTarget(indexesPath: string | null) {
  console.log("\n📤 Deploying indexes to target project...\n");
  console.log(`Target Project: ${targetProjectId}\n`);

  if (!indexesPath || !fs.existsSync(indexesPath)) {
    console.error("❌ Indexes file not found");
    return false;
  }

  try {
    // Read the indexes file
    const indexesContent = fs.readFileSync(indexesPath, "utf8");
    const indexesData = JSON.parse(indexesContent);

    console.log(`📋 Found ${indexesData.indexes?.length || 0} indexes to deploy`);

    // Write to the local firestore.indexes.json (temporarily)
    const localIndexesPath = path.join(process.cwd(), "firestore.indexes.json");
    const originalIndexes = fs.existsSync(localIndexesPath)
      ? fs.readFileSync(localIndexesPath, "utf8")
      : null;

    // Write the fetched indexes
    fs.writeFileSync(localIndexesPath, indexesContent);

    try {
      console.log("Deploying indexes using Firebase CLI...");
      execSync(`firebase deploy --only firestore:indexes --project ${targetProjectId}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      console.log("\n✅ Indexes deployed successfully!");

      // Keep the new indexes file (don't restore original)
      // This way the indexes from source are now in the local file
      console.log("💾 Updated local firestore.indexes.json with source indexes");

      return true;
    } catch (error: any) {
      // Restore original file on error
      if (originalIndexes) {
        fs.writeFileSync(localIndexesPath, originalIndexes);
      }
      throw error;
    }
  } catch (error: any) {
    console.error("\n❌ Error deploying indexes:", error.message);
    return false;
  }
}

// Main function
async function migrateIndexes() {
  console.log("🚀 Migrating Firestore Indexes");
  console.log("=".repeat(50));
  console.log(`Source: ${sourceProjectId}`);
  console.log(`Target: ${targetProjectId}`);
  console.log("=".repeat(50));

  if (!checkFirebaseCLI()) {
    console.error("\n❌ Firebase CLI is not installed!");
    console.log("\n📝 Please install Firebase CLI:");
    console.log("   npm install -g firebase-tools");
    console.log("   firebase login");
    process.exit(1);
  }

  // Fetch indexes from source project
  let indexesPath = await fetchIndexesFromSource();

  // If API/CLI methods fail, use local file
  if (!indexesPath) {
    console.log("\n📋 Attempting to use local firestore.indexes.json file...");
    const localIndexesPath = path.join(process.cwd(), "firestore.indexes.json");
    if (fs.existsSync(localIndexesPath)) {
      console.log("✅ Found local firestore.indexes.json file");
      const tempDir = path.join(process.cwd(), ".temp-firestore-export");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      indexesPath = path.join(tempDir, "firestore.indexes.json");
      fs.copyFileSync(localIndexesPath, indexesPath);
    } else {
      console.error("\n❌ Could not fetch indexes from source project");
      console.log("\n💡 Options:");
      console.log("   1. Ensure firestore.indexes.json exists in the project root");
      console.log("   2. Manually deploy indexes using:");
      console.log(`      firebase deploy --only firestore:indexes --project ${targetProjectId}`);
      console.log("   3. Export indexes from source project first:");
      console.log(`      firebase firestore:indexes --project ${sourceProjectId} > firestore.indexes.json`);
      process.exit(1);
    }
  }

  const success = await deployIndexesToTarget(indexesPath);

  // Cleanup temp directory
  const tempDir = path.join(process.cwd(), ".temp-firestore-export");
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  // Cleanup Firebase Admin SDK
  await sourceApp.delete();

  console.log("\n" + "=".repeat(50));
  if (success) {
    console.log("🎉 Indexes migration completed successfully!");
  } else {
    console.log("❌ Indexes migration failed");
    process.exit(1);
  }
  console.log("=".repeat(50));
}

// Run migration
migrateIndexes().catch((error) => {
  console.error("❌ Fatal error during migration:", error);
  process.exit(1);
});
