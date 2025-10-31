
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity } from '@/data/mockData';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

interface ActivityCardProps {
  activity: Activity;
  onReact?: () => void;
}

export default function ActivityCard({ activity, onReact }: ActivityCardProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'finished':
        return 'checkmark.circle.fill';
      case 'milestone':
        return 'flag.fill';
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

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Image source={{ uri: activity.friend.avatarUrl }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: theme.text }]}>
            {activity.friend.name}
          </Text>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {getTimeAgo(activity.timestamp)}
          </Text>
        </View>
        <View style={[styles.activityIcon, { backgroundColor: getActivityColor() + '20' }]}>
          <IconSymbol name={getActivityIcon()} size={20} color={getActivityColor()} />
        </View>
      </View>

      <Text style={[styles.message, { color: theme.text }]}>
        {activity.message}{' '}
        <Text style={{ fontWeight: '600' }}>{activity.book.title}</Text>
      </Text>

      <View style={styles.bookPreview}>
        <Image source={{ uri: activity.book.coverUrl }} style={styles.bookCover} />
        <View style={styles.bookInfo}>
          <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={1}>
            {activity.book.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
            {activity.book.author}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.reactButton, { backgroundColor: theme.primary + '15' }]}
        onPress={onReact}
        activeOpacity={0.7}
      >
        <IconSymbol name="hand.thumbsup" size={16} color={theme.primary} />
        <Text style={[styles.reactText, { color: theme.primary }]}>Congratulate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
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
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  activityIcon: {
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
  bookPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookCover: {
    width: 50,
    height: 75,
    borderRadius: 6,
    marginRight: 12,
  },
  bookInfo: {
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
  reactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  reactText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
