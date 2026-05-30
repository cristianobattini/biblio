# biblio

La tua libreria personale. App mobile (iOS/macOS) con Expo + dashboard web con Next.js, database cloud Supabase.

---

## Stack

| Layer | Tecnologia |
|---|---|
| Web dashboard | Next.js 14, Tailwind CSS, TypeScript |
| App mobile | Expo (React Native), Expo Router |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Dati libri | Open Library API (gratuita, no key) |
| Scanner barcode | expo-camera (nativo iOS) |

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

Vai su [supabase.com](https://supabase.com) → il tuo progetto → **SQL Editor** → incolla e lancia `supabase_schema.sql`.

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
| Metodo | Descrizione |
|---|---|
| Titolo | Cerca su Open Library, scegli dal risultato |
| ISBN | Inserisci il codice manualmente |
| Fotocamera | Scansiona il barcode del libro (solo mobile) |
| Manuale | Inserisci tutti i campi a mano |

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
```

---

## Note tecniche

- **Row Level Security (RLS)** attiva: ogni utente vede solo i propri libri
- **updated_at** aggiornato automaticamente via trigger PostgreSQL
- Il database è condiviso tra web e mobile — i dati sincronizzano in tempo reale
- Open Library non richiede API key — le chiamate vengono fatte direttamente dal client
# biblio
