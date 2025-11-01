
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import TopBar from '@/components/TopBar';
import { useAppStore } from '@/stores/appStore';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ProfileScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  // Get data from Zustand store
  const user = useAppStore((state) => state.user);
  const userStats = useAppStore((state) => state.userStats);
  const resetStore = useAppStore((state) => state.resetStore);

  // Get sync status
  const syncStatus = useSyncStatus();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your data is saved locally and will sync when you log back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('User logged out');
            Alert.alert('Logged Out', 'You have been logged out successfully.');
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetStore();
            Alert.alert('Data Reset', 'All your data has been reset.');
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Supabase Not Configured',
        'Please enable Supabase by pressing the Supabase button and connecting to your project to enable cloud sync.'
      );
      return;
    }

    Alert.alert('Syncing...', 'Forcing sync with Supabase...');
    const success = await syncStatus.forceSyncNow();
    if (success) {
      Alert.alert('Sync Complete', 'Your data has been synced successfully!');
    } else {
      Alert.alert('Sync Failed', 'Failed to sync data. Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          Platform.OS !== 'ios' && styles.contentWithTabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileHeader, { backgroundColor: theme.card }]}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.handle, { color: theme.textSecondary }]}>{user.handle}</Text>
          <View style={[styles.friendCodeBadge, { backgroundColor: theme.background }]}>
            <Text style={[styles.friendCodeLabel, { color: theme.textSecondary }]}>
              Friend Code
            </Text>
            <Text style={[styles.friendCode, { color: theme.primary }]}>{user.friendCode}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Statistics</Text>
          <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {userStats.booksRead}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Books Read
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {userStats.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {userStats.milestones}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Milestones
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {userStats.averageRating.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Avg Rating
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sync Status</Text>
          <View style={[styles.syncCard, { backgroundColor: theme.card }]}>
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={[styles.syncLabel, { color: theme.textSecondary }]}>
                  Supabase Status
                </Text>
                <Text style={[styles.syncValue, { color: theme.text }]}>
                  {syncStatus.isConfigured ? 'Connected' : 'Not Configured'}
                </Text>
              </View>
              <View style={[
                styles.syncIndicator,
                { backgroundColor: syncStatus.isConfigured ? '#4ECDC4' : theme.textSecondary }
              ]} />
            </View>
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={[styles.syncLabel, { color: theme.textSecondary }]}>
                  Last Sync
                </Text>
                <Text style={[styles.syncValue, { color: theme.text }]}>
                  {syncStatus.lastSyncText}
                </Text>
              </View>
              {syncStatus.isSyncing && (
                <IconSymbol name="arrow.clockwise" size={20} color={theme.primary} />
              )}
            </View>
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={[styles.syncLabel, { color: theme.textSecondary }]}>
                  Data Version
                </Text>
                <Text style={[styles.syncValue, { color: theme.text }]}>
                  v{syncStatus.version}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: theme.primary }]}
              onPress={handleForceSync}
              activeOpacity={0.8}
            >
              <IconSymbol name="arrow.clockwise" size={20} color="#FFFFFF" />
              <Text style={styles.syncButtonText}>Force Sync Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={() => console.log('Analytics pressed')}
            activeOpacity={0.7}
          >
            <IconSymbol name="chart.bar.fill" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Reading Analytics</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={() => console.log('Achievements pressed')}
            activeOpacity={0.7}
          >
            <IconSymbol name="trophy.fill" size={24} color="#FFD93D" />
            <Text style={[styles.menuText, { color: theme.text }]}>Achievements</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={() => console.log('Settings pressed')}
            activeOpacity={0.7}
          >
            <IconSymbol name="gear" size={24} color={theme.textSecondary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Settings</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={() => console.log('Notifications pressed')}
            activeOpacity={0.7}
          >
            <IconSymbol name="bell.fill" size={24} color={theme.primary} />
            <Text style={[styles.menuText, { color: theme.text }]}>Notifications</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FF6B6B' }]}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <IconSymbol name="trash.fill" size={24} color="#FF6B6B" />
            <Text style={[styles.menuText, { color: '#FF6B6B' }]}>Reset All Data</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.right.square.fill" size={24} color="#FF6B6B" />
            <Text style={[styles.menuText, { color: '#FF6B6B' }]}>Logout</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 20,
  },
  contentWithTabBar: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 18,
    marginBottom: 24,
    boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  handle: {
    fontSize: 16,
    marginBottom: 16,
  },
  friendCodeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  friendCodeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  friendCode: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsCard: {
    padding: 16,
    borderRadius: 18,
    boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  syncCard: {
    padding: 16,
    borderRadius: 18,
    boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncInfo: {
    flex: 1,
  },
  syncLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  syncValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  syncIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
