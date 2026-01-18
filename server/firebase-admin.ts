import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin SDK
try {
  // Check if already initialized
  if (admin.apps.length > 0) {
    console.log("Firebase Admin SDK already initialized");
  } else {
    // Option 1: Try to load from service account JSON file
    // Try multiple possible filenames (prioritize new project)
    const possiblePaths = [
      path.join(process.cwd(), "thanvish-ai-52bd9-firebase-adminsdk-fbsvc-6facf5ed67.json"),
      path.join(process.cwd(), "thanvishmusic-firebase-adminsdk-fbsvc-589edaa25b.json"),
      path.join(process.cwd(), "thanvishmusic-firebase-adminsdk-fbsvc-5fcff680e0.json"),
      path.join(process.cwd(), "firebase-adminsdk.json"),
    ];
    
    let serviceAccountPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        serviceAccountPath = possiblePath;
        break;
      }
    }
    
    if (serviceAccountPath) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      // Use .firebasestorage.app format (matches client config) or .appspot.com as fallback
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
                           `${serviceAccount.project_id}.firebasestorage.app`;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucket,
      });
      console.log(`Firebase Admin SDK initialized from service account file: ${path.basename(serviceAccountPath)}`);
      console.log(`Firebase Storage Bucket: ${storageBucket}`);
    } else {
      // Option 2: Use service account JSON from environment variable
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
                             `${serviceAccount.project_id}.firebasestorage.app`;
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: storageBucket,
        });
        console.log("Firebase Admin SDK initialized from environment variable");
        console.log(`Firebase Storage Bucket: ${storageBucket}`);
      } else {
        // Option 3: Use application default credentials (for production environments like Google Cloud)
        const projectId = process.env.FIREBASE_PROJECT_ID || "thanvish-ai-52bd9";
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
                             `${projectId}.firebasestorage.app`;
        
        admin.initializeApp({
          projectId,
          storageBucket: storageBucket,
        });
        
        console.warn("Firebase Admin: Using application default credentials. For production, use service account JSON file or FIREBASE_SERVICE_ACCOUNT environment variable.");
        console.log(`Firebase Storage Bucket: ${storageBucket}`);
      }
    }
  }
} catch (error: any) {
  // If error is "already initialized", that's okay
  if (error.code === "app/already-initialized" || error.message?.includes("already initialized")) {
    console.log("Firebase Admin SDK already initialized");
  } else {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

export { admin };
export default admin;

