
import { IconSymbol } from './IconSymbol';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';
import React from 'react';
import { Activity } from '@/types/store';
import { useThemeMode } from '@/contexts/ThemeContext';

interface ActivityCardProps {
  activity: Activity;
  onReact?: () => void;
}

export default function ActivityCard({ activity, onReact }: ActivityCardProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'finished':
        return 'checkmark.circle.fill';
      case 'milestone':
        return 'star.fill';
      case 'started':
        return 'book.fill';
      default:
        return 'book.fill';
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'finished':
        return theme.success;
      case 'milestone':
        return theme.highlight;
      case 'started':
        return theme.primary;
      default:
        return theme.primary;
    }
  };

  const renderAvatar = () => {
    if (activity.friend.avatarUrl) {
      return (
        <Image
          source={{ uri: activity.friend.avatarUrl }}
          style={styles.avatar}
        />
      );
    }
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
        <IconSymbol name="person.fill" size={20} color={theme.textSecondary} />
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onReact}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            boxShadow: `0px 2px 8px ${theme.cardShadow}`,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.header}>
          {renderAvatar()}
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: theme.text }]}>
              {activity.friend.name}
            </Text>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {getTimeAgo(activity.timestamp)}
            </Text>
          </View>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getActivityColor()}20` },
            ]}
          >
            <IconSymbol
              name={getActivityIcon()}
              size={20}
              color={getActivityColor()}
            />
          </View>
        </View>

        <Text style={[styles.message, { color: theme.text }]}>
          {activity.message}
        </Text>

        {activity.book && (
          <View style={styles.bookInfo}>
            <Image
              source={{ uri: activity.book.coverUrl }}
              style={styles.bookCover}
            />
            <View style={styles.bookDetails}>
              <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={1}>
                {activity.book.title}
              </Text>
              <Text style={[styles.bookAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                {activity.book.author}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookCover: {
    width: 50,
    height: 75,
    borderRadius: 6,
    marginRight: 12,
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
  },
});
