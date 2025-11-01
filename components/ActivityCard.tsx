
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { Activity } from '@/data/mockData';
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { IconSymbol } from './IconSymbol';

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
      return <Image source={{ uri: activity.friend.avatarUrl }} style={styles.avatar} />;
    }
    
    return (
      <View style={[styles.avatarFallback, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <IconSymbol name="person.fill" size={20} color={theme.textSecondary} />
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={!onReact}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? theme.card : '#FFFFFF',
            borderColor: isDark ? theme.border : '#E0E0E0',
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.header}>
          {renderAvatar()}
          <View style={styles.headerText}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {activity.friend.name}
            </Text>
            <Text style={[styles.timeAgo, { color: theme.textSecondary }]}>
              {getTimeAgo(activity.timestamp)}
            </Text>
          </View>
          <View
            style={[
              styles.activityIcon,
              { backgroundColor: getActivityColor() + '20' },
            ]}
          >
            <IconSymbol
              name={getActivityIcon()}
              size={20}
              color={getActivityColor()}
            />
          </View>
        </View>

        <Text style={[styles.activityText, { color: theme.text }]}>
          {activity.message} {activity.book.title}
        </Text>

        {activity.book.title && (
          <View style={[styles.bookInfo, { backgroundColor: theme.background }]}>
            <IconSymbol name="book.fill" size={16} color={theme.textSecondary} />
            <Text style={[styles.bookTitle, { color: theme.text }]}>
              {activity.book.title}
            </Text>
          </View>
        )}

        {onReact && (
          <TouchableOpacity
            style={[styles.reactButton, { borderColor: theme.border }]}
            onPress={onReact}
            activeOpacity={0.8}
          >
            <IconSymbol name="hand.thumbsup" size={16} color={theme.primary} />
            <Text style={[styles.reactText, { color: theme.primary }]}>
              Congratulate
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
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
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  reactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  reactText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
