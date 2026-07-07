# biblio

La tua libreria personale. App mobile (iOS/macOS) con Expo + dashboard web con Next.js, database cloud Supabase.

---

## Stack

| Layer | Tecnologia |
|---|---|
| Web dashboard | Next.js 14, Tailwind CSS, TypeScript |
| App mobile | Expo (React Native), Expo Router |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Dati libri | Open Library + Google Books API + scraping pagina web Google Books per ISBN (gratis, no key) |
| Scanner barcode | expo-camera (mobile nativo) · @zxing/browser (web, sessione mobile) |

---

## Struttura

```
biblio/
├── apps/
│   ├── web/          ← Next.js dashboard (localhost:3000)
│   └── mobile/       ← Expo app (iOS + macOS)
├── supabase_schema.sql
└── README.md
```

---

## Setup

### 1. Supabase — crea le tabelle

Vai su [supabase.com](https://supabase.com) → il tuo progetto → **SQL Editor** → incolla e lancia `supabase_schema.sql`, poi `supabase_scan.sql` (tabelle + realtime per la sessione mobile).

Abilita l'autenticazione email: **Authentication → Providers → Email** (già attivo di default).

---

### 2. Web dashboard (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

---

### 3. App mobile (Expo)

**Prerequisiti macOS:**
```bash
# Installa Node.js se non ce l'hai
brew install node

# Installa Expo CLI
npm install -g expo-cli eas-cli
```

**Avvia:**
```bash
cd apps/mobile
npm install
npx expo start
```

Poi:
- Premi `i` per aprire nel **simulatore iOS** (richiede Xcode)
- Oppure scansiona il QR con l'app **Expo Go** sul telefono

**Per macOS nativo (Catalyst):**
```bash
npx expo run:ios --device  # seleziona Mac nel picker
```

---

## Funzionalità

### Aggiunta libri
Dal web puoi comporre una **lista** di libri e salvarli tutti insieme. Metodi disponibili:

| Metodo | Descrizione |
|---|---|
| Titolo | Cerca (Open Library/Google, fallback scraping), aggiungi i risultati alla lista |
| ISBN | Inserisci il codice: il libro viene aggiunto alla lista |
| Manuale | Inserisci i campi a mano |
| Mobile | Mostra un QR: scansionalo col telefono per leggere i barcode dal vivo |

#### Sessione mobile (QR → fotocamera del telefono)
Nel modale "Aggiungi libri" apri il tab **Mobile**: compare un QR. Inquadralo con la
fotocamera del telefono per aprire una pagina di scansione. Ogni barcode letto viene
cercato (Open Library/Google, con fallback scraping) e **compare in tempo reale** nella lista sul sito (via Supabase
Realtime). Quando hai finito, salva tutti i libri con un click.

> ⚠️ La fotocamera del browser richiede **HTTPS** (o `localhost`). In sviluppo usa il
> deploy Vercel oppure un tunnel HTTPS (es. `npx localtunnel --port 3000`); un semplice
> `http://<ip-lan>:3000` viene bloccato dal browser.

### Campi libro
| Campo | Obbligatorio | Fonte |
|---|---|---|
| Titolo | ✅ | API o utente |
| Autore | ✅ | API o utente |
| Anno | — | API |
| Sinossi | — | API |
| Copertina | — | API |
| ISBN | — | API |
| Genere | — | API |
| Pagine totali | — | API o utente |
| Stato lettura | ✅ | Utente |
| Pagina corrente | — | Utente (solo "In lettura") |
| Voto (1–5 stelle) | — | Utente |
| Riflessioni | — | Utente |
| Tags | — | Utente |

### Progresso lettura
Quando un libro è "In lettura", la pagina corrente viene usata per calcolare la percentuale automaticamente:
```
percentuale = Math.round((pagina_corrente / pagine_totali) * 100)
```

---

## Credenziali

Le credenziali Supabase sono già configurate nei file:
- `apps/web/.env.local`
- `apps/mobile/lib/supabase.ts`

### Ricerca libri (gratuita, nessuna chiave)

La ricerca è **a livelli**, tutta gratuita e senza API key:

1. **Open Library** (`lib/openlibrary.ts`) — fonte principale, nessun captcha.
2. **Google Books API** (`lib/googlebooks.ts`) — funziona senza chiave (quota per IP;
   su alcune reti/IP la quota anonima è azzerata e restituisce 429).
3. **Scraping della pagina web di Google Books** (route server `/api/lookup`, solo per
   ISBN): usa `books.google.com/books?vid=ISBN…`, che **non** è l'API (niente quota,
   niente captcha) e ha copertura enorme — anche per gli ISBN italiani che i livelli 1–2
   mancano. Estrae titolo/autore/copertina dai meta `og:` e dal tag `<title>`.

La ricerca **per titolo** è servita dai livelli 1–2 (la ricerca web di Google Books è
renderizzata in JS e non è scrapabile staticamente).

> Lo scraping avviene lato server (per evitare i blocchi CORS del browser). Se Google
> cambia l'HTML, aggiorna il parser in `apps/web/src/app/api/lookup/route.ts`.

---

## Deploy web (Vercel)

```bash
cd apps/web
npx vercel --prod
```

Aggiungi le variabili d'ambiente su Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://ynirhrzxjgtwwgnqahtq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_FkJoSn2djtPVVVN_fIIgFg_ARm_Ke9C
# (nessuna chiave per la ricerca libri: OL + Google Books, con scraping della pagina web di Google Books per ISBN)
```

---

## Note tecniche

- **Row Level Security (RLS)** attiva: ogni utente vede solo i propri libri
- **updated_at** aggiornato automaticamente via trigger PostgreSQL
- Il database è condiviso tra web e mobile — i dati sincronizzano in tempo reale
- Ricerca libri: **gratuita a livelli** — Open Library → Google Books API → scraping pagina web Google Books per ISBN (`/api/lookup`), nessuna API key
- La sessione mobile usa **Supabase Realtime**: il telefono scrive in `scan_items`, il sito riceve gli scan dal vivo
# biblio
