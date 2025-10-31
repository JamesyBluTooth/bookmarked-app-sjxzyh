
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Group } from '@/data/mockData';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

interface GroupCardProps {
  group: Group;
  onJoin?: () => void;
}

export default function GroupCard({ group, onJoin }: GroupCardProps) {
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Image source={{ uri: group.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]}>{group.name}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
          {group.description}
        </Text>
        
        <View style={styles.info}>
          <View style={styles.infoItem}>
            <IconSymbol name="person.2.fill" size={16} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {group.memberCount} members
            </Text>
          </View>
        </View>

        <View style={[styles.discussionBox, { backgroundColor: theme.background }]}>
          <Text style={[styles.discussionLabel, { color: theme.textSecondary }]}>
            Current Discussion:
          </Text>
          <Text style={[styles.discussionText, { color: theme.text }]} numberOfLines={1}>
            {group.currentDiscussion}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: theme.primary }]}
          onPress={onJoin}
          activeOpacity={0.7}
        >
          <Text style={styles.joinButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  info: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
  },
  discussionBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  discussionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  discussionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
