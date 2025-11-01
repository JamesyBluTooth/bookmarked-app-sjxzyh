
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useThemeMode } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@/stores/appStore';

const { height } = Dimensions.get('window');

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Biography',
  'History',
  'Self-Help',
  'Business',
  'Poetry',
  'Horror',
  'Adventure',
  'Young Adult',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? colors.dark : colors.light;
  const scrollViewRef = useRef<ScrollView>(null);
  const updateUser = useAppStore((state) => state.updateUser);

  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Page 1 fields
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [handle, setHandle] = useState('');

  // Page 2 fields
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const page = Math.round(offsetY / height);
    setCurrentPage(page);
  };

  const scrollToPage = (page: number) => {
    scrollViewRef.current?.scrollTo({ y: page * height, animated: true });
    setCurrentPage(page);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    } else {
      Alert.alert('Maximum Reached', 'You can select up to 3 genres to begin.');
    }
  };

  const handleContinue = () => {
    if (currentPage === 0) {
      // Validate page 1
      if (!username.trim()) {
        Alert.alert('Required Field', 'Please enter a username');
        return;
      }
      if (!handle.trim()) {
        Alert.alert('Required Field', 'Please enter a handle');
        return;
      }
      if (!handle.startsWith('@')) {
        Alert.alert('Invalid Handle', 'Handle must start with @');
        return;
      }
      scrollToPage(1);
    } else {
      // Complete onboarding
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      console.log('Completing onboarding...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update user profile in Supabase
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          username: username.trim(),
          handle: handle.trim(),
          bio: bio.trim() || null,
          favorite_genres: selectedGenres.length > 0 ? selectedGenres : null,
          profile_picture_url: profilePicture || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (profileError) throw profileError;

      // Update local store
      updateUser({
        name: username.trim(),
        handle: handle.trim(),
        avatarUrl: profilePicture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      });

      console.log('Onboarding completed successfully');
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', error.message || 'An error occurred during onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* Page 1: Profile Picture, Username, Handle */}
        <View style={[styles.page, { height }]}>
          <View style={styles.pageContent}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Set Up Your Profile</Text>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              Let&apos;s get to know you better
            </Text>

            {/* Profile Picture */}
            <TouchableOpacity
              style={[styles.profilePictureContainer, { borderColor: theme.border }]}
              onPress={handlePickImage}
            >
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
              ) : (
                <View style={[styles.profilePicturePlaceholder, { backgroundColor: theme.card }]}>
                  <IconSymbol name="camera" size={32} color={theme.textSecondary} />
                  <Text style={[styles.profilePictureText, { color: theme.textSecondary }]}>
                    Add Photo
                  </Text>
                  <Text style={[styles.optionalText, { color: theme.textSecondary }]}>
                    (Optional)
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Username */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Username <Text style={{ color: theme.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Enter your username"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
              />
            </View>

            {/* Handle */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Handle <Text style={{ color: theme.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="@yourhandle"
                placeholderTextColor={theme.textSecondary}
                value={handle}
                onChangeText={(text) => {
                  if (!text.startsWith('@')) {
                    setHandle('@' + text);
                  } else {
                    setHandle(text);
                  }
                }}
                autoCapitalize="none"
              />
            </View>

            {/* Swipe Indicator */}
            <View style={styles.swipeIndicator}>
              <IconSymbol name="chevron.down" size={24} color={theme.primary} />
              <Text style={[styles.swipeText, { color: theme.textSecondary }]}>
                Swipe up to continue
              </Text>
            </View>
          </View>
        </View>

        {/* Page 2: Bio, Favorite Genres */}
        <View style={[styles.page, { height }]}>
          <View style={styles.pageContent}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Tell Us More</Text>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              Share your reading interests
            </Text>

            {/* Bio */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Bio <Text style={[styles.optionalText, { color: theme.textSecondary }]}>(Optional)</Text>
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Tell us about yourself and your reading interests..."
                placeholderTextColor={theme.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Favorite Genres */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Favorite Genres{' '}
                <Text style={[styles.optionalText, { color: theme.textSecondary }]}>
                  (Optional, up to 3)
                </Text>
              </Text>
              <View style={styles.genresContainer}>
                {GENRES.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreChip,
                      {
                        backgroundColor: selectedGenres.includes(genre) ? theme.primary : theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        {
                          color: selectedGenres.includes(genre) ? '#FFFFFF' : theme.text,
                        },
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: theme.primary }]}
              onPress={handleCompleteOnboarding}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.completeButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>

            {/* Swipe Indicator */}
            <View style={styles.swipeIndicator}>
              <IconSymbol name="chevron.up" size={24} color={theme.primary} />
              <Text style={[styles.swipeText, { color: theme.textSecondary }]}>
                Swipe down to go back
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Page Indicator */}
      <View style={styles.pageIndicatorContainer}>
        <View
          style={[
            styles.pageIndicator,
            {
              backgroundColor: currentPage === 0 ? theme.primary : theme.border,
            },
          ]}
        />
        <View
          style={[
            styles.pageIndicator,
            {
              backgroundColor: currentPage === 1 ? theme.primary : theme.border,
            },
          ]}
        />
      </View>

      {/* Continue Button (Page 1 only) */}
      {currentPage === 0 && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.continueButtonContainer, { backgroundColor: theme.background }]}
        >
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    width: '100%',
    justifyContent: 'center',
  },
  pageContent: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 3,
    overflow: 'hidden',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: '400',
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 2,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  swipeIndicator: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 16,
  },
  swipeText: {
    fontSize: 14,
    marginTop: 4,
  },
  pageIndicatorContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
    flexDirection: 'column',
    gap: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  continueButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
  },
  continueButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
