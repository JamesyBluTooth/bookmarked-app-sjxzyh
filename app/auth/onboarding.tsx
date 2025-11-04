
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { decode } from 'base64-arraybuffer';

const { width } = Dimensions.get('window');

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Sci-Fi',
  'Fantasy',
  'Biography',
  'History',
  'Self-Help',
  'Business',
  'Poetry',
];

export default function OnboardingScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const { isDark } = useThemeMode();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const updateUser = useAppStore((state) => state.updateUser);

  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const scrollToPage = (page: number) => {
    scrollViewRef.current?.scrollTo({ x: page * width, animated: true });
    setCurrentPage(page);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleContinue = () => {
    if (currentPage === 0) {
      if (!username.trim()) {
        Alert.alert('Required', 'Please enter your username');
        return;
      }
      if (!handle.trim()) {
        Alert.alert('Required', 'Please enter your handle');
        return;
      }
      scrollToPage(1);
    } else if (currentPage === 1) {
      scrollToPage(2);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (selectedGenres.length === 0) {
      Alert.alert('Required', 'Please select at least one favorite genre');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Starting onboarding for user:', user.id);

      let profilePictureUrl = profileImage;

      // Upload profile picture if selected
      if (profileImage && profileImage.startsWith('file://')) {
        try {
          const fileExt = profileImage.split('.').pop() || 'jpg';
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          console.log('Uploading profile picture:', filePath);

          // Read the file as base64
          const base64 = await FileSystem.readAsStringAsync(profileImage, {
            encoding: 'base64',
          });

          // Convert base64 to ArrayBuffer
          const arrayBuffer = decode(base64);

          // Determine content type
          const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, arrayBuffer, {
              contentType,
              upsert: false,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            Alert.alert('Warning', 'Profile picture upload failed, but continuing with onboarding.');
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            profilePictureUrl = publicUrl;
            console.log('Profile picture uploaded successfully:', publicUrl);
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert('Warning', 'Profile picture upload failed, but continuing with onboarding.');
        }
      }

      // Generate a unique friend code
      const friendCode = `${handle.trim().replace('@', '').toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      console.log('Generated friend code:', friendCode);

      const profileData = {
        user_id: user.id,
        username: username.trim(),
        handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
        bio: bio.trim() || null,
        favorite_genres: selectedGenres,
        profile_picture_url: profilePictureUrl,
        onboarding_completed: true,
        friend_code: friendCode,
      };

      console.log('Upserting profile data:', profileData);

      // Use upsert to insert or update the profile
      const { data: profile, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw upsertError;
      }

      console.log('Profile upserted successfully:', profile);

      // Update local store
      updateUser({
        name: username.trim(),
        handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
        avatarUrl: profilePictureUrl || '',
        friendCode: profile.friend_code,
      });

      Alert.alert('Welcome!', 'Your profile has been set up successfully', [
        {
          text: 'Get Started',
          onPress: () => router.replace('/(tabs)/(home)'),
        },
      ]);
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((page) => (
            <View
              key={page}
              style={[
                styles.progressDot,
                {
                  backgroundColor: currentPage >= page ? theme.primary : theme.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Page 1: Basic Info */}
        <View style={[styles.page, { width }]}>
          <Animated.View entering={FadeIn} style={styles.pageContent}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome to Bookmarked!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Let&apos;s set up your profile
            </Text>

            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View
                  style={[
                    styles.imagePlaceholder,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <IconSymbol name="camera.fill" size={40} color={theme.textSecondary} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Handle</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={handle}
                onChangeText={setHandle}
                placeholder="@yourhandle"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Page 2: Bio */}
        <View style={[styles.page, { width }]}>
          <Animated.View entering={FadeIn} style={styles.pageContent}>
            <Text style={[styles.title, { color: theme.text }]}>Tell us about yourself</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Share a bit about your reading journey (optional)
            </Text>

            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="I love reading because..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => scrollToPage(0)}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={handleContinue}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Page 3: Genres */}
        <View style={[styles.page, { width }]}>
          <Animated.View entering={FadeIn} style={styles.pageContent}>
            <Text style={[styles.title, { color: theme.text }]}>Favorite Genres</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Select your favorite genres (at least one)
            </Text>

            <View style={styles.genresContainer}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    {
                      backgroundColor: selectedGenres.includes(genre)
                        ? theme.primary
                        : theme.card,
                      borderColor: selectedGenres.includes(genre)
                        ? theme.primary
                        : theme.border,
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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => scrollToPage(1)}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary, flex: 1 },
                ]}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  imagePickerButton: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
