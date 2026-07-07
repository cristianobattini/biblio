'use client'
import { Book } from '@/types/book'
import BookCover from './BookCover'
import { updateBook } from '@/lib/books'
import { useState } from 'react'

interface ReadingCardProps {
  book: Book
  onUpdate: (b: Book) => void
  onClick: () => void
}

export default function ReadingCard({ book, onUpdate, onClick }: ReadingCardProps) {
  const [saving, setSaving] = useState(false)
  const pct = book.page_count && book.current_page
    ? Math.min(100, Math.round((book.current_page / book.page_count) * 100))
    : 0

  async function handlePageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value)
    if (isNaN(val)) return
    setSaving(true)
    try {
      const updated = await updateBook(book.id, { current_page: val })
      onUpdate(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="relative bg-bg-tertiary border border-border rounded-xl p-4 w-60 shrink-0 cursor-pointer group overflow-hidden shadow-card"
      onClick={onClick}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-text-secondary" />

      <div className="flex gap-3 mb-3">
        <BookCover coverUrl={book.cover_url} title={book.title} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{book.title}</p>
          <p className="text-xs text-text-muted truncate">{book.author}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-bg-hover rounded-full mb-2 overflow-hidden">
        <div
          className="h-full bg-accent progress-bar rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        className="flex items-center justify-between"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <span>pag.</span>
          <input
            type="number"
            value={book.current_page}
            min={0}
            max={book.page_count || 9999}
            onChange={handlePageChange}
            className="w-12 bg-bg-hover border border-border rounded px-1.5 py-0.5 text-xs text-text-primary text-center focus:outline-none focus:border-border-strong"
          />
          {book.page_count && <span>/ {book.page_count}</span>}
        </div>
        <span className="text-xs font-medium text-text-secondary">{pct}%</span>
      </div>
    </div>
  )
}
