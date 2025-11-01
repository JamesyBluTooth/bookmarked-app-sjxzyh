
# Supabase Setup for Bookmarked

This document contains the SQL commands needed to set up your Supabase database for the Bookmarked app.

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the following SQL commands

## Database Schema

### 1. User Profiles Table

This table stores user profile information and onboarding status.

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  bio TEXT,
  favorite_genres TEXT[],
  profile_picture_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_handle_idx ON public.user_profiles(handle);
```

### 2. User Snapshots Table

This table stores compressed snapshots of user data for sync functionality.

```sql
-- Create user_snapshots table
CREATE TABLE IF NOT EXISTS public.user_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own snapshot"
  ON public.user_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshot"
  ON public.user_snapshots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshot"
  ON public.user_snapshots
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_snapshots_user_id_idx ON public.user_snapshots(user_id);
```

### 3. Updated At Trigger

This trigger automatically updates the `updated_at` timestamp.

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

## Email Configuration

### Enable Email Confirmation (Recommended)

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable "Enable email confirmations"
3. Customize the email templates if desired

### Disable Email Confirmation (For Testing)

1. Go to Authentication > Settings in your Supabase dashboard
2. Disable "Enable email confirmations"
3. Users will be automatically logged in after signup

## Environment Variables

Add the following to your `.env` file or Expo environment configuration:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

## Testing

After running the SQL commands:

1. Test signup with a new email
2. Check your email for the confirmation link (if email confirmation is enabled)
3. Test login with the confirmed account
4. Complete the onboarding flow
5. Verify that the data is stored in Supabase

## Troubleshooting

### Email not sending

- Check your Supabase email settings
- Verify that email confirmation is enabled
- Check the Supabase logs for errors

### Authentication errors

- Verify that your environment variables are correct
- Check that RLS policies are properly configured
- Review the Supabase logs for detailed error messages

### Sync not working

- Ensure the user_snapshots table is created
- Verify that the user is authenticated
- Check network connectivity
- Review the app logs for sync errors
