
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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/appStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { BarChart } from 'react-native-chart-kit';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type SectionType = 'analytics' | 'achievements' | 'settings' | null;
type ReadingSpeedUnit = { distance: 'pages' | 'books'; time: 'minute' | 'hour' | 'day' | 'week' };

interface ReadingSession {
  date: string;
  pages_read: number;
  time_spent_minutes: number;
}

interface BookRating {
  id: string;
  book_title: string;
  book_author: string;
  book_cover_url: string;
  rating: number;
  created_at: string;
}

interface Achievement {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  completed: boolean;
  completed_at?: string;
}

export default function ProfileScreen() {
  const user = useAppStore((state) => state.user);
  const userStats = useAppStore((state) => state.userStats);
  const books = useAppStore((state) => state.books);
  const resetStore = useAppStore((state) => state.resetStore);
  const updateUser = useAppStore((state) => state.updateUser);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const themeMode = useAppStore((state) => state.themeMode);
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  
  const [friendCode, setFriendCode] = useState(user.friendCode);
  const [expandedSection, setExpandedSection] = useState<SectionType>(null);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [readingSpeedUnit, setReadingSpeedUnit] = useState<ReadingSpeedUnit>({
    distance: 'pages',
    time: 'minute',
  });
  const [bookRatings, setBookRatings] = useState<BookRating[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

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

  const loadReadingSessions = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get last 7 days of reading sessions
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const { data, error } = await supabase
        .from('reading_sessions')
        .select('session_date, pages_read, time_spent_minutes')
        .eq('user_id', authUser.id)
        .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error) throw error;

      // Fill in missing days with zero values
      const sessions: ReadingSession[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = data?.filter(s => s.session_date === dateStr) || [];
        const totalPages = dayData.reduce((sum, s) => sum + (s.pages_read || 0), 0);
        const totalTime = dayData.reduce((sum, s) => sum + (s.time_spent_minutes || 0), 0);
        
        sessions.push({
          date: dateStr,
          pages_read: totalPages,
          time_spent_minutes: totalTime,
        });
      }

      setReadingSessions(sessions);
    } catch (error) {
      console.error('Error loading reading sessions:', error);
    }
  }, []);

  const loadBookRatings = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('book_ratings')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookRatings(data || []);
    } catch (error) {
      console.error('Error loading book ratings:', error);
    }
  }, []);

  const loadAchievements = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Get user's completed achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, completed_at')
        .eq('user_id', authUser.id);

      if (userAchievementsError) throw userAchievementsError;

      const completedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const completedMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.completed_at]) || []);

      const achievementsWithStatus: Achievement[] = (allAchievements || []).map(a => ({
        ...a,
        completed: completedIds.has(a.id),
        completed_at: completedMap.get(a.id),
      }));

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }, []);

  useEffect(() => {
    loadFriendCode();
    if (isSupabaseConfigured()) {
      loadReadingSessions();
      loadBookRatings();
      loadAchievements();
    }
  }, [loadFriendCode, loadReadingSessions, loadBookRatings, loadAchievements]);

  const handleEditProfile = () => {
    router.push('/auth/onboarding');
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
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (!authUser) return;

              // Delete user data from Supabase
              await supabase.from('reading_sessions').delete().eq('user_id', authUser.id);
              await supabase.from('book_ratings').delete().eq('user_id', authUser.id);
              await supabase.from('user_achievements').delete().eq('user_id', authUser.id);
              await supabase.from('friendships').delete().eq('user_id', authUser.id);
              await supabase.from('friendships').delete().eq('friend_id', authUser.id);
              await supabase.from('friend_activities').delete().eq('user_id', authUser.id);
              await supabase.from('user_snapshots').delete().eq('user_id', authUser.id);
              await supabase.from('user_profiles').delete().eq('user_id', authUser.id);

              // Delete auth user
              await supabase.auth.admin.deleteUser(authUser.id);

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

  const toggleSection = (section: SectionType) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const calculateReadingSpeed = () => {
    const totalPages = readingSessions.reduce((sum, s) => sum + s.pages_read, 0);
    const totalMinutes = readingSessions.reduce((sum, s) => sum + s.time_spent_minutes, 0);
    
    if (totalMinutes === 0) return '0';

    let distance = totalPages;
    let time = totalMinutes;

    // Convert distance
    if (readingSpeedUnit.distance === 'books') {
      const completedBooks = books.filter(b => b.status === 'completed').length;
      distance = completedBooks;
    }

    // Convert time
    switch (readingSpeedUnit.time) {
      case 'hour':
        time = totalMinutes / 60;
        break;
      case 'day':
        time = totalMinutes / (60 * 24);
        break;
      case 'week':
        time = totalMinutes / (60 * 24 * 7);
        break;
    }

    const speed = time > 0 ? distance / time : 0;
    return speed.toFixed(2);
  };

  const getAverageRating = () => {
    if (bookRatings.length === 0) return '0.0';
    const sum = bookRatings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / bookRatings.length).toFixed(1);
  };

  const completedAchievements = achievements.filter(a => a.completed);
  const lockedAchievements = achievements.filter(a => !a.completed);
  const achievementPercentage = achievements.length > 0 
    ? Math.round((completedAchievements.length / achievements.length) * 100)
    : 0;

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

  const renderBarChart = () => {
    const labels = readingSessions.map(s => {
      const date = new Date(s.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const data = readingSessions.map(s => s.time_spent_minutes);

    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={{
            labels,
            datasets: [{ data: data.length > 0 ? data : [0] }],
          }}
          width={Dimensions.get('window').width - 64}
          height={220}
          yAxisLabel=""
          yAxisSuffix="m"
          chartConfig={{
            backgroundColor: theme.card,
            backgroundGradientFrom: theme.card,
            backgroundGradientTo: theme.card,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => theme.text,
            style: {
              borderRadius: 16,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: theme.border,
              strokeWidth: 1,
            },
          }}
          style={{
            borderRadius: 16,
          }}
          fromZero
          showValuesOnTopOfBars
          onDataPointClick={({ index }) => setSelectedBarIndex(index)}
        />
      </View>
    );
  };

  const renderAnalytics = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Reading Speed */}
        <View style={styles.analyticsItem}>
          <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Reading Speed</Text>
          <View style={styles.readingSpeedContainer}>
            <Text style={[styles.analyticsValue, { color: theme.text }]}>
              {calculateReadingSpeed()}
            </Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[styles.unitButton, { borderColor: theme.border }]}
                onPress={() => setReadingSpeedUnit(prev => ({
                  ...prev,
                  distance: prev.distance === 'pages' ? 'books' : 'pages',
                }))}
              >
                <Text style={[styles.unitButtonText, { color: theme.primary }]}>
                  {readingSpeedUnit.distance}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.unitSeparator, { color: theme.textSecondary }]}>/</Text>
              <TouchableOpacity
                style={[styles.unitButton, { borderColor: theme.border }]}
                onPress={() => {
                  const timeUnits: Array<'minute' | 'hour' | 'day' | 'week'> = ['minute', 'hour', 'day', 'week'];
                  const currentIndex = timeUnits.indexOf(readingSpeedUnit.time);
                  const nextIndex = (currentIndex + 1) % timeUnits.length;
                  setReadingSpeedUnit(prev => ({ ...prev, time: timeUnits[nextIndex] }));
                }}
              >
                <Text style={[styles.unitButtonText, { color: theme.primary }]}>
                  {readingSpeedUnit.time}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartSection}>
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>Last 7 Days</Text>
          {renderBarChart()}
          
          {selectedBarIndex !== null && readingSessions[selectedBarIndex] && (
            <View style={[styles.barDetails, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.barDetailLabel, { color: theme.textSecondary }]}>
                {new Date(readingSessions[selectedBarIndex].date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={[styles.barDetailText, { color: theme.text }]}>
                Pages: {readingSessions[selectedBarIndex].pages_read}
              </Text>
              <Text style={[styles.barDetailText, { color: theme.text }]}>
                Time: {readingSessions[selectedBarIndex].time_spent_minutes} minutes
              </Text>
            </View>
          )}
        </View>

        {/* Average Rating */}
        <View style={styles.ratingsSection}>
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>Average Rating</Text>
          <View style={styles.averageRatingContainer}>
            <Text style={[styles.averageRatingValue, { color: theme.primary }]}>
              {getAverageRating()}
            </Text>
            <IconSymbol name="star.fill" size={32} color={theme.primary} />
          </View>

          {bookRatings.length > 0 && (
            <>
              <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>
                Your Ratings
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ratingsScroll}>
                {bookRatings.map((rating) => (
                  <View
                    key={rating.id}
                    style={[styles.ratingCard, { backgroundColor: theme.background, borderColor: theme.border }]}
                  >
                    {rating.book_cover_url && (
                      <Image source={{ uri: rating.book_cover_url }} style={styles.ratingBookCover} />
                    )}
                    <Text style={[styles.ratingBookTitle, { color: theme.text }]} numberOfLines={2}>
                      {rating.book_title}
                    </Text>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconSymbol
                          key={star}
                          name={star <= rating.rating ? 'star.fill' : 'star'}
                          size={16}
                          color={theme.primary}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderAchievements = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Achievement Stats */}
        <View style={styles.achievementStats}>
          <View style={styles.achievementStatItem}>
            <Text style={[styles.achievementStatValue, { color: theme.primary }]}>
              {completedAchievements.length}
            </Text>
            <Text style={[styles.achievementStatLabel, { color: theme.textSecondary }]}>
              Completed
            </Text>
          </View>
          <View style={styles.achievementStatItem}>
            <Text style={[styles.achievementStatValue, { color: theme.textSecondary }]}>
              {lockedAchievements.length}
            </Text>
            <Text style={[styles.achievementStatLabel, { color: theme.textSecondary }]}>
              Remaining
            </Text>
          </View>
          <View style={styles.achievementStatItem}>
            <Text style={[styles.achievementStatValue, { color: theme.primary }]}>
              {achievementPercentage}%
            </Text>
            <Text style={[styles.achievementStatLabel, { color: theme.textSecondary }]}>
              Complete
            </Text>
          </View>
        </View>

        {/* Completed Achievements */}
        {completedAchievements.length > 0 && (
          <>
            <Text style={[styles.subsectionTitle, { color: theme.text }]}>Completed</Text>
            <View style={styles.achievementsGrid}>
              {completedAchievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.achievementIconContainer, { backgroundColor: theme.primary }]}>
                    <IconSymbol name={achievement.icon} size={32} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.achievementTitle, { color: theme.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: theme.textSecondary }]}>
                    {achievement.description}
                  </Text>
                  <View style={styles.achievementCompletedOverlay}>
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <>
            <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>
              Locked
            </Text>
            <View style={styles.achievementsGrid}>
              {lockedAchievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    styles.achievementCardLocked,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.achievementIconContainer, { backgroundColor: theme.border }]}>
                    <IconSymbol name={achievement.icon} size={32} color={theme.textSecondary} />
                  </View>
                  <Text style={[styles.achievementTitle, { color: theme.textSecondary }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: theme.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );

  const renderSettings = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Profile Settings */}
        <TouchableOpacity
          style={[styles.settingsItem, { borderBottomColor: theme.border }]}
          onPress={handleEditProfile}
        >
          <IconSymbol name="person.circle" size={24} color={theme.primary} />
          <Text style={[styles.settingsItemText, { color: theme.text }]}>Edit Profile</Text>
          <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Theme Toggle */}
        <View style={[styles.settingsItem, { borderBottomColor: theme.border }]}>
          <IconSymbol name={isDark ? 'moon.fill' : 'sun.max.fill'} size={24} color={theme.primary} />
          <Text style={[styles.settingsItemText, { color: theme.text }]}>Theme</Text>
          <View style={styles.themeButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                themeMode === 'light' && { backgroundColor: theme.primary },
                { borderColor: theme.border },
              ]}
              onPress={() => setThemeMode('light')}
            >
              <Text style={[styles.themeButtonText, themeMode === 'light' && { color: '#FFFFFF' }, { color: theme.text }]}>
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
              <Text style={[styles.themeButtonText, themeMode === 'dark' && { color: '#FFFFFF' }, { color: theme.text }]}>
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account */}
        <TouchableOpacity
          style={[styles.settingsItem, styles.settingsItemDanger]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          <IconSymbol name="trash" size={24} color={theme.error} />
          <Text style={[styles.settingsItemText, { color: theme.error }]}>Delete Account</Text>
          {loading && <ActivityIndicator size="small" color={theme.error} />}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {renderAvatar()}
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.handle, { color: theme.textSecondary }]}>{user.handle}</Text>
          
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.primary }]}
            onPress={handleEditProfile}
          >
            <IconSymbol name="pencil" size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Account</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.friendCodeContainer,
              { backgroundColor: theme.background, borderColor: theme.primary },
            ]}
          >
            <Text style={[styles.friendCodeLabel, { color: theme.textSecondary }]}>
              Friend Code
            </Text>
            <Text style={[styles.friendCode, { color: theme.primary }]}>{friendCode}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {userStats.booksRead}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Books Read</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {userStats.milestones}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Milestones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {userStats.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reading Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {userStats.averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Rating</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>

          {/* Analytics */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => toggleSection('analytics')}
          >
            <IconSymbol name="chart.bar" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Analytics</Text>
            <IconSymbol
              name={expandedSection === 'analytics' ? 'chevron.up' : 'chevron.down'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          {expandedSection === 'analytics' && renderAnalytics()}

          {/* Achievements */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => toggleSection('achievements')}
          >
            <IconSymbol name="trophy" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Achievements</Text>
            <IconSymbol
              name={expandedSection === 'achievements' ? 'chevron.up' : 'chevron.down'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          {expandedSection === 'achievements' && renderAchievements()}

          {/* Settings */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => toggleSection('settings')}
          >
            <IconSymbol name="gear" size={24} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
            <IconSymbol
              name={expandedSection === 'settings' ? 'chevron.up' : 'chevron.down'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          {expandedSection === 'settings' && renderSettings()}
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
  profileCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 16,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  friendCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    width: '100%',
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
  statsCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 16,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
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
  sectionContent: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  analyticsItem: {
    marginBottom: 20,
  },
  analyticsLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  analyticsValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  readingSpeedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitSeparator: {
    fontSize: 16,
  },
  chartSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  barDetails: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  barDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  barDetailText: {
    fontSize: 14,
    marginBottom: 2,
  },
  ratingsSection: {
    marginTop: 8,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  averageRatingValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  ratingsScroll: {
    marginTop: 8,
  },
  ratingCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  ratingBookCover: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  ratingBookTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    height: 32,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  achievementStatItem: {
    alignItems: 'center',
  },
  achievementStatValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementStatLabel: {
    fontSize: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  achievementCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  achievementCompletedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  settingsItemDanger: {
    borderBottomWidth: 0,
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
});
