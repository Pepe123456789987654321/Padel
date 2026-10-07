import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  ChevronLeft,
  Send,
  Trash2,
  Users,
  Sparkles,
  UserPlus,
  Edit3,
  KeyRound,
  Check,
  Zap,
  ExternalLink,
  Copy,
  CreditCard,
  Link2
} from 'lucide-react';
import { Court, TimeSlot, Booking, CourtBlock, MatchPlayer } from '../types';
import { TIME_SLOTS } from '../data/initialData';
import { MercadoPagoModal } from './MercadoPagoModal';
import { BookingConfirmation } from './BookingConfirmation';
import { FixedSlotModal } from './FixedSlotModal';
import { OpenMatchesView } from './OpenMatchesView';
import { EditOpenMatchModal } from './EditOpenMatchModal';
import { isMatchOrganizer, getOrganizerToken, claimMatchOwnership } from '../lib/openMatchAuth';
import { useAuth } from '../lib/AuthContext';

interface BookingViewProps {
  onGoToProfile: () => void;
  onOpenAuthModal?: () => void;
}

export const BookingView: React.FC<BookingViewProps> = ({ onGoToProfile, onOpenAuthModal }) => {
  const { currentUser, isEmailVerified, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'grid' | 'open_matches'>('grid');
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [openMatches, setOpenMatches] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<CourtBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Open Match Modal state (for host only)
  const [editingOpenMatch, setEditingOpenMatch] = useState<Booking | null>(null);

  // Claim ownership modal state (phone matching fallback)
  const [claimingMatch, setClaimingMatch] = useState<Booking | null>(null);
  const [claimPhoneInput, setClaimPhoneInput] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  // Fixed slot modal state
  const [isFixedSlotOpen, setIsFixedSlotOpen] = useState(false);

  // Date selection state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active slot selection for booking modal
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Detail view modal for an already booked slot
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // Form State for new booking
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // "Falta Uno" options in Booking Modal
  const [isOpenMatch, setIsOpenMatch] = useState(false);
  const [matchCategory, setMatchCategory] = useState('5ta Categoría');
  const [initialPlayerCount, setInitialPlayerCount] = useState(1);
  const [playerPreferredSide, setPlayerPreferredSide] = useState<'Drive' | 'Revés' | 'Ambos'>('Ambos');

  // Joining an open match from viewing modal
  const [joinName, setJoinName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinCategory, setJoinCategory] = useState('5ta Categoría');
  const [joinSide, setJoinSide] = useState<'Drive' | 'Revés' | 'Ambos'>('Ambos');
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState('');

  // Modals & Confirmation
  const DIRECT_MERCADOPAGO_URL = 'https://mpago.la/1tUpkqU';
  const [bookingMode, setBookingMode] = useState<'directa' | 'sena'>('directa');
  const [isCopiedDirectLink, setIsCopiedDirectLink] = useState(false);
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);
  const [isMPModalOpen, setIsMPModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch courts, bookings for date, admin blocks and open matches
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [courtsRes, bookingsRes, blocksRes, openMatchesRes] = await Promise.all([
        fetch('/api/courts'),
        fetch(`/api/bookings?date=${selectedDate}`),
        fetch('/api/admin/blocks'),
        fetch('/api/open-matches')
      ]);

      const courtsData = await courtsRes.json();
      const bookingsData = await bookingsRes.json();
      const blocksData = await blocksRes.json();
      const openMatchesData = await openMatchesRes.json();

      setCourts(courtsData);
      setBookings(bookingsData);
      setBlocks(blocksData);
      setOpenMatches(openMatchesData);
    } catch (e) {
      console.error('Error loading data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Format date helper: DD/MM/YYYY
  const getFormattedDateString = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Get Day of week in uppercase (e.g. VIERNES)
  const getDayOfWeekName = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('es-AR', { weekday: 'long' }).toUpperCase();
  };

  // Find booking for court and slot
  const getBookingForSlot = (courtId: string, slotStartTime: string) => {
    return bookings.find(
      (b) =>
        b.courtId === courtId &&
        b.timeSlot.startTime === slotStartTime &&
        b.paymentStatus !== 'cancelled'
    );
  };

  // Check if slot is blocked
  const isSlotBlocked = (courtId: string, slotId: string) => {
    return blocks.some((blk) => blk.courtId === courtId && blk.date === selectedDate && blk.slotId === slotId);
  };

  // Slot click handler
  const handleCellClick = (court: Court, slot: TimeSlot) => {
    const existingBooking = getBookingForSlot(court.id, slot.startTime);
    if (existingBooking) {
      setViewingBooking(existingBooking);
      setJoinSuccess('');
      return;
    }

    if (isSlotBlocked(court.id, slot.id)) {
      alert('Este turno se encuentra bloqueado por mantenimiento o evento especial.');
      return;
    }

    // Open booking modal immediately with "directa" selected by default
    setSelectedCourt(court);
    setSelectedSlot(slot);
    setBookingMode('directa');
    setIsOpenMatch(false);
    setInitialPlayerCount(1);
    setFormError('');

    // Prepopulate user details if logged in
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      setUserEmail(currentUser.email || '');
      if (userData?.phone) {
        setUserPhone(userData.phone);
      }
    }
  };

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(DIRECT_MERCADOPAGO_URL);
    setIsCopiedDirectLink(true);
    setTimeout(() => setIsCopiedDirectLink(false), 2000);
  };

  const handleDirectBookingPayment = async () => {
    if (!userName.trim()) {
      setFormError('Por favor completá tu nombre completo para la reserva.');
      return;
    }
    if (!selectedCourt || !selectedSlot) return;

    setIsSubmittingDirect(true);
    setFormError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedCourt.id,
          date: selectedDate,
          timeSlot: selectedSlot,
          userName: userName.trim(),
          userEmail: userEmail.trim() || (currentUser?.email || ''),
          userPhone: userPhone.trim(),
          notes: notes.trim(),
          isDirect: true,
          isDirectBooking: true,
          directPaymentUrl: DIRECT_MERCADOPAGO_URL,
          paymentMethod: 'Mercado Pago Directo',
          depositPaid: selectedCourt.price,
          totalPrice: selectedCourt.price,
          remainingBalance: 0
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'No se pudo registrar la reserva');
      }

      const createdBooking = await res.json();

      // Open Mercado Pago official link directly: https://mpago.la/1tUpkqU
      window.open(DIRECT_MERCADOPAGO_URL, '_blank');

      // Clear selection and show confirmation ticket
      setSelectedCourt(null);
      setSelectedSlot(null);
      setConfirmedBooking(createdBooking);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Error al procesar la reserva directa');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!userName.trim()) {
      setFormError('Por favor completá el nombre para continuar.');
      return;
    }
    setFormError('');
    setIsMPModalOpen(true);
  };

  const handleJoinOpenMatch = async (bookingId: string) => {
    if (!joinName.trim()) {
      alert('Por favor completá tu nombre para sumarte al partido.');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/join-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: joinName.trim(),
          playerPhone: joinPhone.trim(),
          playerCategory: joinCategory,
          preferredSide: joinSide
        })
      });

      const data = await res.json();
      if (res.ok) {
        setJoinSuccess('¡Te sumaste con éxito al partido!');
        fetchData();
        setViewingBooking(data.booking);
      } else {
        alert(data.error || 'Error al sumarse');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || 'Cancelado desde la vista de reservas' })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message + '\n' + data.refundInfo);
        setViewingBooking(null);
        fetchData();
      } else {
        alert(data.error || 'Error al cancelar la reserva');
      }
    } catch (e) {
      console.error(e);
      alert('Ocurrió un error al intentar cancelar');
    } finally {
      setIsCancelling(false);
    }
  };

  // Quick toggle status for organizers from BookingView
  const handleQuickUpdateOpenMatchStatus = async (
    booking: Booking,
    status: 'buscando_jugadores' | 'partido_completo'
  ) => {
    const token = getOrganizerToken(booking.id) || booking.creatorToken;
    try {
      const res = await fetch(`/api/bookings/${booking.id}/open-match`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-creator-token': token || ''
        },
        body: JSON.stringify({
          creatorToken: token,
          userPhone: booking.userPhone,
          openMatchStatus: status
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setViewingBooking(updated);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo actualizar el estado.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado del partido.');
    }
  };

  // Claim organizer ownership with phone verification
  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingMatch || !claimPhoneInput.trim()) return;

    const ok = claimMatchOwnership(claimingMatch, claimPhoneInput.trim());
    if (ok) {
      setClaimSuccess('¡Verificación exitosa! Sos el organizador de este partido.');
      setTimeout(() => {
        const target = claimingMatch;
        setClaimingMatch(null);
        setClaimPhoneInput('');
        setClaimSuccess('');
        setClaimError('');
        setEditingOpenMatch(target);
        fetchData();
      }, 700);
    } else {
      setClaimError('El teléfono ingresado no coincide con el titular de la reserva.');
    }
  };

  if (confirmedBooking) {
    return (
      <BookingConfirmation
        booking={confirmedBooking}
        onGoToProfile={onGoToProfile}
        onNewBooking={() => {
          setConfirmedBooking(null);
          setSelectedCourt(null);
          setSelectedSlot(null);
          fetchData();
        }}
      />
    );
  }

  const activeSeekingMatches = openMatches.filter(
    (m) => m.openMatchStatus === 'buscando_jugadores'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-slate-900">
      
      {/* Top Navigation & Action Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Switch Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'grid'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Grilla de Turnos</span>
          </button>

          <button
            onClick={() => setActiveTab('open_matches')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'open_matches'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Partidos Abiertos (Falta Uno)</span>
            {activeSeekingMatches.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black">
                {activeSeekingMatches.length}
              </span>
            )}
          </button>
        </div>

        {/* Action: Request Fixed Slot by WhatsApp */}
        <button
          onClick={() => {
            if (!currentUser || !isEmailVerified) {
              onOpenAuthModal?.();
              return;
            }
            setIsFixedSlotOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>Solicitar Turno Fijo / WhatsApp</span>
        </button>
      </div>

      {activeTab === 'open_matches' ? (
        <OpenMatchesView
          openMatches={openMatches}
          courts={courts}
          onRefresh={fetchData}
          onCreateOpenMatch={() => {
            setActiveTab('grid');
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }}
          onRequestFixedSlot={() => {
            if (!currentUser || !isEmailVerified) {
              onOpenAuthModal?.();
              return;
            }
            setIsFixedSlotOpen(true);
          }}
          onOpenAuthModal={onOpenAuthModal}
        />
      ) : (
        /* Outer Card Container for Grid */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 space-y-6">
          
          {/* Centered Main Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Reserva de Canchas
            </h1>
            <p className="text-xs text-slate-500">
              Hacé click en cualquier turno disponible para reservar tu cancha o abrir un partido comunitario.
            </p>
          </div>

          {/* Control Bar: Volver | Date Selector Box | Day of Week Button */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            
            {/* Volver Button (Celeste / Sky) */}
            <div>
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="w-full sm:w-auto px-6 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-extrabold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Ir a Hoy</span>
              </button>
            </div>

            {/* Date Selector Box (White / Light Gray) */}
            <div className="relative">
              <div className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg p-2.5 flex items-center justify-between shadow-sm cursor-pointer transition-colors">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-wide pl-2">
                  {getFormattedDateString(selectedDate)}
                </span>
                <div className="flex items-center gap-1.5 text-slate-900">
                  <CalendarIcon className="w-5 h-5 text-slate-900" />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>

            {/* Day of Week Button (Celeste / Sky) */}
            <div>
              <div className="bg-sky-600 text-white font-black text-base sm:text-lg py-2.5 px-6 rounded-lg text-center tracking-wider uppercase shadow-sm flex items-center justify-center">
                {getDayOfWeekName(selectedDate)}
              </div>
            </div>

          </div>

          {/* Matrix Table */}
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 text-sm font-semibold">Cargando la grilla de turnos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-md">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-sky-600 text-white">
                    <th className="p-3 border border-sky-700 font-extrabold text-center w-28 uppercase tracking-wider text-xs sm:text-sm">
                      Hora
                    </th>
                    {courts.map((court) => (
                      <th key={court.id} className="p-3 border border-sky-700 font-extrabold text-center uppercase tracking-wider text-xs sm:text-sm">
                        {court.name.split(' - ')[0] || court.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                      {/* Time Column */}
                      <td className="p-3 border border-slate-300 font-extrabold text-slate-800 text-center bg-slate-100 text-xs sm:text-sm min-w-[90px]">
                        {slot.startTime}
                      </td>

                      {/* Court Slots */}
                      {courts.map((court) => {
                        const booking = getBookingForSlot(court.id, slot.startTime);
                        const blocked = isSlotBlocked(court.id, slot.id);

                        if (booking) {
                          // Check if it is an Open Match ("Falta Uno")
                          if (booking.isOpenMatch) {
                            const playersCount = booking.players?.length || 1;
                            const missing = Math.max(0, 4 - playersCount);
                            const isComplete = booking.openMatchStatus === 'partido_completo' || playersCount >= 4;

                            return (
                              <td
                                key={court.id}
                                onClick={() => handleCellClick(court, slot)}
                                className={`p-2.5 border border-slate-300 font-bold text-center cursor-pointer transition-colors text-xs shadow-inner ${
                                  isComplete
                                    ? 'bg-emerald-200 hover:bg-emerald-300 text-emerald-950'
                                    : missing === 1
                                    ? 'bg-amber-300 hover:bg-amber-400 text-amber-950 animate-pulse'
                                    : 'bg-amber-200 hover:bg-amber-300 text-amber-950'
                                }`}
                                title={
                                  isComplete
                                    ? `Partido Completo: ¡Ya se consiguieron los 4 jugadores! (${playersCount}/4)`
                                    : `Falta Uno: ${playersCount}/4 anotados. Click para ver o sumarte.`
                                }
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-center gap-1">
                                    {isComplete ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900 shrink-0" />
                                    ) : (
                                      <Users className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                                    )}
                                    <span className="font-black uppercase tracking-tight">
                                      {isComplete ? 'Completo' : missing === 1 ? '¡Falta 1!' : `Faltan ${missing}`}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-800 font-medium">
                                    {isComplete ? 'Jugadores listos' : `${booking.matchCategory || '5ta Cat'} • ${playersCount}/4`}
                                  </p>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={court.id}
                              onClick={() => handleCellClick(court, slot)}
                              className="p-3 border border-slate-300 bg-red-400 hover:bg-red-500 text-slate-950 font-bold text-center cursor-pointer transition-colors text-xs sm:text-sm shadow-inner"
                              title={`Reservado por ${booking.userName}. Hacé click para ver detalles.`}
                            >
                              Reservado {booking.userName}
                            </td>
                          );
                        }

                        if (blocked) {
                          return (
                            <td
                              key={court.id}
                              onClick={() => handleCellClick(court, slot)}
                              className="p-3 border border-slate-300 bg-slate-200 text-slate-600 font-bold text-center text-xs sm:text-sm cursor-not-allowed"
                            >
                              Bloqueado
                            </td>
                          );
                        }

                        return (
                          <td
                            key={court.id}
                            onClick={() => handleCellClick(court, slot)}
                            className="p-3 border border-slate-300 bg-sky-100 hover:bg-sky-200 text-sky-950 font-extrabold text-center cursor-pointer transition-colors text-xs sm:text-sm"
                            title="Click para reservar este turno"
                          >
                            Disponible
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick Legend Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-sky-200 border border-sky-400"></span>
              <span>Turno Disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-amber-300 border border-amber-500"></span>
              <span>Partido Abierto (Falta 1 o más)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-red-400 border border-red-500"></span>
              <span>Turno Ocupado (Cerrado)</span>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: Nueva Reserva (Directa o con Seña) */}
      {selectedCourt && selectedSlot && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-sky-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  Reserva de Cancha
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedCourt.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {getDayOfWeekName(selectedDate)} {getFormattedDateString(selectedDate)} • <strong>{selectedSlot.startTime} hs</strong> (90 min)
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCourt(null);
                  setSelectedSlot(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Modalidad: Directa vs Con Seña */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Opción 1: Reserva Directa */}
              <button
                type="button"
                onClick={() => setBookingMode('directa')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  bookingMode === 'directa'
                    ? 'border-sky-500 bg-sky-50/70 shadow-md ring-2 ring-sky-400/20 text-slate-900'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    bookingMode === 'directa'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Zap className="w-3 h-3 fill-current" />
                    Directa
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    ${selectedCourt.price.toLocaleString('es-AR')}
                  </span>
                </div>
                <div>
                  <p className="font-black text-sm text-slate-900">Reserva Directa</p>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Pago total inmediato con link de Mercado Pago
                  </p>
                </div>
              </button>

              {/* Opción 2: Con Seña */}
              <button
                type="button"
                onClick={() => setBookingMode('sena')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  bookingMode === 'sena'
                    ? 'border-sky-500 bg-sky-50/70 shadow-md ring-2 ring-sky-400/20 text-slate-900'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    bookingMode === 'sena'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <CreditCard className="w-3 h-3" />
                    Con Seña
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    ${selectedCourt.depositPrice.toLocaleString('es-AR')}
                  </span>
                </div>
                <div>
                  <p className="font-black text-sm text-slate-900">Reserva con Seña</p>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Abonás seña y saldo en el club (o Falta Uno)
                  </p>
                </div>
              </button>
            </div>

            {/* CONTENIDO SEGÚN LA MODALIDAD ELEGIDA */}

            {bookingMode === 'directa' ? (
              /* PANEL: RESERVA DIRECTA CON LINK DE MERCADO PAGO */
              <div className="space-y-3.5 animate-fadeIn">
                
                {/* Banner Oficial Mercado Pago con Link */}
                <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-4 border border-sky-800/80 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Link Oficial de Mercado Pago</p>
                        <p className="text-[10px] text-sky-200">Aboná el turno de forma rápida y segura</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-sky-500/30 text-sky-300 border border-sky-400/40 px-2 py-0.5 rounded-full">
                      Pago Directo
                    </span>
                  </div>

                  {/* Link visible y cliqueable */}
                  <div className="bg-slate-950/90 rounded-xl p-2.5 border border-sky-900/80 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <a
                      href={DIRECT_MERCADOPAGO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono font-bold text-sky-300 hover:text-sky-200 underline truncate flex-1"
                      title="Abrir https://mpago.la/1tUpkqU"
                    >
                      {DIRECT_MERCADOPAGO_URL}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyDirectLink}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {isCopiedDirectLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                    <a
                      href={DIRECT_MERCADOPAGO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      title="Abrir en Mercado Pago"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-sky-900/60 text-slate-300">
                    <span>Total del turno (100% abonado):</span>
                    <span className="text-base font-black text-sky-300">
                      ${selectedCourt.price.toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                </div>

                {/* Form Inputs para titular */}
                <div className="space-y-3 pt-1">
                  {currentUser && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Reserva vinculada a: <strong>{currentUser.email}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.5 rounded shrink-0">
                        Verificado
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre Completo / Titular de la Reserva *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Gabi Veletti"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp / Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      placeholder="+54 9 11 1234-5678"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Action Buttons para Reserva Directa */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingDirect}
                    onClick={handleDirectBookingPayment}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-current text-white" />
                    <span>
                      {isSubmittingDirect
                        ? 'Registrando y abriendo Mercado Pago...'
                        : `Pagar con Mercado Pago ($${selectedCourt.price.toLocaleString('es-AR')} ARS)`}
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourt(null);
                        setSelectedSlot(null);
                      }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <a
                      href={DIRECT_MERCADOPAGO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ir a mpago.la</span>
                    </a>
                  </div>
                </div>

              </div>
            ) : (
              /* PANEL: RESERVA CON SEÑA / PARTIDO ABIERTO */
              <div className="space-y-3.5 animate-fadeIn">
                
                {/* Sub-selector: Turno Cerrado vs Falta Uno */}
                <div className="p-1 bg-slate-100 rounded-2xl flex gap-1">
                  <button
                    type="button"
                    onClick={() => setIsOpenMatch(false)}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      !isOpenMatch
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Partido Completo (Cerrado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpenMatch(true)}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isOpenMatch
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Partido Abierto ("Falta Uno")</span>
                  </button>
                </div>

                {/* Price Info Box */}
                <div className={`border rounded-2xl p-3 flex items-center justify-between text-xs font-bold ${
                  isOpenMatch ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-sky-50 border-sky-200 text-sky-950'
                }`}>
                  <div>
                    <p className="text-slate-600 text-[11px] font-normal">
                      {isOpenMatch ? 'Costo por Jugador (1/4):' : 'Valor Total de Cancha:'}
                    </p>
                    <p className="text-base font-black">
                      ${(isOpenMatch ? selectedCourt.price / 4 : selectedCourt.price).toLocaleString('es-AR')} ARS
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600 text-[11px] font-normal">Seña Mercado Pago:</p>
                    <p className="text-base font-black text-sky-700">${selectedCourt.depositPrice.toLocaleString('es-AR')} ARS</p>
                  </div>
                </div>

                {/* Si es Partido Abierto, configuración extra */}
                {isOpenMatch && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5 text-xs">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>Configuración del Partido Abierto:</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Categoría / Nivel
                        </label>
                        <select
                          value={matchCategory}
                          onChange={(e) => setMatchCategory(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="4ta Categoría">4ta Categoría</option>
                          <option value="5ta Categoría">5ta Categoría</option>
                          <option value="6ta Categoría">6ta Categoría</option>
                          <option value="7ma Categoría">7ma Categoría</option>
                          <option value="Principiantes">Principiantes</option>
                          <option value="Mixto / Libre">Mixto / Libre</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          ¿Cuántos son por ahora?
                        </label>
                        <select
                          value={initialPlayerCount}
                          onChange={(e) => setInitialPlayerCount(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value={1}>1 solo jugador (Faltan 3)</option>
                          <option value={2}>2 jugadores (Faltan 2)</option>
                          <option value={3}>3 jugadores (Falta 1)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Tu Lado de Preferencia
                      </label>
                      <select
                        value={playerPreferredSide}
                        onChange={(e) => setPlayerPreferredSide(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="Ambos">Ambos / Indistinto</option>
                        <option value="Drive">Drive (Derecha)</option>
                        <option value="Revés">Revés (Izquierda)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Form Inputs */}
                <div className="space-y-3 pt-1">
                  {currentUser && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Reserva vinculada a: <strong>{currentUser.email}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.5 rounded shrink-0">
                        Verificado
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre Completo / Titular de la Reserva *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Gabi Veletti"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp de Contacto (Para coordinar)
                    </label>
                    <input
                      type="tel"
                      placeholder="+54 9 11 1234-5678"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourt(null);
                      setSelectedSlot(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className={`flex-1 py-2.5 text-white font-black text-xs rounded-xl transition-colors shadow-md cursor-pointer ${
                      isOpenMatch ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                  >
                    {isOpenMatch ? 'Abrir Partido y Pagar Seña' : `Pagar Seña Mercado Pago ($${selectedCourt.depositPrice.toLocaleString('es-AR')})`}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL: Ver Detalle de Reserva Existente / Sumarse a Partido Abierto */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-4 p-6 sm:p-7">
            
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className={`text-xs font-black uppercase tracking-wider ${
                  viewingBooking.isOpenMatch ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {viewingBooking.isOpenMatch ? '🎾 Partido Abierto Comunitario' : 'Turno Reservado (Cerrado)'}
                </span>
                <h3 className="text-xl font-black text-slate-800">{viewingBooking.courtName}</h3>
                <p className="text-xs text-slate-500">
                  {getDayOfWeekName(viewingBooking.date)} {getFormattedDateString(viewingBooking.date)} — {viewingBooking.timeSlot.startTime} hs
                </p>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If it's an OPEN MATCH */}
            {viewingBooking.isOpenMatch ? (() => {
              const isHost = isMatchOrganizer(viewingBooking);
              const playersCount = viewingBooking.players?.length || 1;
              const isComplete = viewingBooking.openMatchStatus === 'partido_completo' || playersCount >= 4;

              return (
                <div className="space-y-3.5">
                  {/* Organizer banner or Ownership verification */}
                  {isHost ? (
                    <div className="space-y-2">
                      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">👑</span>
                          <div>
                            <p className="font-black text-xs text-amber-950">Sos el organizador de este partido</p>
                            <p className="text-[10px] text-amber-800 font-medium">Solo vos podés editar los cupos o cambiar el estado</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const target = viewingBooking;
                            setViewingBooking(null);
                            setEditingOpenMatch(target);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Editar</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickUpdateOpenMatchStatus(viewingBooking, 'partido_completo')}
                          className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            viewingBooking.openMatchStatus === 'partido_completo'
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar: Conseguidos</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickUpdateOpenMatchStatus(viewingBooking, 'buscando_jugadores')}
                          className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            viewingBooking.openMatchStatus === 'buscando_jugadores'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Marcar: Falta Gente</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        Organizado por: <strong className="text-slate-900">{viewingBooking.userName}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const target = viewingBooking;
                          setViewingBooking(null);
                          setClaimingMatch(target);
                          setClaimPhoneInput('');
                          setClaimError('');
                          setClaimSuccess('');
                        }}
                        className="text-[11px] text-sky-600 hover:text-sky-800 hover:underline font-bold cursor-pointer"
                      >
                        ¿Sos el titular? Verificate
                      </button>
                    </div>
                  )}

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase">Categoría:</span>
                      <p className="text-sm font-black text-amber-950">{viewingBooking.matchCategory || '5ta Categoría'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-amber-800 uppercase">Estado:</span>
                      <p className="text-sm font-black text-amber-950">
                        {isComplete ? 'Completo (4/4)' : `${playersCount}/4 anotados`}
                      </p>
                    </div>
                  </div>

                  {/* Players Roster */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Cuarteto de Jugadores:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((idx) => {
                        const pl = viewingBooking.players?.[idx];
                        if (pl) {
                          return (
                            <div
                              key={pl.id || idx}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                            >
                              <div className="w-7 h-7 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs">
                                {pl.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate">
                                  {pl.name} {pl.isHost ? '👑' : ''}
                                </p>
                                <p className="text-[10px] text-slate-500">{pl.preferredSide || 'Ambos'}</p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="p-2.5 border border-dashed border-slate-300 rounded-xl flex items-center gap-2 text-slate-400 bg-slate-50/50"
                          >
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                              ?
                            </div>
                            <span className="text-xs font-semibold italic">Lugar Libre</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct Join Form if spots open & not marked complete */}
                  {!isComplete && playersCount < 4 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-amber-600" />
                        <span>¿Querés sumarte a este partido?</span>
                      </h5>

                      {joinSuccess ? (
                        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center">
                          {joinSuccess}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Tu Nombre completo *"
                              value={joinName}
                              onChange={(e) => setJoinName(e.target.value)}
                              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                            />
                            <input
                              type="tel"
                              placeholder="WhatsApp (Opcional)"
                              value={joinPhone}
                              onChange={(e) => setJoinPhone(e.target.value)}
                              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleJoinOpenMatch(viewingBooking.id)}
                            disabled={isJoining}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isJoining ? 'Anotando...' : '¡Anotarme en este partido!'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-center font-black text-xs rounded-2xl flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡PARTIDO COMPLETO! Ya se consiguieron los jugadores.</span>
                    </div>
                  )}
                </div>
              );
            })() : (
              /* Regular Booking details */
              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {viewingBooking.isDirectBooking && (
                  <div className="p-2.5 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between text-sky-950 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-sky-600 fill-current" />
                      Reserva Directa Mercado Pago
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-mono">
                      100% Abonado
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Titular de Reserva:</span>
                  <span className="font-extrabold text-slate-900">{viewingBooking.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="font-bold text-slate-800">{viewingBooking.userPhone || 'No informado'}</span>
                </div>
                {viewingBooking.userEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-bold text-slate-800">{viewingBooking.userEmail}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-500">{viewingBooking.isDirectBooking ? 'Abonado 100%:' : 'Seña Abonada:'}</span>
                  <span className="font-bold text-sky-600">
                    ${viewingBooking.depositPaid.toLocaleString('es-AR')} ARS ({viewingBooking.paymentMethod || 'Mercado Pago'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo a Cobrar en Club:</span>
                  <span className={`font-bold ${viewingBooking.remainingBalance === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ${viewingBooking.remainingBalance.toLocaleString('es-AR')} ARS {viewingBooking.remainingBalance === 0 ? '(¡Totalmente pagado!)' : ''}
                  </span>
                </div>
                {viewingBooking.directPaymentUrl && (
                  <div className="flex flex-col gap-1 bg-sky-50/70 p-2.5 rounded-xl border border-sky-200 text-[11px] mt-1">
                    <span className="text-sky-900 font-bold flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-sky-600" />
                      Link de Mercado Pago:
                    </span>
                    <a
                      href={viewingBooking.directPaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-800 underline font-mono text-[10px] break-all"
                    >
                      {viewingBooking.directPaymentUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {viewingBooking.userPhone && (
                <a
                  href={`https://wa.me/${viewingBooking.userPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${viewingBooking.userName}, te escribo por tu turno de Punto Padel del ${viewingBooking.date} a las ${viewingBooking.timeSlot.startTime} hs.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Contactar Organizador por WhatsApp</span>
                </a>
              )}

              <button
                onClick={() => handleCancelBooking(viewingBooking.id)}
                disabled={isCancelling}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Cancelar esta Reserva</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Mercado Pago Payment Modal */}
      {selectedCourt && selectedSlot && (
        <MercadoPagoModal
          isOpen={isMPModalOpen}
          onClose={() => setIsMPModalOpen(false)}
          court={selectedCourt}
          date={selectedDate}
          timeSlot={selectedSlot}
          userName={userName}
          userEmail={userEmail}
          userPhone={userPhone}
          notes={notes}
          isOpenMatch={isOpenMatch}
          matchCategory={matchCategory}
          playerPreferredSide={playerPreferredSide}
          initialPlayerCount={initialPlayerCount}
          onPaymentSuccess={(newBooking) => {
            setIsMPModalOpen(false);
            setSelectedCourt(null);
            setSelectedSlot(null);
            setConfirmedBooking(newBooking);
          }}
        />
      )}

      {/* Fixed Slot Request Modal */}
      <FixedSlotModal
        isOpen={isFixedSlotOpen}
        onClose={() => setIsFixedSlotOpen(false)}
        courts={courts}
      />

      {/* Edit Open Match Modal (Organizer Only) */}
      {editingOpenMatch && (
        <EditOpenMatchModal
          isOpen={!!editingOpenMatch}
          booking={editingOpenMatch}
          onClose={() => setEditingOpenMatch(null)}
          onUpdated={() => {
            fetchData();
          }}
        />
      )}

      {/* Organizer Ownership Claim / Verification Modal */}
      {claimingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verificar Titular</span>
                </span>
                <h3 className="text-lg font-black text-slate-900">¿Organizaste este partido?</h3>
              </div>
              <button
                onClick={() => setClaimingMatch(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Para proteger tu reserva, solo quien creó el partido puede editar los cupos o marcarlo como completo. Ingresá el <strong>teléfono de WhatsApp</strong> con el que hiciste la reserva:
            </p>

            {claimSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{claimSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número de Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: 11 5510 4499"
                    value={claimPhoneInput}
                    onChange={(e) => setClaimPhoneInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                    required
                    autoFocus
                  />
                </div>

                {claimError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold rounded-xl">
                    {claimError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setClaimingMatch(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Verificar y Editar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
