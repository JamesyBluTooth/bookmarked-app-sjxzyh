
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AddFriendModal from '@/components/AddFriendModal';
import FriendProfileModal from '@/components/FriendProfileModal';

type TabType = 'friends' | 'challenges';

interface Friend {
  id: string;
  user_id: string;
  username: string;
  handle: string;
  profile_picture_url?: string;
  friend_code: string;
}

interface FriendActivity {
  id: string;
  user_id: string;
  activity_type: 'book_completed' | 'challenge_completed' | 'book_rated' | 'book_reviewed';
  book_title?: string;
  book_author?: string;
  book_cover_url?: string;
  rating?: number;
  review_text?: string;
  challenge_name?: string;
  created_at: string;
  user_profile: {
    username: string;
    handle: string;
    profile_picture_url?: string;
  };
}

export default function FriendsScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; friendCode: string } | null>(null);

  const loadCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('friend_code')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setCurrentUser({ id: user.id, friendCode: profile.friend_code });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Get friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', currentUser.id);

      if (friendshipsError) throw friendshipsError;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Get friend profiles
      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', friendIds);

      if (profilesError) throw profilesError;

      setFriends(profiles || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadFriendActivities = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Get friend IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', currentUser.id);

      if (!friendships || friendships.length === 0) {
        setActivities([]);
        return;
      }

      const friendIds = friendships.map(f => f.friend_id);

      // Get activities from friends
      const { data: activitiesData, error } = await supabase
        .from('friend_activities')
        .select(`
          *,
          user_profile:user_profiles!friend_activities_user_id_fkey(username, handle, profile_picture_url)
        `)
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error loading friend activities:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      loadFriendActivities();
    }
  }, [currentUser, loadFriends, loadFriendActivities]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFriends(), loadFriendActivities()]);
    setRefreshing(false);
  }, [loadFriends, loadFriendActivities]);

  const handleAddFriend = async (friendUserId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUser.id,
          friend_id: friendUserId,
        });

      if (error) throw error;

      Alert.alert('Success', 'Friend added successfully!');
      loadFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend');
    }
  };

  const handleUnfriend = async (friendUserId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('friend_id', friendUserId);

      if (error) throw error;

      Alert.alert('Success', 'Friend removed');
      loadFriends();
      loadFriendActivities();
    } catch (error) {
      console.error('Error unfriending:', error);
      Alert.alert('Error', 'Failed to remove friend');
    }
  };

  const handleFriendPress = (friendUserId: string) => {
    setSelectedFriendId(friendUserId);
    setShowFriendProfile(true);
  };

  const renderAvatar = (url?: string, size: number = 70) => {
    if (url) {
      return (
        <Image
          source={{ uri: url }}
          style={[styles.friendImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarFallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.card,
            borderWidth: 2,
            borderColor: theme.border,
          },
        ]}
      >
        <IconSymbol name="person.fill" size={size * 0.5} color={theme.textSecondary} />
      </View>
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'book_completed':
        return 'checkmark.circle.fill';
      case 'challenge_completed':
        return 'trophy.fill';
      case 'book_rated':
      case 'book_reviewed':
        return 'star.fill';
      default:
        return 'book.fill';
    }
  };

  const getActivityMessage = (activity: FriendActivity) => {
    switch (activity.activity_type) {
      case 'book_completed':
        return `completed ${activity.book_title}`;
      case 'challenge_completed':
        return `completed challenge: ${activity.challenge_name}`;
      case 'book_rated':
        return `rated ${activity.book_title} ${activity.rating}/5`;
      case 'book_reviewed':
        return `reviewed ${activity.book_title}`;
      default:
        return 'had an activity';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderFriendsTab = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.content,
        Platform.OS !== 'ios' && styles.contentWithTabBar,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      {/* Friends List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Friends</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : friends.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.2" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No friends yet. Add friends to see their reading activity!
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsRow}
          >
            {friends.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendCard}
                onPress={() => handleFriendPress(friend.user_id)}
                activeOpacity={0.7}
              >
                {renderAvatar(friend.profile_picture_url, 70)}
                <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                  {friend.username}
                </Text>
                <Text style={[styles.friendHandle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {friend.handle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Friend Activity Feed */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Friend Activity</Text>
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="clock" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No recent activity from friends
            </Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View
              key={activity.id}
              style={[
                styles.activityCard,
                {
                  backgroundColor: isDark ? theme.card : '#FFFFFF',
                  borderColor: isDark ? theme.border : '#E0E0E0',
                },
              ]}
            >
              <View style={styles.activityHeader}>
                {renderAvatar(activity.user_profile.profile_picture_url, 40)}
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityUser, { color: theme.text }]}>
                    {activity.user_profile.username}
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                    {getTimeAgo(activity.created_at)}
                  </Text>
                </View>
                <View style={[styles.activityIcon, { backgroundColor: theme.primary + '20' }]}>
                  <IconSymbol
                    name={getActivityIcon(activity.activity_type)}
                    size={20}
                    color={theme.primary}
                  />
                </View>
              </View>
              <Text style={[styles.activityMessage, { color: theme.text }]}>
                {getActivityMessage(activity)}
              </Text>
              {activity.review_text && (
                <Text style={[styles.reviewText, { color: theme.textSecondary }]} numberOfLines={3}>
                  {activity.review_text}
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderChallengesTab = () => (
    <View style={styles.emptyTabContainer}>
      <IconSymbol name="trophy" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTabText, { color: theme.textSecondary }]}>
        Challenges coming soon!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="Friends"
        showAvatar
        avatarUrl={undefined}
        onNotificationPress={() => console.log('Notifications pressed')}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'friends' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'friends' ? theme.primary : theme.textSecondary },
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'challenges' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'challenges' ? theme.primary : theme.textSecondary },
            ]}
          >
            Challenges
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Friend Button */}
      {activeTab === 'friends' && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddFriendModal(true)}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Tab Content */}
      {activeTab === 'friends' ? renderFriendsTab() : renderChallengesTab()}

      {/* Modals */}
      {currentUser && (
        <>
          <AddFriendModal
            visible={showAddFriendModal}
            onClose={() => setShowAddFriendModal(false)}
            onAddFriend={handleAddFriend}
            currentUserId={currentUser.id}
            currentUserFriendCode={currentUser.friendCode}
          />
          {selectedFriendId && (
            <FriendProfileModal
              visible={showFriendProfile}
              onClose={() => {
                setShowFriendProfile(false);
                setSelectedFriendId(null);
              }}
              friendUserId={selectedFriendId}
              onUnfriend={() => handleUnfriend(selectedFriendId)}
              showUnfriendButton={true}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    top: 120,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 5,
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
  loader: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
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
  activityCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 12,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityUser: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityMessage: {
    fontSize: 15,
    lineHeight: 20,
  },
  reviewText: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTabText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
});
