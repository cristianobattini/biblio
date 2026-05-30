'use client'
import { useState, useEffect, useMemo } from 'react'
import { getBooks } from '@/lib/books'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import BookDetail from '@/components/books/BookDetail'
import { ArrowLeft } from 'lucide-react'

export default function GenresPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Book | null>(null)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)

  useEffect(() => {
    getBooks().then(setBooks).finally(() => setLoading(false))
  }, [])

  const genres = useMemo(() => {
    const map = new Map<string, number>()
    for (const book of books) {
      const g = book.genre?.trim()
      if (g) map.set(g, (map.get(g) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [books])

  const genreBooks = useMemo(() =>
    activeGenre ? books.filter(b => b.genre?.trim() === activeGenre) : [],
    [books, activeGenre]
  )

  function handleUpdate(updated: Book) {
    setBooks(bs => bs.map(b => b.id === updated.id ? updated : b))
    if (selected?.id === updated.id) setSelected(updated)
  }

  function handleDelete(id: string) {
    setBooks(bs => bs.filter(b => b.id !== id))
    setSelected(null)
  }

  const noGenre = books.filter(b => !b.genre?.trim()).length

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
          {activeGenre ? (
            <>
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => { setActiveGenre(null); setSelected(null) }}
                  className="text-text-dim hover:text-text-secondary transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-text-primary">{activeGenre}</h1>
                  <p className="text-xs text-text-muted mt-0.5">{genreBooks.length} {genreBooks.length === 1 ? 'libro' : 'libri'}</p>
                </div>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {genreBooks.map(book => (
                  <BookCard key={book.id} book={book} onClick={() => setSelected(book)} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-xl font-semibold tracking-tight text-text-primary">Generi</h1>
                <p className="text-xs text-text-muted mt-0.5">{genres.length} {genres.length === 1 ? 'genere' : 'generi'}</p>
              </div>

              {genres.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-text-muted text-sm">Nessun genere trovato</p>
                  <p className="text-text-dim text-xs mt-1">Aggiungi un genere ai tuoi libri</p>
                </div>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {genres.map(([genre, count]) => (
                    <button
                      key={genre}
                      onClick={() => setActiveGenre(genre)}
                      className="bg-bg-tertiary border border-border rounded-xl p-5 text-left hover:bg-bg-hover hover:border-border-strong transition-all card-hover shadow-card"
                    >
                      <p className="text-sm font-medium text-text-primary mb-1">{genre}</p>
                      <p className="text-[11px] text-text-muted">{count} {count === 1 ? 'libro' : 'libri'}</p>
                      <div className="mt-3 h-0.5 bg-bg-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-text-muted rounded-full"
                          style={{ width: `${Math.round((count / books.length) * 100)}%` }}
                        />
                      </div>
                    </button>
                  ))}
                  {noGenre > 0 && (
                    <div className="bg-bg-tertiary border border-border-subtle rounded-xl p-5 opacity-50">
                      <p className="text-sm font-medium text-text-muted mb-1">Senza genere</p>
                      <p className="text-[11px] text-text-dim">{noGenre} {noGenre === 1 ? 'libro' : 'libri'}</p>
                    </div>
                  )}
                </div>
              )}
            </>
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
