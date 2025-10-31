
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onAddNote: (content: string, pageNumber?: number) => void;
  currentPage: number;
}

export default function AddNoteModal({
  visible,
  onClose,
  onAddNote,
  currentPage,
}: AddNoteModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [content, setContent] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) {
      setError('Please enter a note');
      return;
    }

    const page = pageNumber ? parseInt(pageNumber) : undefined;
    onAddNote(content.trim(), page);
    handleClose();
  };

  const handleClose = () => {
    setContent('');
    setPageNumber('');
    setError('');
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
              <Text style={[styles.title, { color: theme.text }]}>Add Note</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Page Number (Optional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder={`Current page: ${currentPage}`}
                  placeholderTextColor={theme.textSecondary}
                  value={pageNumber}
                  onChangeText={setPageNumber}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Note</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder="Record your thoughts, observations, or reflections..."
                  placeholderTextColor={theme.textSecondary}
                  value={content}
                  onChangeText={(text) => {
                    setContent(text);
                    setError('');
                  }}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={theme.error} />
                  <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={handleSubmit}
                >
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Add Note</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  inputGroup: {
    marginBottom: 20,
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
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 120,
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
