
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FriendProfileModalProps {
  visible: boolean;
  onClose: () => void;
  friendUserId: string;
  onUnfriend?: () => void;
  showUnfriendButton?: boolean;
}

interface FriendProfile {
  username: string;
  handle: string;
  profile_picture_url?: string;
  bio?: string;
  favorite_genres?: string[];
}

interface FriendStats {
  booksRead: number;
  currentStreak: number;
  milestones: number;
  averageRating: number;
}

export default function FriendProfileModal({
  visible,
  onClose,
  friendUserId,
  onUnfriend,
  showUnfriendButton = true,
}: FriendProfileModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [stats, setStats] = useState<FriendStats>({
    booksRead: 0,
    currentStreak: 0,
    milestones: 0,
    averageRating: 0,
  });

  const loadFriendProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', friendUserId)
        .single();

      if (error) throw error;

      setProfile(data);
      // TODO: Load actual stats from user_snapshots or calculate from activities
      setStats({
        booksRead: 0,
        currentStreak: 0,
        milestones: 0,
        averageRating: 0,
      });
    } catch (error) {
      console.error('Error loading friend profile:', error);
    } finally {
      setLoading(false);
    }
  }, [friendUserId]);

  useEffect(() => {
    if (visible && friendUserId) {
      loadFriendProfile();
    }
  }, [visible, friendUserId, loadFriendProfile]);

  const handleUnfriend = () => {
    Alert.alert(
      'Unfriend',
      `Are you sure you want to unfriend ${profile?.username}? This will remove all their activity from your feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: () => {
            onUnfriend?.();
            onClose();
          },
        },
      ]
    );
  };

  const renderAvatar = () => {
    if (profile?.profile_picture_url) {
      return (
        <Image
          source={{ uri: profile.profile_picture_url }}
          style={styles.avatar}
        />
      );
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

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top']}
      >
        <Animated.View
          entering={SlideInRight.springify()}
          exiting={SlideOutRight.springify()}
          style={styles.content}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                {renderAvatar()}
                <Text style={[styles.name, { color: theme.text }]}>
                  {profile?.username}
                </Text>
                <Text style={[styles.handle, { color: theme.textSecondary }]}>
                  {profile?.handle}
                </Text>
                {profile?.bio && (
                  <Text style={[styles.bio, { color: theme.text }]}>
                    {profile.bio}
                  </Text>
                )}
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
                    {stats.booksRead}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Books
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {stats.currentStreak}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Streak
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {stats.milestones}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Milestones
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {stats.averageRating.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Avg Rating
                  </Text>
                </View>
              </View>

              {/* Favorite Genres */}
              {profile?.favorite_genres && profile.favorite_genres.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Favorite Genres
                  </Text>
                  <View style={styles.genresContainer}>
                    {profile.favorite_genres.map((genre, index) => (
                      <View
                        key={index}
                        style={[
                          styles.genreTag,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.primary,
                          },
                        ]}
                      >
                        <Text style={[styles.genreText, { color: theme.primary }]}>
                          {genre}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Unfriend Button */}
              {showUnfriendButton && (
                <TouchableOpacity
                  style={[styles.unfriendButton, { backgroundColor: theme.error }]}
                  onPress={handleUnfriend}
                >
                  <Text style={styles.unfriendButtonText}>Unfriend</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
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
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unfriendButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  unfriendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
