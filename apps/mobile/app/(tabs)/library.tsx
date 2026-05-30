import React, { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { getBooks } from '../../lib/books'
import { Book, BookStatus } from '../../types/book'
import { colors, radius } from '../../lib/theme'

const FILTERS: { label: string; status: BookStatus | 'all' }[] = [
  { label: 'Tutti', status: 'all' },
  { label: 'In lettura', status: 'reading' },
  { label: 'Letti', status: 'read' },
  { label: 'Da leggere', status: 'unread' },
]

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([])
  const [filter, setFilter] = useState<BookStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const router = useRouter()

  useFocusEffect(useCallback(() => {
    getBooks().then(setBooks)
  }, []))

  const filtered = books.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  function renderBook({ item }: { item: Book }) {
    const stars = '★'.repeat(item.rating ?? 0) + '☆'.repeat(5 - (item.rating ?? 0))
    const pct = item.page_count && item.current_page
      ? Math.round((item.current_page / item.page_count) * 100)
      : 0

    return (
      <TouchableOpacity onPress={() => router.push(`/book/${item.id}`)} style={s.card} activeOpacity={0.8}>
        <View style={s.coverWrap}>
          {item.cover_url
            ? <Image source={{ uri: item.cover_url }} style={s.cover} />
            : <View style={[s.cover, { backgroundColor: colors.bg.hover }]} />
          }
        </View>
        <View style={s.info}>
          <Text style={s.title} numberOfLines={2}>{item.title}</Text>
          <Text style={s.author} numberOfLines={1}>{item.author}</Text>
          <Text style={s.stars}>{stars}</Text>
          {item.status === 'reading' && item.page_count ? (
            <View style={s.progWrap}>
              <View style={[s.prog, { width: `${pct}%` as any }]} />
            </View>
          ) : null}
          {item.genre ? <Text style={s.genre} numberOfLines={1}>{item.genre}</Text> : null}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={s.heading}>Libreria</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Cerca titolo o autore…"
          placeholderTextColor={colors.text.dim}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.status}
              onPress={() => setFilter(f.status)}
              style={[s.filterBtn, filter === f.status && s.filterBtnActive]}
            >
              <Text style={[s.filterText, filter === f.status && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderBook}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <Text style={{ color: colors.text.muted, textAlign: 'center', marginTop: 40, fontSize: 13 }}>
            Nessun libro trovato
          </Text>
        }
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  heading: { fontSize: 20, fontWeight: '600', color: colors.text.primary, letterSpacing: -0.4, marginBottom: 12 },
  searchInput: { backgroundColor: colors.bg.tertiary, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.text.primary },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.tertiary },
  filterBtnActive: { backgroundColor: colors.bg.hover, borderColor: colors.border.strong },
  filterText: { fontSize: 11, color: colors.text.muted },
  filterTextActive: { color: colors.text.primary },

  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.bg.tertiary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.subtle, padding: 12 },
  coverWrap: {},
  cover: { width: 52, height: 72, borderRadius: 4 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '500', color: colors.text.primary, lineHeight: 18 },
  author: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  stars: { fontSize: 11, color: colors.text.primary, marginTop: 5 },
  genre: { fontSize: 10, color: colors.text.dim, marginTop: 4 },
  progWrap: { height: 2, backgroundColor: colors.bg.hover, borderRadius: 1, marginTop: 8, overflow: 'hidden' },
  prog: { height: 2, backgroundColor: colors.accent, borderRadius: 1 },
})
