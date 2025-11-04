
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookData, Friend, Activity, Group, FriendRequest, Challenge, UserStats } from '@/types/store';

type ThemeMode = 'light' | 'dark' | 'auto';

export interface AppState {
  // Books
  books: BookData[];
  addBook: (book: BookData) => void;
  updateBook: (id: string, updates: Partial<BookData>) => void;
  deleteBook: (id: string) => void;
  getBookById: (id: string) => BookData | undefined;
  
  // Friends
  friends: Friend[];
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  updateFriend: (id: string, updates: Partial<Friend>) => void;
  
  // Activities
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  
  // Groups
  groups: Group[];
  addGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
  
  // Friend Requests
  friendRequests: FriendRequest[];
  addFriendRequest: (request: FriendRequest) => void;
  removeFriendRequest: (id: string) => void;
  
  // Challenge
  challenge: Challenge | null;
  updateChallenge: (challenge: Challenge) => void;
  
  // User Stats
  userStats: UserStats;
  updateUserStats: (stats: Partial<UserStats>) => void;
  
  // User Profile
  user: {
    name: string;
    handle: string;
    friendCode: string;
    avatarUrl: string;
  };
  updateUser: (updates: Partial<AppState['user']>) => void;
  
  // Theme Mode
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  
  // Sync metadata
  lastSyncTimestamp: number;
  setLastSyncTimestamp: (timestamp: number) => void;
  
  // Version for conflict resolution
  version: number;
  incrementVersion: () => void;
  
  // Reset store (for testing or logout)
  resetStore: () => void;
}

const initialState = {
  books: [],
  friends: [],
  activities: [],
  groups: [],
  friendRequests: [],
  challenge: null,
  userStats: {
    booksRead: 0,
    currentStreak: 0,
    activeFriends: 0,
    milestones: 0,
    averageRating: 0,
  },
  user: {
    name: 'Guest User',
    handle: '@guest',
    friendCode: 'BOOK-0000',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
  themeMode: 'light' as ThemeMode,
  lastSyncTimestamp: 0,
  version: 1,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Books
      addBook: (book) => {
        set((state) => ({
          books: [...state.books, book],
          version: state.version + 1,
        }));
        console.log('Book added:', book.title);
      },
      
      updateBook: (id, updates) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id ? { ...book, ...updates } : book
          ),
          version: state.version + 1,
        }));
        console.log('Book updated:', id);
      },
      
      deleteBook: (id) => {
        set((state) => ({
          books: state.books.filter((book) => book.id !== id),
          version: state.version + 1,
        }));
        console.log('Book deleted:', id);
      },
      
      getBookById: (id) => {
        return get().books.find((book) => book.id === id);
      },
      
      // Friends
      addFriend: (friend) => {
        set((state) => ({
          friends: [...state.friends, friend],
          version: state.version + 1,
        }));
        console.log('Friend added:', friend.name);
      },
      
      removeFriend: (id) => {
        set((state) => ({
          friends: state.friends.filter((friend) => friend.id !== id),
          version: state.version + 1,
        }));
        console.log('Friend removed:', id);
      },
      
      updateFriend: (id, updates) => {
        set((state) => ({
          friends: state.friends.map((friend) =>
            friend.id === id ? { ...friend, ...updates } : friend
          ),
          version: state.version + 1,
        }));
        console.log('Friend updated:', id);
      },
      
      // Activities
      addActivity: (activity) => {
        set((state) => ({
          activities: [activity, ...state.activities].slice(0, 50), // Keep last 50 activities
          version: state.version + 1,
        }));
        console.log('Activity added:', activity.type);
      },
      
      // Groups
      addGroup: (group) => {
        set((state) => ({
          groups: [...state.groups, group],
          version: state.version + 1,
        }));
        console.log('Group added:', group.name);
      },
      
      removeGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          version: state.version + 1,
        }));
        console.log('Group removed:', id);
      },
      
      // Friend Requests
      addFriendRequest: (request) => {
        set((state) => ({
          friendRequests: [...state.friendRequests, request],
          version: state.version + 1,
        }));
        console.log('Friend request added');
      },
      
      removeFriendRequest: (id) => {
        set((state) => ({
          friendRequests: state.friendRequests.filter((req) => req.id !== id),
          version: state.version + 1,
        }));
        console.log('Friend request removed:', id);
      },
      
      // Challenge
      updateChallenge: (challenge) => {
        set((state) => ({
          challenge,
          version: state.version + 1,
        }));
        console.log('Challenge updated:', challenge.title);
      },
      
      // User Stats
      updateUserStats: (stats) => {
        set((state) => ({
          userStats: { ...state.userStats, ...stats },
          version: state.version + 1,
        }));
        console.log('User stats updated');
      },
      
      // User Profile
      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
          version: state.version + 1,
        }));
        console.log('User profile updated');
      },
      
      // Theme Mode
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        console.log('Theme mode set to:', mode);
      },
      
      // Sync metadata
      setLastSyncTimestamp: (timestamp) => {
        set({ lastSyncTimestamp: timestamp });
      },
      
      incrementVersion: () => {
        set((state) => ({ version: state.version + 1 }));
      },
      
      // Reset
      resetStore: () => {
        set(initialState);
        console.log('Store reset to initial state');
      },
    }),
    {
      name: 'bookmarked-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        books: state.books,
        friends: state.friends,
        activities: state.activities,
        groups: state.groups,
        friendRequests: state.friendRequests,
        challenge: state.challenge,
        userStats: state.userStats,
        user: state.user,
        themeMode: state.themeMode,
        lastSyncTimestamp: state.lastSyncTimestamp,
        version: state.version,
      }),
    }
  )
);
