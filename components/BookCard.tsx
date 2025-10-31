
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const isCompleted = book.status === 'completed';

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

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? theme.card : '#FFFFFF',
            borderColor: isDark ? theme.border : '#E0E0E0',
            transform: [{ translateY }],
          },
          isCompleted && {
            borderColor: theme.success,
          },
        ]}
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
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 2,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
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
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginTop: 12,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
});
