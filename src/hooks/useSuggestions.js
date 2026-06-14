import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSuggestions(userId) {
  const [suggestions, setSuggestions] = useState({
    locations: [], acTypes: [], acRegs: [], ratings: [], privileges: []
  })

  useEffect(() => {
    if (!userId) return
    supabase
      .from('log_entries')
      .select('location, ac_type, ac_registration, rating, privilege')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) return
        const unique = (arr) => [...new Set(arr.filter(Boolean))]
        setSuggestions({
          locations: unique(data.map(e => e.location)),
          acTypes: unique(data.map(e => e.ac_type)),
          acRegs: unique(data.map(e => e.ac_registration)),
          ratings: unique(data.map(e => e.rating)),
          privileges: unique(data.map(e => e.privilege))
        })
      })
  }, [userId])

  return suggestions
}