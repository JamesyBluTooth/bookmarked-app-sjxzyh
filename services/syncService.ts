
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { SyncSnapshot } from '@/types/store';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEVICE_ID_KEY = 'bookmarked-device-id';

class SyncService {
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private deviceId: string | null = null;

  async initialize() {
    console.log('Initializing sync service...');
    
    // Get or create device ID
    this.deviceId = await this.getDeviceId();
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured. Sync service will run in offline-only mode.');
      return;
    }

    // Try to restore from Supabase on startup
    await this.restoreFromSupabase();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Listen for network changes
    this.setupNetworkListener();
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `device-${Date.now()}`;
    }
  }

  private async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected === true && networkState.isInternetReachable === true;
    } catch (error) {
      console.error('Error checking network state:', error);
      return false;
    }
  }

  private setupNetworkListener() {
    // Check network status periodically
    setInterval(async () => {
      const online = await this.isOnline();
      if (online && !this.isSyncing) {
        console.log('Network available, attempting sync...');
        await this.syncToSupabase();
      }
    }, 30000); // Check every 30 seconds
  }

  private startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      await this.syncToSupabase();
    }, SYNC_INTERVAL);

    console.log('Periodic sync started');
  }

  async restoreFromSupabase(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping restore');
      return false;
    }

    try {
      console.log('Attempting to restore from Supabase...');
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping restore');
        return false;
      }

      // Check if online
      const online = await this.isOnline();
      if (!online) {
        console.log('Offline, skipping restore');
        return false;
      }

      // Fetch snapshot from Supabase
      const { data, error } = await supabase
        .from('user_snapshots')
        .select('snapshot')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No snapshot found in Supabase');
          return false;
        }
        throw error;
      }

      if (!data || !data.snapshot) {
        console.log('No snapshot data found');
        return false;
      }

      const snapshot: SyncSnapshot = data.snapshot;
      const store = useAppStore.getState();
      const localVersion = store.version;

      // Compare versions - use the most recent
      if (snapshot.version > localVersion) {
        console.log(`Restoring from Supabase (remote version ${snapshot.version} > local version ${localVersion})`);
        
        // Restore state from snapshot
        store.books.forEach(() => store.deleteBook(store.books[0]?.id));
        snapshot.data.books.forEach((book) => store.addBook(book));
        
        store.friends.forEach(() => store.removeFriend(store.friends[0]?.id));
        snapshot.data.friends.forEach((friend) => store.addFriend(friend));
        
        snapshot.data.activities.forEach((activity) => store.addActivity(activity));
        
        store.groups.forEach(() => store.removeGroup(store.groups[0]?.id));
        snapshot.data.groups.forEach((group) => store.addGroup(group));
        
        store.friendRequests.forEach(() => store.removeFriendRequest(store.friendRequests[0]?.id));
        snapshot.data.friendRequests.forEach((request) => store.addFriendRequest(request));
        
        if (snapshot.data.challenge) {
          store.updateChallenge(snapshot.data.challenge);
        }
        
        store.updateUserStats(snapshot.data.userStats);
        store.updateUser(snapshot.data.user);
        store.setLastSyncTimestamp(snapshot.timestamp);
        
        console.log('Successfully restored from Supabase');
        return true;
      } else {
        console.log(`Local version ${localVersion} is up to date (remote version ${snapshot.version})`);
        return false;
      }
    } catch (error) {
      console.error('Error restoring from Supabase:', error);
      return false;
    }
  }

  async syncToSupabase(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping sync');
      return false;
    }

    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return false;
    }

    try {
      this.isSyncing = true;
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping sync');
        return false;
      }

      // Check if online
      const online = await this.isOnline();
      if (!online) {
        console.log('Offline, skipping sync');
        return false;
      }

      const store = useAppStore.getState();
      
      // Create snapshot
      const snapshot: SyncSnapshot = {
        data: {
          books: store.books,
          friends: store.friends,
          activities: store.activities,
          groups: store.groups,
          friendRequests: store.friendRequests,
          challenge: store.challenge,
          userStats: store.userStats,
          user: store.user,
        },
        version: store.version,
        timestamp: Date.now(),
        deviceId: this.deviceId || 'unknown',
      };

      console.log(`Syncing to Supabase (version ${snapshot.version})...`);

      // Upsert snapshot to Supabase
      const { error } = await supabase
        .from('user_snapshots')
        .upsert({
          user_id: user.id,
          snapshot: snapshot,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        throw error;
      }

      store.setLastSyncTimestamp(Date.now());
      console.log('Successfully synced to Supabase');
      return true;
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  async forceSyncNow(): Promise<boolean> {
    console.log('Force sync requested');
    return await this.syncToSupabase();
  }

  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Periodic sync stopped');
    }
  }

  getSyncStatus() {
    const store = useAppStore.getState();
    return {
      lastSyncTimestamp: store.lastSyncTimestamp,
      version: store.version,
      isSyncing: this.isSyncing,
      isConfigured: isSupabaseConfigured(),
    };
  }
}

export const syncService = new SyncService();
