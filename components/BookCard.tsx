
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BookData } from '@/types/book';
import ProgressBar from './ProgressBar';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

interface BookCardProps {
  book: BookData;
  onPress?: () => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
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

  const getStatusColor = () => {
    switch (book.status) {
      case 'completed':
        return theme.success;
      case 'reading':
        return theme.primary;
      case 'to-read':
        return theme.textSecondary;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (book.status) {
      case 'completed':
        return 'Completed';
      case 'reading':
        return 'Reading';
      case 'to-read':
        return 'To Read';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
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
        <Image source={{ uri: book.coverUrl }} style={styles.cover} />
        <Text style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
                {book.author}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {book.status === 'reading' && book.currentPage && book.totalPages && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={(book.currentPage / book.totalPages) * 100}
                height={6}
                color={theme.primary}
                backgroundColor={theme.border}
              />
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {book.currentPage} / {book.totalPages} pages
              </Text>
            </View>
          )}

          {book.status === 'completed' && book.rating && (
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: theme.text }]}>
                ⭐ {book.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingContainer: {
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
