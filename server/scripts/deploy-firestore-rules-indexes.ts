import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Target Firebase project (thanvish-ai-52bd9)
const targetServiceAccountPath = path.join(
  process.cwd(),
  "thanvish-ai-52bd9-firebase-adminsdk-fbsvc-6facf5ed67.json"
);

// Paths to rules and indexes files
const rulesPath = path.join(process.cwd(), "firestore.rules");
const indexesPath = path.join(process.cwd(), "firestore.indexes.json");

// Get target project ID
if (!fs.existsSync(targetServiceAccountPath)) {
  console.error(`❌ Target service account file not found: ${targetServiceAccountPath}`);
  process.exit(1);
}

const targetServiceAccount = JSON.parse(fs.readFileSync(targetServiceAccountPath, "utf8"));
const targetProjectId = targetServiceAccount.project_id;

// Check if Firebase CLI is installed
function checkFirebaseCLI(): boolean {
  try {
    execSync("firebase --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Deploy Firestore Rules using Firebase CLI
async function deployRules() {
  console.log("\n📋 Deploying Firestore Rules...\n");

  try {
    if (!fs.existsSync(rulesPath)) {
      console.error(`❌ Rules file not found: ${rulesPath}`);
      return false;
    }

    console.log(`Deploying rules to project: ${targetProjectId}`);
    execSync(`firebase deploy --only firestore:rules --project ${targetProjectId}`, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("\n✅ Firestore rules deployed successfully!");
    return true;
  } catch (error: any) {
    console.error("\n❌ Error deploying Firestore rules:", error.message);
    return false;
  }
}

// Deploy Firestore Indexes using Firebase CLI
async function deployIndexes() {
  console.log("\n📊 Deploying Firestore Indexes...\n");

  try {
    if (!fs.existsSync(indexesPath)) {
      console.error(`❌ Indexes file not found: ${indexesPath}`);
      return false;
    }

    console.log(`Deploying indexes to project: ${targetProjectId}`);
    execSync(`firebase deploy --only firestore:indexes --project ${targetProjectId}`, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("\n✅ Firestore indexes deployed successfully!");
    return true;
  } catch (error: any) {
    console.error("\n❌ Error deploying Firestore indexes:", error.message);
    return false;
  }
}

// Main function
async function deployAll() {
  console.log("🚀 Deploying Firestore Rules and Indexes");
  console.log("=".repeat(50));
  console.log(`Target Project: ${targetProjectId}`);
  console.log("=".repeat(50));

  if (!checkFirebaseCLI()) {
    console.error("\n❌ Firebase CLI is not installed!");
    console.log("\n📝 Please install Firebase CLI:");
    console.log("   npm install -g firebase-tools");
    console.log("\n   Then login:");
    console.log("   firebase login");
    console.log("\n   Then run this script again.");
    process.exit(1);
  }

  const rulesSuccess = await deployRules();
  const indexesSuccess = await deployIndexes();

  console.log("\n" + "=".repeat(50));
  console.log("📋 Deployment Summary");
  console.log("=".repeat(50));
  console.log(`Rules deployed: ${rulesSuccess ? "✅ Yes" : "❌ Failed"}`);
  console.log(`Indexes deployed: ${indexesSuccess ? "✅ Yes" : "❌ Failed"}`);
  console.log("=".repeat(50));

  if (rulesSuccess && indexesSuccess) {
    console.log("\n🎉 All Firestore rules and indexes deployed successfully!");
  } else {
    console.log("\n⚠️  Some deployments failed. Please check the errors above.");
    process.exit(1);
  }

  process.exit(0);
}

// Run deployment
deployAll().catch((error) => {
  console.error("❌ Fatal error during deployment:", error);
  process.exit(1);
});

