'use client'
import { useState, useEffect } from 'react'
import { Book, BookUpdate } from '@/types/book'
import { updateBook, deleteBook } from '@/lib/books'
import BookCover from './BookCover'
import StarRating from '@/components/ui/StarRating'
import StatusBadge from '@/components/ui/StatusBadge'
import { X, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookDetailProps {
  book: Book
  onClose: () => void
  onUpdate: (b: Book) => void
  onDelete: (id: string) => void
}

export default function BookDetail({ book, onClose, onUpdate, onDelete }: BookDetailProps) {
  const [data, setData] = useState<Book>(book)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  // Re-focus the panel on a different book when the selection changes.
  useEffect(() => {
    setData(book)
    setTagInput('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])

  const pct = data.page_count && data.current_page
    ? Math.min(100, Math.round((data.current_page / data.page_count) * 100))
    : 0

  async function save(updates: BookUpdate) {
    setSaving(true)
    try {
      const updated = await updateBook(data.id, updates)
      setData(updated)
      onUpdate(updated)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Eliminare questo libro?')) return
    await deleteBook(data.id)
    onDelete(data.id)
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || data.tags.includes(t)) return
    const tags = [...data.tags, t]
    setData(d => ({ ...d, tags }))
    save({ tags })
    setTagInput('')
  }

  function removeTag(tag: string) {
    const tags = data.tags.filter(t => t !== tag)
    setData(d => ({ ...d, tags }))
    save({ tags })
  }

  return (
    <div className="w-[560px] max-w-[95vw] shrink-0 bg-bg-secondary border-l border-border flex flex-col h-screen sticky top-0 shadow-panel overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-subtle">
        <button onClick={handleDelete} className="text-text-dim hover:text-text-muted transition-colors">
          <Trash2 size={15} />
        </button>
        <button onClick={onClose} className="text-text-dim hover:text-text-secondary transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Cover + meta */}
      <div className="p-5">
        <BookCover coverUrl={data.cover_url} title={data.title} size="lg" className="mb-4" />
        <h2 className="text-base font-semibold text-text-primary leading-tight mb-1">{data.title}</h2>
        <p className="text-sm text-text-muted mb-1">{data.author}</p>
        {data.year && <p className="text-xs text-text-dim mb-3">{data.year}{data.genre ? ` · ${data.genre}` : ''}</p>}

        <StarRating
          value={data.rating}
          onChange={v => { setData(d => ({ ...d, rating: v })); save({ rating: v }) }}
          size={16}
        />
      </div>

      <div className="border-t border-border-subtle" />

      {/* Status */}
      <div className="p-5">
        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Stato</p>
        <div className="flex gap-2">
          {(['unread', 'reading', 'read'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setData(d => ({ ...d, status: s })); save({ status: s }) }}
              className={cn(
                'flex-1 text-[10px] py-1.5 rounded-lg border transition-all',
                data.status === s
                  ? 'bg-bg-hover border-border-strong text-text-primary'
                  : 'bg-bg-tertiary border-border text-text-dim hover:text-text-muted'
              )}
            >
              {s === 'unread' ? 'Da leggere' : s === 'reading' ? 'In lettura' : 'Letto'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress (only when reading) */}
      {data.status === 'reading' && (
        <>
          <div className="border-t border-border-subtle" />
          <div className="p-5">
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">Avanzamento</p>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={data.current_page}
                min={0}
                max={data.page_count || 9999}
                onChange={e => setData(d => ({ ...d, current_page: parseInt(e.target.value) || 0 }))}
                onBlur={() => save({ current_page: data.current_page })}
                className="w-16 bg-bg-tertiary border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary text-center focus:outline-none focus:border-border-strong"
              />
              <span className="text-xs text-text-dim">/</span>
              <input
                type="number"
                value={data.page_count ?? ''}
                min={0}
                placeholder="tot"
                onChange={e => setData(d => ({ ...d, page_count: parseInt(e.target.value) || undefined }))}
                onBlur={() => save({ page_count: data.page_count })}
                className="w-16 bg-bg-tertiary border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary text-center placeholder:text-text-dim focus:outline-none focus:border-border-strong"
              />
              <span className="text-xs text-text-muted">pag.</span>
              <span className="ml-auto text-xs font-medium text-text-secondary">{pct}%</span>
            </div>
            <div className="h-1 bg-bg-hover rounded-full overflow-hidden">
              <div className="h-full bg-accent progress-bar rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </>
      )}

      {/* Bio */}
      {data.bio && (
        <>
          <div className="border-t border-border-subtle" />
          <div className="p-5">
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Sinossi</p>
            <p className="text-xs text-text-muted leading-relaxed line-clamp-6">{data.bio}</p>
          </div>
        </>
      )}

      <div className="border-t border-border-subtle" />

      {/* Notes */}
      <div className="p-5">
        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">Le mie riflessioni</p>
        <textarea
          value={data.notes || ''}
          onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
          onBlur={() => save({ notes: data.notes })}
          rows={4}
          placeholder="Scrivi le tue note…"
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong resize-none leading-relaxed"
        />
      </div>

      <div className="border-t border-border-subtle" />

      {/* Tags */}
      <div className="p-5">
        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">Tags</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-bg-hover border border-border rounded-full px-2 py-0.5 text-[10px] text-text-muted"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="text-text-dim hover:text-text-muted">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Aggiungi tag…"
            className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong"
          />
          <button onClick={addTag} className="bg-bg-hover border border-border rounded-lg px-2 py-1.5 text-text-muted hover:text-text-secondary transition-colors">
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
