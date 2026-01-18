import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Service account file path
const serviceAccountPath = path.join(
  process.cwd(),
  "thanvish-ai-52bd9-firebase-adminsdk-fbsvc-6facf5ed67.json"
);

console.log("🔍 Verifying Firebase Service Account...\n");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account file not found: ${serviceAccountPath}`);
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  console.log("✅ Service account file found");
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}\n`);

  // Initialize Firebase Admin SDK
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  }, "verify");

  console.log("✅ Firebase Admin SDK initialized\n");

  // Test Firestore access
  try {
    const db = admin.firestore(app);
    const testRef = db.collection("_test").doc("connection");
    await testRef.set({ test: true, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    await testRef.delete();
    console.log("✅ Firestore access verified");
  } catch (error: any) {
    console.log(`⚠️  Firestore access test: ${error.message}`);
  }

  // Test Auth access
  try {
    const auth = admin.auth(app);
    const listUsersResult = await auth.listUsers(1);
    console.log("✅ Firebase Auth access verified");
    console.log(`   Found ${listUsersResult.users.length} user(s) in test query`);
  } catch (error: any) {
    console.log(`⚠️  Firebase Auth access test: ${error.message}`);
  }

  // Test Storage access
  try {
    const storage = admin.storage(app);
    const bucket = storage.bucket();
    const [exists] = await bucket.exists();
    if (exists) {
      console.log("✅ Firebase Storage access verified");
      console.log(`   Bucket: ${bucket.name}`);
    } else {
      console.log("⚠️  Storage bucket does not exist");
    }
  } catch (error: any) {
    console.log(`⚠️  Firebase Storage access test: ${error.message}`);
  }

  // Cleanup
  await app.delete();

  console.log("\n🎉 Service account verification completed!");
  console.log("\n📋 Summary:");
  console.log("   ✅ Service account file is valid");
  console.log("   ✅ Firebase Admin SDK can initialize");
  console.log("   ✅ Ready to use in your application\n");

} catch (error: any) {
  console.error("\n❌ Error verifying service account:", error.message);
  process.exit(1);
}

