export type ServiceType  = 'hotel' | 'transfer' | 'flight' | 'other'
export type DocumentType = 'devis' | 'proforma' | 'facture' | 'bon_versement'

export interface AgencyConfig {
  id: string
  name: string
  address?: string
  city?: string
  phone?: string
  email?: string
  logo_url?: string
  stamp_url?: string
  rib?: string
  footer_note?: string
  rc?: string
  nif?: string
  nis?: string
  ai?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  sort_order: number
  service_type: ServiceType
  description: string
  quantity: number
  unit_cost: number
  margin_pct: number
  unit_price: number
  total_cost: number
  total_price: number
  profit: number
  hotel_name?: string
  hotel_city?: string
  hotel_country?: string
  adults?: number
  children?: number
  room_type?: string
  board_type?: 'room_only' | 'breakfast' | 'half_board' | 'half_board_plus' | 'full_board' | 'all_inclusive'
  checkin_date?: string
  checkout_date?: string
  nights?: number
  transfer_type?: string
  vehicle_type?: string
  passengers?: number
  luggage_count?: number
  arrival_datetime?: string
  departure_datetime?: string
  flight_type?: string
  airline?: string
  origin?: string
  destination?: string
  via?: string
  departure_date?: string
  return_date?: string
  dep_time?: string
  arr_time?: string
  ret_dep_time?: string
  ret_arr_time?: string
  includes_baggage?: boolean
  other_description?: string
  created_at: string
}

/** Données persistées du dernier voucher généré pour ce devis */
export interface VoucherGuest {
  name: string
  type: 'Adult' | 'Child'
}
export interface VoucherData {
  voucherNumber?: string
  hotelName?: string
  hotelAddress?: string
  guests?: VoucherGuest[]
}

export interface Quote {
  id: string
  quote_number: string
  issue_date: string
  validity_days: number
  client_id?: string
  client?: Client
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  remarks?: string
  total_cost: number
  total_client: number
  profit: number
  items?: QuoteItem[]
  created_at: string
  updated_at: string
  manual_profit?: number | null
  manual_profit_enabled?: boolean
  document_type?: DocumentType
  payment_method?: string | null
  voucher_data?: VoucherData | null
}
