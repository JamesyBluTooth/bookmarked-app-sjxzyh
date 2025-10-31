
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import BookCard from '@/components/BookCard';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { mockBooks, mockUser } from '@/data/mockData';
import { useRouter } from 'expo-router';

type FilterType = 'all' | 'reading' | 'to-read' | 'completed';

export default function BooksScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'reading', label: 'Currently Reading' },
    { key: 'to-read', label: 'To Read' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredBooks = mockBooks.filter(book => {
    if (activeFilter === 'all') return true;
    return book.status === activeFilter;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="My Library"
        showAvatar
        avatarUrl={mockUser.avatarUrl}
        onNotificationPress={() => console.log('Notifications pressed')}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && { backgroundColor: theme.primary },
                activeFilter !== filter.key && { backgroundColor: theme.card },
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                  activeFilter !== filter.key && { color: theme.text },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          Platform.OS !== 'ios' && styles.contentWithTabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: theme.textSecondary }]}>
            {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
          </Text>
        </View>

        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onPress={() => console.log('Book pressed:', book.title)}
          />
        ))}

        {filteredBooks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No books found in this category
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  statsRow: {
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
});
