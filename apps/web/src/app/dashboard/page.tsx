'use client'
import { useState, useEffect } from 'react'
import { getBooks } from '@/lib/books'
import { Book } from '@/types/book'
import ReadingCard from '@/components/books/ReadingCard'
import BookCard from '@/components/books/BookCard'
import BookDetail from '@/components/books/BookDetail'
import AddBookModal from '@/components/books/AddBookModal'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

const GENRES = ['Tutti', 'Fiction', 'Saggistica', 'Sci-fi', 'Storia', 'Fantasy', 'Thriller']

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Book | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [genre, setGenre] = useState('Tutti')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    getBooks().then(setBooks).finally(() => setLoading(false))
    createClient().auth.getUser().then(({ data }) => {
      setUserName(data.user?.email?.split('@')[0] ?? '')
    })
  }, [])

  const reading = books.filter(b => b.status === 'reading')
  const filtered = books.filter(b =>
    genre === 'Tutti' || b.genre?.toLowerCase().includes(genre.toLowerCase())
  )

  function handleUpdate(updated: Book) {
    setBooks(bs => bs.map(b => b.id === updated.id ? updated : b))
    if (selected?.id === updated.id) setSelected(updated)
  }

  function handleDelete(id: string) {
    setBooks(bs => bs.filter(b => b.id !== id))
    setSelected(null)
  }

  function handleAdd(book: Book) {
    setBooks(bs => [book, ...bs])
    setShowAdd(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-muted font-mono text-sm tracking-widest animate-pulse">caricamento…</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-8 py-7">
          {/* Topbar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text-primary">
                {userName ? `Ciao, ${userName}` : 'La tua libreria'}
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                {books.length} libri{reading.length > 0 ? ` · ${reading.length} in lettura` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  placeholder="Cerca…"
                  className="bg-bg-tertiary border border-border rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-dim w-48 focus:outline-none focus:border-border-strong"
                />
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-accent text-bg-primary text-sm font-medium px-4 py-2 rounded-lg hover:bg-text-secondary transition-colors"
              >
                <Plus size={15} />
                Aggiungi
              </button>
            </div>
          </div>

          {/* Reading carousel */}
          {reading.length > 0 && (
            <section className="mb-8">
              <p className="text-[10px] text-text-muted uppercase tracking-widest mb-3">
                In lettura · {reading.length} {reading.length === 1 ? 'libro' : 'libri'}
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {reading.map(book => (
                  <ReadingCard
                    key={book.id}
                    book={book}
                    onUpdate={handleUpdate}
                    onClick={() => setSelected(book)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Books grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={cn(
                      'shrink-0 text-xs px-4 py-1.5 rounded-full border transition-all',
                      genre === g
                        ? 'bg-bg-hover border-border-strong text-text-primary'
                        : 'bg-bg-tertiary border-border text-text-muted hover:text-text-secondary'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 shrink-0 ml-3">
                {(['grid', 'list'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      'p-1.5 rounded-lg border transition-all',
                      view === v
                        ? 'bg-bg-hover border-border-strong text-text-primary'
                        : 'bg-bg-tertiary border-border text-text-muted'
                    )}
                  >
                    {v === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-text-muted text-sm">Nessun libro trovato</p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="mt-4 text-xs text-text-dim hover:text-text-muted underline transition-colors"
                >
                  Aggiungi il tuo primo libro
                </button>
              </div>
            ) : (
              <div className={cn(
                view === 'grid'
                  ? 'grid gap-4'
                  : 'flex flex-col gap-3',
              )}
              style={view === 'grid' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' } : {}}
              >
                {filtered.map(book => (
                  <BookCard key={book.id} book={book} onClick={() => setSelected(book)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <BookDetail
          book={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* Add modal */}
      {showAdd && (
        <AddBookModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
