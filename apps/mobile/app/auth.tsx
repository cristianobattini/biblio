import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { colors, radius } from '../lib/theme'

export default function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        Alert.alert('Controlla la tua email per confermare l\'account.')
      }
    } catch (e: any) {
      Alert.alert('Errore', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.logo}>biblio</Text>
        <Text style={s.sub}>la tua libreria</Text>

        <View style={s.modeRow}>
          {(['login', 'signup'] as const).map(m => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} style={[s.modeBtn, mode === m && s.modeBtnActive]}>
              <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.text.dim} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.text.dim} secureTextEntry />

        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[s.btn, loading && { opacity: 0.5 }]}>
          {loading ? <ActivityIndicator color={colors.bg.primary} /> : <Text style={s.btnText}>{mode === 'login' ? 'Accedi' : 'Crea account'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logo: { fontSize: 32, fontWeight: '300', color: colors.text.primary, textAlign: 'center', letterSpacing: 6, marginBottom: 4 },
  sub: { fontSize: 12, color: colors.text.dim, textAlign: 'center', letterSpacing: 2, marginBottom: 40 },
  modeRow: { flexDirection: 'row', backgroundColor: colors.bg.tertiary, borderRadius: radius.md, padding: 4, marginBottom: 24 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.bg.hover },
  modeBtnText: { fontSize: 13, color: colors.text.muted },
  modeBtnTextActive: { color: colors.text.primary },
  input: { backgroundColor: colors.bg.secondary, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text.primary, marginBottom: 12 },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 15, fontWeight: '600', color: colors.bg.primary },
})
