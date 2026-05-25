import { QuoteItem } from '@/types/database'

const BOARD_LABELS: Record<string, string> = {
  room_only:     'Chambre seulement',
  breakfast:     'Petit déjeuner',
  half_board:    'Demi pension',
  full_board:    'Pension complète',
  all_inclusive: 'Tout inclus',
}

function pad(n: number | null | undefined) {
  return String(n ?? 0).padStart(2, '0')
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '?'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function fmtTime(t: string | null | undefined) {
  return t ? t.slice(0, 5) : '??:??'
}

export function buildHotelDescription(data: Partial<QuoteItem>): string {
  const adults   = `${pad(data.adults)} ADT`
  const children = (data.children ?? 0) > 0 ? ` + ${pad(data.children)} CHD` : ''
  let nights = 0
  if (data.checkin_date && data.checkout_date) {
    nights = Math.max(0, Math.round(
      (new Date(data.checkout_date).getTime() - new Date(data.checkin_date).getTime()) / 86400000
    ))
  }
  const nStr  = `${pad(nights)} nuit${nights > 1 ? 'ées' : 'ée'}`
  const board = BOARD_LABELS[data.board_type ?? ''] ?? data.board_type ?? '?'
  const hotel = data.hotel_name || '?'
  const city  = data.hotel_city || '?'
  const country = data.hotel_country || '?'
  const room  = data.room_type || '?'
  return `${hotel} | ${city} - ${country} | ${adults}${children} | ${room} | ${board} | ${fmtDate(data.checkin_date)}-${fmtDate(data.checkout_date)} (${nStr})`
}

export function buildFlightDescription(data: Partial<QuoteItem>): string {
  const airline  = data.airline || '?'
  const org      = data.origin || '?'
  const dst      = data.destination || '?'
  const via      = data.via ? ` via ${data.via}` : ''
  const baggage  = data.includes_baggage !== false ? 'avec bagages' : 'sans bagages'
  const depDate  = fmtDate(data.departure_date)
  const retDate  = fmtDate(data.return_date)
  const depTime  = fmtTime(data.dep_time)
  const arrTime  = fmtTime(data.arr_time)
  const rDepTime = fmtTime(data.ret_dep_time)
  const rArrTime = fmtTime(data.ret_arr_time)
  return `Vol aller-retour ${baggage} ${airline} ${org} – ${dst} du ${depDate} au ${retDate}${via} : départ ${org} ${depTime} → arrivée ${dst} ${arrTime}, retour ${dst} ${rDepTime} → arrivée ${org} ${rArrTime}`
}

export function buildTransferDescription(data: Partial<QuoteItem>): string {
  const type  = data.transfer_type || 'Aéroport-Hôtel-Aéroport'
  const veh   = data.vehicle_type  ? ` | ${data.vehicle_type}` : ''
  const pax   = data.passengers    ? ` | ${data.passengers} pers.` : ''
  const bags  = (data.luggage_count ?? 0) > 0 ? ` | ${data.luggage_count} bagage(s)` : ''
  return `Transfert ${type}${veh}${pax}${bags}`
}

export function buildDescription(data: Partial<QuoteItem>): string {
  switch (data.service_type) {
    case 'hotel':    return buildHotelDescription(data)
    case 'flight':   return buildFlightDescription(data)
    case 'transfer': return buildTransferDescription(data)
    default:         return data.other_description || data.description || ''
  }
}
