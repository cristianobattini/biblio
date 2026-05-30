'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, BookOpen, PlayCircle, CheckCircle, Bookmark,
  Tag, LayoutGrid, BarChart2, Settings, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/library', label: 'Tutti i libri', icon: BookOpen },
  { href: '/dashboard/reading', label: 'In lettura', icon: PlayCircle },
  { href: '/dashboard/read', label: 'Letti', icon: CheckCircle },
  { href: '/dashboard/unread', label: 'Da leggere', icon: Bookmark },
]

const navBottom = [
  { href: '/dashboard/tags', label: 'Tags', icon: Tag },
  { href: '/dashboard/genres', label: 'Generi', icon: LayoutGrid },
  { href: '/dashboard/stats', label: 'Statistiche', icon: BarChart2 },
  { href: '/dashboard/settings', label: 'Impostazioni', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <aside className="w-[200px] shrink-0 bg-bg-secondary border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-border-subtle">
        <span className="text-lg font-semibold tracking-tight text-text-primary">
          biblio<span className="text-text-muted font-light">.</span>
        </span>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-all border-r-2',
                active
                  ? 'text-text-primary bg-bg-hover border-text-primary'
                  : 'text-text-muted hover:text-text-secondary border-transparent'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}

        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] text-text-dim tracking-widest uppercase">Organizza</span>
        </div>

        {navBottom.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-all border-r-2',
                active
                  ? 'text-text-primary bg-bg-hover border-text-primary'
                  : 'text-text-muted hover:text-text-secondary border-transparent'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={signOut}
        className="flex items-center gap-3 px-5 py-4 text-sm text-text-dim hover:text-text-muted border-t border-border-subtle transition-colors"
      >
        <LogOut size={15} />
        Esci
      </button>
    </aside>
  )
}
