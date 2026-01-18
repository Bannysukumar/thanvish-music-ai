import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

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

// Initialize source Firebase Admin SDK
if (!fs.existsSync(sourceServiceAccountPath)) {
  console.error(`❌ Source service account file not found: ${sourceServiceAccountPath}`);
  process.exit(1);
}

const sourceServiceAccount = JSON.parse(fs.readFileSync(sourceServiceAccountPath, "utf8"));
const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(sourceServiceAccount),
  },
  "source"
);

// Initialize target Firebase Admin SDK
if (!fs.existsSync(targetServiceAccountPath)) {
  console.error(`❌ Target service account file not found: ${targetServiceAccountPath}`);
  process.exit(1);
}

const targetServiceAccount = JSON.parse(fs.readFileSync(targetServiceAccountPath, "utf8"));
const targetApp = admin.initializeApp(
  {
    credential: admin.credential.cert(targetServiceAccount),
  },
  "target"
);

const sourceAuth = admin.auth(sourceApp);
const sourceDb = admin.firestore(sourceApp);
const sourceStorage = admin.storage(sourceApp);

const targetAuth = admin.auth(targetApp);
const targetDb = admin.firestore(targetApp);
const targetStorage = admin.storage(targetApp);

interface MigrationStats {
  collections: number;
  documents: number;
  users: number;
  storageFiles: number;
  errors: number;
}

const stats: MigrationStats = {
  collections: 0,
  documents: 0,
  users: 0,
  storageFiles: 0,
  errors: 0,
};

// Helper function to convert Firestore timestamp to plain object
function convertTimestamps(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof admin.firestore.Timestamp) {
    return admin.firestore.Timestamp.fromMillis(data.toMillis());
  }

  if (data instanceof admin.firestore.FieldValue) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }

  if (typeof data === "object") {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }

  return data;
}

