import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../lib/theme'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'

export default function SettingsScreen() {
  const router = useRouter()
  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/auth')
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text.primary, marginBottom: 24 }}>Impostazioni</Text>
      <TouchableOpacity
        onPress={signOut}
        style={{ backgroundColor: colors.bg.tertiary, borderWidth: 1, borderColor: colors.border.default, borderRadius: 10, padding: 14 }}
      >
        <Text style={{ color: colors.text.muted, fontSize: 14 }}>Esci dall'account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
