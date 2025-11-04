
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import GroupCard from '@/components/GroupCard';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/appStore';
import { Group } from '@/types/store';

export default function GroupsScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const groups = useAppStore((state) => state.groups);
  const [loading, setLoading] = useState(false);

  // Mock groups for now since the feature is not fully implemented
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Classic Readers',
      description: 'Dive into timeless literature and discuss the classics that shaped modern storytelling.',
      memberCount: 234,
      currentDiscussion: 'Pride and Prejudice by Jane Austen',
      imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    },
    {
      id: '2',
      name: 'Sci-Fi Enthusiasts',
      description: 'Explore futuristic worlds, advanced technology, and the boundaries of human imagination.',
      memberCount: 189,
      currentDiscussion: 'Dune by Frank Herbert',
      imageUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400',
    },
    {
      id: '3',
      name: 'Mystery & Thriller Club',
      description: 'Unravel complex plots, discuss twists, and share your favorite page-turners.',
      memberCount: 312,
      currentDiscussion: 'The Silent Patient by Alex Michaelides',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    },
    {
      id: '4',
      name: 'Non-Fiction Explorers',
      description: 'Learn from real stories, biographies, and thought-provoking essays.',
      memberCount: 156,
      currentDiscussion: 'Sapiens by Yuval Noah Harari',
      imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400',
    },
  ];

  const handleJoinGroup = (groupId: string) => {
    Alert.alert('Coming Soon', 'Group functionality will be available in a future update!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="Reading Groups"
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
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Discover Reading Circles
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Join themed groups and share your reading journey
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <>
            {mockGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                onJoin={() => handleJoinGroup(group.id)}
              />
            ))}
          </>
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
