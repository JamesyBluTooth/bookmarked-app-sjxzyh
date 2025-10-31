
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

export default function StatCard({ icon, value, label, color }: StatCardProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const iconColor = color || theme.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? theme.card : '#FFFFFF',
          borderColor: isDark ? theme.border : '#E0E0E0',
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <IconSymbol name={icon} size={24} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginVertical: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});
