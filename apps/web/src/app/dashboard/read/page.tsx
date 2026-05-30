'use client'
import { useState, useEffect } from 'react'
import { getBooks } from '@/lib/books'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import BookDetail from '@/components/books/BookDetail'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReadPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Book | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    getBooks()
      .then(all => setBooks(
        all.filter(b => b.status === 'read').sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      ))
      .finally(() => setLoading(false))
  }, [])

  function handleUpdate(updated: Book) {
    setBooks(bs => bs.map(b => b.id === updated.id ? updated : b))
    if (selected?.id === updated.id) setSelected(updated)
  }

  function handleDelete(id: string) {
    setBooks(bs => bs.filter(b => b.id !== id))
    setSelected(null)
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text-primary">Letti</h1>
              <p className="text-xs text-text-muted mt-0.5">
                {books.length} {books.length === 1 ? 'libro' : 'libri'}
              </p>
            </div>
            <div className="flex gap-1">
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

          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-text-muted text-sm">Nessun libro letto</p>
              <p className="text-text-dim text-xs mt-1">I libri che hai terminato appariranno qui</p>
            </div>
          ) : (
            <div
              className={cn(view === 'grid' ? 'grid gap-4' : 'flex flex-col gap-3')}
              style={view === 'grid' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' } : {}}
            >
              {books.map(book => (
                <BookCard key={book.id} book={book} onClick={() => setSelected(book)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <BookDetail
          book={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
