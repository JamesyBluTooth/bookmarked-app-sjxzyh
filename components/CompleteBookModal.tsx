
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
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface CompleteBookModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (rating?: number, review?: string) => void;
}

export default function CompleteBookModal({
  visible,
  onClose,
  onComplete,
}: CompleteBookModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    onComplete(rating, review.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setRating(undefined);
    setReview('');
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
              <Text style={[styles.title, { color: theme.text }]}>Complete Book</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Rate this book (Optional)
                </Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <IconSymbol
                        name={rating && star <= rating ? 'star.fill' : 'star'}
                        size={40}
                        color={rating && star <= rating ? theme.highlight : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating && (
                  <TouchableOpacity
                    onPress={() => setRating(undefined)}
                    style={styles.clearButton}
                  >
                    <Text style={[styles.clearText, { color: theme.textSecondary }]}>
                      Clear rating
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Write a review (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder="Share your thoughts about this book..."
                  placeholderTextColor={theme.textSecondary}
                  value={review}
                  onChangeText={setReview}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.success }]}
                  onPress={handleSubmit}
                >
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Complete</Text>
                </TouchableOpacity>
              </View>
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
    maxHeight: '80%',
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  starButton: {
    padding: 4,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 8,
  },
  clearText: {
    fontSize: 14,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 150,
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
