import { BookSearchResult } from '@/types/book'

// Google Books — free, works without an API key (per-IP anonymous quota). Fallback provider.

const API = 'https://www.googleapis.com/books/v1/volumes'

function normalizeCover(links?: { thumbnail?: string; smallThumbnail?: string }): string | undefined {
  const raw = links?.thumbnail ?? links?.smallThumbnail
  if (!raw) return undefined
  return raw.replace(/^http:/, 'https:').replace(/&edge=curl/, '')
}

function isbnFrom(ids?: { type: string; identifier: string }[]): string | undefined {
  if (!ids) return undefined
  const isbn13 = ids.find(i => i.type === 'ISBN_13')
  const isbn10 = ids.find(i => i.type === 'ISBN_10')
  return (isbn13 ?? isbn10 ?? ids[0])?.identifier
}

function mapVolume(v: any): BookSearchResult {
  const info = v.volumeInfo ?? {}
  return {
    title: info.title ?? 'Senza titolo',
    author: info.authors?.[0] ?? 'Autore sconosciuto',
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) || undefined : undefined,
    cover_url: normalizeCover(info.imageLinks),
    isbn: isbnFrom(info.industryIdentifiers),
    page_count: info.pageCount || undefined,
    genre: info.categories?.[0],
    bio: info.description,
  }
}

export async function searchByTitle(query: string): Promise<BookSearchResult[]> {
  try {
    const res = await fetch(`${API}?q=${encodeURIComponent(`intitle:${query}`)}&maxResults=8&printType=books`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []).map(mapVolume)
  } catch {
    return []
  }
}

export async function searchByISBN(isbn: string): Promise<BookSearchResult | null> {
  const clean = isbn.replace(/[^0-9X]/gi, '')
  if (!clean) return null
  try {
    const res = await fetch(`${API}?q=${encodeURIComponent(`isbn:${clean}`)}`)
    if (!res.ok) return null
    const data = await res.json()
    const hit = data.items?.[0]
    if (!hit) return null
    const mapped = mapVolume(hit)
    return { ...mapped, isbn: mapped.isbn ?? clean }
  } catch {
    return null
  }
}
