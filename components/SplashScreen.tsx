
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

export default function SplashScreen() {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
          <IconSymbol name="book.fill" size={60} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Bookmarked</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your Reading Companion
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});
