
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

interface AddProgressModalProps {
  visible: boolean;
  onClose: () => void;
  onAddProgress: (pagesRead: number, timeSpent: number) => void;
  currentPage: number;
  totalPages: number;
}

export default function AddProgressModal({
  visible,
  onClose,
  onAddProgress,
  currentPage,
  totalPages,
}: AddProgressModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [pagesRead, setPagesRead] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const pages = parseInt(pagesRead);
    const time = parseInt(timeSpent);

    if (!pages || pages <= 0) {
      setError('Please enter a valid number of pages');
      return;
    }

    if (currentPage + pages > totalPages) {
      setError(`Cannot exceed total pages (${totalPages})`);
      return;
    }

    if (!time || time <= 0) {
      setError('Please enter a valid time in minutes');
      return;
    }

    onAddProgress(pages, time);
    handleClose();
  };

  const handleClose = () => {
    setPagesRead('');
    setTimeSpent('');
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
              <Text style={[styles.title, { color: theme.text }]}>Add Progress</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={[styles.currentProgress, { color: theme.textSecondary }]}>
                Current: {currentPage} / {totalPages} pages
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Pages Read</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder="Enter number of pages"
                  placeholderTextColor={theme.textSecondary}
                  value={pagesRead}
                  onChangeText={(text) => {
                    setPagesRead(text);
                    setError('');
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Time Spent (minutes)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder="Enter time in minutes"
                  placeholderTextColor={theme.textSecondary}
                  value={timeSpent}
                  onChangeText={(text) => {
                    setTimeSpent(text);
                    setError('');
                  }}
                  keyboardType="numeric"
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
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Add</Text>
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
  currentProgress: {
    fontSize: 14,
    marginBottom: 20,
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
