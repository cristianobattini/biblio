import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, RefreshControl, Image
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getBooks, updateBook } from '../../lib/books'
import { Book } from '../../types/book'
import { colors, radius } from '../../lib/theme'
import { supabase } from '../../lib/supabase'

function ReadingCard({ book, onPress, onPageUpdate }: {
  book: Book
  onPress: () => void
  onPageUpdate: (b: Book) => void
}) {
  const pct = book.page_count && book.current_page
    ? Math.round((book.current_page / book.page_count) * 100)
    : 0

  return (
    <TouchableOpacity onPress={onPress} style={styles.readingCard} activeOpacity={0.8}>
      <View style={styles.readingCardAccent} />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={styles.smallCover} />
        ) : (
          <View style={[styles.smallCover, styles.coverPlaceholder]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.rcTitle} numberOfLines={1}>{book.title}</Text>
          <Text style={styles.rcAuthor} numberOfLines={1}>{book.author}</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={styles.rcPages}>
          pag. {book.current_page}{book.page_count ? ` / ${book.page_count}` : ''}
        </Text>
        <Text style={styles.rcPct}>{pct}%</Text>
      </View>
    </TouchableOpacity>
  )
}

function MiniBookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const stars = '★'.repeat(book.rating ?? 0) + '☆'.repeat(5 - (book.rating ?? 0))
  return (
    <TouchableOpacity onPress={onPress} style={styles.miniCard} activeOpacity={0.8}>
      <View style={styles.miniCoverWrap}>
        {book.cover_url
          ? <Image source={{ uri: book.cover_url }} style={styles.miniCover} />
          : <View style={[styles.miniCover, styles.coverPlaceholder]} />
        }
      </View>
      <View style={styles.miniInfo}>
        <Text style={styles.miniTitle} numberOfLines={1}>{book.title}</Text>
        <Text style={styles.miniAuthor} numberOfLines={1}>{book.author}</Text>
        <Text style={styles.miniStars}>{stars}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  async function load() {
    const data = await getBooks()
    setBooks(data)
  }

  useFocusEffect(useCallback(() => {
    load().finally(() => setLoading(false))
  }, []))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.email?.split('@')[0] ?? '')
    })
  }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const reading = books.filter(b => b.status === 'reading')
  const recent = books.filter(b => b.status !== 'reading').slice(0, 6)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text.muted} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {userName ? `Ciao, ${userName}` : 'La tua libreria'}
          </Text>
          <Text style={styles.subheading}>
            {books.length} libri{reading.length > 0 ? ` · ${reading.length} in lettura` : ''}
          </Text>
        </View>

        {reading.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>IN LETTURA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12, paddingRight: 16 }}>
                {reading.map(book => (
                  <ReadingCard
                    key={book.id}
                    book={book}
                    onPress={() => router.push(`/book/${book.id}`)}
                    onPageUpdate={b => setBooks(bs => bs.map(x => x.id === b.id ? b : x))}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {recent.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.sectionLabel}>RECENTI</Text>
              <TouchableOpacity onPress={() => router.push('/library')}>
                <Text style={styles.seeAll}>Vedi tutti</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.miniGrid}>
              {recent.map(book => (
                <MiniBookCard
                  key={book.id}
                  book={book}
                  onPress={() => router.push(`/book/${book.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {books.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nessun libro ancora</Text>
            <TouchableOpacity onPress={() => router.push('/add')}>
              <Text style={styles.emptyAction}>Aggiungi il primo →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '600', color: colors.text.primary, letterSpacing: -0.4 },
  subheading: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, color: colors.text.muted, letterSpacing: 1, marginBottom: 10 },
  seeAll: { fontSize: 11, color: colors.text.dim },

  readingCard: {
    width: 220, backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default,
    padding: 14, overflow: 'hidden',
  },
  readingCardAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: colors.text.secondary,
  },
  smallCover: { width: 36, height: 50, borderRadius: 4 },
  coverPlaceholder: { backgroundColor: colors.bg.hover },
  rcTitle: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  rcAuthor: { fontSize: 11, color: colors.text.muted, marginTop: 1 },
  progressBar: {
    height: 3, backgroundColor: colors.bg.hover,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.accent, borderRadius: 2 },
  rcPages: { fontSize: 10, color: colors.text.muted },
  rcPct: { fontSize: 10, color: colors.text.secondary, fontWeight: '500' },

  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniCard: {
    width: '47%', backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  miniCoverWrap: { height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.card },
  miniCover: { width: 44, height: 60, borderRadius: 3 },
  miniInfo: { padding: 8 },
  miniTitle: { fontSize: 11, fontWeight: '500', color: colors.text.primary },
  miniAuthor: { fontSize: 10, color: colors.text.muted, marginTop: 1 },
  miniStars: { fontSize: 9, color: colors.text.primary, marginTop: 4 },

  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.text.muted },
  emptyAction: { fontSize: 12, color: colors.text.secondary, marginTop: 8 },
})
