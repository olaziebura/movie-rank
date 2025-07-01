# Database Migration Instructions

## Adding profile_image_url Column

To fix the "Could not find the 'profile_image_url' column" error, you need to run the SQL migration:

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the contents of `sql/add_profile_image_url.sql`

### Option 2: Supabase CLI (if available)
```bash
supabase db push
```

### Option 3: Manual SQL Execution
Connect to your Supabase database and run:

```sql
-- Add profile_image_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN profile_image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN profiles.profile_image_url IS 'URL or path to user profile image';
```

## Verification

After running the migration, the profile updates should work without errors. The app includes fallback logic to handle missing columns gracefully, but for full functionality, the column must be added to the database.

## Rollback (if needed)

To remove the column:
```sql
ALTER TABLE profiles DROP COLUMN profile_image_url;
```
