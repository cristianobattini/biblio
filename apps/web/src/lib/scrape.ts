import { BookSearchResult } from '@/types/book'

// Server-side scraping route (/api/lookup) — free, no key. Used as a last resort
// when the free APIs miss a book, so the request volume to the source stays low.

export async function scrapeByISBN(isbn: string): Promise<BookSearchResult | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, '')
  if (!clean) return null
  try {
    const res = await fetch(`/api/lookup?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    return (await res.json()) as BookSearchResult | null
  } catch {
    return null
  }
}

export async function scrapeByTitle(query: string): Promise<BookSearchResult[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(`/api/lookup?title=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    return (await res.json()) as BookSearchResult[]
  } catch {
    return []
  }
}
