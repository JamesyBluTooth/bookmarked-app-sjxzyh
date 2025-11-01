
import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { BookData, BookNote, ProgressEntry, GoogleBookData } from '@/types/book';
import ProgressBar from '@/components/ProgressBar';
import AddProgressModal from '@/components/AddProgressModal';
import AddNoteModal from '@/components/AddNoteModal';
import CompleteBookModal from '@/components/CompleteBookModal';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function BookDetailScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const params = useLocalSearchParams();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    console.log('Book detail params:', params);
    if (params.isbn) {
      fetchBookData(params.isbn as string);
    } else if (params.bookData) {
      // If book data is passed directly
      try {
        const bookData = JSON.parse(params.bookData as string);
        setBook(bookData);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing book data:', e);
        setError('Failed to load book data');
        setLoading(false);
      }
    } else {
      setError('No book information provided');
      setLoading(false);
    }
  }, [params]);

  const fetchBookData = async (isbn: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch book data');
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Book not found');
      }

      const googleBook: GoogleBookData = data.items[0];
      const volumeInfo = googleBook.volumeInfo;

      const bookData: BookData = {
        id: googleBook.id,
        isbn: isbn,
        title: volumeInfo.title || 'Unknown Title',
        author: volumeInfo.authors?.join(', ') || 'Unknown Author',
        coverUrl: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                  volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:') || 
                  'https://via.placeholder.com/200x300?text=No+Cover',
        synopsis: volumeInfo.description,
        pageCount: volumeInfo.pageCount || 0,
        genre: volumeInfo.categories?.[0],
        publisher: volumeInfo.publisher,
        publishedDate: volumeInfo.publishedDate,
        status: 'reading',
        currentPage: 0,
        progress: 0,
        notes: [],
        progressEntries: [],
        dateAdded: new Date().toISOString(),
      };

      setBook(bookData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching book data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load book');
      setLoading(false);
    }
  };

  const handleAddProgress = (pagesRead: number, timeSpent: number) => {
    if (!book) return;

    const newCurrentPage = Math.min(book.currentPage + pagesRead, book.pageCount);
    const newProgress = Math.round((newCurrentPage / book.pageCount) * 100);

    const progressEntry: ProgressEntry = {
      id: Date.now().toString(),
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
      status: newProgress === 100 ? 'completed' : book.status === 'to-read' ? 'reading' : book.status,
    };

    setBook(updatedBook);
    setShowProgressModal(false);
  };

  const handleAddNote = (content: string, pageNumber?: number) => {
    if (!book) return;

    const note: BookNote = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      pageNumber,
    };

    const updatedBook: BookData = {
      ...book,
      notes: [...book.notes, note],
    };

    setBook(updatedBook);
    setShowNoteModal(false);
  };

  const handleCompleteBook = (rating?: number, review?: string) => {
    if (!book) return;

    const updatedBook: BookData = {
      ...book,
      status: 'completed',
      currentPage: book.pageCount,
      progress: 100,
      rating,
      review,
      dateCompleted: new Date().toISOString(),
    };

    setBook(updatedBook);
    setShowCompleteModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`;
  };

  const allLogs = [
    ...book?.progressEntries.map(entry => ({ type: 'progress' as const, data: entry })) || [],
    ...book?.notes.map(note => ({ type: 'note' as const, data: note })) || [],
  ].sort((a, b) => {
    const timeA = new Date(a.data.timestamp).getTime();
    const timeB = new Date(b.data.timestamp).getTime();
    return timeB - timeA;
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Book Details</Text>
          <TouchableOpacity style={styles.menuButton}>
            <IconSymbol name="ellipsis" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={[styles.loadingText, { color: '#FFFFFF' }]}>
            Loading book details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !book) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Book Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <IconSymbol name="exclamationmark.triangle" size={60} color="#FFFFFF" />
          <Text style={[styles.errorText, { color: '#FFFFFF' }]}>
            {error || 'Book not found'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = book.status === 'completed';
  const dateStarted = book.dateAdded ? new Date(book.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const dateFinished = book.dateCompleted ? new Date(book.dateCompleted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Book Details</Text>
        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol name="ellipsis" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.bookInfoRow}>
            <View style={styles.coverContainer}>
              <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
            </View>

            <View style={styles.bookInfo}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>{book.author}</Text>
              <Text style={styles.dates}>
                Date Started: {dateStarted}
              </Text>
              {isCompleted && dateFinished && (
                <Text style={styles.dates}>
                  Date Finished: {dateFinished}
                </Text>
              )}
              {!isCompleted && (
                <Text style={styles.dates}>
                  Date Finished: {"--"} until complete
                </Text>
              )}
            </View>
          </View>

          {book.genre && (
            <View style={styles.genresCard}>
              <Text style={styles.genresTitle}>Genres</Text>
              <View style={styles.genreTags}>
                {book.genre.split(',').map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreTagText}>{genre.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.whiteSection}>
          {!isCompleted && (
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Progress (%)</Text>
              <View style={styles.progressBarContainer}>
                <ProgressBar progress={book.progress} />
              </View>
              <Text style={styles.progressSubtext}>
                {book.currentPage} / {book.pageCount} pages
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            {!isCompleted && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowProgressModal(true)}
                >
                  <Text style={styles.actionButtonText}>+ Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowNoteModal(true)}
                >
                  <Text style={styles.actionButtonText}>+ Note</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => setShowCompleteModal(true)}
                >
                  <Text style={styles.completeButtonText}>✓ Complete</Text>
                </TouchableOpacity>
              </>
            )}
            {isCompleted && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowNoteModal(true)}
              >
                <Text style={styles.actionButtonText}>+ Note</Text>
              </TouchableOpacity>
            )}
          </View>

          {allLogs.length > 0 && (
            <View style={styles.activitySection}>
              <Text style={styles.activityTitle}>Activity Log</Text>
              {allLogs.map((log, index) => (
                <Animated.View
                  key={`${log.type}-${log.data.id}`}
                  entering={FadeIn.delay(index * 50)}
                  style={styles.logItem}
                >
                  <View style={styles.logIconContainer}>
                    {log.type === 'note' ? (
                      <View style={styles.noteIcon}>
                        <Text style={styles.noteIconText}>+</Text>
                      </View>
                    ) : (
                      <View style={styles.progressIcon}>
                        <IconSymbol name="book" size={20} color={theme.primary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.logContent}>
                    <Text style={styles.logDate}>
                      {formatDate(log.data.timestamp)}
                    </Text>
                    {log.type === 'progress' && (
                      <Text style={styles.logText}>
                        Read {log.data.pagesRead} pages in {formatTime(log.data.timeSpent)}
                      </Text>
                    )}
                    {log.type === 'note' && (
                      <Text style={styles.logText}>
                        {log.data.content}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
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
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B4FE8',
  },
  topSection: {
    padding: 20,
  },
  bookInfoRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  coverContainer: {
    marginRight: 16,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  dates: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  genresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  genresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B4FE8',
    marginBottom: 12,
  },
  genreTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5B4FE8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  genreTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4FE8',
  },
  whiteSection: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 400,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B4FE8',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 12,
  },
  progressSubtext: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5B4FE8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B4FE8',
  },
  completeButton: {
    backgroundColor: '#5B4FE8',
    borderColor: '#5B4FE8',
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activitySection: {
    marginTop: 8,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B4FE8',
    marginBottom: 16,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  logIconContainer: {
    marginRight: 12,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3CD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#856404',
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
  },
  logDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  logText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
});
