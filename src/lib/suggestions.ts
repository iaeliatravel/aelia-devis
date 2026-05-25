import { supabase } from './supabase'

export async function getSuggestions(category: string, query: string): Promise<string[]> {
  const { data } = await supabase
    .from('suggestions')
    .select('value')
    .eq('category', category)
    .ilike('value', `%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(8)

  return data?.map(d => d.value) || []
}

export async function saveSuggestion(category: string, value: string): Promise<void> {
  if (!value.trim()) return

  await supabase.rpc('upsert_suggestion', {
    p_category: category,
    p_value: value.trim(),
  })
}

export async function saveItemSuggestions(item: Record<string, unknown>): Promise<void> {
  const suggestions: Array<{ category: string; value: string }> = []

  if (item.hotel_name) suggestions.push({ category: 'hotel', value: String(item.hotel_name) })
  if (item.hotel_city) suggestions.push({ category: 'city', value: String(item.hotel_city) })
  if (item.hotel_country) suggestions.push({ category: 'country', value: String(item.hotel_country) })
  if (item.airline) suggestions.push({ category: 'airline', value: String(item.airline) })
  if (item.vehicle_type) suggestions.push({ category: 'vehicle_type', value: String(item.vehicle_type) })
  if (item.room_type) suggestions.push({ category: 'room_type', value: String(item.room_type) })

  for (const s of suggestions) {
    await saveSuggestion(s.category, s.value)
  }
}
