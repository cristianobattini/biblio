import { createClient } from './supabase'
import { BookSearchResult } from '@/types/book'

export interface ScanSession {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

export interface ScanItem {
  id: string
  session_id: string
  isbn?: string
  title: string
  author: string
  cover_url?: string
  year?: number
  page_count?: number
  genre?: string
  created_at: string
}

// Desktop: open a pairing session. Its id is the token embedded in the QR code.
export async function createSession(): Promise<ScanSession> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non risulti autenticato su questo indirizzo. Apri la dashboard dallo stesso URL con cui hai fatto login (es. non passare da localhost a un IP di rete) ed effettua di nuovo l\'accesso.')
  }
  const { data, error } = await supabase
    .from('scan_sessions')
    .insert({ user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data as ScanSession
}

// Phone: confirm the session exists and is still valid before scanning.
export async function getSession(id: string): Promise<ScanSession | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('scan_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return (data as ScanSession) ?? null
}

// Phone: push a scanned book into the session's scratch queue.
export async function insertScanItem(
  sessionId: string,
  book: BookSearchResult
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('scan_items').insert({
    session_id: sessionId,
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    cover_url: book.cover_url,
    year: book.year,
    page_count: book.page_count,
    genre: book.genre,
  })
  if (error) throw error
}

// Desktop: subscribe to books as the phone scans them. Returns an unsubscribe fn.
export function subscribeToItems(
  sessionId: string,
  onItem: (item: ScanItem) => void
): () => void {
  const supabase = createClient()
  const channel = supabase
    .channel(`scan:${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'scan_items', filter: `session_id=eq.${sessionId}` },
      payload => onItem(payload.new as ScanItem)
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

// Desktop: tear down the session (cascade-deletes its items) when done.
export async function deleteSession(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('scan_sessions').delete().eq('id', id)
}
