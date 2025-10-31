
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import BookCard from '@/components/BookCard';
import ProgressBar from '@/components/ProgressBar';
import SplashScreen from '@/components/SplashScreen';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { mockBooks, mockUserStats, mockChallenge, mockUser, mockFriends } from '@/data/mockData';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [greeting, setGreeting] = useState('');

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

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const currentlyReading = mockBooks.find(book => book.status === 'reading');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        showAvatar
        avatarUrl={mockUser.avatarUrl}
        onNotificationPress={() => Alert.alert('Notifications', 'No new notifications')}
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
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {greeting}, {mockUser.name.split(' ')[0]}! 👋
          </Text>
          <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
            Ready to continue your reading journey?
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="book.fill"
            value={mockUserStats.booksRead}
            label="Books Read"
            color={theme.primary}
          />
          <StatCard
            icon="flame.fill"
            value={mockUserStats.currentStreak}
            label="Day Streak"
            color="#FF6B35"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="person.2.fill"
            value={mockUserStats.activeFriends}
            label="Active Friends"
            color={theme.secondary}
          />
          <StatCard
            icon="trophy.fill"
            value={mockUserStats.milestones}
            label="Milestones"
            color={theme.highlight}
          />
        </View>

        {currentlyReading && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Currently Reading
            </Text>
            <BookCard
              book={currentlyReading}
              onPress={() => Alert.alert('Book Details', `Opening ${currentlyReading.title}`)}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Daily Challenge
          </Text>
          <View style={[styles.challengeCard, { backgroundColor: theme.card }]}>
            <View style={styles.challengeHeader}>
              <View style={[styles.challengeIcon, { backgroundColor: theme.primary + '20' }]}>
                <IconSymbol name="target" size={24} color={theme.primary} />
              </View>
              <View style={styles.challengeInfo}>
                <Text style={[styles.challengeTitle, { color: theme.text }]}>
                  {mockChallenge.title}
                </Text>
                <Text style={[styles.challengeDescription, { color: theme.textSecondary }]}>
                  {mockChallenge.description}
                </Text>
              </View>
            </View>
            
            <View style={styles.challengeProgress}>
              <ProgressBar
                progress={(mockChallenge.progress / mockChallenge.goal) * 100}
                height={8}
              />
              <Text style={[styles.challengeProgressText, { color: theme.textSecondary }]}>
                {mockChallenge.progress} / {mockChallenge.goal} {mockChallenge.unit}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: theme.primary }]}
              onPress={() => Alert.alert('Log Time', 'Time logging feature coming soon!')}
              activeOpacity={0.7}
            >
              <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.logButtonText}>Log Reading Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Active Friends
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsRow}
          >
            {mockFriends.filter(f => f.isActive).map(friend => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendAvatar}
                onPress={() => Alert.alert('Friend Profile', friend.name)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: friend.avatarUrl }} style={styles.friendImage} />
                <View style={[styles.activeIndicator, { backgroundColor: theme.success }]} />
                <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                  {friend.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  greetingSection: {
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
    gap: 12,
    marginBottom: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  challengeCard: {
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
  },
  challengeProgress: {
    marginBottom: 16,
  },
  challengeProgressText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  friendsRow: {
    gap: 16,
    paddingRight: 16,
  },
  friendAvatar: {
    alignItems: 'center',
    width: 70,
  },
  friendImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  activeIndicator: {
    position: 'absolute',
    top: 2,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  friendName: {
    fontSize: 12,
    textAlign: 'center',
  },
});
