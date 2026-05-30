import { supabase } from './supabase'
import { Book, BookInsert, BookUpdate } from '../types/book'

export async function getBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Book[]
}

export async function insertBook(book: BookInsert): Promise<Book> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .insert({ ...book, user_id: user!.id })
    .select()
    .single()
  if (error) throw error
  return data as Book
}

export async function updateBook(id: string, updates: BookUpdate): Promise<Book> {
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
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}
