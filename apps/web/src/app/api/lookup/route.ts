import { NextRequest } from 'next/server'
import { BookSearchResult } from '@/types/book'

// Free book lookup, server-side (avoids browser CORS), no API key.
// ISBN: scrape the Google Books *web* page (not the quota-limited API) — huge
// coverage, no captcha. Title search stays on the API layers (Open Library etc.).

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/\s+/g, ' ')
    .trim()
}

function isBlocked(html: string): boolean {
  return /just a moment|unusual traffic|our systems have detected|captcha/i.test(html)
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'it,en;q=0.8' },
      cache: 'no-store',
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return isBlocked(html) ? null : html
  } catch {
    return null
  }
}

function meta(html: string, prop: string): string | undefined {
  const m =
    html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]*)"`, 'i')) ??
    html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${prop}"`, 'i'))
  return m ? unescapeHtml(m[1]) : undefined
}

// Google serves covers from a locale host (books.google.it/…); pin to .com.
function normalizeCover(url?: string): string | undefined {
  if (!url) return undefined
  return url.replace(/^http:/, 'https:').replace(/\/\/books\.google\.[a-z.]+\//i, '//books.google.com/')
}

async function byISBN(isbn: string): Promise<BookSearchResult | null> {
  const html = await fetchHtml(`https://books.google.com/books?vid=ISBN${isbn}&hl=it`)
  if (!html) return null

  const title = meta(html, 'og:title')
  // Google returns a placeholder page ("Titulo - Autor") for ISBNs it has no data for.
  if (!title || /^t[ií]tulo$/i.test(title)) return null

  // <title> is "Title - Author - Google Libri" → pull the author out of the middle.
  let author: string | undefined
  const titleTag = html.match(/<title>([^<]*)<\/title>/i)?.[1]
  if (titleTag) {
    let t = unescapeHtml(titleTag).replace(/\s*-\s*Google (Libri|Books)\s*$/i, '')
    if (t.toLowerCase().startsWith(title.toLowerCase())) {
      t = t.slice(title.length).replace(/^\s*-\s*/, '').trim()
    }
    author = t || undefined
  }

  return {
    title,
    author: author ?? 'Autore sconosciuto',
    cover_url: normalizeCover(meta(html, 'og:image')),
    isbn,
    year: undefined,
    page_count: undefined,
    genre: undefined,
    bio: meta(html, 'og:description'),
  }
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn')?.replace(/[^0-9Xx]/g, '')
  if (isbn) return Response.json(await byISBN(isbn))

  // Title-based scraping isn't reliable (Google Books web search is JS-rendered),
  // so title queries are served by the API layers in lib/booksearch.
  return Response.json([])
}
