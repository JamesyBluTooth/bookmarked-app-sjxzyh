
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import ProgressBar from './ProgressBar';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { BookData } from '@/types/book';

interface BookCardProps {
  book: BookData;
  onPress?: () => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  const isCompleted = book.status === 'completed';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.card },
        isCompleted && { 
          borderColor: theme.success, 
          borderWidth: 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.coverContainer}>
        <Image source={{ uri: book.coverUrl }} style={styles.cover} />
        {isCompleted && (
          <View style={[styles.completedOverlay, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
            <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
              <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
              {book.author}
            </Text>
          </View>
        </View>

        {book.status === 'reading' && (
          <View style={styles.progressSection}>
            <ProgressBar progress={book.progress} />
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {book.currentPage} / {book.pageCount} pages ({book.progress}%)
            </Text>
          </View>
        )}

        {isCompleted && book.rating && (
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <IconSymbol
                key={i}
                name={i < book.rating! ? 'star.fill' : 'star'}
                size={16}
                color={theme.highlight}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  coverContainer: {
    position: 'relative',
    marginRight: 12,
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
  },
  progressSection: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
});
