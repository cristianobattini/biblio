'use client'
import { useState, useEffect, useMemo } from 'react'
import { getBooks } from '@/lib/books'
import { Book } from '@/types/book'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-bg-tertiary border border-border rounded-xl p-5">
      <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">{label}</p>
      <p className="text-2xl font-semibold text-text-primary tracking-tight">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

function Bar({ label, value, max, count }: { label: string; value: number; max: number; count: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-24 truncate shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden">
        <div className="h-full bg-text-secondary rounded-full progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-dim w-6 text-right shrink-0">{count}</span>
    </div>
  )
}

export default function StatsPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBooks().then(setBooks).finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const total = books.length
    const reading = books.filter(b => b.status === 'reading').length
    const read = books.filter(b => b.status === 'read').length
    const unread = books.filter(b => b.status === 'unread').length

    const pagesRead = books
      .filter(b => b.status === 'read')
      .reduce((s, b) => s + (b.page_count ?? 0), 0)
    const pagesInProgress = books
      .filter(b => b.status === 'reading')
      .reduce((s, b) => s + (b.current_page ?? 0), 0)

    const rated = books.filter(b => b.rating != null && b.rating > 0)
    const avgRating = rated.length
      ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1)
      : '—'

    const genreMap = new Map<string, number>()
    for (const book of books) {
      const g = book.genre?.trim()
      if (g) genreMap.set(g, (genreMap.get(g) ?? 0) + 1)
    }
    const topGenres = [...genreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    const maxGenre = topGenres[0]?.[1] ?? 1

    const ratingDist = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: books.filter(b => b.rating === star).length,
    }))
    const maxRating = Math.max(...ratingDist.map(r => r.count), 1)

    const monthMap = new Map<string, number>()
    for (const book of books) {
      const d = new Date(book.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
    }
    const last12 = Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (11 - i))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('it-IT', { month: 'short' })
      return { key, label, count: monthMap.get(key) ?? 0 }
    })
    const maxMonth = Math.max(...last12.map(m => m.count), 1)

    return { total, reading, read, unread, pagesRead, pagesInProgress, avgRating, rated: rated.length, topGenres, maxGenre, ratingDist, maxRating, last12, maxMonth }
  }, [books])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-muted font-mono text-sm tracking-widest animate-pulse">caricamento…</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-7 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Statistiche</h1>
          <p className="text-xs text-text-muted mt-0.5">Una panoramica della tua lettura</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
          <StatCard label="Totale" value={stats.total} sub="libri" />
          <StatCard label="Letti" value={stats.read} sub="completati" />
          <StatCard label="In lettura" value={stats.reading} sub="in corso" />
          <StatCard label="Da leggere" value={stats.unread} sub="in lista" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatCard
            label="Pagine lette"
            value={stats.pagesRead.toLocaleString('it-IT')}
            sub={stats.pagesInProgress > 0 ? `+${stats.pagesInProgress.toLocaleString('it-IT')} in corso` : undefined}
          />
          <StatCard
            label="Voto medio"
            value={stats.avgRating}
            sub={stats.rated > 0 ? `su ${stats.rated} libri valutati` : 'nessun voto'}
          />
        </div>

        {/* Activity (last 12 months) */}
        <div className="bg-bg-tertiary border border-border rounded-xl p-5 mb-5">
          <p className="text-[10px] text-text-dim uppercase tracking-widest mb-5">Libri aggiunti · ultimi 12 mesi</p>
          <div className="flex items-end gap-1.5 h-20">
            {stats.last12.map(({ key, label, count }) => (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 56 }}>
                  <div
                    className="w-full bg-text-dim rounded-sm transition-all"
                    style={{ height: stats.maxMonth > 0 ? `${Math.max(2, Math.round((count / stats.maxMonth) * 56))}px` : '2px' }}
                  />
                </div>
                <span className="text-[9px] text-text-dim">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Top genres */}
          {stats.topGenres.length > 0 && (
            <div className="bg-bg-tertiary border border-border rounded-xl p-5">
              <p className="text-[10px] text-text-dim uppercase tracking-widest mb-4">Generi principali</p>
              <div className="flex flex-col gap-3">
                {stats.topGenres.map(([genre, count]) => (
                  <Bar key={genre} label={genre} value={count} max={stats.maxGenre} count={count} />
                ))}
              </div>
            </div>
          )}

          {/* Rating distribution */}
          <div className="bg-bg-tertiary border border-border rounded-xl p-5">
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-4">Distribuzione voti</p>
            <div className="flex flex-col gap-3">
              {stats.ratingDist.map(({ star, count }) => (
                <Bar key={star} label={'★'.repeat(star)} value={count} max={stats.maxRating} count={count} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
