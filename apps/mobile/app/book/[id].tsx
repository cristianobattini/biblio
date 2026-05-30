import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, Alert, StyleSheet, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getBooks, updateBook, deleteBook } from '../../lib/books'
import { Book, BookStatus, BookUpdate } from '../../types/book'
import { colors, radius } from '../../lib/theme'

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    getBooks().then(bs => {
      setBook(bs.find(b => b.id === id) ?? null)
    }).finally(() => setLoading(false))
  }, [id])

  async function save(updates: BookUpdate) {
    if (!book) return
    const updated = await updateBook(book.id, updates)
    setBook(updated)
  }

  async function handleDelete() {
    Alert.alert('Elimina libro', 'Sei sicuro?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => {
        await deleteBook(id)
        router.back()
      }},
    ])
  }

  function addTag() {
    if (!book) return
    const t = tagInput.trim().toLowerCase()
    if (!t || book.tags.includes(t)) return
    const tags = [...book.tags, t]
    setBook(b => b ? { ...b, tags } : b)
    save({ tags })
    setTagInput('')
  }

  function removeTag(tag: string) {
    if (!book) return
    const tags = book.tags.filter(t => t !== tag)
    setBook(b => b ? { ...b, tags } : b)
    save({ tags })
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.text.muted} />
    </View>
  )

  if (!book) return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text.muted }}>Libro non trovato</Text>
    </View>
  )

  const pct = book.page_count && book.current_page
    ? Math.round((book.current_page / book.page_count) * 100)
    : 0

  const stars = [1,2,3,4,5].map(i => (
    <TouchableOpacity key={i} onPress={() => { setBook(b => b ? { ...b, rating: i } : b); save({ rating: i }) }}>
      <Text style={{ fontSize: 22, color: i <= (book.rating ?? 0) ? colors.accent : colors.text.dim }}>★</Text>
    </TouchableOpacity>
  ))

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.text.dim} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.coverWrap}>
            <View style={s.spine} />
            {book.cover_url
              ? <Image source={{ uri: book.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : null
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{book.title}</Text>
            <Text style={s.author}>{book.author}</Text>
            {book.year && <Text style={s.year}>{book.year}{book.genre ? ` · ${book.genre}` : ''}</Text>}
            <View style={{ flexDirection: 'row', gap: 3, marginTop: 10 }}>{stars}</View>
          </View>
        </View>

        <View style={s.divider} />

        {/* Status */}
        <View style={s.block}>
          <Text style={s.label}>STATO</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['unread', 'reading', 'read'] as BookStatus[]).map(st => (
              <TouchableOpacity
                key={st}
                onPress={() => { setBook(b => b ? { ...b, status: st } : b); save({ status: st }) }}
                style={[s.statusBtn, book.status === st && s.statusBtnActive]}
              >
                <Text style={[s.statusText, book.status === st && s.statusTextActive]}>
                  {st === 'unread' ? 'Da leggere' : st === 'reading' ? 'In lettura' : 'Letto'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress */}
        {book.status === 'reading' && (
          <>
            <View style={s.divider} />
            <View style={s.block}>
              <Text style={s.label}>AVANZAMENTO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <TextInput
                  style={s.pageInput}
                  value={String(book.current_page)}
                  onChangeText={v => setBook(b => b ? { ...b, current_page: parseInt(v) || 0 } : b)}
                  onBlur={() => save({ current_page: book.current_page })}
                  keyboardType="numeric"
                />
                {book.page_count && <Text style={s.pageOf}>/ {book.page_count} pag.</Text>}
                <Text style={[s.pageOf, { marginLeft: 'auto', color: colors.text.secondary }]}>{pct}%</Text>
              </View>
              <View style={s.progBg}>
                <View style={[s.progFill, { width: `${pct}%` as any }]} />
              </View>
            </View>
          </>
        )}

        {/* Bio */}
        {book.bio && (
          <>
            <View style={s.divider} />
            <View style={s.block}>
              <Text style={s.label}>SINOSSI</Text>
              <Text style={s.bio}>{book.bio}</Text>
            </View>
          </>
        )}

        <View style={s.divider} />

        {/* Notes */}
        <View style={s.block}>
          <Text style={s.label}>LE MIE RIFLESSIONI</Text>
          <TextInput
            style={s.notesInput}
            value={book.notes || ''}
            onChangeText={v => setBook(b => b ? { ...b, notes: v } : b)}
            onBlur={() => save({ notes: book.notes })}
            placeholder="Scrivi le tue note…"
            placeholderTextColor={colors.text.dim}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={s.divider} />

        {/* Tags */}
        <View style={s.block}>
          <Text style={s.label}>TAGS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {book.tags.map(tag => (
              <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={s.tag}>
                <Text style={s.tagText}>{tag} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[s.pageInput, { flex: 1 }]}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              placeholder="Aggiungi tag…"
              placeholderTextColor={colors.text.dim}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={addTag} style={s.addTagBtn}>
              <Text style={{ color: colors.text.primary, fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  scroll: { flex: 1, paddingHorizontal: 16 },

  hero: { flexDirection: 'row', gap: 14, paddingVertical: 20, alignItems: 'flex-start' },
  coverWrap: { width: 80, height: 110, borderRadius: 6, backgroundColor: colors.bg.hover, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 4, height: 6 }, shadowOpacity: 0.8, shadowRadius: 12 },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text.primary, letterSpacing: -0.3, lineHeight: 22 },
  author: { fontSize: 12, color: colors.text.muted, marginTop: 3 },
  year: { fontSize: 11, color: colors.text.dim, marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.border.subtle, marginVertical: 4 },
  block: { paddingVertical: 16 },
  label: { fontSize: 10, color: colors.text.dim, letterSpacing: 1, marginBottom: 10 },

  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.tertiary, alignItems: 'center' },
  statusBtnActive: { backgroundColor: colors.bg.hover, borderColor: colors.border.strong },
  statusText: { fontSize: 10, color: colors.text.dim },
  statusTextActive: { color: colors.text.primary },

  pageInput: { backgroundColor: colors.bg.tertiary, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, color: colors.text.primary, minWidth: 60, textAlign: 'center' },
  pageOf: { fontSize: 12, color: colors.text.muted },
  progBg: { height: 4, backgroundColor: colors.bg.hover, borderRadius: 2, overflow: 'hidden' },
  progFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },

  bio: { fontSize: 12, color: colors.text.muted, lineHeight: 19 },
  notesInput: { backgroundColor: colors.bg.tertiary, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text.primary, minHeight: 90, lineHeight: 20 },

  tag: { backgroundColor: colors.bg.hover, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, color: colors.text.muted },
  addTagBtn: { backgroundColor: colors.bg.hover, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.sm, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
})
