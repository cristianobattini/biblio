import { BookSearchResult } from '@/types/book'
import * as openLibrary from './openlibrary'
import * as googleBooks from './googlebooks'
import { scrapeByISBN, scrapeByTitle } from './scrape'

// Free, layered lookup: Open Library → Google Books → web scraping.
// The free APIs (no key, no captcha) handle most books; scraping only fills the
// gaps, keeping request volume to the scraped source low so it doesn't get blocked.

export async function searchByTitle(query: string): Promise<BookSearchResult[]> {
  const ol = await openLibrary.searchByTitle(query)
  if (ol.length) return ol

  const google = await googleBooks.searchByTitle(query)
  if (google.length) return google

  return scrapeByTitle(query)
}

export async function searchByISBN(isbn: string): Promise<BookSearchResult | null> {
  const ol = await openLibrary.searchByISBN(isbn)
  if (ol) return ol

  const google = await googleBooks.searchByISBN(isbn)
  if (google) return google

  return scrapeByISBN(isbn)
}
