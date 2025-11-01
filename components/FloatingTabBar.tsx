
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
  const pillPosition = useSharedValue(0);

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
      pillPosition.value = withTiming(activeTabIndex, {
        duration: 300,
      });
    }
  }, [activeTabIndex, pillPosition]);

  const handleTabPress = (route: string, index: number) => {
    router.push(route);
  };

  const pillStyle = useAnimatedStyle(() => {
    const pillWidth = 100 / tabs.length;
    return {
      left: `${pillPosition.value * pillWidth}%`,
      width: `${pillWidth}%`,
    };
  });

  const actualWidth = Math.min(containerWidth, screenWidth);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={[
        styles.container,
        {
          width: actualWidth,
          maxWidth: containerWidth,
        }
      ]}>
        <View style={[
          styles.navContainer,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderTopColor: isDark ? '#2C2C2C' : '#E5E7EB',
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
          <Animated.View style={[
            styles.navPill,
            pillStyle,
            {
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
            }
          ]} />

          {/* Navigation Items */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;

              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.navItem}
                  onPress={() => handleTabPress(tab.route, index)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name={tab.icon}
                    size={22}
                    color={isActive ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      {
                        color: isActive ? '#FFFFFF' : '#6B7280',
                      }
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  container: {
    alignSelf: 'center',
  },
  navContainer: {
    position: 'relative',
    borderTopWidth: 2,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  navPill: {
    position: 'absolute',
    bottom: 5.6,
    height: '85%',
    borderRadius: 12,
    zIndex: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 0,
    zIndex: 1,
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  navLabel: {
    fontSize: 13.6,
    fontWeight: '600',
    marginTop: 4,
  },
});
