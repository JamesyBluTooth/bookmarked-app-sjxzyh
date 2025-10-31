
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

interface TopBarProps {
  title?: string;
  showAvatar?: boolean;
  avatarUrl?: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
}

export default function TopBar({
  title,
  showAvatar = true,
  avatarUrl,
  onNotificationPress,
  onAvatarPress,
}: TopBarProps) {
  const { themeMode, setThemeMode, isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('auto');
    } else {
      setThemeMode('light');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.leftSection}>
        {title && (
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        )}
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={isDark ? 'sun.max.fill' : 'moon.fill'}
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="bell.fill"
            size={22}
            color={theme.text}
          />
          <View style={[styles.badge, { backgroundColor: theme.primary }]} />
        </TouchableOpacity>

        {showAvatar && avatarUrl && (
          <TouchableOpacity
            onPress={onAvatarPress}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
