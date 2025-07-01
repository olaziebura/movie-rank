-- Add profile_image_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN profile_image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN profiles.profile_image_url IS 'URL or path to user profile image';
