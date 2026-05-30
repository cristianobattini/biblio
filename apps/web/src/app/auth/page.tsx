'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Controlla la tua email per confermare l\'account.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-light tracking-[0.3em] text-text-primary mb-1">biblio</h1>
          <p className="text-text-muted text-xs tracking-widest">la tua libreria</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-card">
          <div className="flex mb-8 bg-bg-tertiary rounded-lg p-1">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  mode === m
                    ? 'bg-bg-hover text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-2 tracking-wider uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@esempio.com"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-2 tracking-wider uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-strong transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-text-secondary bg-bg-tertiary border border-border rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-bg-primary font-medium text-sm rounded-lg py-3 hover:bg-text-secondary transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? '...' : mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
