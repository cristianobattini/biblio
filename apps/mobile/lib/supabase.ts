import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ynirhrzxjgtwwgnqahtq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_FkJoSn2djtPVVVN_fIIgFg_ARm_Ke9C'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
