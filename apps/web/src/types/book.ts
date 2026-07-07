export type BookStatus = 'unread' | 'reading' | 'read'

export interface Book {
  id: string
  user_id: string
  title: string
  author: string
  year?: number
  bio?: string
  cover_url?: string
  isbn?: string
  genre?: string
  page_count?: number
  status: BookStatus
  current_page: number
  rating?: number
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export type BookInsert = Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type BookUpdate = Partial<BookInsert>

export interface BookSearchResult {
  title: string
  author: string
  year?: number
  bio?: string
  cover_url?: string
  isbn?: string
  page_count?: number
  genre?: string
}

/** @deprecated use BookSearchResult */
export type OpenLibraryResult = BookSearchResult
