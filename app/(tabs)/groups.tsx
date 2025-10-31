
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import GroupCard from '@/components/GroupCard';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { mockGroups, mockUser } from '@/data/mockData';
import { useRouter } from 'expo-router';

export default function GroupsScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="Reading Groups"
        showAvatar
        avatarUrl={mockUser.avatarUrl}
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

        {mockGroups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onJoin={() => Alert.alert('Joined!', `You joined ${group.name}`)}
          />
        ))}
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
});
