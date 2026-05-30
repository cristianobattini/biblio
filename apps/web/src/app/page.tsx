'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/dashboard')
      else router.replace('/auth')
    })
  }, [router])
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-text-muted font-mono text-sm tracking-widest animate-pulse">biblio</div>
    </div>
  )
}
