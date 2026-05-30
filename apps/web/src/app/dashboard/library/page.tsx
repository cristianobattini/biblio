'use client'
import { useState, useEffect, useMemo } from 'react'
import { getBooks } from '@/lib/books'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import BookDetail from '@/components/books/BookDetail'
import AddBookModal from '@/components/books/AddBookModal'
import { Plus, LayoutGrid, List, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'added' | 'title' | 'author' | 'rating' | 'year'
type StatusFilter = 'all' | 'reading' | 'read' | 'unread'

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Tutti',
  reading: 'In lettura',
  read: 'Letti',
  unread: 'Da leggere',
}

const SORT_LABELS: Record<SortKey, string> = {
  added: 'Recenti',
  title: 'Titolo',
  author: 'Autore',
  rating: 'Voto',
  year: 'Anno',
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Book | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('added')

  useEffect(() => {
    getBooks().then(setBooks).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = books
    if (status !== 'all') result = result.filter(b => b.status === status)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre?.toLowerCase().includes(q)
      )
    }
    return [...result].sort((a, b) => {
      switch (sort) {
        case 'title':  return a.title.localeCompare(b.title)
        case 'author': return a.author.localeCompare(b.author)
        case 'rating': return (b.rating ?? 0) - (a.rating ?? 0)
        case 'year':   return (b.year ?? 0) - (a.year ?? 0)
        default:       return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [books, status, query, sort])

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text-primary">Tutti i libri</h1>
              <p className="text-xs text-text-muted mt-0.5">{books.length} libri in totale</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Cerca…"
                  className="bg-bg-tertiary border border-border rounded-lg pl-8 pr-4 py-2 text-sm text-text-primary placeholder:text-text-dim w-48 focus:outline-none focus:border-border-strong"
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

          {/* Filters */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-2">
              {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'text-xs px-4 py-1.5 rounded-full border transition-all',
                    status === s
                      ? 'bg-bg-hover border-border-strong text-text-primary'
                      : 'bg-bg-tertiary border-border text-text-muted hover:text-text-secondary'
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-xs text-text-muted focus:outline-none focus:border-border-strong cursor-pointer"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                  <option key={k} value={k}>{SORT_LABELS[k]}</option>
                ))}
              </select>
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
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-text-muted text-sm">Nessun libro trovato</p>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="mt-3 text-xs text-text-dim hover:text-text-muted underline transition-colors"
                >
                  Cancella ricerca
                </button>
              )}
            </div>
          ) : (
            <div
              className={cn(view === 'grid' ? 'grid gap-4' : 'flex flex-col gap-3')}
              style={view === 'grid' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' } : {}}
            >
              {filtered.map(book => (
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

      {showAdd && (
        <AddBookModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
