
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { BookData, BookNote, ProgressEntry } from '@/types/book';
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
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    console.log('Book detail params:', params);
  }, [params]);

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const allLogs = [
    ...book?.progressEntries.map(entry => ({ type: 'progress' as const, data: entry })) || [],
    ...book?.notes.map(note => ({ type: 'note' as const, data: note })) || [],
  ].sort((a, b) => {
    const timeA = new Date(a.data.timestamp).getTime();
    const timeB = new Date(b.data.timestamp).getTime();
    return timeB - timeA;
  });

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Book not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = book.status === 'completed';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Book Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.coverContainer, isCompleted && { borderColor: theme.success, borderWidth: 3 }]}>
          <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
          {isCompleted && (
            <View style={[styles.completedOverlay, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
              <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
                <IconSymbol name="checkmark" size={32} color="#FFFFFF" />
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{book.title}</Text>
        <Text style={[styles.author, { color: theme.textSecondary }]}>{book.author}</Text>

        {book.genre && (
          <Text style={[styles.genre, { color: theme.textSecondary }]}>{book.genre}</Text>
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
                {new Date(book.publishedDate).getFullYear()}
              </Text>
            </View>
          )}
        </View>

        {!isCompleted && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Progress</Text>
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {book.currentPage} / {book.pageCount} pages
              </Text>
            </View>
            <ProgressBar progress={book.progress} />
          </View>
        )}

        {isCompleted && book.rating && (
          <View style={styles.ratingSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Rating</Text>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <IconSymbol
                  key={i}
                  name={i < book.rating! ? 'star.fill' : 'star'}
                  size={28}
                  color={theme.highlight}
                />
              ))}
            </View>
          </View>
        )}

        {book.synopsis && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Synopsis</Text>
            <Text style={[styles.synopsis, { color: theme.textSecondary }]}>
              {book.synopsis.replace(/<[^>]*>/g, '')}
            </Text>
          </View>
        )}

        {book.review && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Review</Text>
            <Text style={[styles.review, { color: theme.textSecondary }]}>
              {book.review}
            </Text>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>
          <View style={styles.actionButtons}>
            {!isCompleted && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card }]}
                  onPress={() => setShowProgressModal(true)}
                >
                  <IconSymbol name="chart.bar.fill" size={24} color={theme.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>
                    Add Progress
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card }]}
                  onPress={() => setShowNoteModal(true)}
                >
                  <IconSymbol name="note.text" size={24} color={theme.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>
                    Add Note
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card }]}
                  onPress={() => setShowCompleteModal(true)}
                >
                  <IconSymbol name="checkmark.circle.fill" size={24} color={theme.success} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>
                    Complete Book
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {isCompleted && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card }]}
                onPress={() => setShowNoteModal(true)}
              >
                <IconSymbol name="note.text" size={24} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>
                  Add Note
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {allLogs.length > 0 && (
          <View style={styles.logsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity Logs</Text>
            {allLogs.map((log, index) => (
              <Animated.View
                key={`${log.type}-${log.data.id}`}
                entering={FadeIn.delay(index * 50)}
                style={[styles.logItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.logHeader}>
                  <View style={styles.logIconContainer}>
                    <IconSymbol
                      name={log.type === 'progress' ? 'chart.bar.fill' : 'note.text'}
                      size={20}
                      color={log.type === 'progress' ? theme.primary : theme.secondary}
                    />
                  </View>
                  <View style={styles.logContent}>
                    <Text style={[styles.logDate, { color: theme.textSecondary }]}>
                      {formatDate(log.data.timestamp)}
                    </Text>
                    {log.type === 'progress' && (
                      <View style={styles.logDetails}>
                        <Text style={[styles.logText, { color: theme.text }]}>
                          Read {log.data.pagesRead} pages in {formatTime(log.data.timeSpent)}
                        </Text>
                        <Text style={[styles.logSubtext, { color: theme.textSecondary }]}>
                          Progress: {log.data.progressPercentage}% ({log.data.currentPage}/{book.pageCount} pages)
                        </Text>
                      </View>
                    )}
                    {log.type === 'note' && (
                      <View style={styles.logDetails}>
                        {log.data.pageNumber && (
                          <Text style={[styles.logSubtext, { color: theme.textSecondary }]}>
                            Page {log.data.pageNumber}
                          </Text>
                        )}
                        <Text style={[styles.logText, { color: theme.text }]}>
                          {log.data.content}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  coverContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: 200,
    height: 300,
    borderRadius: 12,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  genre: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  ratingSection: {
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  synopsis: {
    fontSize: 15,
    lineHeight: 22,
  },
  review: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logsSection: {
    marginBottom: 24,
  },
  logItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
  },
  logDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  logDetails: {
    gap: 4,
  },
  logText: {
    fontSize: 15,
    fontWeight: '500',
  },
  logSubtext: {
    fontSize: 13,
  },
});
