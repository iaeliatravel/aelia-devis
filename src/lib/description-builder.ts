import { QuoteItem } from '@/types/database'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function buildDescription(item: Partial<QuoteItem>): string {
  switch (item.service_type) {
    case 'hotel':
      return buildHotelDescription(item)
    case 'flight':
      return buildFlightDescription(item)
    case 'transfer':
      return buildTransferDescription(item)
    case 'other':
      return item.other_description || 'Autre prestation'
    default:
      return ''
  }
}

function buildHotelDescription(item: Partial<QuoteItem>): string {
  if (!item.hotel_name) return 'Hôtel'
  const adults = `${String(item.adults || 0).padStart(2, '0')} ADT`
  const children = item.children ? ` + ${String(item.children).padStart(2, '0')} CHD` : ''
  const checkin = item.checkin_date ? format(new Date(item.checkin_date), 'dd/MM/yyyy', { locale: fr }) : ''
  const checkout = item.checkout_date ? format(new Date(item.checkout_date), 'dd/MM/yyyy', { locale: fr }) : ''
  const nights = item.nights ? `${String(item.nights).padStart(2, '0')} nuitées` : ''

  return `${item.hotel_name} | ${item.hotel_city || ''} - ${item.hotel_country || ''} | ${adults}${children} | ${item.room_type || ''} | ${item.board_type || ''} | ${checkin}-${checkout} (${nights})`
}

function buildFlightDescription(item: Partial<QuoteItem>): string {
  if (!item.airline) return 'Vol'
  const baggage = item.includes_baggage ? 'avec bagages' : 'sans bagages'
  const depDate = item.departure_date ? format(new Date(item.departure_date), 'dd/MM/yyyy', { locale: fr }) : ''
  const retDate = item.return_date ? format(new Date(item.return_date), 'dd/MM/yyyy', { locale: fr }) : ''
  const via = item.via ? ` via ${item.via}` : ''

  return `Vol aller-retour ${baggage} ${item.airline} ${item.origin} – ${item.destination} du ${depDate} au ${retDate}${via} : départ ${item.origin} ${item.dep_time} → arrivée ${item.destination} ${item.arr_time}, retour ${item.destination} ${item.ret_dep_time} → arrivée ${item.origin} ${item.ret_arr_time}`
}

export function buildTransferDescription(item: Partial<QuoteItem>): string {
  return `Transfert ${item.transfer_type || 'Aéroport-Hôtel-Aéroport'} | ${item.vehicle_type || ''} | ${item.passengers || 0} pers. | ${item.luggage_count || 0} bagages`
}
