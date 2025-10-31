
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    <View style={[styles.container, { backgroundColor: theme.card }]}>
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
