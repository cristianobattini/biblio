'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { LogOut, Mail, Shield } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[10px] text-text-dim uppercase tracking-widest mb-4">{title}</p>
      <div className="bg-bg-tertiary border border-border rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value, action }: {
  icon: React.ElementType
  label: string
  value?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border-subtle last:border-0">
      <Icon size={15} className="text-text-dim shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{label}</p>
        {value && <p className="text-xs text-text-muted mt-0.5 truncate">{value}</p>}
      </div>
      {action}
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-muted font-mono text-sm tracking-widest animate-pulse">caricamento…</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-7 max-w-lg">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Impostazioni</h1>
          <p className="text-xs text-text-muted mt-0.5">Gestisci il tuo account</p>
        </div>

        <Section title="Account">
          <Row
            icon={Mail}
            label="Email"
            value={user?.email ?? '—'}
          />
          <Row
            icon={Shield}
            label="Account creato"
            value={user?.created_at
              ? new Date(user.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—'
            }
          />
        </Section>

        <Section title="Sessione">
          <Row
            icon={LogOut}
            label="Esci dall'account"
            value="Verrai reindirizzato alla pagina di accesso"
            action={
              <button
                onClick={signOut}
                className="shrink-0 text-xs text-text-muted border border-border rounded-lg px-3 py-1.5 hover:border-border-strong hover:text-text-secondary transition-all"
              >
                Esci
              </button>
            }
          />
        </Section>

        <p className="text-[11px] text-text-dim text-center mt-8">
          biblio · v0.1
        </p>
      </div>
    </div>
  )
}
