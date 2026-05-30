import { BookStatus } from '@/types/book'
import { cn } from '@/lib/utils'

const config: Record<BookStatus, { label: string; className: string }> = {
  reading: { label: 'In lettura', className: 'bg-bg-hover text-text-secondary border-border-strong' },
  read:    { label: 'Letto',      className: 'bg-bg-tertiary text-text-muted border-border' },
  unread:  { label: 'Da leggere', className: 'bg-bg-secondary text-text-dim border-border-subtle' },
}

export default function StatusBadge({ status }: { status: BookStatus }) {
  const { label, className } = config[status]
  return (
    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', className)}>
      {label}
    </span>
  )
}
