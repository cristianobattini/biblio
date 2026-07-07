'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Search, Barcode, PenLine, Smartphone, Loader2, Plus, Check, Maximize2, Minimize2 } from 'lucide-react'
import QRCode from 'qrcode'
import { searchByTitle, searchByISBN } from '@/lib/booksearch'
import { insertBooks } from '@/lib/books'
import { createSession, subscribeToItems, deleteSession, ScanSession, ScanItem } from '@/lib/scan'
import { Book, BookStatus, BookSearchResult } from '@/types/book'
import BookCover from './BookCover'
import { cn } from '@/lib/utils'

type Mode = 'title' | 'isbn' | 'manual' | 'mobile'

interface PendingBook extends BookSearchResult {
  _key: string
  status: BookStatus
}

interface AddBookModalProps {
  onClose: () => void
  onAdd: (books: Book[]) => void
}

const STATUS_LABEL: Record<BookStatus, string> = {
  unread: 'Da leggere',
  reading: 'In lettura',
  read: 'Letto',
}

function keyFor(b: BookSearchResult) {
  return (b.isbn ?? `${b.title}|${b.author}`).toLowerCase()
}

export default function AddBookModal({ onClose, onAdd }: AddBookModalProps) {
  const [mode, setMode] = useState<Mode>('title')
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manual, setManual] = useState({ title: '', author: '', year: '', genre: '', page_count: '' })
  const [pending, setPending] = useState<PendingBook[]>([])

  // Mobile session
  const [session, setSession] = useState<ScanSession | null>(null)
  const [qr, setQr] = useState('')
  const [sessionErr, setSessionErr] = useState('')
  const pendingKeys = useRef(new Set<string>())

  function addPending(b: BookSearchResult) {
    const k = keyFor(b)
    if (pendingKeys.current.has(k)) return
    pendingKeys.current.add(k)
    setPending(p => [{ ...b, _key: k, status: 'unread' }, ...p])
  }

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    try {
      if (mode === 'isbn') {
        const r = await searchByISBN(query)
        if (r) { addPending(r); setQuery('') }
      } else {
        setResults(await searchByTitle(query))
      }
    } finally {
      setLoading(false)
    }
  }

  function addManual() {
    if (!manual.title.trim() || !manual.author.trim()) return
    addPending({
      title: manual.title.trim(),
      author: manual.author.trim(),
      year: manual.year ? parseInt(manual.year) : undefined,
      genre: manual.genre || undefined,
      page_count: manual.page_count ? parseInt(manual.page_count) : undefined,
    })
    setManual({ title: '', author: '', year: '', genre: '', page_count: '' })
  }

  function removePending(k: string) {
    pendingKeys.current.delete(k)
    setPending(p => p.filter(b => b._key !== k))
  }

  function setStatus(k: string, status: BookStatus) {
    setPending(p => p.map(b => b._key === k ? { ...b, status } : b))
  }

  async function handleSaveAll() {
    if (pending.length === 0) return
    setSaving(true)
    try {
      const saved = await insertBooks(pending.map(b => ({
        title: b.title,
        author: b.author,
        year: b.year,
        bio: b.bio,
        cover_url: b.cover_url,
        isbn: b.isbn,
        genre: b.genre,
        page_count: b.page_count,
        status: b.status,
        current_page: 0,
        notes: '',
        tags: [],
      })))
      if (session) await deleteSession(session.id)
      onAdd(saved)
    } finally {
      setSaving(false)
    }
  }

  // Start a mobile pairing session the first time the tab is opened.
  useEffect(() => {
    if (mode !== 'mobile' || session) return
    let cancelled = false
    createSession()
      .then(async s => {
        if (cancelled) return
        setSession(s)
        const url = `${window.location.origin}/scan/${s.id}`
        setQr(await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: '#e8e8e8', light: '#0a0a0a' } }))
      })
      .catch((e) => {
        if (cancelled) return
        console.error('createSession failed:', e)
        const msg = e?.message || String(e)
        // The scan tables come from supabase_scan.sql — flag the most common cause.
        setSessionErr(
          /scan_sessions|does not exist|relation|schema cache/i.test(msg)
            ? 'Tabelle mancanti: esegui supabase_scan.sql nel SQL editor di Supabase.'
            : `Impossibile avviare la sessione: ${msg}`
        )
      })
    return () => { cancelled = true }
  }, [mode, session])

  // Subscribe to live scans coming from the phone.
  useEffect(() => {
    if (!session) return
    const unsub = subscribeToItems(session.id, (item: ScanItem) => {
      addPending({
        title: item.title,
        author: item.author,
        year: item.year,
        cover_url: item.cover_url,
        isbn: item.isbn,
        page_count: item.page_count,
        genre: item.genre,
      })
    })
    return unsub
  }, [session])

  // Clean up an unsaved session when the modal is dismissed.
  useEffect(() => {
    return () => { if (session && !saving) deleteSession(session.id).catch(() => {}) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const TABS = [
    { id: 'title' as const, label: 'Titolo', icon: Search },
    { id: 'isbn' as const, label: 'ISBN', icon: Barcode },
    { id: 'manual' as const, label: 'Manuale', icon: PenLine },
    { id: 'mobile' as const, label: 'Mobile', icon: Smartphone },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={cn(
          'bg-bg-secondary border border-border rounded-2xl w-full flex flex-col shadow-card-lg transition-all duration-200',
          expanded ? 'max-w-4xl h-[92vh]' : 'max-w-lg max-h-[90vh]'
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary">Aggiungi libri</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 text-text-dim hover:text-text-secondary transition-colors"
              title={expanded ? 'Riduci' : 'Espandi'}
            >
              {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button onClick={onClose} className="p-1 text-text-dim hover:text-text-secondary transition-colors" title="Chiudi">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Mode selector */}
          <div className="grid grid-cols-4 gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setResults([]); setQuery('') }}
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

          {/* Title / ISBN search */}
          {(mode === 'title' || mode === 'isbn') && (
            <div>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={mode === 'title' ? 'Cerca per titolo…' : 'Inserisci ISBN…'}
                  className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-accent text-bg-primary px-4 rounded-lg text-xs font-medium hover:bg-text-secondary transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : mode === 'isbn' ? 'Aggiungi' : 'Cerca'}
                </button>
              </div>

              {results.length > 0 && (
                <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                  {results.map((r, i) => {
                    const added = pendingKeys.current.has(keyFor(r))
                    return (
                      <button
                        key={i}
                        onClick={() => addPending(r)}
                        disabled={added}
                        className="w-full flex items-center gap-3 p-2.5 bg-bg-tertiary border border-border rounded-xl hover:border-border-strong transition-all text-left disabled:opacity-50"
                      >
                        <BookCover coverUrl={r.cover_url} title={r.title} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">{r.title}</p>
                          <p className="text-[10px] text-text-muted truncate">{r.author}</p>
                          {r.year && <p className="text-[10px] text-text-dim">{r.year}</p>}
                        </div>
                        {added ? <Check size={16} className="text-text-muted shrink-0" /> : <Plus size={16} className="text-text-dim shrink-0" />}
                      </button>
                    )
                  })}
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
                    onKeyDown={e => e.key === 'Enter' && addManual()}
                    placeholder={placeholder}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong"
                  />
                </div>
              ))}
              <button
                onClick={addManual}
                disabled={!manual.title.trim() || !manual.author.trim()}
                className="w-full flex items-center justify-center gap-2 bg-bg-hover border border-border-strong text-text-primary text-xs font-medium rounded-lg py-2.5 hover:bg-bg-tertiary transition-colors disabled:opacity-40"
              >
                <Plus size={14} /> Aggiungi alla lista
              </button>
            </div>
          )}

          {/* Mobile session */}
          {mode === 'mobile' && (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              {sessionErr ? (
                <p className="text-xs text-text-muted py-8">{sessionErr}</p>
              ) : qr ? (
                <>
                  <div className="rounded-xl overflow-hidden border border-border p-2 bg-bg-primary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr} alt="QR sessione mobile" width={200} height={200} />
                  </div>
                  <p className="text-xs text-text-secondary max-w-xs">
                    Inquadra il QR con la fotocamera del telefono, poi scansiona i codici a barre dei libri.
                  </p>
                  <p className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    In attesa di scansioni…
                  </p>
                </>
              ) : (
                <Loader2 size={20} className="animate-spin text-text-muted my-8" />
              )}
            </div>
          )}

          {/* Pending list */}
          {pending.length > 0 && (
            <div>
              <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">
                Da salvare · {pending.length}
              </p>
              <div className={cn(
                'overflow-y-auto',
                expanded
                  ? 'grid grid-cols-2 gap-2 max-h-[46vh]'
                  : 'space-y-2 max-h-64'
              )}>
                {pending.map(b => (
                  <div key={b._key} className="flex items-center gap-3 p-2.5 bg-bg-tertiary border border-border rounded-xl">
                    <BookCover coverUrl={b.cover_url} title={b.title} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{b.title}</p>
                      <p className="text-[10px] text-text-muted truncate mb-1.5">{b.author}</p>
                      <div className="flex gap-1">
                        {(['unread', 'reading', 'read'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setStatus(b._key, s)}
                            className={cn(
                              'text-[9px] px-2 py-0.5 rounded-full border transition-all',
                              b.status === s
                                ? 'bg-bg-hover border-border-strong text-text-primary'
                                : 'bg-bg-secondary border-border text-text-dim hover:text-text-muted'
                            )}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removePending(b._key)} className="text-text-dim hover:text-text-secondary shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-subtle">
          <button
            onClick={handleSaveAll}
            disabled={pending.length === 0 || saving}
            className="w-full bg-accent text-bg-primary font-medium text-sm rounded-xl py-3 hover:bg-text-secondary transition-colors disabled:opacity-40"
          >
            {saving ? 'Salvataggio…' : pending.length > 0 ? `Salva tutti (${pending.length})` : 'Aggiungi libri alla lista'}
          </button>
        </div>
      </div>
    </div>
  )
}
