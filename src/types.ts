export interface Court {
  id: string;
  name: string;
  type: 'Techada Cristal' | 'Exterior Panorámica' | 'Cancha Indoor VIP';
  surface: string;
  price: number; // Precio total por 90 min
  depositPrice: number; // Seña con Mercado Pago
  image: string;
  description: string;
  features: string[];
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g. "11:00"
  endTime: string;   // e.g. "12:30"
  label: string;     // e.g. "11:00 - 12:30"
  isPeakHour: boolean; // e.g. 17:00 hs onwards
}

export interface MatchPlayer {
  id: string;
  name: string;
  phone?: string;
  category?: string; // e.g. "5ta Categoría"
  preferredSide?: 'Drive' | 'Revés' | 'Ambos';
  joinedAt: string;
  isHost?: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  date: string; // YYYY-MM-DD
  timeSlot: {
    startTime: string;
    endTime: string;
    label: string;
  };
  userName: string;
  userEmail: string;
  userPhone: string;
  totalPrice: number;
  depositPaid: number;
  remainingBalance: number;
  paymentMethod: 'Mercado Pago' | 'Mercado Pago Directo' | 'Efectivo en Club' | 'Tarjeta de Crédito';
  paymentStatus: 'approved' | 'pending' | 'cancelled' | 'refunded';
  mercadoPagoPreferenceId?: string;
  mercadoPagoPaymentId?: string;
  isDirectBooking?: boolean;
  directPaymentUrl?: string;
  createdAt: string;
  notes?: string;
  cancelReason?: string;

  // "Falta Uno" / Partido Abierto fields
  isOpenMatch?: boolean;
  matchCategory?: string; // e.g. "5ta Categoría", "6ta / 7ma Categoría", "Mixto / Libre"
  maxPlayers?: number; // 4
  players?: MatchPlayer[];
  openMatchStatus?: 'buscando_jugadores' | 'partido_completo';
  creatorToken?: string; // Token de seguridad que identifica al creador/organizador del partido

  // Turno Fijo Semanal
  isRecurringFixed?: boolean;
  fixedDayOfWeek?: string;
}

export interface FixedSlotRequest {
  id: string;
  userName: string;
  userPhone: string;
  dayOfWeek: string;
  startTime: string;
  courtId: string;
  courtName: string;
  frequency: 'Semanal (Todos los meses)' | 'Quincenal';
  notes?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CourtBlock {
  id: string;
  courtId: string;
  date: string;
  slotId: string;
  reason: string; // e.g. "Mantenimiento de césped", "Torneo Anual"
}

export interface PlayerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string; // e.g. "5ta Categoría"
  preferredSide: 'Drive' | 'Revés' | 'Ambos';
  dominantHand: 'Derecha' | 'Zurda';
  favoriteCourtId?: string;
  matchesPlayed: number;
  notificationsEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'reminder' | 'confirmation' | 'cancellation' | 'admin';
  bookingId?: string;
}

export interface DailyRevenueItem {
  date: string;
  formattedDate?: string;
  amount: number;
  deposits: number;
  balances: number;
  bookingsCount: number;
}

export interface StatsSummary {
  totalBookings: number;
  totalRevenue: number;
  depositsCollected: number;
  pendingBalances: number;
  occupancyRate: number;
  popularCourt: string;
  bookingsByCourt: { courtName: string; count: number; revenue?: number }[];
  hourlyOccupancy: { hour: string; occupancy: number; revenue?: number }[];
  dailyRevenue: DailyRevenueItem[];
}

export interface AdminUser {
  id: string;
  name: string;
  role: 'Administrador Principal' | 'Administrador' | 'Recepción / Canchero';
  pin: string;
  email?: string;
  createdAt: string;
}
