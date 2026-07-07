'use client'
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { BookOpen, Check, Loader2, CameraOff } from 'lucide-react'
import { getSession, insertScanItem } from '@/lib/scan'
import { searchByISBN } from '@/lib/booksearch'

type Phase = 'checking' | 'invalid' | 'ready' | 'no-camera'

// Book barcodes are EAN-13; restricting formats + TRY_HARDER greatly improves reads.
const HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A]],
  [DecodeHintType.TRY_HARDER, true],
]) as Map<DecodeHintType, never>

interface Scanned {
  isbn: string
  title: string
  author: string
}

// Normalise a raw barcode into an ISBN, or null if it isn't one.
// Handles EAN-13 (Bookland 978/979), ISBN-10, and an EAN-5 price add-on (18 digits).
function normalizeIsbn(raw: string): string | null {
  const d = raw.replace(/[^0-9Xx]/g, '')
  if (d.length === 10) return d
  if (d.length === 13 && (d.startsWith('978') || d.startsWith('979'))) return d
  if (d.length === 18 && (d.startsWith('978') || d.startsWith('979'))) return d.slice(0, 13)
  if (d.length === 13) return d // other EAN-13 — let the lookup decide
  return null
}

export default function ScanPage({ params }: { params: { session: string } }) {
  const sessionId = params.session
  const videoRef = useRef<HTMLVideoElement>(null)
  const seen = useRef<Set<string>>(new Set())
  const [phase, setPhase] = useState<Phase>('checking')
  const [scanned, setScanned] = useState<Scanned[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const [debug, setDebug] = useState<string>('')
  const [hit, setHit] = useState(0) // increments on each successful read → replays the green bounce
  const [hitActive, setHitActive] = useState(false) // green border stays for 3s after a read
  const hitTimer = useRef<ReturnType<typeof setTimeout>>()

  function triggerHit() {
    setHit(h => h + 1)
    setHitActive(true)
    clearTimeout(hitTimer.current)
    hitTimer.current = setTimeout(() => setHitActive(false), 3000)
  }

  useEffect(() => () => clearTimeout(hitTimer.current), [])

  // Validate the pairing session before turning on the camera.
  useEffect(() => {
    getSession(sessionId)
      .then(s => {
        if (!s || new Date(s.expires_at) < new Date()) setPhase('invalid')
        else setPhase('ready')
      })
      .catch(() => setPhase('invalid'))
  }, [sessionId])

  // Run the camera + barcode reader once the session is valid.
  useEffect(() => {
    if (phase !== 'ready' || !videoRef.current) return
    const reader = new BrowserMultiFormatReader(HINTS)
    let controls: { stop: () => void } | null = null
    let stopped = false

    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (result) => {
          if (!result) return
          const raw = result.getText()
          setDebug(`letto: ${raw}`)
          const code = normalizeIsbn(raw)
          if (!code || seen.current.has(code)) return
          seen.current.add(code)
          triggerHit() // green bounce feedback (held 3s), doesn't stop scanning
          handleCode(code)
        }
      )
      .then(c => { controls = c; if (stopped) c.stop() })
      .catch((e) => { console.error('camera error:', e); setPhase('no-camera') })

    return () => { stopped = true; controls?.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function handleCode(code: string) {
    try {
      const book = await searchByISBN(code)
      if (!book) { setFlash('Libro non trovato'); return }
      await insertScanItem(sessionId, book)
      setScanned(s => [{ isbn: code, title: book.title, author: book.author }, ...s])
      setFlash(`✓ ${book.title}`)
      if (navigator.vibrate) navigator.vibrate(60)
    } catch {
      setFlash('Errore, riprova')
    } finally {
      setTimeout(() => setFlash(null), 1800)
    }
  }

  if (phase === 'checking') {
    return (
      <Centered>
        <Loader2 size={22} className="animate-spin text-text-muted" />
        <p className="text-sm text-text-muted mt-3">Connessione…</p>
      </Centered>
    )
  }

  if (phase === 'invalid') {
    return (
      <Centered>
        <BookOpen size={26} className="text-text-dim" />
        <p className="text-sm text-text-primary mt-3">Sessione non valida o scaduta</p>
        <p className="text-xs text-text-muted mt-1">Genera un nuovo QR dal sito e riprova.</p>
      </Centered>
    )
  }

  if (phase === 'no-camera') {
    return (
      <Centered>
        <CameraOff size={26} className="text-text-dim" />
        <p className="text-sm text-text-primary mt-3">Fotocamera non disponibile</p>
        <p className="text-xs text-text-muted mt-1 max-w-xs">
          Concedi il permesso alla fotocamera. La scansione richiede una connessione sicura (HTTPS).
        </p>
      </Centered>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="px-5 py-4 border-b border-border-subtle text-center">
        <span className="text-base font-semibold tracking-tight text-text-primary">
          biblio<span className="text-text-muted font-light">.</span>
        </span>
        <p className="text-[11px] text-text-muted mt-0.5">Scansiona i codici a barre dei libri</p>
      </header>

      <div className="relative w-full h-[58vh] bg-black overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {/* Reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4/5 h-24 border-2 border-white/70 rounded-lg" />
        </div>
        {/* Green border: bounces in on a read, held 3s, then removed (re-mounts via key to replay) */}
        {hitActive && (
          <div
            key={hit}
            className="absolute inset-0 pointer-events-none border-[6px] border-emerald-400 rounded-xl animate-scan-hit"
          />
        )}
        {/* Debug: last raw code the decoder saw */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-text-muted text-[10px] font-mono px-2 py-1 rounded max-w-[90%] truncate">
          {debug || 'in ascolto…'}
        </div>
        {flash && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 border border-border-strong text-text-primary text-xs px-4 py-2 rounded-full whitespace-nowrap max-w-[90%] truncate">
            {flash}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">
          Scansionati · {scanned.length}
        </p>
        {scanned.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-8">
            Inquadra il codice a barre sul retro del libro.
          </p>
        ) : (
          <div className="space-y-2">
            {scanned.map((b, i) => (
              <div key={`${b.isbn}-${i}`} className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border rounded-xl">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{b.title}</p>
                  <p className="text-[10px] text-text-muted truncate">{b.author}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-text-dim text-center mt-6">
          I libri compaiono in tempo reale sul sito. Chiudi questa pagina quando hai finito.
        </p>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-center px-6">
      {children}
    </div>
  )
}
