'use client'
import { Book } from '@/types/book'
import BookCover from './BookCover'
import StarRating from '@/components/ui/StarRating'
import StatusBadge from '@/components/ui/StatusBadge'

interface BookCardProps {
  book: Book
  onClick: () => void
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      className="bg-bg-tertiary border border-border rounded-xl overflow-hidden cursor-pointer card-hover shadow-card"
      onClick={onClick}
    >
      <div className="h-28 bg-bg-card flex items-center justify-center">
        <BookCover coverUrl={book.cover_url} title={book.title} size="md" />
      </div>
      <div className="p-3">
        <p className="text-[13px] font-medium text-text-primary truncate mb-0.5">{book.title}</p>
        <p className="text-[11px] text-text-muted truncate mb-2">{book.author}</p>
        <div className="flex items-center justify-between">
          <StarRating value={book.rating} readonly size={12} />
          <StatusBadge status={book.status} />
        </div>
        {book.genre && (
          <p className="text-[10px] text-text-dim mt-1.5 truncate">{book.genre}</p>
        )}
      </div>
    </div>
  )
}
