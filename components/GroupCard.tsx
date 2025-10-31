
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? theme.card : '#FFFFFF',
          borderColor: isDark ? theme.border : '#E0E0E0',
          transform: [{ translateY }],
        },
      ]}
    >
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
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    marginVertical: 8,
    marginHorizontal: 4,
    boxShadow: '0 3px 0 #D0D0D0',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
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
