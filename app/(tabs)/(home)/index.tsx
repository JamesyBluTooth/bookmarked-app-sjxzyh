
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import TopBar from '@/components/TopBar';
import ProgressBar from '@/components/ProgressBar';
import { useAppStore } from '@/stores/appStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPLASH_SHOWN_KEY = '@bookmarked_splash_shown';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [greeting, setGreeting] = useState('');

  // Get data from Zustand store
  const books = useAppStore((state) => state.books);
  const userStats = useAppStore((state) => state.userStats);
  const challenge = useAppStore((state) => state.challenge);
  const user = useAppStore((state) => state.user);
  const friends = useAppStore((state) => state.friends);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const currentlyReading = books.filter(book => book.status === 'reading');
  const activeFriends = friends.filter(friend => friend.isActive);
  const mostRecentBook = currentlyReading.length > 0 ? currentlyReading[0] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="Bookmarked - Home"
        showAvatar
        avatarUrl={user.avatarUrl}
        onNotificationPress={() => console.log('Notifications pressed')}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: theme.primary }]}>
            {greeting}
          </Text>
          <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
            Let&apos;s continue your reading journey
          </Text>
        </View>

        {/* Stats Grid - 2x2 */}
        <View style={styles.statsContainer}>
          {/* Row 1 */}
          <View style={styles.statsRow}>
            {/* Books Read Card */}
            <View style={[styles.statCard, { backgroundColor: isDark ? theme.card : '#FFFFFF', borderColor: isDark ? theme.border : '#E0E0E0' }]}>
              <IconSymbol name="book.fill" size={32} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{userStats.booksRead}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>Books Read</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/books')}>
                <Text style={[styles.statLink, { color: theme.primary }]}>See Completed</Text>
              </TouchableOpacity>
            </View>

            {/* Reading Streak Card */}
            <View style={[styles.statCard, { backgroundColor: isDark ? theme.card : '#FFFFFF', borderColor: isDark ? theme.border : '#E0E0E0' }]}>
              <IconSymbol name="flame.fill" size={32} color="#FF6B35" />
              <Text style={[styles.statValue, { color: theme.text }]}>{userStats.currentStreak} days</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>Reading Streak</Text>
              <TouchableOpacity onPress={() => console.log('See More')}>
                <Text style={[styles.statLink, { color: theme.primary }]}>See More</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.statsRow}>
            {/* Friends Active Card */}
            <View style={[styles.statCard, { backgroundColor: isDark ? theme.card : '#FFFFFF', borderColor: isDark ? theme.border : '#E0E0E0' }]}>
              <IconSymbol name="person.2.fill" size={32} color="#4ECDC4" />
              <Text style={[styles.statValue, { color: theme.text }]}>{activeFriends.length}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>Friends Active</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/friends')}>
                <Text style={[styles.statLink, { color: theme.primary }]}>All Friends</Text>
              </TouchableOpacity>
            </View>

            {/* Milestones Card */}
            <View style={[styles.statCard, { backgroundColor: isDark ? theme.card : '#FFFFFF', borderColor: isDark ? theme.border : '#E0E0E0' }]}>
              <IconSymbol name="star.fill" size={32} color="#FFD93D" />
              <Text style={[styles.statValue, { color: theme.text }]}>{userStats.milestones}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>Milestones</Text>
              <TouchableOpacity onPress={() => console.log('See Completed')}>
                <Text style={[styles.statLink, { color: theme.primary }]}>See Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Currently Reading Section */}
        {mostRecentBook && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Currently Reading</Text>
            <TouchableOpacity
              style={[
                styles.bookCard,
                {
                  backgroundColor: isDark ? theme.card : '#FFFFFF',
                  borderColor: isDark ? theme.border : '#E0E0E0',
                },
              ]}
              onPress={() => router.push({
                pathname: '/book-detail',
                params: { 
                  isbn: mostRecentBook.isbn,
                  bookData: JSON.stringify(mostRecentBook)
                }
              })}
              activeOpacity={0.7}
            >
              <View style={styles.bookCardContent}>
                <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                  {mostRecentBook.title}
                </Text>
                <Text style={[styles.bookAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                  {mostRecentBook.author}
                </Text>
                <View style={styles.progressContainer}>
                  <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Progress</Text>
                  <ProgressBar progress={mostRecentBook.progress} height={8} />
                  <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                    {mostRecentBook.progress}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Challenge Section */}
        {challenge && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Challenge</Text>
            <View style={[styles.challengeCard, { backgroundColor: theme.primary }]}>
              <View style={styles.challengeContent}>
                <View style={styles.challengeHeader}>
                  <IconSymbol name="target" size={24} color="#FFFFFF" />
                  <Text style={styles.challengeTitle}>
                    {challenge.title}
                  </Text>
                </View>
                <Text style={styles.challengeDescription}>
                  You&apos;ve read for {challenge.progress} minutes today
                </Text>
                <View style={styles.challengeProgressBar}>
                  <View 
                    style={[
                      styles.challengeProgressFill, 
                      { width: `${(challenge.progress / challenge.goal) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 100,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#D0D0D0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: '0 3px 0 #D0D0D0',
      },
    }),
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  statLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  bookCard: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#D0D0D0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: '0 3px 0 #D0D0D0',
      },
    }),
  },
  bookCardContent: {
    gap: 8,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bookAuthor: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
    gap: 4,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  challengeCard: {
    borderRadius: 18,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#D0D0D0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: '0 3px 0 #D0D0D0',
      },
    }),
  },
  challengeContent: {
    gap: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
});
