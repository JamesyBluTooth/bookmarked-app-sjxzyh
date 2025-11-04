
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function LoginScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState('false');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Supabase Not Configured',
        'Please enable Supabase by pressing the Supabase button and connecting to your project.'
      );
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      console.log('Login successful:', data.user?.email);
      
      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', profileError);
      }

      // Navigate to onboarding if not completed, otherwise to home
      if (!profile || !profile.onboarding_completed) {
        router.replace('/auth/onboarding');
      } else {
        router.replace('/(tabs)/(home)');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn} style={styles.content}>
            {/* Logo */}
            <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
              <Text style={styles.logoText}>B</Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Email address"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

{/* Password Input with Eye Icon */}
<View style={styles.passwordContainer}>
  <TextInput
    style={[
      styles.input,
      { 
        backgroundColor: theme.card, 
        color: theme.text, 
        borderColor: theme.border,
        paddingRight: 50 // space for icon
      }
    ]}
    placeholder="Password"
    placeholderTextColor={theme.textSecondary}
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
    editable={!loading}
  />
  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    style={styles.eyeButton}
    disabled={loading}
  >
    <IconSymbol
      name={showPassword ? 'eye.slash.fill' : 'eye.fill'} // iOS SF Symbols
      color={theme.textSecondary}
      size={22}
    />
  </TouchableOpacity>
</View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              disabled={loading}
            >
              <Text style={[styles.linkText, { color: theme.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: theme.textSecondary }]}>
                New here?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/signup')}
                disabled={loading}
              >
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  Create an account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Text */}
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Your reading journey continues here 📚
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
	passwordContainer: {
  position: 'relative',
  marginBottom: 16,
},
eyeButton: {
  position: 'absolute',
  right: 16,
  top: 16,
},
});
