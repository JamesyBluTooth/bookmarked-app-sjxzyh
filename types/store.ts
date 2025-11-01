
// Re-export book types
export type {
  BookData,
  BookNote,
  ProgressEntry,
  GoogleBookData,
} from './book';

// Friend types
export interface Friend {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  isActive: boolean;
}

// Activity types
export interface Activity {
  id: string;
  friend: Friend;
  type: 'finished' | 'milestone' | 'started';
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    progress: number;
    status: 'reading' | 'to-read' | 'completed';
    rating?: number;
    totalPages?: number;
    currentPage?: number;
  };
  timestamp: Date;
  message: string;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  currentDiscussion: string;
  imageUrl: string;
}

// Friend Request types
export interface FriendRequest {
  id: string;
  friend: Friend;
  timestamp: Date;
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  unit: string;
}

// User Stats types
export interface UserStats {
  booksRead: number;
  currentStreak: number;
  activeFriends: number;
  milestones: number;
  averageRating: number;
}

// User Profile types
export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  handle: string;
  bio?: string;
  favorite_genres?: string[];
  profile_picture_url?: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Sync snapshot type
export interface SyncSnapshot {
  data: {
    books: any[];
    friends: Friend[];
    activities: Activity[];
    groups: Group[];
    friendRequests: FriendRequest[];
    challenge: Challenge | null;
    userStats: UserStats;
    user: {
      name: string;
      handle: string;
      friendCode: string;
      avatarUrl: string;
    };
  };
  version: number;
  timestamp: number;
  deviceId: string;
}
