import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(process.cwd(), "thanvishmusic-firebase-adminsdk-fbsvc-5fcff680e0.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK initialized");
} else {
  console.error("Service account file not found!");
  process.exit(1);
}

async function createAdminUser() {
  try {
    const email = "bannysukumar@gmail.com";
    const password = "bannysukumar@gmail.com";

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true,
    });

    console.log("✅ User created in Firebase Authentication:", userRecord.uid);

    // Store admin role in Firestore
    const adminDb = admin.firestore();
    await adminDb.collection("admins").doc(userRecord.uid).set({
      email: email,
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Admin role assigned in Firestore");
    console.log("\n🎉 Admin user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      console.log("⚠️  User already exists. Updating admin role...");
      
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail("bannysukumar@gmail.com");
      
      // Update admin role in Firestore
      const adminDb = admin.firestore();
      await adminDb.collection("admins").doc(userRecord.uid).set({
        email: "bannysukumar@gmail.com",
        isAdmin: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Update password if needed
      await admin.auth().updateUser(userRecord.uid, {
        password: "bannysukumar@gmail.com",
      });

      console.log("✅ Admin role updated!");
      console.log(`   Email: bannysukumar@gmail.com`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Password: bannysukumar@gmail.com`);
      
      process.exit(0);
    } else {
      console.error("❌ Error creating admin user:", error);
      process.exit(1);
    }
  }
}

createAdminUser();

