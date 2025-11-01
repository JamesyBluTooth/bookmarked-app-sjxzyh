
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookData, BookNote, ProgressEntry, GoogleBookData } from '@/types/book';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import ProgressBar from '@/components/ProgressBar';
import AddProgressModal from '@/components/AddProgressModal';
import AddNoteModal from '@/components/AddNoteModal';
import CompleteBookModal from '@/components/CompleteBookModal';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppStore } from '@/stores/appStore';

export default function BookDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<BookData | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Get book from Zustand store
  const getBookById = useAppStore((state) => state.getBookById);
  const updateBook = useAppStore((state) => state.updateBook);
  const updateUserStats = useAppStore((state) => state.updateUserStats);
  const userStats = useAppStore((state) => state.userStats);

  // Memoize the ISBN to prevent unnecessary re-fetches
  const isbn = useMemo(() => params.isbn as string, [params.isbn]);
  const bookDataParam = useMemo(() => params.bookData as string, [params.bookData]);

  // Fetch book data only when ISBN changes
  const fetchBookData = useCallback(async (isbnToFetch: string) => {
    if (!isbnToFetch) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching book data for ISBN:', isbnToFetch);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnToFetch}`
      );
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const googleBook: GoogleBookData = data.items[0];
        const volumeInfo = googleBook.volumeInfo;

        const bookData: BookData = {
          id: googleBook.id,
          isbn: isbnToFetch,
          title: volumeInfo.title,
          author: volumeInfo.authors?.[0] || 'Unknown Author',
          coverUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '',
          synopsis: volumeInfo.description,
          pageCount: volumeInfo.pageCount || 0,
          genre: volumeInfo.categories?.[0],
          publisher: volumeInfo.publisher,
          publishedDate: volumeInfo.publishedDate,
          status: 'to-read',
          currentPage: 0,
          progress: 0,
          notes: [],
          progressEntries: [],
          dateAdded: new Date().toISOString(),
        };

        setBook(bookData);
      } else {
        console.log('No book found for ISBN:', isbnToFetch);
      }
    } catch (error) {
      console.error('Error fetching book data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load book data only once when component mounts or ISBN changes
  useEffect(() => {
    if (bookDataParam) {
      try {
        const parsedBook = JSON.parse(bookDataParam);
        setBook(parsedBook);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing book data:', error);
        fetchBookData(isbn);
      }
    } else if (isbn) {
      // Try to get from store first
      const storeBook = getBookById(isbn);
      if (storeBook) {
        setBook(storeBook);
        setLoading(false);
      } else {
        fetchBookData(isbn);
      }
    } else {
      setLoading(false);
    }
  }, [isbn, bookDataParam, fetchBookData, getBookById]);

  const handleAddProgress = useCallback((pagesRead: number, timeSpent: number) => {
    if (!book) return;

    const newCurrentPage = Math.min(book.currentPage + pagesRead, book.pageCount);
    const newProgress = Math.round((newCurrentPage / book.pageCount) * 100);

    const progressEntry: ProgressEntry = {
      id: `progress-${Date.now()}`,
      pagesRead,
      timeSpent,
      timestamp: new Date().toISOString(),
      currentPage: newCurrentPage,
      progressPercentage: newProgress,
    };

    const updatedBook: BookData = {
      ...book,
      currentPage: newCurrentPage,
      progress: newProgress,
      progressEntries: [...book.progressEntries, progressEntry],
      status: newProgress === 100 ? 'completed' : 'reading',
    };

    setBook(updatedBook);
    updateBook(book.id, updatedBook);
    setShowProgressModal(false);

    console.log('Progress added:', progressEntry);
  }, [book, updateBook]);

  const handleAddNote = useCallback((content: string, pageNumber?: number) => {
    if (!book) return;

    const note: BookNote = {
      id: `note-${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      pageNumber: pageNumber || book.currentPage,
    };

    const updatedBook: BookData = {
      ...book,
      notes: [...book.notes, note],
    };

    setBook(updatedBook);
    updateBook(book.id, updatedBook);
    setShowNoteModal(false);

    console.log('Note added:', note);
  }, [book, updateBook]);

  const handleCompleteBook = useCallback((rating?: number, review?: string) => {
    if (!book) return;

    const updatedBook: BookData = {
      ...book,
      status: 'completed',
      progress: 100,
      currentPage: book.pageCount,
      rating,
      review,
      dateCompleted: new Date().toISOString(),
    };

    setBook(updatedBook);
    updateBook(book.id, updatedBook);
    
    // Update user stats
    updateUserStats({
      booksRead: userStats.booksRead + 1,
      averageRating: rating 
        ? (userStats.averageRating * userStats.booksRead + rating) / (userStats.booksRead + 1)
        : userStats.averageRating,
    });

    setShowCompleteModal(false);
    console.log('Book completed:', updatedBook);
  }, [book, updateBook, updateUserStats, userStats]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const formatTime = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  // Memoize the sorted logs to prevent recalculation on every render
  const allLogs = useMemo(() => {
    if (!book) return [];
    
    return [
      ...book.progressEntries.map(entry => ({ type: 'progress' as const, data: entry })),
      ...book.notes.map(note => ({ type: 'note' as const, data: note })),
    ].sort((a, b) => {
      const timeA = new Date(a.data.timestamp).getTime();
      const timeB = new Date(b.data.timestamp).getTime();
      return timeB - timeA;
    });
  }, [book]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading book details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={60} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.text }]}>Book not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Book Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn} style={styles.content}>
          <View style={styles.coverContainer}>
            {book.coverUrl ? (
              <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: theme.card }]}>
                <IconSymbol name="book" size={60} color={theme.textSecondary} />
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.title, { color: theme.text }]}>{book.title}</Text>
            <Text style={[styles.author, { color: theme.textSecondary }]}>{book.author}</Text>
            
            {book.genre && (
              <View style={[styles.genreBadge, { backgroundColor: theme.card }]}>
                <Text style={[styles.genreText, { color: theme.primary }]}>{book.genre}</Text>
              </View>
            )}

            {book.synopsis && (
              <View style={styles.synopsisContainer}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Synopsis</Text>
                <Text style={[styles.synopsis, { color: theme.textSecondary }]}>
                  {book.synopsis}
                </Text>
              </View>
            )}

            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <IconSymbol name="book.pages" size={20} color={theme.textSecondary} />
                <Text style={[styles.metadataText, { color: theme.textSecondary }]}>
                  {book.pageCount} pages
                </Text>
              </View>
              {book.publishedDate && (
                <View style={styles.metadataItem}>
                  <IconSymbol name="calendar" size={20} color={theme.textSecondary} />
                  <Text style={[styles.metadataText, { color: theme.textSecondary }]}>
                    {book.publishedDate}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Progress</Text>
            <View style={[
              styles.progressCard, 
              { 
                backgroundColor: isDark ? theme.card : '#FFFFFF',
                borderColor: isDark ? theme.border : '#E0E0E0',
              }
            ]}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressText, { color: theme.text }]}>
                  {book.currentPage} / {book.pageCount} pages
                </Text>
                <Text style={[styles.progressPercentage, { color: theme.primary }]}>
                  {book.progress}%
                </Text>
              </View>
              <ProgressBar progress={book.progress} height={8} />
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowProgressModal(true)}
              activeOpacity={0.8}
            >
              <IconSymbol name="plus.circle.fill" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: isDark ? theme.card : '#FFFFFF',
                  borderColor: isDark ? theme.border : '#E0E0E0',
                  borderWidth: 2,
                }
              ]}
              onPress={() => setShowNoteModal(true)}
              activeOpacity={0.8}
            >
              <IconSymbol name="note.text" size={24} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Add Note</Text>
            </TouchableOpacity>

            {book.status !== 'completed' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.success }]}
                onPress={() => setShowCompleteModal(true)}
                activeOpacity={0.8}
              >
                <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Complete Book</Text>
              </TouchableOpacity>
            )}
          </View>

          {allLogs.length > 0 && (
            <View style={styles.logsSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity Log</Text>
              {allLogs.map((log, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.logCard, 
                    { 
                      backgroundColor: isDark ? theme.card : '#FFFFFF',
                      borderColor: isDark ? theme.border : '#E0E0E0',
                    }
                  ]}
                >
                  <View style={styles.logHeader}>
                    <View style={styles.logIconContainer}>
                      <IconSymbol
                        name={log.type === 'progress' ? 'chart.bar.fill' : 'note.text'}
                        size={20}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.logInfo}>
                      <Text style={[styles.logDate, { color: theme.textSecondary }]}>
                        {formatDate(log.data.timestamp)}
                      </Text>
                      {log.type === 'progress' && (
                        <Text style={[styles.logDetail, { color: theme.text }]}>
                          Read {log.data.pagesRead} pages • {formatTime(log.data.timeSpent)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {log.type === 'note' && (
                    <Text style={[styles.noteContent, { color: theme.text }]}>
                      {log.data.content}
                    </Text>
                  )}
                  {log.type === 'progress' && (
                    <View style={styles.progressLogBar}>
                      <ProgressBar progress={log.data.progressPercentage} height={4} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <AddProgressModal
        visible={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onAddProgress={handleAddProgress}
        currentPage={book.currentPage}
        totalPages={book.pageCount}
      />

      <AddNoteModal
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onAddNote={handleAddNote}
        currentPage={book.currentPage}
      />

      <CompleteBookModal
        visible={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onComplete={handleCompleteBook}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  coverContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cover: {
    width: 200,
    height: 300,
    borderRadius: 12,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  coverPlaceholder: {
    width: 200,
    height: 300,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  author: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  genreBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  synopsisContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  synopsis: {
    fontSize: 15,
    lineHeight: 22,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    justifyContent: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 18,
    gap: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logsSection: {
    marginTop: 8,
  },
  logCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 12,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  logDetail: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  progressLogBar: {
    marginTop: 12,
  },
});
