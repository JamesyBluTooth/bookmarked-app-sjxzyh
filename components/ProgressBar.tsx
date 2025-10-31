
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
}

export default function ProgressBar({ progress, height = 6, color }: ProgressBarProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const barColor = color || theme.primary;

  return (
    <View style={[styles.container, { height, backgroundColor: theme.border }]}>
      <View
        style={[
          styles.progress,
          {
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 10,
  },
});
