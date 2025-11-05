
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
  Alert,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkAndAwardAchievements, getUserProgress } from '@/utils/achievementHelper';

interface AddProgressModalProps {
  visible: boolean;
  onClose: () => void;
  onAddProgress: (pages: number, timeSpent: number) => void;
  bookTitle: string;
  bookId: string;
  currentPage: number;
  totalPages?: number;
}

export default function AddProgressModal({
  visible,
  onClose,
  onAddProgress,
  bookTitle,
  bookId,
  currentPage,
  totalPages,
}: AddProgressModalProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const [pages, setPages] = useState('');
  const [timeSpent, setTimeSpent] = useState('');

  const handleAdd = async () => {
    const pagesNum = parseInt(pages, 10);
    const timeNum = parseInt(timeSpent, 10);

    if (isNaN(pagesNum) || pagesNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of pages.');
      return;
    }

    if (isNaN(timeNum) || timeNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid time spent in minutes.');
      return;
    }

    if (totalPages && currentPage + pagesNum > totalPages) {
      Alert.alert(
        'Invalid Pages',
        `You cannot add more pages than the total (${totalPages} pages).`
      );
      return;
    }

    try {
      // Save reading session to Supabase if configured
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('reading_sessions').insert({
            user_id: user.id,
            book_id: bookId,
            book_title: bookTitle,
            pages_read: pagesNum,
            time_spent_minutes: timeNum,
            session_date: new Date().toISOString().split('T')[0],
          });

          // Check and award achievements
          const progress = await getUserProgress(user.id);
          await checkAndAwardAchievements(user.id, progress);
        }
      }

      onAddProgress(pagesNum, timeNum);
      setPages('');
      setTimeSpent('');
    } catch (error) {
      console.error('Error saving reading session:', error);
      Alert.alert('Error', 'Failed to save reading session. Please try again.');
    }
  };

  const handleClose = () => {
    setPages('');
    setTimeSpent('');
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
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Add Progress</Text>
            <TouchableOpacity onPress={handleClose}>
              <IconSymbol name="xmark.circle.fill" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.bookTitle, { color: theme.text }]}>{bookTitle}</Text>
          <Text style={[styles.currentProgress, { color: theme.textSecondary }]}>
            Current: Page {currentPage}
            {totalPages && ` of ${totalPages}`}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Pages Read</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter number of pages"
              placeholderTextColor={theme.textSecondary}
              value={pages}
              onChangeText={setPages}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Time Spent (minutes)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter time in minutes"
              placeholderTextColor={theme.textSecondary}
              value={timeSpent}
              onChangeText={setTimeSpent}
              keyboardType="number-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Add Progress</Text>
          </TouchableOpacity>
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
  currentProgress: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
