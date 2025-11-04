
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/appStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { syncService } from '@/services/syncService';
import TopBar from '@/components/TopBar';

export default function ProfileScreen() {
  const user = useAppStore((state) => state.user);
  const userStats = useAppStore((state) => state.userStats);
  const resetStore = useAppStore((state) => state.resetStore);
  const updateUser = useAppStore((state) => state.updateUser);
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const { lastSyncTime, isSyncing } = useSyncStatus();
  const router = useRouter();
  const [friendCode, setFriendCode] = useState(user.friendCode);

  const loadFriendCode = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('friend_code')
        .eq('user_id', authUser.id)
        .single();

      if (profile?.friend_code) {
        setFriendCode(profile.friend_code);
        updateUser({ friendCode: profile.friend_code });
      }
    } catch (error) {
      console.error('Error loading friend code:', error);
    }
  }, [updateUser]);

  useEffect(() => {
    loadFriendCode();
  }, [loadFriendCode]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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
    ]);
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

  const renderAvatar = () => {
    if (user.avatarUrl) {
      return <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />;
    }

    return (
      <View
        style={[
          styles.avatarFallback,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <IconSymbol name="person.fill" size={50} color={theme.textSecondary} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <TopBar />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {renderAvatar()}
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.handle, { color: theme.textSecondary }]}>{user.handle}</Text>
          <View
            style={[
              styles.friendCodeContainer,
              { backgroundColor: theme.card, borderColor: theme.primary },
            ]}
          >
            <Text style={[styles.friendCodeLabel, { color: theme.textSecondary }]}>
              Friend Code
            </Text>
            <Text style={[styles.friendCode, { color: theme.primary }]}>{friendCode}</Text>
          </View>
        </View>

        {/* Stats */}
        <View
          style={[
            styles.statsContainer,
            {
              backgroundColor: isDark ? theme.card : '#FFFFFF',
              borderColor: isDark ? theme.border : '#E0E0E0',
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {userStats.booksRead}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Books</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {userStats.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {userStats.milestones}
            </Text>
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

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: isDark ? theme.card : '#FFFFFF',
                borderColor: isDark ? theme.border : '#E0E0E0',
              },
            ]}
          >
            <IconSymbol name="chart.bar" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Analytics</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: isDark ? theme.card : '#FFFFFF',
                borderColor: isDark ? theme.border : '#E0E0E0',
              },
            ]}
          >
            <IconSymbol name="trophy" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Achievements</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: isDark ? theme.card : '#FFFFFF',
                borderColor: isDark ? theme.border : '#E0E0E0',
              },
            ]}
          >
            <IconSymbol name="gear" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: isDark ? theme.card : '#FFFFFF',
                borderColor: isDark ? theme.border : '#E0E0E0',
              },
            ]}
          >
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
              style={[
                styles.menuItem,
                {
                  backgroundColor: isDark ? theme.card : '#FFFFFF',
                  borderColor: isDark ? theme.border : '#E0E0E0',
                },
              ]}
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
            style={[
              styles.dangerButton,
              {
                backgroundColor: isDark ? theme.card : '#FFFFFF',
                borderColor: isDark ? theme.border : '#E0E0E0',
              },
            ]}
            onPress={handleResetData}
          >
            <Text style={[styles.dangerButtonText, { color: theme.error }]}>
              Reset All Data
            </Text>
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
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  handle: {
    fontSize: 16,
    marginBottom: 12,
  },
  friendCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  friendCodeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  friendCode: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 2,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
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
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
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
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
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
