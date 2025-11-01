
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useThemeMode } from '@/contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

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
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useThemeMode();
  const themeColors = isDark ? colors.dark : colors.light;

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

  // Animated value for pill indicator position
  const animatedIndex = useSharedValue(activeTabIndex);

  useEffect(() => {
    animatedIndex.value = withSpring(activeTabIndex, {
      damping: 20,
      stiffness: 90,
      mass: 0.5,
    });
  }, [activeTabIndex, animatedIndex]);

  const handleTabPress = (route: string) => {
    router.push(route);
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: themeColors.card,
        borderTopColor: themeColors.border,
      }
    ]}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => {
          const isActive = activeTabIndex === index;

          return (
            <TabButton
              key={tab.name}
              tab={tab}
              index={index}
              isActive={isActive}
              animatedIndex={animatedIndex}
              themeColors={themeColors}
              onPress={() => handleTabPress(tab.route)}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabButtonProps {
  tab: TabBarItem;
  index: number;
  isActive: boolean;
  animatedIndex: Animated.SharedValue<number>;
  themeColors: any;
  onPress: () => void;
}

function TabButton({ tab, index, isActive, animatedIndex, themeColors, onPress }: TabButtonProps) {
  const animatedIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animatedIndex.value,
      [index - 1, index, index + 1],
      [0, 1, 0],
      'clamp'
    );

    return {
      transform: [{ scale: 0.85 + scale * 0.15 }],
    };
  });

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tabContent}>
        <Animated.View style={[
          styles.iconContainer,
          animatedIconStyle,
          isActive && { backgroundColor: themeColors.primary }
        ]}>
          <IconSymbol
            name={tab.icon}
            size={24}
            color={isActive ? '#FFFFFF' : themeColors.textSecondary}
          />
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            { color: themeColors.textSecondary },
            isActive && { color: themeColors.text, fontWeight: '600' },
          ]}
        >
          {tab.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    paddingBottom: Platform.select({
      ios: 20,
      android: 10,
      default: 10,
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -3px 0 rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
