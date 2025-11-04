
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { IconSymbol } from './IconSymbol';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { BookData } from '@/types/book';

interface EditBookDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BookData>) => void;
  book: BookData;
}

export default function EditBookDetailsModal({
  visible,
  onClose,
  onSave,
  book,
}: EditBookDetailsModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [pageCount, setPageCount] = useState(book.pageCount.toString());
  const [genre, setGenre] = useState(book.genre || '');
  const [publisher, setPublisher] = useState(book.publisher || '');
  const [publishedDate, setPublishedDate] = useState(book.publishedDate || '');
  const [synopsis, setSynopsis] = useState(book.synopsis || '');
  const [coverUrl, setCoverUrl] = useState(book.coverUrl || '');

  useEffect(() => {
    if (visible) {
      setTitle(book.title);
      setAuthor(book.author);
      setPageCount(book.pageCount.toString());
      setGenre(book.genre || '');
      setPublisher(book.publisher || '');
      setPublishedDate(book.publishedDate || '');
      setSynopsis(book.synopsis || '');
      setCoverUrl(book.coverUrl || '');
    }
  }, [visible, book]);

  const handleSave = () => {
    const pageCountNum = parseInt(pageCount, 10);
    
    if (!title.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }
    
    if (!author.trim()) {
      Alert.alert('Error', 'Author cannot be empty');
      return;
    }
    
    if (isNaN(pageCountNum) || pageCountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid page count');
      return;
    }

    const updates: Partial<BookData> = {
      title: title.trim(),
      author: author.trim(),
      pageCount: pageCountNum,
      genre: genre.trim() || undefined,
      publisher: publisher.trim() || undefined,
      publishedDate: publishedDate.trim() || undefined,
      synopsis: synopsis.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
    };

    onSave(updates);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.background,
              borderColor: isDark ? theme.border : '#E0E0E0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Edit Book Details
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View style={[styles.disclaimer, { backgroundColor: isDark ? 'rgba(255, 215, 64, 0.1)' : 'rgba(255, 215, 64, 0.15)' }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FFD740" />
            <Text style={[styles.disclaimerText, { color: theme.text }]}>
              Only edit these details if Google Books data is missing or incorrect. 
              Changes are saved locally and won&apos;t sync to other devices.
            </Text>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter book title"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Author */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Author <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={author}
                onChangeText={setAuthor}
                placeholder="Enter author name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Page Count */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Page Count <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={pageCount}
                onChangeText={setPageCount}
                placeholder="Enter page count"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
              />
            </View>

            {/* Genre */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Genre</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={genre}
                onChangeText={setGenre}
                placeholder="Enter genre (e.g., Fiction / Mystery)"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Publisher */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Publisher</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={publisher}
                onChangeText={setPublisher}
                placeholder="Enter publisher name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Published Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Published Date</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={publishedDate}
                onChangeText={setPublishedDate}
                placeholder="Enter published date (e.g., 2023-01-15)"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Cover URL */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Cover Image URL</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={coverUrl}
                onChangeText={setCoverUrl}
                placeholder="Enter cover image URL"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>

            {/* Synopsis */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Synopsis</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? theme.card : '#F5F5F5',
                    color: theme.text,
                    borderColor: isDark ? theme.border : '#E0E0E0',
                  },
                ]}
                value={synopsis}
                onChangeText={setSynopsis}
                placeholder="Enter book synopsis"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: theme.border },
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  saveButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
