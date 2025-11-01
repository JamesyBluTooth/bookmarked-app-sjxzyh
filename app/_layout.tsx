
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { syncService } from '@/services/syncService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize sync service
  useEffect(() => {
    console.log('Initializing app with Zustand + Supabase sync...');
    syncService.initialize().catch((error) => {
      console.error('Failed to initialize sync service:', error);
    });

    return () => {
      syncService.stopSync();
    };
  }, []);

  // Handle authentication state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping auth check');
      setIsReady(true);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email || 'No session');
      setSession(session);
      setIsReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email || 'No session');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isReady || !loaded) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isSupabaseConfigured()) {
      // If Supabase is not configured, allow access to the app
      if (inAuthGroup) {
        router.replace('/(tabs)/(home)');
      }
      return;
    }

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      console.log('No session, redirecting to login');
      router.replace('/auth/login');
    } else if (session && inAuthGroup && segments[1] !== 'onboarding') {
      // Check if user has completed onboarding
      checkOnboardingStatus();
    }
  }, [session, segments, isReady, loaded]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', session?.user?.id)
        .single();

      if (!profile || !profile.onboarding_completed) {
        console.log('Onboarding not completed, redirecting to onboarding');
        router.replace('/auth/onboarding');
      } else {
        console.log('Onboarding completed, redirecting to home');
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      router.replace('/auth/onboarding');
    }
  };

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <SystemBars style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="formsheet" options={{ presentation: 'formSheet' }} />
            <Stack.Screen
              name="transparent-modal"
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
              }}
            />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </NavigationThemeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
