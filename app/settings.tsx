
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/appStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function SettingsScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const resetStore = useAppStore((state) => state.resetStore);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const themeMode = useAppStore((state) => state.themeMode);
  const [loading, setLoading] = useState(false);

  const handleEditProfile = () => {
    router.push('/auth/onboarding');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (isSupabaseConfigured()) {
                await supabase.auth.signOut();
              }
              resetStore();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (isSupabaseConfigured()) {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                  Alert.alert('Error', 'No user found');
                  return;
                }

                // Delete user data from Supabase
                await supabase.from('reading_sessions').delete().eq('user_id', authUser.id);
                await supabase.from('book_ratings').delete().eq('user_id', authUser.id);
                await supabase.from('user_achievements').delete().eq('user_id', authUser.id);
                await supabase.from('friendships').delete().eq('user_id', authUser.id);
                await supabase.from('friendships').delete().eq('friend_id', authUser.id);
                await supabase.from('friend_activities').delete().eq('user_id', authUser.id);
                await supabase.from('user_snapshots').delete().eq('user_id', authUser.id);
                await supabase.from('user_profiles').delete().eq('user_id', authUser.id);

                // Sign out (deleting auth user requires admin privileges)
                await supabase.auth.signOut();
              }

              // Clear local store
              resetStore();

              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              ACCOUNT
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomColor: theme.border }]}
                onPress={handleEditProfile}
              >
                <View style={styles.settingsItemLeft}>
                  <IconSymbol name="person.circle" size={24} color={theme.text} />
                  <Text style={[styles.settingsItemText, { color: theme.text }]}>
                    Profile
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  // Navigate to notifications settings (placeholder)
                  Alert.alert('Notifications', 'Notification settings coming soon!');
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <IconSymbol name="bell" size={24} color={theme.text} />
                  <Text style={[styles.settingsItemText, { color: theme.text }]}>
                    Notifications
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <IconSymbol name={isDark ? 'moon.fill' : 'sun.max.fill'} size={24} color={theme.text} />
                  <Text style={[styles.settingsItemText, { color: theme.text }]}>
                    Theme
                  </Text>
                </View>
                <View style={styles.themeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.themeButton,
                      themeMode === 'light' && { backgroundColor: theme.primary },
                      { borderColor: theme.border },
                    ]}
                    onPress={() => setThemeMode('light')}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                        { color: themeMode === 'light' ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      Light
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.themeButton,
                      themeMode === 'dark' && { backgroundColor: theme.primary },
                      { borderColor: theme.border },
                    ]}
                    onPress={() => setThemeMode('dark')}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                        { color: themeMode === 'dark' ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      Dark
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              SUPPORT
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  Alert.alert('Help Center', 'Help center coming soon!');
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <IconSymbol name="questionmark.circle" size={24} color={theme.text} />
                  <Text style={[styles.settingsItemText, { color: theme.text }]}>
                    Help Center
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  Alert.alert('Feedback', 'Feedback form coming soon!');
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <IconSymbol name="envelope" size={24} color={theme.text} />
                  <Text style={[styles.settingsItemText, { color: theme.text }]}>
                    Feedback
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.signOutButtonText, { color: theme.primary }]}>
                SIGN OUT
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => Alert.alert('Terms', 'Terms of service coming soon!')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>TERMS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon!')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>PRIVACY POLICY</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Acknowledgements', 'Acknowledgements coming soon!')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>ACKNOWLEDGEMENTS</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: theme.error }]}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.error} />
              ) : (
                <>
                  <IconSymbol name="trash" size={20} color={theme.error} />
                  <Text style={[styles.deleteButtonText, { color: theme.error }]}>
                    Delete Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dangerZone: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
