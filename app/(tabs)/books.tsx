
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import BookCard from '@/components/BookCard';
import AddBookModal from '@/components/AddBookModal';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { BookData } from '@/types/book';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppStore } from '@/stores/appStore';

type FilterType = 'all' | 'reading' | 'completed';

export default function BooksScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Use Zustand store
  const books = useAppStore((state) => state.books);
  const addBook = useAppStore((state) => state.addBook);
  const user = useAppStore((state) => state.user);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'reading', label: 'Currently Reading' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredBooks = books.filter(book => {
    if (activeFilter === 'all') return true;
    return book.status === activeFilter;
  });

  const handleAddBook = (book: BookData) => {
    addBook(book);
    setIsAddModalVisible(false);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2000);
  };

  const handleBookPress = (book: BookData) => {
    console.log('Opening book detail with ISBN:', book.isbn);
    router.push({
      pathname: '/book-detail',
      params: { 
        isbn: book.isbn,
        bookData: JSON.stringify(book)
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <TopBar
        title="My Library"
        showAvatar
        avatarUrl={user.avatarUrl}
        onNotificationPress={() => console.log('Notifications pressed')}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      {books.length > 0 && (
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
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          Platform.OS !== 'ios' && styles.contentWithTabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="book" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Your library is empty
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Add a book to begin tracking your reading
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: theme.textSecondary }]}>
                {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
              </Text>
            </View>

            {filteredBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => handleBookPress(book)}
              />
            ))}

            {filteredBooks.length === 0 && (
              <View style={styles.emptyFilterState}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No books found in this category
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setIsAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddBookModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddBook={handleAddBook}
      />

      {showConfirmation && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.confirmationToast, { backgroundColor: theme.success }]}
        >
          <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
          <Text style={styles.confirmationText}>Book added successfully!</Text>
        </Animated.View>
      )}
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
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyFilterState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  confirmationToast: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 180 : 170,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  confirmationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
