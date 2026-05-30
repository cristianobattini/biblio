import React from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../lib/theme'

export default function StatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text.muted, fontSize: 13, fontFamily: 'monospace' }}>statistiche — prossimamente</Text>
    </SafeAreaView>
  )
}
