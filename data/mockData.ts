
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  progress: number;
  status: 'reading' | 'to-read' | 'completed';
  rating?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface Friend {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  isActive: boolean;
}

export interface Activity {
  id: string;
  friend: Friend;
  type: 'finished' | 'milestone' | 'started';
  book: Book;
  timestamp: Date;
  message: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  currentDiscussion: string;
  imageUrl: string;
}

export interface FriendRequest {
  id: string;
  friend: Friend;
  timestamp: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  unit: string;
}

export interface UserStats {
  booksRead: number;
  currentStreak: number;
  activeFriends: number;
  milestones: number;
  averageRating: number;
}

// Mock data
export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    progress: 65,
    status: 'reading',
    totalPages: 304,
    currentPage: 198,
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    progress: 100,
    status: 'completed',
    rating: 5,
    totalPages: 320,
    currentPage: 320,
  },
  {
    id: '3',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
    progress: 0,
    status: 'to-read',
    totalPages: 476,
  },
  {
    id: '4',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    coverUrl: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400',
    progress: 100,
    status: 'completed',
    rating: 4,
    totalPages: 256,
    currentPage: 256,
  },
  {
    id: '5',
    title: 'Dune',
    author: 'Frank Herbert',
    coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    progress: 30,
    status: 'reading',
    totalPages: 688,
    currentPage: 206,
  },
];

export const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    handle: '@sarahreads',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    isActive: true,
  },
  {
    id: '2',
    name: 'Mike Chen',
    handle: '@mikechen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    isActive: true,
  },
  {
    id: '3',
    name: 'Emma Davis',
    handle: '@emmareads',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    isActive: false,
  },
  {
    id: '4',
    name: 'Alex Turner',
    handle: '@alexbooks',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    isActive: true,
  },
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    friend: mockFriends[0],
    type: 'finished',
    book: mockBooks[1],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    message: 'just finished reading',
  },
  {
    id: '2',
    friend: mockFriends[1],
    type: 'milestone',
    book: mockBooks[0],
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    message: 'reached 50% progress on',
  },
  {
    id: '3',
    friend: mockFriends[3],
    type: 'started',
    book: mockBooks[4],
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    message: 'started reading',
  },
];

export const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Classic Readers',
    description: 'Exploring timeless literature together',
    memberCount: 234,
    currentDiscussion: 'Pride and Prejudice - Chapter 10',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
  },
  {
    id: '2',
    name: 'Sci-Fi Enthusiasts',
    description: 'Journey through space and time',
    memberCount: 567,
    currentDiscussion: 'Foundation Series Discussion',
    imageUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400',
  },
  {
    id: '3',
    name: 'Mystery Book Club',
    description: 'Unraveling mysteries one page at a time',
    memberCount: 189,
    currentDiscussion: 'The Silent Patient - Theories',
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
  },
];

export const mockFriendRequests: FriendRequest[] = [
  {
    id: '1',
    friend: {
      id: '5',
      name: 'Jessica Lee',
      handle: '@jessicareads',
      avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
      isActive: false,
    },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

export const mockChallenge: Challenge = {
  id: '1',
  title: 'Daily Reading Goal',
  description: 'Read for 30 minutes',
  progress: 18,
  goal: 30,
  unit: 'minutes',
};

export const mockUserStats: UserStats = {
  booksRead: 47,
  currentStreak: 12,
  activeFriends: 3,
  milestones: 23,
  averageRating: 4.2,
};

export const mockUser = {
  name: 'John Doe',
  handle: '@johndoe',
  friendCode: 'BOOK-2847',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
};
