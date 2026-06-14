import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSetting(key) {
  const [value, setValue] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', key).single()
      .then(({ data }) => {
        setValue(data?.value || null)
        setLoading(false)
      })
  }, [key])

  return { value, loading }
}