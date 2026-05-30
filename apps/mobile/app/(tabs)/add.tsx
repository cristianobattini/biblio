import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Image, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { searchByTitle, searchByISBN } from '../../lib/openlibrary'
import { insertBook } from '../../lib/books'
import { OpenLibraryResult, BookStatus } from '../../types/book'
import { colors, radius } from '../../lib/theme'

type Mode = 'title' | 'isbn' | 'camera' | 'manual'

export default function AddScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('title')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OpenLibraryResult[]>([])
  const [selected, setSelected] = useState<OpenLibraryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<BookStatus>('unread')
  const [rating, setRating] = useState(0)
  const [currentPage, setCurrentPage] = useState('0')
  const [manual, setManual] = useState({ title: '', author: '', year: '', genre: '', page_count: '' })
  const [scanned, setScanned] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    try {
      if (mode === 'isbn') {
        const r = await searchByISBN(query)
        if (r) setSelected(r)
        else Alert.alert('Nessun risultato', 'ISBN non trovato.')
      } else {
        const r = await searchByTitle(query)
        setResults(r)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleBarcode({ data }: { data: string }) {
    if (scanned) return
    setScanned(true)
    setMode('isbn')
    setLoading(true)
    const r = await searchByISBN(data)
    setLoading(false)
    if (r) setSelected(r)
    else { Alert.alert('ISBN non trovato'); setScanned(false) }
  }

  async function handleAdd() {
    const src = selected ?? (mode === 'manual' ? {
      title: manual.title,
      author: manual.author,
      year: manual.year ? parseInt(manual.year) : undefined,
      genre: manual.genre || undefined,
      page_count: manual.page_count ? parseInt(manual.page_count) : undefined,
    } : null)
    if (!src?.title || !src?.author) {
      Alert.alert('Titolo e autore sono obbligatori')
      return
    }
    setSaving(true)
    try {
      await insertBook({
        title: src.title,
        author: src.author,
        year: (src as any).year,
        bio: (src as OpenLibraryResult).bio,
        cover_url: (src as OpenLibraryResult).cover_url,
        isbn: (src as OpenLibraryResult).isbn,
        genre: (src as any).genre,
        page_count: (src as any).page_count,
        status,
        current_page: parseInt(currentPage) || 0,
        rating: rating || undefined,
        notes: '',
        tags: [],
      })
      router.replace('/')
    } finally {
      setSaving(false)
    }
  }

  const modes: { id: Mode; label: string }[] = [
    { id: 'title',  label: 'Titolo' },
    { id: 'isbn',   label: 'ISBN' },
    { id: 'camera', label: 'Fotocamera' },
    { id: 'manual', label: 'Manuale' },
  ]

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Aggiungi libro</Text>

        {/* Mode selector */}
        <View style={s.modeRow}>
          {modes.map(m => (
            <TouchableOpacity
              key={m.id}
              onPress={() => { setMode(m.id); setResults([]); setSelected(null); setQuery(''); setScanned(false) }}
              style={[s.modeBtn, mode === m.id && s.modeBtnActive]}
            >
              <Text style={[s.modeBtnText, mode === m.id && s.modeBtnTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Camera scanner */}
        {mode === 'camera' && !selected && (
          <View style={s.cameraWrap}>
            {!permission?.granted ? (
              <TouchableOpacity onPress={requestPermission} style={s.permBtn}>
                <Text style={s.permBtnText}>Autorizza fotocamera</Text>
              </TouchableOpacity>
            ) : (
              <>
                <CameraView
                  style={s.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarcode}
                />
                {loading && (
                  <View style={s.cameraOverlay}>
                    <ActivityIndicator color={colors.accent} />
                    <Text style={{ color: colors.text.muted, marginTop: 8, fontSize: 12 }}>Ricerca in corso…</Text>
                  </View>
                )}
                <View style={s.scanFrame} />
                <Text style={s.scanHint}>Inquadra il codice a barre del libro</Text>
              </>
            )}
          </View>
        )}

        {/* Search (title/isbn) */}
        {(mode === 'title' || mode === 'isbn') && !selected && (
          <View style={s.block}>
            <Text style={s.label}>{mode === 'title' ? 'TITOLO' : 'ISBN'}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                placeholder={mode === 'title' ? 'Es. La strada…' : 'Es. 9788804668046'}
                placeholderTextColor={colors.text.dim}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={handleSearch} style={s.searchBtn}>
                {loading ? <ActivityIndicator size="small" color={colors.bg.primary} /> : <Text style={s.searchBtnText}>Cerca</Text>}
              </TouchableOpacity>
            </View>
            {results.map((r, i) => (
              <TouchableOpacity key={i} onPress={() => setSelected(r)} style={s.resultRow}>
                {r.cover_url
                  ? <Image source={{ uri: r.cover_url }} style={s.resultCover} />
                  : <View style={[s.resultCover, { backgroundColor: colors.bg.hover }]} />
                }
                <View style={{ flex: 1 }}>
                  <Text style={s.resultTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={s.resultAuthor} numberOfLines={1}>{r.author}</Text>
                  {r.year && <Text style={s.resultYear}>{r.year}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Manual */}
        {mode === 'manual' && (
          <View style={s.block}>
            {[
              { key: 'title', label: 'TITOLO *', ph: 'Es. La strada' },
              { key: 'author', label: 'AUTORE *', ph: 'Es. Cormac McCarthy' },
              { key: 'year', label: 'ANNO', ph: '2006' },
              { key: 'genre', label: 'GENERE', ph: 'Es. Narrativa' },
              { key: 'page_count', label: 'PAGINE', ph: '340' },
            ].map(({ key, label, ph }) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <Text style={s.label}>{label}</Text>
                <TextInput
                  style={s.input}
                  value={manual[key as keyof typeof manual]}
                  onChangeText={v => setManual(m => ({ ...m, [key]: v }))}
                  placeholder={ph}
                  placeholderTextColor={colors.text.dim}
                  keyboardType={['year', 'page_count'].includes(key) ? 'numeric' : 'default'}
                />
              </View>
            ))}
          </View>
        )}

        {/* Selected preview */}
        {selected && (
          <View style={s.selectedCard}>
            {selected.cover_url
              ? <Image source={{ uri: selected.cover_url }} style={s.selectedCover} />
              : <View style={[s.selectedCover, { backgroundColor: colors.bg.hover }]} />
            }
            <View style={{ flex: 1 }}>
              <Text style={s.selectedTitle}>{selected.title}</Text>
              <Text style={s.selectedAuthor}>{selected.author}</Text>
            </View>
            <TouchableOpacity onPress={() => { setSelected(null); setResults([]); setScanned(false) }}>
              <Text style={{ color: colors.text.dim, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status */}
        <View style={s.block}>
          <Text style={s.label}>STATO LETTURA</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['unread', 'reading', 'read'] as const).map(st => (
              <TouchableOpacity
                key={st}
                onPress={() => setStatus(st)}
                style={[s.statusBtn, status === st && s.statusBtnActive]}
              >
                <Text style={[s.statusBtnText, status === st && s.statusBtnTextActive]}>
                  {st === 'unread' ? 'Da leggere' : st === 'reading' ? 'In lettura' : 'Letto'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {status === 'reading' && (
          <View style={s.block}>
            <Text style={s.label}>PAGINA CORRENTE</Text>
            <TextInput
              style={[s.input, { width: 80 }]}
              value={currentPage}
              onChangeText={setCurrentPage}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Rating */}
        <View style={s.block}>
          <Text style={s.label}>VOTO</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[1,2,3,4,5].map(i => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Text style={{ fontSize: 24, color: i <= rating ? colors.accent : colors.text.dim }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAdd}
          disabled={saving}
          style={[s.addBtn, saving && { opacity: 0.5 }]}
        >
          <Text style={s.addBtnText}>{saving ? 'Salvataggio…' : 'Aggiungi alla libreria'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '600', color: colors.text.primary, marginBottom: 20, letterSpacing: -0.4 },

  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.tertiary, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.bg.hover, borderColor: colors.border.strong },
  modeBtnText: { fontSize: 11, color: colors.text.muted },
  modeBtnTextActive: { color: colors.text.primary },

  cameraWrap: { borderRadius: radius.md, overflow: 'hidden', marginBottom: 16, height: 280, backgroundColor: colors.bg.card, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  camera: { width: '100%', height: '100%' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,10,0.7)', alignItems: 'center', justifyContent: 'center' },
  scanFrame: { position: 'absolute', width: 200, height: 100, borderWidth: 1, borderColor: colors.accent, borderRadius: 4 },
  scanHint: { position: 'absolute', bottom: 16, fontSize: 11, color: colors.text.muted },
  permBtn: { backgroundColor: colors.bg.hover, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 10 },
  permBtnText: { color: colors.text.primary, fontSize: 13 },

  block: { marginBottom: 20 },
  label: { fontSize: 10, color: colors.text.dim, letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: colors.bg.tertiary, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text.primary },

  searchBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { fontSize: 13, fontWeight: '500', color: colors.bg.primary },

  resultRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  resultCover: { width: 32, height: 46, borderRadius: 3 },
  resultTitle: { fontSize: 12, fontWeight: '500', color: colors.text.primary },
  resultAuthor: { fontSize: 11, color: colors.text.muted },
  resultYear: { fontSize: 10, color: colors.text.dim },

  selectedCard: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.bg.tertiary, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.md, padding: 12, marginBottom: 20 },
  selectedCover: { width: 40, height: 56, borderRadius: 4 },
  selectedTitle: { fontSize: 13, fontWeight: '500', color: colors.text.primary },
  selectedAuthor: { fontSize: 11, color: colors.text.muted },

  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.tertiary, alignItems: 'center' },
  statusBtnActive: { backgroundColor: colors.bg.hover, borderColor: colors.border.strong },
  statusBtnText: { fontSize: 10, color: colors.text.dim },
  statusBtnTextActive: { color: colors.text.primary },

  addBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: colors.bg.primary },
})
