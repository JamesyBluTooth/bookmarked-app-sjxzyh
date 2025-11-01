
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import ActivityCard from '@/components/ActivityCard';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { mockActivities, mockFriends, mockFriendRequests, mockUser } from '@/data/mockData';
import { useRouter } from 'expo-router';

export default function FriendsScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState(mockFriendRequests);

  const handleAcceptRequest = (id: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
    Alert.alert('Success', 'Friend request accepted!');
  };

  const handleDeclineRequest = (id: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
    Alert.alert('Declined', 'Friend request declined');
  };

  const renderAvatar = (avatarUrl: string | undefined, size: number = 70) => {
    if (avatarUrl) {
      return (
        <Image 
          source={{ uri: avatarUrl }} 
          style={[
            styles.friendImage, 
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        />
      );
    }
    
    // Fallback to person outline icon
    return (
      <View style={[
        styles.avatarFallback,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: theme.card,
          borderWidth: 2,
          borderColor: theme.border,
        }
      ]}>
        <IconSymbol name="person.fill" size={size * 0.5} color={theme.textSecondary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="Friends"
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Active Friends
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsRow}
          >
            {mockFriends.map(friend => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendCard}
                onPress={() => Alert.alert('Friend Profile', friend.name)}
                activeOpacity={0.7}
              >
                {renderAvatar(friend.avatarUrl, 70)}
                {friend.isActive && (
                  <View style={[styles.activeIndicator, { backgroundColor: theme.success }]} />
                )}
                <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                  {friend.name}
                </Text>
                <Text style={[styles.friendHandle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {friend.handle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Friend Requests
            </Text>
            {friendRequests.map(request => (
              <View 
                key={request.id} 
                style={[
                  styles.requestCard, 
                  { 
                    backgroundColor: isDark ? theme.card : '#FFFFFF',
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  }
                ]}
              >
                {renderAvatar(request.friend.avatarUrl, 50)}
                <View style={styles.requestInfo}>
                  <Text style={[styles.requestName, { color: theme.text }]}>
                    {request.friend.name}
                  </Text>
                  <Text style={[styles.requestHandle, { color: theme.textSecondary }]}>
                    {request.friend.handle}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleAcceptRequest(request.id)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.declineButton, { backgroundColor: theme.error + '20' }]}
                    onPress={() => handleDeclineRequest(request.id)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="xmark" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Activity
          </Text>
          {mockActivities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onReact={() => Alert.alert('Congratulations sent!', `You congratulated ${activity.friend.name}`)}
            />
          ))}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  friendsRow: {
    gap: 12,
    paddingRight: 16,
  },
  friendCard: {
    alignItems: 'center',
    width: 90,
  },
  friendImage: {
    marginBottom: 8,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: 2,
    right: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  friendName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  friendHandle: {
    fontSize: 11,
    textAlign: 'center',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 12,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  requestAvatar: {
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  requestHandle: {
    fontSize: 13,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
