'use client'
import { useState, useEffect } from 'react'
import { getBooks } from '@/lib/books'
import { Book } from '@/types/book'
import ReadingCard from '@/components/books/ReadingCard'
import BookDetail from '@/components/books/BookDetail'

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Book | null>(null)

  useEffect(() => {
    getBooks()
      .then(all => setBooks(all.filter(b => b.status === 'reading')))
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
          <div className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">In lettura</h1>
            <p className="text-xs text-text-muted mt-0.5">
              {books.length} {books.length === 1 ? 'libro' : 'libri'}
            </p>
          </div>

          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-text-muted text-sm">Nessun libro in lettura</p>
              <p className="text-text-dim text-xs mt-1">Inizia a leggere un libro dalla tua libreria</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {books.map(book => (
                <div key={book.id} className="w-full max-w-sm">
                  <ReadingCard
                    book={book}
                    onUpdate={handleUpdate}
                    onClick={() => setSelected(book)}
                  />
                </div>
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
