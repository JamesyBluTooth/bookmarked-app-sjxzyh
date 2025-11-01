
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import BookCard from '@/components/BookCard';
import ProgressBar from '@/components/ProgressBar';
import SplashScreen from '@/components/SplashScreen';
import { useAppStore } from '@/stores/appStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [showSplash, setShowSplash] = useState(true);
  const [greeting, setGreeting] = useState('');

  // Get data from Zustand store
  const books = useAppStore((state) => state.books);
  const userStats = useAppStore((state) => state.userStats);
  const challenge = useAppStore((state) => state.challenge);
  const user = useAppStore((state) => state.user);
  const friends = useAppStore((state) => state.friends);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  const currentlyReading = books.filter(book => book.status === 'reading');
  const activeFriends = friends.filter(friend => friend.isActive);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="Bookmarked"
        showAvatar
        avatarUrl={user.avatarUrl}
        onNotificationPress={() => console.log('Notifications pressed')}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          Platform.OS !== 'ios' && styles.contentWithTabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {greeting}, {user.name.split(' ')[0]}!
          </Text>
          <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
            Ready to continue your reading journey?
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="book.fill"
            label="Books Read"
            value={userStats.booksRead.toString()}
            color={theme.primary}
          />
          <StatCard
            icon="flame.fill"
            label="Current Streak"
            value={`${userStats.currentStreak} days`}
            color="#FF6B35"
          />
          <StatCard
            icon="person.2.fill"
            label="Active Friends"
            value={activeFriends.length.toString()}
            color="#4ECDC4"
          />
          <StatCard
            icon="star.fill"
            label="Milestones"
            value={userStats.milestones.toString()}
            color="#FFD93D"
          />
        </View>

        {currentlyReading.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Currently Reading</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/books')}>
                <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {currentlyReading.slice(0, 2).map(book => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => router.push({
                  pathname: '/book-detail',
                  params: { 
                    isbn: book.isbn,
                    bookData: JSON.stringify(book)
                  }
                })}
              />
            ))}
          </View>
        )}

        {challenge && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Challenge</Text>
            <View style={[styles.challengeCard, { backgroundColor: theme.card }]}>
              <View style={styles.challengeHeader}>
                <IconSymbol name="target" size={32} color={theme.primary} />
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: theme.text }]}>
                    {challenge.title}
                  </Text>
                  <Text style={[styles.challengeDescription, { color: theme.textSecondary }]}>
                    {challenge.description}
                  </Text>
                </View>
              </View>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeStats}>
                  <Text style={[styles.challengeValue, { color: theme.primary }]}>
                    {challenge.progress} / {challenge.goal} {challenge.unit}
                  </Text>
                </View>
                <ProgressBar 
                  progress={(challenge.progress / challenge.goal) * 100} 
                  height={8} 
                />
              </View>
            </View>
          </View>
        )}

        {activeFriends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Friends</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/friends')}>
                <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsScroll}
            >
              {activeFriends.map(friend => (
                <TouchableOpacity
                  key={friend.id}
                  style={[styles.friendCard, { backgroundColor: theme.card }]}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatar} />
                  <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                    {friend.name.split(' ')[0]}
                  </Text>
                  <View style={styles.activeIndicator} />
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    paddingBottom: 20,
  },
  contentWithTabBar: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeCard: {
    padding: 16,
    borderRadius: 18,
    boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
  },
  challengeProgress: {
    gap: 8,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  friendCard: {
    width: 80,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ECDC4',
  },
});