// Migrate Firestore collections
async function migrateFirestore() {
  console.log("\n📦 Starting Firestore migration...\n");

  try {
    // Get all collections from source
    const collections = await sourceDb.listCollections();
    console.log(`Found ${collections.length} collections to migrate\n`);

    for (const collection of collections) {
      const collectionName = collection.id;
      console.log(`📁 Migrating collection: ${collectionName}`);

      try {
        // Get all documents in the collection
        const snapshot = await collection.get();
        let batchCount = 0;
        const BATCH_SIZE = 500; // Firestore batch limit
        let currentBatch = targetDb.batch();

        for (const doc of snapshot.docs) {
          const data = convertTimestamps(doc.data());
          const docRef = targetDb.collection(collectionName).doc(doc.id);
          currentBatch.set(docRef, data);
          batchCount++;
          stats.documents++;

          // Commit batch if it reaches the limit
          if (batchCount >= BATCH_SIZE) {
            await currentBatch.commit();
            console.log(`  ✓ Migrated ${batchCount} documents`);
            batchCount = 0;
            currentBatch = targetDb.batch();
          }
        }

        // Commit remaining documents
        if (batchCount > 0) {
          await currentBatch.commit();
          console.log(`  ✓ Migrated ${batchCount} documents`);
        }

        // Handle subcollections
        for (const doc of snapshot.docs) {
          const subcollections = await doc.ref.listCollections();
          for (const subcollection of subcollections) {
            const subcollectionPath = `${collectionName}/${doc.id}/${subcollection.id}`;
            console.log(`  📁 Migrating subcollection: ${subcollectionPath}`);

            const subSnapshot = await subcollection.get();
            let subBatchCount = 0;
            let currentSubBatch = targetDb.batch();

            for (const subDoc of subSnapshot.docs) {
              const subData = convertTimestamps(subDoc.data());
              const subDocRef = targetDb
                .collection(collectionName)
                .doc(doc.id)
                .collection(subcollection.id)
                .doc(subDoc.id);
              currentSubBatch.set(subDocRef, subData);
              subBatchCount++;
              stats.documents++;

              if (subBatchCount >= BATCH_SIZE) {
                await currentSubBatch.commit();
                subBatchCount = 0;
                currentSubBatch = targetDb.batch();
              }
            }

            if (subBatchCount > 0) {
              await currentSubBatch.commit();
            }

            console.log(`  ✓ Migrated ${subSnapshot.size} documents from subcollection`);
          }
        }

        stats.collections++;
        console.log(`✅ Completed collection: ${collectionName}\n`);
      } catch (error: any) {
        console.error(`❌ Error migrating collection ${collectionName}:`, error.message);
        stats.errors++;
      }
    }

    console.log(`\n✅ Firestore migration completed!`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Documents: ${stats.documents}`);
  } catch (error: any) {
    console.error("❌ Error during Firestore migration:", error);
    stats.errors++;
  }
}

// Migrate Firebase Auth users
async function migrateAuthUsers() {
  console.log("\n👥 Starting Firebase Auth migration...\n");

  try {
    let nextPageToken: string | undefined;
    let totalUsers = 0;

    do {
      const listUsersResult = await sourceAuth.listUsers(1000, nextPageToken);
      nextPageToken = listUsersResult.pageToken;

      for (const userRecord of listUsersResult.users) {
        try {
          // Create user in target project
          const newUser = await targetAuth.createUser({
            uid: userRecord.uid,
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            phoneNumber: userRecord.phoneNumber,
            password: undefined, // Cannot migrate passwords
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            disabled: userRecord.disabled,
            metadata: {
              creationTime: userRecord.metadata.creationTime,
              lastSignInTime: userRecord.metadata.lastSignInTime,
            },
            customClaims: userRecord.customClaims,
            providerData: userRecord.providerData.map((provider) => ({
              uid: provider.uid,
              email: provider.email,
              displayName: provider.displayName,
              photoURL: provider.photoURL,
              providerId: provider.providerId,
            })),
          });

          stats.users++;
          totalUsers++;
          if (totalUsers % 100 === 0) {
            console.log(`  ✓ Migrated ${totalUsers} users...`);
          }
        } catch (error: any) {
          if (error.code === "auth/uid-already-exists") {
            console.log(`  ⚠️  User ${userRecord.uid} already exists, skipping...`);
          } else {
            console.error(`  ❌ Error migrating user ${userRecord.uid}:`, error.message);
            stats.errors++;
          }
        }
      }
    } while (nextPageToken);

    console.log(`\n✅ Auth migration completed!`);
    console.log(`   Users migrated: ${stats.users}`);
  } catch (error: any) {
    console.error("❌ Error during Auth migration:", error);
    stats.errors++;
  }
}

// Migrate Firebase Storage files
async function migrateStorage() {
  console.log("\n📦 Starting Firebase Storage migration...\n");

  try {
    const sourceBucket = sourceStorage.bucket();
    const targetBucket = targetStorage.bucket();

    // Check if buckets exist
    try {
      const [sourceExists] = await sourceBucket.exists();
      if (!sourceExists) {
        console.log("⚠️  Source bucket does not exist, skipping storage migration");
        return;
      }
    } catch (error: any) {
      console.log("⚠️  Could not access source bucket, skipping storage migration:", error.message);
      return;
    }

    // List all files in source bucket
    let files: any[] = [];
    try {
      const [fileList] = await sourceBucket.getFiles();
      files = fileList;
    } catch (error: any) {
      console.log("⚠️  Could not list files from source bucket:", error.message);
      return;
    }

    if (files.length === 0) {
      console.log("ℹ️  No files found in source bucket, skipping storage migration");
      return;
    }

    console.log(`Found ${files.length} files to migrate\n`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`  📄 Migrating: ${file.name} (${i + 1}/${files.length})`);

        // Download file from source
        const [sourceFileBuffer] = await file.download();

        // Get file metadata
        const [metadata] = await file.getMetadata();

        // Upload to target bucket
        const targetFile = targetBucket.file(file.name);
        await targetFile.save(sourceFileBuffer, {
          metadata: {
            contentType: metadata.contentType,
            metadata: metadata.metadata,
            cacheControl: metadata.cacheControl,
          },
        });

        stats.storageFiles++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ Migrated ${i + 1}/${files.length} files...`);
        }
      } catch (error: any) {
        if (error.code === 404) {
          console.log(`  ⚠️  File ${file.name} not found in source, skipping...`);
        } else {
          console.error(`  ❌ Error migrating file ${file.name}:`, error.message);
          stats.errors++;
        }
      }
    }

    console.log(`\n✅ Storage migration completed!`);
    console.log(`   Files migrated: ${stats.storageFiles}`);
  } catch (error: any) {
    console.error("❌ Error during Storage migration:", error);
    stats.errors++;
  }
}

// Main migration function
async function migrateAll() {
  console.log("🚀 Starting Firebase Data Migration");
  console.log("=".repeat(50));
  console.log(`Source: ${sourceServiceAccount.project_id}`);
  console.log(`Target: ${targetServiceAccount.project_id}`);
  console.log("=".repeat(50));

  const startTime = Date.now();

  // Migrate in order: Firestore, Auth, Storage
  await migrateFirestore();
  await migrateAuthUsers();
  await migrateStorage();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Migration Summary");
  console.log("=".repeat(50));
  console.log(`Collections migrated: ${stats.collections}`);
  console.log(`Documents migrated: ${stats.documents}`);
  console.log(`Users migrated: ${stats.users}`);
  console.log(`Storage files migrated: ${stats.storageFiles}`);
  console.log(`Errors encountered: ${stats.errors}`);
  console.log(`Total time: ${duration} seconds`);
  console.log("=".repeat(50));

  // Cleanup
  await sourceApp.delete();
  await targetApp.delete();

  process.exit(stats.errors > 0 ? 1 : 0);
}

// Run migration
migrateAll().catch((error) => {
  console.error("❌ Fatal error during migration:", error);
  process.exit(1);
});

