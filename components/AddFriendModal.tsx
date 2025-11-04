
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import { supabase } from '@/lib/supabase';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFriend: (friendUserId: string) => void;
  currentUserId: string;
  currentUserFriendCode: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  handle: string;
  profile_picture_url?: string;
  friend_code: string;
}

export default function AddFriendModal({
  visible,
  onClose,
  onAddFriend,
  currentUserId,
  currentUserFriendCode,
}: AddFriendModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');

  const handleClose = () => {
    setFriendCode('');
    setFoundUser(null);
    setError('');
    onClose();
  };

  const handleSearch = async () => {
    if (!friendCode.trim()) {
      setError('Please enter a friend code');
      return;
    }

    const code = friendCode.trim().toUpperCase();

    // Check if user is trying to friend themselves
    if (code === currentUserFriendCode) {
      setError("You can't friend yourself.");
      setFoundUser(null);
      return;
    }

    setLoading(true);
    setError('');
    setFoundUser(null);

    try {
      // Search for user by friend code
      const { data, error: searchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('friend_code', code)
        .single();

      if (searchError || !data) {
        setError("Couldn't find user, are you sure that's the right code?");
        setLoading(false);
        return;
      }

      // Check if already friends
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('friend_id', data.user_id)
        .single();

      if (existingFriendship) {
        setError('You are already friends with this user');
        setLoading(false);
        return;
      }

      setFoundUser(data);
    } catch (err) {
      console.error('Error searching for user:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!foundUser) return;

    setLoading(true);
    try {
      await onAddFriend(foundUser.user_id);
      handleClose();
    } catch (err) {
      console.error('Error adding friend:', err);
      setError('Failed to add friend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (url?: string) => {
    if (url) {
      return <Image source={{ uri: url }} style={styles.avatar} />;
    }
    return (
      <View style={[styles.avatarFallback, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <IconSymbol name="person.fill" size={40} color={theme.textSecondary} />
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown.springify()}
          style={[
            styles.modal,
            {
              backgroundColor: isDark ? theme.card : '#FFFFFF',
              borderColor: isDark ? theme.border : '#E0E0E0',
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Add Friend</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Enter Friend Code
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={friendCode}
                onChangeText={(text) => {
                  setFriendCode(text.toUpperCase());
                  setError('');
                  setFoundUser(null);
                }}
                placeholder="ABC123"
                placeholderTextColor={theme.textSecondary}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: theme.primary }]}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            )}

            {foundUser && (
              <View
                style={[
                  styles.userCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                {renderAvatar(foundUser.profile_picture_url)}
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {foundUser.username}
                  </Text>
                  <Text style={[styles.userHandle, { color: theme.textSecondary }]}>
                    {foundUser.handle}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                  onPress={handleAddFriend}
                  disabled={loading}
                >
                  <Text style={styles.addButtonText}>Add Friend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
