import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  coverUrl?: string
  title: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { w: 48, h: 64, spine: 6, icon: 16 },
  md: { w: 72, h: 96, spine: 9, icon: 22 },
  lg: { w: 96, h: 128, spine: 12, icon: 30 },
}

export default function BookCover({ coverUrl, title, size = 'md', className }: BookCoverProps) {
  const s = sizes[size]
  return (
    <div
      className={cn('relative shrink-0 rounded overflow-hidden bg-bg-hover shadow-book', className)}
      style={{ width: s.w, height: s.h }}
    >
      {/* Spine shadow */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 bg-black/50"
        style={{ width: s.spine }}
      />
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes={`${s.w}px`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-bg-card">
          <BookOpen size={s.icon} className="text-text-dim" />
        </div>
      )}
    </div>
  )
}
