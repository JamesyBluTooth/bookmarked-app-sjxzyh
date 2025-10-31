
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = 600,
  borderRadius = 18,
  bottomMargin
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useThemeMode();
  const themeColors = isDark ? colors.dark : colors.light;
  const animatedValue = useSharedValue(0);

  const activeTabIndex = React.useMemo(() => {
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;

      if (pathname === tab.route) {
        score = 100;
      } else if (pathname.startsWith(tab.route)) {
        score = 80;
      } else if (pathname.includes(tab.name)) {
        score = 60;
      } else if (tab.route.includes('/(tabs)/') && pathname.includes(tab.route.split('/(tabs)/')[1])) {
        score = 40;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      animatedValue.value = withTiming(activeTabIndex, {
        duration: 300,
      });
    }
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = (route: string) => {
    router.push(route);
  };

  const pillStyle = useAnimatedStyle(() => {
    const tabWidthPercent = 100 / tabs.length;
    return {
      left: `${interpolate(
        animatedValue.value,
        tabs.map((_, i) => i),
        tabs.map((_, i) => i * tabWidthPercent)
      )}%`,
    };
  });

  const maxWidth = Math.min(containerWidth, screenWidth);

  return (
    <View style={[styles.container, { maxWidth }]}>
      <View style={[
        styles.navBar,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: isDark ? '#3A3A3C' : '#E5E7EB',
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
            },
            android: {
              elevation: 8,
            },
            web: {
              boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.05)',
            },
          }),
        }
      ]}>
        {/* Sliding Pill Indicator */}
        <Animated.View
          style={[
            styles.pill,
            {
              width: `${100 / tabs.length}%`,
              backgroundColor: '#4F46E5',
              ...Platform.select({
                ios: {
                  shadowColor: '#3730A3',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                },
                android: {
                  elevation: 4,
                },
                web: {
                  boxShadow: '0 4px 0 #3730A3, 0 4px 8px rgba(0, 0, 0, 0.1)',
                },
              }),
            },
            pillStyle,
          ]}
        />

        {/* Navigation Items */}
        {tabs.map((tab, index) => {
          const isActive = activeTabIndex === index;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={styles.navItemContent}>
                <Text style={styles.navIcon}>{getIconEmoji(tab.icon)}</Text>
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: isActive ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280'),
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Helper function to map icon names to emojis
function getIconEmoji(iconName: string): string {
  const iconMap: { [key: string]: string } = {
    'house.fill': '🏠',
    'bookmark.fill': '📚',
    'person.2.fill': '👥',
    'person.3.fill': '💬',
    'person.fill': '👤',
  };
  return iconMap[iconName] || '📱';
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    marginHorizontal: 'auto',
  },
  navBar: {
    width: '100%',
    borderTopWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    bottom: 5.6,
    height: '85%',
    borderRadius: 12,
    zIndex: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 1,
    position: 'relative',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 22.4,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 13.6,
    fontWeight: '600',
  },
});
