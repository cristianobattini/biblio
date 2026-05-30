'use client'
import { useState, useEffect, useMemo } from 'react'
import { getBooks } from '@/lib/books'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import BookDetail from '@/components/books/BookDetail'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TagsPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Book | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    getBooks().then(setBooks).finally(() => setLoading(false))
  }, [])

  const tags = useMemo(() => {
    const map = new Map<string, number>()
    for (const book of books) {
      for (const tag of book.tags) {
        if (tag) map.set(tag, (map.get(tag) ?? 0) + 1)
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [books])

  const tagBooks = useMemo(() =>
    activeTag ? books.filter(b => b.tags.includes(activeTag)) : [],
    [books, activeTag]
  )

  const maxCount = tags[0]?.[1] ?? 1

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
          {activeTag ? (
            <>
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => { setActiveTag(null); setSelected(null) }}
                  className="text-text-dim hover:text-text-secondary transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-text-primary">#{activeTag}</h1>
                  <p className="text-xs text-text-muted mt-0.5">{tagBooks.length} {tagBooks.length === 1 ? 'libro' : 'libri'}</p>
                </div>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {tagBooks.map(book => (
                  <BookCard key={book.id} book={book} onClick={() => setSelected(book)} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-xl font-semibold tracking-tight text-text-primary">Tags</h1>
                <p className="text-xs text-text-muted mt-0.5">{tags.length} {tags.length === 1 ? 'tag' : 'tags'}</p>
              </div>

              {tags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-text-muted text-sm">Nessun tag trovato</p>
                  <p className="text-text-dim text-xs mt-1">Aggiungi tag ai tuoi libri dal pannello dettagli</p>
                </div>
              ) : (
                <>
                  {/* Tag cloud */}
                  <div className="flex flex-wrap gap-2 mb-10">
                    {tags.map(([tag, count]) => {
                      const scale = 0.7 + (count / maxCount) * 0.6
                      return (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className={cn(
                            'bg-bg-tertiary border border-border rounded-full px-3 py-1.5 text-text-muted hover:bg-bg-hover hover:border-border-strong hover:text-text-secondary transition-all',
                          )}
                          style={{ fontSize: `${Math.round(10 * scale)}px` }}
                        >
                          #{tag}
                          <span className="ml-1.5 text-text-dim text-[10px]">{count}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Tag list */}
                  <p className="text-[10px] text-text-dim uppercase tracking-widest mb-4">Tutti i tag</p>
                  <div className="flex flex-col gap-2">
                    {tags.map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        className="flex items-center justify-between bg-bg-tertiary border border-border rounded-xl px-4 py-3 hover:bg-bg-hover hover:border-border-strong transition-all text-left group"
                      >
                        <span className="text-sm text-text-primary">#{tag}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-0.5 bg-bg-hover rounded-full overflow-hidden">
                            <div
                              className="h-full bg-text-muted rounded-full"
                              style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted w-12 text-right">
                            {count} {count === 1 ? 'libro' : 'libri'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
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
