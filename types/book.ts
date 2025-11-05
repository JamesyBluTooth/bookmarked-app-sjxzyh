
export interface BookData {
  id: string;
  isbn: string;
  title: string;
  author: string;
  coverUrl: string;
  synopsis?: string;
  pageCount: number;
  genre?: string;
  publisher?: string;
  publishedDate?: string;
  status: 'reading' | 'completed';
  currentPage: number;
  progress: number;
  rating?: number;
  review?: string;
  notes: BookNote[];
  progressEntries: ProgressEntry[];
  dateAdded: string;
  dateCompleted?: string;
  totalPages?: number;
}

export interface BookNote {
  id: string;
  content: string;
  timestamp: string;
  pageNumber?: number;
}

export interface ProgressEntry {
  id: string;
  pagesRead: number;
  timeSpent: number;
  timestamp: string;
  currentPage: number;
  progressPercentage: number;
}

export interface GoogleBookData {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publisher?: string;
    publishedDate?: string;
    industryIdentifiers?: {
      type: string;
      identifier: string;
    }[];
  };
}
