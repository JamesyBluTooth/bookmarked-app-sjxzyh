
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
  Alert,
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
import EditBookDetailsModal from '@/components/EditBookDetailsModal';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [showOptions, setShowOptions] = useState(false);

  // Get book from Zustand store
  const getBookById = useAppStore((state) => state.getBookById);
  const getBookWithOverrides = useAppStore((state) => state.getBookWithOverrides);
  const updateBook = useAppStore((state) => state.updateBook);
  const deleteBook = useAppStore((state) => state.deleteBook);
  const setLocalBookOverride = useAppStore((state) => state.setLocalBookOverride);
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
      // Try to get from store first (with local overrides applied)
      const storeBook = getBookWithOverrides(isbn);
      if (storeBook) {
        setBook(storeBook);
        setLoading(false);
      } else {
        fetchBookData(isbn);
      }
    } else {
      setLoading(false);
    }
  }, [isbn, bookDataParam, fetchBookData, getBookWithOverrides]);

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

  const handleSaveBookDetails = useCallback((updates: Partial<BookData>) => {
    if (!book) return;

    // Save to local overrides (doesn't sync to Supabase)
    setLocalBookOverride(book.id, updates);

    // Update local state
    const updatedBook = { ...book, ...updates };
    setBook(updatedBook);

    console.log('Book details updated locally:', updates);
    Alert.alert(
      'Details Saved',
      'Book details have been updated locally. These changes will not sync to other devices.',
      [{ text: 'OK' }]
    );
  }, [book, setLocalBookOverride]);

  const handleDeleteBook = useCallback(() => {
    if (!book) return;

    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting book:', book.id);
            deleteBook(book.id);
            
            // Navigate back after deletion
            router.back();
          },
        },
      ]
    );
  }, [book, deleteBook, router]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  const toggleNoteExpansion = useCallback((noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
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

  // Split genres if they exist
  const genres = book.genre ? book.genre.split('/').map(g => g.trim()) : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top Half - Primary Color Background */}
        <View style={[styles.topSection, { backgroundColor: theme.primary }]}>
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButtonTop}
          >
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.topContent}>
            {/* Book Cover - Left Aligned */}
            <View style={styles.coverSection}>
              {book.coverUrl ? (
                <Image 
                  source={{ uri: book.coverUrl }} 
                  style={styles.coverSmall} 
                  resizeMode="cover" 
                />
              ) : (
                <View style={[styles.coverPlaceholderSmall, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <IconSymbol name="book" size={40} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Title and Author - Middle */}
            <View style={styles.titleSection}>
              <Text style={styles.titleWhite} numberOfLines={3}>
                {book.title}
              </Text>
              <Text style={styles.authorWhite} numberOfLines={2}>
                {book.author}
              </Text>
              {book.publishedDate && (
                <Text style={styles.dateStarted}>
                  Date Started
                </Text>
              )}
              {book.dateCompleted && (
                <Text style={styles.dateFinished}>
                  Date Finished (&quot;---&quot; until complete)
                </Text>
              )}
            </View>

            {/* Genres Card - Right */}
            {genres.length > 0 && (
              <View style={styles.genresCard}>
                <Text style={styles.genresTitle}>Genres</Text>
                <View style={styles.genresContainer}>
                  {genres.map((genre, index) => (
                    <View 
                      key={index} 
                      style={[styles.genrePill, { borderColor: theme.primary }]}
                    >
                      <Text style={[styles.genreText, { color: theme.primary }]}>
                        {genre}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Half - White Background */}
        <View style={[styles.bottomSection, { backgroundColor: theme.background }]}>
          {/* Progress Card - Bridging Section */}
          <View style={[
            styles.progressCard,
            {
              backgroundColor: isDark ? theme.card : '#FFFFFF',
              borderColor: isDark ? theme.border : '#E0E0E0',
            }
          ]}>
            <Text style={[styles.progressTitle, { color: theme.primary }]}>
              Progress (%)
            </Text>
            <View style={styles.progressBarContainer}>
              <ProgressBar progress={book.progress} height={12} />
            </View>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressPages, { color: theme.text }]}>
                {book.currentPage} / {book.pageCount} pages
              </Text>
              <Text style={[styles.progressPercentage, { color: theme.primary }]}>
                {book.progress}%
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionButtonOutlined,
                { borderColor: theme.primary }
              ]}
              onPress={() => setShowProgressModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonTextOutlined, { color: theme.primary }]}>
                + Progress
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButtonOutlined,
                { borderColor: theme.primary }
              ]}
              onPress={() => setShowNoteModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonTextOutlined, { color: theme.primary }]}>
                + Note
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButtonFilled,
                { backgroundColor: theme.primary }
              ]}
              onPress={() => setShowCompleteModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonTextFilled}>
                ✓ Complete
              </Text>
            </TouchableOpacity>
          </View>

          {/* Options Section */}
          <View style={styles.optionsSection}>
            <TouchableOpacity
              style={styles.optionsHeader}
              onPress={() => setShowOptions(!showOptions)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionsTitle, { color: theme.text }]}>
                Options
              </Text>
              <IconSymbol 
                name={showOptions ? 'chevron.up' : 'chevron.down'} 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>

            {showOptions && (
              <Animated.View 
                entering={FadeIn.duration(200)}
                style={[
                  styles.optionsContent,
                  {
                    backgroundColor: isDark ? theme.card : '#FFFFFF',
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => setShowEditModal(true)}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="pencil" size={20} color={theme.primary} />
                  <Text style={[styles.optionButtonText, { color: theme.text }]}>
                    Edit Book Details
                  </Text>
                </TouchableOpacity>

                <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleDeleteBook}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="trash" size={20} color="#FF3B30" />
                  <Text style={styles.deleteButtonText}>
                    Delete Book
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Activity Log Section */}
          {allLogs.length > 0 && (
            <View style={styles.activityLogSection}>
              <Text style={[styles.activityLogTitle, { color: theme.primary }]}>
                Activity Log
              </Text>
              
              <ScrollView 
                style={styles.activityLogScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {allLogs.map((log, index) => (
                  <View key={index} style={styles.logRow}>
                    {/* Timeline */}
                    <View style={styles.timeline}>
                      <View 
                        style={[
                          styles.timelineCircle,
                          { 
                            backgroundColor: log.type === 'progress' 
                              ? 'rgba(98, 0, 238, 0.1)' 
                              : 'rgba(255, 215, 64, 0.2)' 
                          }
                        ]}
                      >
                        <IconSymbol
                          name={log.type === 'progress' ? 'book.fill' : 'pencil'}
                          size={16}
                          color={log.type === 'progress' ? theme.primary : '#FFD740'}
                        />
                      </View>
                      {index < allLogs.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                      )}
                    </View>

                    {/* Log Card */}
                    <View 
                      style={[
                        styles.logCard,
                        {
                          backgroundColor: isDark ? theme.card : '#FFFFFF',
                          borderColor: isDark ? theme.border : '#E0E0E0',
                        }
                      ]}
                    >
                      <View style={styles.logHeader}>
                        <Text style={[styles.logDate, { color: theme.text }]}>
                          {formatDate(log.data.timestamp)}
                        </Text>
                        <Text style={[styles.logTime, { color: theme.textSecondary }]}>
                          {formatTime(log.data.timestamp)}
                        </Text>
                      </View>

                      {log.type === 'progress' && (
                        <Text style={[styles.logContent, { color: theme.text }]}>
                          Read {log.data.pagesRead} pages in {formatDuration(log.data.timeSpent)}
                        </Text>
                      )}

                      {log.type === 'note' && (
                        <View>
                          <Text 
                            style={[styles.logContent, { color: theme.text }]}
                            numberOfLines={expandedNotes.has(log.data.id) ? undefined : 2}
                          >
                            {log.data.content}
                          </Text>
                          {log.data.content.length > 100 && (
                            <TouchableOpacity 
                              onPress={() => toggleNoteExpansion(log.data.id)}
                              style={styles.readMoreButton}
                            >
                              <Text style={[styles.readMoreText, { color: theme.primary }]}>
                                {expandedNotes.has(log.data.id) ? 'Show Less' : 'Read More'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
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

      <EditBookDetailsModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveBookDetails}
        book={book}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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

  // Top Section Styles
  topSection: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  backButtonTop: {
    padding: 8,
    marginBottom: 16,
  },
  topContent: {
    flexDirection: 'row',
    gap: 16,
  },
  coverSection: {
    width: 120,
  },
  coverSmall: {
    width: 120,
    height: 180,
    borderRadius: 12,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 6,
  },
  coverPlaceholderSmall: {
    width: 120,
    height: 180,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  titleWhite: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  authorWhite: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  dateStarted: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  dateFinished: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  genresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    width: 160,
    alignSelf: 'flex-start',
  },
  genresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6200EE',
    marginBottom: 12,
    textAlign: 'center',
  },
  genresContainer: {
    gap: 8,
  },
  genrePill: {
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  genreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Section Styles
  bottomSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  progressCard: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPages: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButtonOutlined: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionButtonTextOutlined: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonFilled: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTextFilled: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Options Section
  optionsSection: {
    marginBottom: 24,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContent: {
    borderRadius: 18,
    borderWidth: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // Activity Log
  activityLogSection: {
    flex: 1,
    minHeight: 300,
  },
  activityLogTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  activityLogScroll: {
    flex: 1,
  },
  logRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeline: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 40,
  },
  logCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 12,
  },
  logContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMoreButton: {
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
