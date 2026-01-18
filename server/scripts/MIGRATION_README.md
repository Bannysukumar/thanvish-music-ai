# Firebase Data Migration Script

This script migrates all data from one Firebase project to another, including:
- **Firestore** collections and documents (including subcollections)
- **Firebase Auth** users (with metadata, custom claims, and provider data)
- **Firebase Storage** files

## Prerequisites

1. Both Firebase service account JSON files must be present in the project root:
   - `thanvishmusic-firebase-adminsdk-fbsvc-589edaa25b.json` (source)
   - `thanvish-ai-52bd9-firebase-adminsdk-fbsvc-6facf5ed67.json` (target)

2. Both service accounts must have the following permissions:
   - **Firestore**: Read access on source, Write access on target
   - **Firebase Auth**: Read access on source, Write access on target
   - **Firebase Storage**: Read access on source, Write access on target

## Usage

Run the migration script using npm:

```bash
npm run migrate-firebase
```

Or directly with tsx:

```bash
tsx server/scripts/migrate-firebase-data.ts
```

## What Gets Migrated

### Firestore
- All top-level collections
- All documents within each collection
- All subcollections (e.g., `users/{userId}/compositions`)
- Document metadata (timestamps, field values)

### Firebase Auth
- User accounts (UID, email, phone, display name, photo URL)
- Email verification status
- User metadata (creation time, last sign in)
- Custom claims
- Provider data (OAuth providers)
- **Note**: Passwords cannot be migrated for security reasons. Users will need to reset their passwords.

### Firebase Storage
- All files in the default storage bucket
- File metadata (content type, custom metadata, cache control)

## Important Notes

1. **Passwords**: User passwords cannot be migrated. Users will need to use "Forgot Password" to reset their passwords after migration.

2. **UID Preservation**: The script preserves user UIDs, which means:
   - Users will have the same UID in the target project
   - Firestore documents referencing user UIDs will remain valid

3. **Batch Processing**: 
   - Firestore documents are migrated in batches of 500 (Firestore limit)
   - Large collections may take significant time

4. **Storage**: 
   - Large files may take time to migrate
   - Ensure you have sufficient bandwidth and storage quota

5. **Errors**: 
   - The script will continue even if individual items fail
   - A summary of errors will be shown at the end
   - Check the console output for specific error messages

## Migration Process

The script runs migrations in this order:
1. **Firestore** - All collections and documents
2. **Firebase Auth** - All user accounts
3. **Firebase Storage** - All files

## Output

The script provides detailed progress information:
- Collection names being migrated
- Document counts
- User counts
- File names and progress
- Final summary with statistics

## Troubleshooting

### "Service account file not found"
- Ensure both JSON files are in the project root directory
- Check file names match exactly

### "Permission denied" errors
- Verify service account permissions in Firebase Console
- Ensure IAM roles are correctly assigned

### "UID already exists" warnings
- This is normal if running the script multiple times
- The script will skip existing users

### Storage migration fails
- Check that both projects have Storage enabled
- Verify bucket names and permissions
- Large files may timeout - consider migrating in smaller batches

## After Migration

1. **Deploy Firestore Rules and Indexes**: 
   ```bash
   npm run deploy-rules-indexes
   ```
   Or manually:
   ```bash
   firebase deploy --only firestore --project thanvish-ai-52bd9
   ```

2. **Update Firebase Configuration**: Update your client-side Firebase config to point to the new project
3. **Update Environment Variables**: Change `VITE_FIREBASE_PROJECT_ID` and related env vars
4. **Test Authentication**: Verify users can log in (they'll need to reset passwords)
5. **Verify Data**: Check that all collections and files were migrated correctly

## Deploying Rules and Indexes

After migrating data, you need to deploy Firestore rules and indexes to the target project:

### Using the Script (Recommended)
```bash
npm run deploy-rules-indexes
```

### Using Firebase CLI Directly
```bash
# Deploy both rules and indexes
firebase deploy --only firestore --project thanvish-ai-52bd9

# Or deploy separately
firebase deploy --only firestore:rules --project thanvish-ai-52bd9
firebase deploy --only firestore:indexes --project thanvish-ai-52bd9
```

### Prerequisites for Deployment
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Ensure you have permissions to deploy to the target project

