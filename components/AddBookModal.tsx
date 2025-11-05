
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import { BookData, GoogleBookData } from '@/types/book';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBook: (book: BookData) => void;
}

export default function AddBookModal({ visible, onClose, onAddBook }: AddBookModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookData, setBookData] = useState<GoogleBookData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'reading' | 'completed'>('reading');

  const validateISBN = (value: string): boolean => {
    const cleaned = value.replace(/[-\s]/g, '');
    return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
  };

  const fetchBookData = async () => {
    if (!validateISBN(isbn)) {
      setError('Please enter a valid 10 or 13 digit ISBN');
      return;
    }

    setLoading(true);
    setError('');
    setBookData(null);

    try {
      const cleanedISBN = isbn.replace(/[-\s]/g, '');
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanedISBN}`
      );
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        setBookData(data.items[0]);
      } else {
        setError('Book not found. Please check the ISBN and try again.');
      }
    } catch (err) {
      console.error('Error fetching book data:', err);
      setError('Failed to fetch book data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!bookData) return;

    const volumeInfo = bookData.volumeInfo;
    const newBook: BookData = {
      id: Date.now().toString(),
      isbn: isbn.replace(/[-\s]/g, ''),
      title: volumeInfo.title,
      author: volumeInfo.authors?.join(', ') || 'Unknown Author',
      coverUrl: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:') ||
                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      synopsis: volumeInfo.description,
      pageCount: volumeInfo.pageCount || 0,
      genre: volumeInfo.categories?.join(', '),
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate,
      status: selectedStatus,
      currentPage: selectedStatus === 'completed' ? (volumeInfo.pageCount || 0) : 0,
      progress: selectedStatus === 'completed' ? 100 : 0,
      notes: [],
      progressEntries: [],
      dateAdded: new Date().toISOString(),
      dateCompleted: selectedStatus === 'completed' ? new Date().toISOString() : undefined,
      totalPages: volumeInfo.pageCount || 0,
    };

    onAddBook(newBook);
    handleClose();
  };

  const handleClose = () => {
    setIsbn('');
    setBookData(null);
    setError('');
    setSelectedStatus('reading');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View
            entering={SlideInDown}
            exiting={SlideOutDown}
            style={[styles.modalContainer, { backgroundColor: theme.card }]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Add a Book</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!bookData ? (
                <>
                  <Text style={[styles.label, { color: theme.text }]}>ISBN</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: error ? theme.error : theme.border,
                      }
                    ]}
                    placeholder="Enter 10 or 13 digit ISBN"
                    placeholderTextColor={theme.textSecondary}
                    value={isbn}
                    onChangeText={(text) => {
                      setIsbn(text);
                      setError('');
                    }}
                    keyboardType="numeric"
                    maxLength={17}
                  />
                  <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    You&apos;ll find the ISBN on the back cover or inside the first few pages
                  </Text>

                  {error && (
                    <Animated.View entering={FadeIn} style={styles.errorContainer}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={20} color={theme.error} />
                      <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                    </Animated.View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.button,
                      { backgroundColor: theme.primary },
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={fetchBookData}
                    disabled={loading || !isbn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Search</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <Animated.View entering={FadeIn}>
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: bookData.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') }}
                      style={styles.coverImage}
                    />
                    <View style={styles.bookInfo}>
                      <Text style={[styles.bookTitle, { color: theme.text }]}>
                        {bookData.volumeInfo.title}
                      </Text>
                      <Text style={[styles.bookAuthor, { color: theme.textSecondary }]}>
                        {bookData.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                      </Text>
                      {bookData.volumeInfo.pageCount && (
                        <Text style={[styles.bookPages, { color: theme.textSecondary }]}>
                          {bookData.volumeInfo.pageCount} pages
                        </Text>
                      )}
                      {bookData.volumeInfo.categories && (
                        <Text style={[styles.bookGenre, { color: theme.textSecondary }]}>
                          {bookData.volumeInfo.categories.join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>

                  {bookData.volumeInfo.description && (
                    <View style={styles.synopsisContainer}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>Synopsis</Text>
                      <Text
                        style={[styles.synopsis, { color: theme.textSecondary }]}
                        numberOfLines={6}
                      >
                        {bookData.volumeInfo.description.replace(/<[^>]*>/g, '')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.statusContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Reading Status
                    </Text>
                    <View style={styles.statusButtons}>
                      {(['reading', 'completed'] as const).map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusButton,
                            selectedStatus === status
                              ? { backgroundColor: theme.primary }
                              : { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 },
                          ]}
                          onPress={() => setSelectedStatus(status)}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              selectedStatus === status
                                ? { color: '#FFFFFF' }
                                : { color: theme.text },
                            ]}
                          >
                            {status === 'reading' ? 'Currently Reading' : 'Completed'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
                      onPress={() => setBookData(null)}
                    >
                      <Text style={[styles.actionButtonText, { color: theme.text }]}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.primary }]}
                      onPress={handleConfirm}
                    >
                      <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Add Book</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  hint: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  coverImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  bookAuthor: {
    fontSize: 15,
    marginBottom: 4,
  },
  bookPages: {
    fontSize: 13,
    marginBottom: 2,
  },
  bookGenre: {
    fontSize: 13,
  },
  synopsisContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  synopsis: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
