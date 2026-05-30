import { OpenLibraryResult } from '@/types/book'

export async function searchByTitle(query: string): Promise<OpenLibraryResult[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,isbn,number_of_pages_median,subject,cover_i`
  )
  const data = await res.json()
  return (data.docs || []).map((doc: any) => ({
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Autore sconosciuto',
    year: doc.first_publish_year,
    cover_url: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    isbn: doc.isbn?.[0],
    page_count: doc.number_of_pages_median,
    genre: doc.subject?.[0],
    bio: undefined,
  }))
}

export async function searchByISBN(isbn: string): Promise<OpenLibraryResult | null> {
  const clean = isbn.replace(/[^0-9X]/gi, '')
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`)
  const data = await res.json()
  const book = data[`ISBN:${clean}`]
  if (!book) return null

  const descRes = await fetch(`https://openlibrary.org${book.key}.json`).catch(() => null)
  let bio: string | undefined
  if (descRes?.ok) {
    const descData = await descRes.json()
    bio = typeof descData.description === 'string'
      ? descData.description
      : descData.description?.value
  }

  return {
    title: book.title,
    author: book.authors?.[0]?.name ?? 'Autore sconosciuto',
    year: book.publish_date ? parseInt(book.publish_date.slice(-4)) : undefined,
    cover_url: book.cover?.medium,
    isbn: clean,
    page_count: book.number_of_pages,
    genre: book.subjects?.[0]?.name,
    bio,
  }
}
