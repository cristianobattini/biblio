'use client'
import { useState } from 'react'
import { X, Search, Barcode, PenLine, Loader2 } from 'lucide-react'
import { searchByTitle, searchByISBN } from '@/lib/openlibrary'
import { insertBook } from '@/lib/books'
import { Book, BookStatus, OpenLibraryResult } from '@/types/book'
import BookCover from './BookCover'
import StarRating from '@/components/ui/StarRating'
import { cn } from '@/lib/utils'

type Mode = 'title' | 'isbn' | 'manual'

interface AddBookModalProps {
  onClose: () => void
  onAdd: (book: Book) => void
}

export default function AddBookModal({ onClose, onAdd }: AddBookModalProps) {
  const [mode, setMode] = useState<Mode>('title')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OpenLibraryResult[]>([])
  const [selected, setSelected] = useState<OpenLibraryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<BookStatus>('unread')
  const [rating, setRating] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [manual, setManual] = useState({ title: '', author: '', year: '', genre: '', page_count: '' })

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    try {
      if (mode === 'isbn') {
        const r = await searchByISBN(query)
        if (r) setSelected(r)
      } else {
        const r = await searchByTitle(query)
        setResults(r)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    setSaving(true)
    try {
      const src = selected ?? (mode === 'manual' ? {
        title: manual.title,
        author: manual.author,
        year: manual.year ? parseInt(manual.year) : undefined,
        genre: manual.genre || undefined,
        page_count: manual.page_count ? parseInt(manual.page_count) : undefined,
      } : null)
      if (!src?.title || !src?.author) return

      const book = await insertBook({
        title: src.title,
        author: src.author,
        year: src.year,
        bio: (src as OpenLibraryResult).bio,
        cover_url: (src as OpenLibraryResult).cover_url,
        isbn: (src as OpenLibraryResult).isbn,
        genre: src.genre,
        page_count: src.page_count,
        status,
        current_page: currentPage,
        rating: rating || undefined,
        notes: '',
        tags: [],
      })
      onAdd(book)
    } finally {
      setSaving(false)
    }
  }

  const canAdd = selected || (mode === 'manual' && manual.title && manual.author)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-card-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary">Aggiungi libro</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Mode selector */}
          <div>
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Metodo</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'title', label: 'Titolo', icon: Search },
                { id: 'isbn',  label: 'ISBN',   icon: Barcode },
                { id: 'manual',label: 'Manuale', icon: PenLine },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setMode(id); setResults([]); setSelected(null); setQuery('') }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs',
                    mode === id
                      ? 'bg-bg-hover border-border-strong text-text-primary'
                      : 'bg-bg-tertiary border-border text-text-muted hover:text-text-secondary'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          {mode !== 'manual' && !selected && (
            <div>
              <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">
                {mode === 'title' ? 'Titolo' : 'ISBN'}
              </p>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={mode === 'title' ? 'Es. La strada…' : 'Es. 9788804668046'}
                  className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong"
                />
                <button
                  onClick={handleSearch}
                  className="bg-accent text-bg-primary px-4 rounded-lg text-xs font-medium hover:bg-text-secondary transition-colors"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Cerca'}
                </button>
              </div>

              {results.length > 0 && (
                <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(r)}
                      className="w-full flex items-center gap-3 p-3 bg-bg-tertiary border border-border rounded-xl hover:border-border-strong transition-all text-left"
                    >
                      <BookCover coverUrl={r.cover_url} title={r.title} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{r.title}</p>
                        <p className="text-[10px] text-text-muted truncate">{r.author}</p>
                        {r.year && <p className="text-[10px] text-text-dim">{r.year}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual form */}
          {mode === 'manual' && (
            <div className="space-y-3">
              {[
                { key: 'title', label: 'Titolo *', placeholder: 'Es. La strada' },
                { key: 'author', label: 'Autore *', placeholder: 'Es. Cormac McCarthy' },
                { key: 'year', label: 'Anno', placeholder: 'Es. 2006' },
                { key: 'genre', label: 'Genere', placeholder: 'Es. Narrativa' },
                { key: 'page_count', label: 'Pagine', placeholder: 'Es. 340' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1">{label}</p>
                  <input
                    value={manual[key as keyof typeof manual]}
                    onChange={e => setManual(m => ({ ...m, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Selected book preview */}
          {selected && (
            <div className="flex items-start gap-3 p-3 bg-bg-tertiary border border-border rounded-xl">
              <BookCover coverUrl={selected.cover_url} title={selected.title} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{selected.title}</p>
                <p className="text-xs text-text-muted">{selected.author}</p>
                {selected.year && <p className="text-[10px] text-text-dim">{selected.year}</p>}
              </div>
              <button onClick={() => { setSelected(null); setResults([]) }} className="text-text-dim hover:text-text-secondary">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Stato lettura</p>
            <div className="flex gap-2">
              {(['unread', 'reading', 'read'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex-1 py-2 text-[10px] rounded-lg border transition-all',
                    status === s
                      ? 'bg-bg-hover border-border-strong text-text-primary'
                      : 'bg-bg-tertiary border-border text-text-dim hover:text-text-muted'
                  )}
                >
                  {s === 'unread' ? 'Da leggere' : s === 'reading' ? 'In lettura' : 'Letto'}
                </button>
              ))}
            </div>
          </div>

          {status === 'reading' && (
            <div>
              <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Pagina corrente</p>
              <input
                type="number"
                value={currentPage}
                onChange={e => setCurrentPage(parseInt(e.target.value) || 0)}
                min={0}
                className="w-24 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-strong"
              />
            </div>
          )}

          {/* Rating */}
          <div>
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Voto</p>
            <StarRating value={rating} onChange={setRating} size={18} />
          </div>

          <button
            onClick={handleAdd}
            disabled={!canAdd || saving}
            className="w-full bg-accent text-bg-primary font-medium text-sm rounded-xl py-3 hover:bg-text-secondary transition-colors disabled:opacity-40"
          >
            {saving ? 'Salvataggio…' : 'Aggiungi alla libreria'}
          </button>
        </div>
      </div>
    </div>
  )
}
