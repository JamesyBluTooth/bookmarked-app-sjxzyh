
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkAndAwardAchievements, getUserProgress } from '@/utils/achievementHelper';

interface CompleteBookModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (rating: number, review: string) => void;
  bookTitle: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
  bookId: string;
}

export default function CompleteBookModal({
  visible,
  onClose,
  onComplete,
  bookTitle,
  bookAuthor,
  bookCoverUrl,
  bookId,
}: CompleteBookModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleComplete = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before completing.');
      return;
    }

    try {
      // Save rating to Supabase if configured
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('book_ratings').upsert({
            user_id: user.id,
            book_id: bookId,
            book_title: bookTitle,
            book_author: bookAuthor,
            book_cover_url: bookCoverUrl,
            rating,
            review_text: review || null,
          });

          // Check and award achievements
          const progress = await getUserProgress(user.id);
          await checkAndAwardAchievements(user.id, progress);
        }
      }

      onComplete(rating, review);
      setRating(0);
      setReview('');
    } catch (error) {
      console.error('Error saving book completion:', error);
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  const handleClose = () => {
    setRating(0);
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
          entering={SlideInDown.springify()}
          exiting={SlideOutDown.springify()}
          style={[styles.modal, { backgroundColor: theme.card }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Complete Book</Text>
              <TouchableOpacity onPress={handleClose}>
                <IconSymbol name="xmark.circle.fill" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.bookTitle, { color: theme.text }]}>{bookTitle}</Text>
            {bookAuthor && (
              <Text style={[styles.bookAuthor, { color: theme.textSecondary }]}>
                by {bookAuthor}
              </Text>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Rating *</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <IconSymbol
                      name={star <= rating ? 'star.fill' : 'star'}
                      size={40}
                      color={star <= rating ? theme.primary : theme.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Review (Optional)</Text>
              <TextInput
                style={[
                  styles.reviewInput,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Share your thoughts about this book..."
                placeholderTextColor={theme.textSecondary}
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: theme.primary }]}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Complete Book</Text>
            </TouchableOpacity>
          </ScrollView>
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
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  reviewInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
