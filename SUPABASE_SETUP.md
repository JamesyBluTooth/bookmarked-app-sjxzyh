
# Supabase Setup Instructions for Bookmarked

This app uses **Zustand** for state management with **AsyncStorage** for local persistence and **Supabase** for cloud synchronization.

## Features

- ✅ **Offline-First**: All data is stored locally using AsyncStorage
- ✅ **Automatic Sync**: Syncs to Supabase every 5 minutes when online
- ✅ **Conflict Resolution**: Most recent version always wins
- ✅ **Background Sync**: Syncs quietly in the background
- ✅ **Cross-Device**: Sign in on a new device and your data syncs automatically

## How It Works

1. **Local Storage**: All app data (books, friends, activities, etc.) is stored in Zustand and persisted to AsyncStorage
2. **Periodic Sync**: Every 5 minutes, the app compresses and uploads a snapshot to Supabase
3. **On Startup**: The app checks Supabase for an existing snapshot and restores it if newer
4. **Offline Mode**: The app works fully offline; sync resumes when connection is available

## Supabase Setup (Optional)

To enable cloud sync, follow these steps:

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be provisioned

### 2. Create the Database Table

Run this SQL in your Supabase SQL Editor:

\`\`\`sql
-- Create user_snapshots table
CREATE TABLE user_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own snapshots"
  ON user_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
  ON user_snapshots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshots"
  ON user_snapshots
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_snapshots_user_id ON user_snapshots(user_id);
\`\`\`

### 3. Configure Environment Variables

In Natively, press the **Supabase** button and connect to your project. This will automatically set:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

You can find these in your Supabase project settings under **API**.

### 4. Enable Authentication (Optional)

If you want user authentication:

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable your preferred auth method (Email, Google, etc.)
3. Implement sign-in in your app using `supabase.auth.signInWithPassword()` or other methods

## Usage

### Without Supabase

The app works perfectly without Supabase! All data is stored locally and persists between sessions.

### With Supabase

Once configured, the app will:

- Automatically sync your data to the cloud every 5 minutes
- Restore your data when you sign in on a new device
- Handle conflicts by using the most recent version
- Continue working offline and sync when connection returns

### Manual Sync

You can force a sync at any time:

1. Go to the **Profile** tab
2. Scroll to **Sync Status**
3. Tap **Force Sync Now**

## Data Structure

The app stores the following in Zustand:

- **Books**: Your library with progress, notes, and ratings
- **Friends**: Your reading friends and their activity
- **Activities**: Social feed of reading milestones
- **Groups**: Reading circles you've joined
- **Friend Requests**: Pending friend requests
- **Challenge**: Your daily reading challenge
- **User Stats**: Books read, streak, milestones, etc.
- **User Profile**: Name, handle, avatar, friend code

## Troubleshooting

### Sync Not Working

1. Check that Supabase is configured (Profile > Sync Status)
2. Ensure you're signed in to Supabase
3. Check your internet connection
4. Try forcing a manual sync

### Data Not Restoring on New Device

1. Make sure you're signed in with the same Supabase account
2. Check that the previous device successfully synced (check last sync time)
3. Try forcing a sync on the old device first

### Reset Data

If you need to start fresh:

1. Go to **Profile** tab
2. Scroll to **Danger Zone**
3. Tap **Reset All Data**

This will clear all local data. Your Supabase snapshot will remain until you sync again.

## Architecture

- **State Management**: Zustand with middleware
- **Local Persistence**: AsyncStorage via Zustand persist middleware
- **Cloud Sync**: Supabase with JSONB storage
- **Conflict Resolution**: Version-based (highest version wins)
- **Network Detection**: expo-network for online/offline detection
- **Sync Interval**: 5 minutes (configurable in `services/syncService.ts`)

## Security

- All Supabase requests are authenticated
- Row Level Security (RLS) ensures users can only access their own data
- Snapshots are stored as JSONB for efficient querying
- No sensitive data is logged

## Performance

- Local operations are instant (no network delay)
- Sync happens in the background (non-blocking)
- Only one snapshot per user (keeps database clean)
- Compressed JSON for efficient storage

---

**Note**: This app is designed to work offline-first. Supabase is optional and only adds cloud backup and cross-device sync capabilities.
