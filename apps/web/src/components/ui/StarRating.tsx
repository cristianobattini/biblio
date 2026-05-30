'use client'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value?: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: number
}

export default function StarRating({ value = 0, onChange, readonly = false, size = 14 }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn('transition-colors', readonly ? 'cursor-default' : 'cursor-pointer')}
        >
          <Star
            size={size}
            className={cn(
              'transition-colors',
              i <= (hover || value)
                ? 'fill-text-primary text-text-primary'
                : 'fill-transparent text-text-dim'
            )}
          />
        </button>
      ))}
    </div>
  )
}
