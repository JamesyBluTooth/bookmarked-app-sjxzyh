
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import * as SplashScreenExpo from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '@/components/SplashScreen';
import { View } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreenExpo.preventAutoHideAsync();

const SPLASH_SHOWN_KEY = '@bookmarked_splash_shown';

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Checking if splash has been shown before...');
        const hasShownSplash = await AsyncStorage.getItem(SPLASH_SHOWN_KEY);
        
        if (!hasShownSplash) {
          console.log('First time loading app, showing splash screen');
          setShowCustomSplash(true);
          await AsyncStorage.setItem(SPLASH_SHOWN_KEY, 'true');
          
          // Show splash for 2 seconds
          setTimeout(() => {
            setShowCustomSplash(false);
            setAppIsReady(true);
          }, 2000);
        } else {
          console.log('App has been loaded before, skipping splash');
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn('Error checking splash status:', e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreenExpo.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady || showCustomSplash) {
    return (
      <ThemeProvider>
        <SplashScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <WidgetProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'default',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="book-detail" />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="transparent-modal"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="formsheet"
            options={{
              presentation: 'formSheet',
            }}
          />
        </Stack>
      </WidgetProvider>
    </ThemeProvider>
  );
}
