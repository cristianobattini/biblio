import { createClient } from './supabase'
import { Book, BookInsert, BookUpdate } from '@/types/book'

export async function getBooks(): Promise<Book[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Book[]
}

export async function getBook(id: string): Promise<Book | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Book
}

export async function insertBook(book: BookInsert): Promise<Book> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .insert({ ...book, user_id: user!.id })
    .select()
    .single()
  if (error) throw error
  return data as Book
}

export async function insertBooks(books: BookInsert[]): Promise<Book[]> {
  if (books.length === 0) return []
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const rows = books.map(b => ({ ...b, user_id: user!.id }))
  const { data, error } = await supabase
    .from('books')
    .insert(rows)
    .select()
  if (error) throw error
  return data as Book[]
}

export async function updateBook(id: string, updates: BookUpdate): Promise<Book> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Book
}

export async function deleteBook(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}
