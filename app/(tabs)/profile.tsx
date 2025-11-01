
import { useAppStore } from '@/stores/appStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import React from 'react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  handle: {
    fontSize: 16,
    marginBottom: 8,
  },
  friendCode: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  dangerZone: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  dangerButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncStatus: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default function ProfileScreen() {
  const user = useAppStore((state) => state.user);
  const userStats = useAppStore((state) => state.userStats);
  const resetStore = useAppStore((state) => state.resetStore);
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { lastSyncTime, isSyncing } = useSyncStatus();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isSupabaseConfigured()) {
                console.log('Logging out from Supabase...');
                await supabase.auth.signOut();
              }
              console.log('Logged out successfully');
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your local data. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetStore();
            Alert.alert('Success', 'All data has been reset');
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Supabase Not Configured',
        'Please enable Supabase to use sync features.'
      );
      return;
    }

    try {
      const { syncService } = require('@/services/syncService');
      const success = await syncService.forceSyncNow();
      if (success) {
        Alert.alert('Success', 'Data synced successfully');
      } else {
        Alert.alert('Sync Failed', 'Unable to sync data. Please check your connection.');
      }
    } catch (error) {
      console.error('Force sync error:', error);
      Alert.alert('Error', 'An error occurred during sync');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.handle, { color: theme.textSecondary }]}>{user.handle}</Text>
          <Text style={[styles.friendCode, { color: theme.primary, backgroundColor: theme.card }]}>
            {user.friendCode}
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{userStats.booksRead}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Books</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{userStats.currentStreak}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{userStats.milestones}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Milestones</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {userStats.averageRating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Rating</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
            <IconSymbol name="chart.bar" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Analytics</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
            <IconSymbol name="trophy" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Achievements</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
            <IconSymbol name="gear" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
            <IconSymbol name="bell" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Notifications</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sync Section */}
        {isSupabaseConfigured() && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Sync</Text>
            
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: theme.card }]}
              onPress={handleForceSync}
            >
              <IconSymbol name="arrow.clockwise" size={24} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Force Sync Now</Text>
            </TouchableOpacity>

            <Text style={[styles.syncStatus, { color: theme.textSecondary }]}>
              {isSyncing ? 'Syncing...' : `Last synced: ${lastSyncTime}`}
            </Text>
          </View>
        )}

        {/* Danger Zone */}
        <View style={[styles.dangerZone, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.error }]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: theme.card }]}
            onPress={handleResetData}
          >
            <Text style={[styles.dangerButtonText, { color: theme.error }]}>Reset All Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: theme.error }]}
            onPress={handleLogout}
          >
            <Text style={[styles.dangerButtonText, { color: '#FFFFFF' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
