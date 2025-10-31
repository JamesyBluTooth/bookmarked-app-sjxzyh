
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { mockUser, mockUserStats } from '@/data/mockData';

export default function ProfileScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  const menuItems = [
    { icon: 'chart.bar.fill', label: 'Analytics', color: theme.primary },
    { icon: 'trophy.fill', label: 'Achievements', color: theme.highlight },
    { icon: 'gear', label: 'Settings', color: theme.textSecondary },
    { icon: 'bell.fill', label: 'Notifications', color: theme.secondary },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="Profile"
        showAvatar={false}
        onNotificationPress={() => console.log('Notifications pressed')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          Platform.OS !== 'ios' && styles.contentWithTabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileHeader, { backgroundColor: theme.card }]}>
          <Image source={{ uri: mockUser.avatarUrl }} style={styles.avatar} />
          <Text style={[styles.name, { color: theme.text }]}>{mockUser.name}</Text>
          <Text style={[styles.handle, { color: theme.textSecondary }]}>{mockUser.handle}</Text>
          
          <View style={[styles.friendCodeContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.friendCodeLabel, { color: theme.textSecondary }]}>
              Friend Code
            </Text>
            <Text style={[styles.friendCode, { color: theme.primary }]}>
              {mockUser.friendCode}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Reading Stats
          </Text>
          <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {mockUserStats.booksRead}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Books Read
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {mockUserStats.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {mockUserStats.milestones}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Milestones
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {mockUserStats.averageRating.toFixed(1)} ⭐
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Avg Rating
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: theme.card }]}
              onPress={() => Alert.alert(item.label, `Opening ${item.label}...`)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <IconSymbol name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>
                {item.label}
              </Text>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.error }]}>
            Danger Zone
          </Text>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.error + '15', borderColor: theme.error }]}
            onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: () => console.log('Logged out') }
            ])}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.right.square" size={20} color={theme.error} />
            <Text style={[styles.logoutText, { color: theme.error }]}>
              Logout
            </Text>
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
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
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
  friendCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  friendCodeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  friendCode: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsCard: {
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
