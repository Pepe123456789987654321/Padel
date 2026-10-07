import React, { useState, useEffect } from 'react';
import { User, Calendar, Award, ShieldAlert, Clock, RefreshCw, XCircle, Share2, Check, Download, Bell, Trophy, Zap, AlertTriangle, Building2, MapPin } from 'lucide-react';
import { Booking, PlayerProfile } from '../types';

interface UserProfileProps {
  onNewBookingClick: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onNewBookingClick }) => {
  const [profile, setProfile] = useState<PlayerProfile>({
    id: 'p-1',
    name: 'Luciano Beltrán',
    email: 'luciano.padel@gmail.com',
    phone: '+54 9 11 4522-8901',
    category: '5ta Categoría',
    preferredSide: 'Revés',
    dominantHand: 'Derecha',
    matchesPlayed: 14,
    notificationsEnabled: true
  });

  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'history' | 'settings'>('upcoming');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  // Fetch bookings for logged-in user
  const fetchMyBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${profile.email}`);
      const data = await res.json();
      setMyBookings(data);
    } catch (e) {
      console.error('Error loading user bookings', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [profile.email]);

  const upcomingBookings = myBookings.filter((b) => b.paymentStatus === 'approved');
  const pastOrCancelledBookings = myBookings.filter((b) => b.paymentStatus === 'cancelled' || b.paymentStatus === 'refunded');

  // Handle Cancel Booking
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cancelar');
      }

      setCancelSuccessMsg(data.refundInfo || 'Reserva cancelada correctamente');
      setTimeout(() => {
        setCancellingBooking(null);
        setCancelSuccessMsg('');
        fetchMyBookings();
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = (b: Booking) => {
    const startIso = b.date.replace(/-/g, '') + 'T' + b.timeSlot.startTime.replace(':', '') + '00';
    const endIso = b.date.replace(/-/g, '') + 'T' + b.timeSlot.endTime.replace(':', '') + '00';
    
    const title = encodeURIComponent(`Partido de Pádel - ${b.courtName}`);
    const details = encodeURIComponent(
      `Reserva Padel Point #${b.id}\nJugador: ${b.userName}\nSaldo restante a pagar en club: $${b.remainingBalance} ARS`
    );
    const location = encodeURIComponent('Padel Point Club - Av. del Deporte 1450');

    return `https://calendar.google.com/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&ctz=America/Argentina/Buenos_Aires`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn text-white">
      
      {/* Player Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-lime-500 to-emerald-400 p-0.5 shadow-xl shadow-lime-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-lime-400">
                {profile.name.split(' ').map((n) => n[0]).join('')}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                <span className="bg-lime-500/20 text-lime-300 border border-lime-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {profile.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">{profile.email} • {profile.phone}</p>
              <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                <span className="bg-slate-800 px-2 py-0.5 rounded-md">Lado: <strong>{profile.preferredSide}</strong></span>
                <span className="bg-slate-800 px-2 py-0.5 rounded-md">Mano: <strong>{profile.dominantHand}</strong></span>
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-around md:justify-end bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-center px-3">
              <p className="text-2xl font-black text-lime-400">{upcomingBookings.length}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Próximos Partidos</p>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="text-center px-3">
              <p className="text-2xl font-black text-white">{profile.matchesPlayed}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Jugados en Club</p>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="text-center px-3">
              <p className="text-2xl font-black text-amber-400">100%</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Asistencia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-800 gap-4 text-sm font-bold">
        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'upcoming'
              ? 'border-lime-400 text-lime-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Próximos Partidos ({upcomingBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'history'
              ? 'border-lime-400 text-lime-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial & Cancelaciones ({pastOrCancelledBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'settings'
              ? 'border-lime-400 text-lime-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notificaciones & Ajustes</span>
        </button>
      </div>

      {/* Tab 1: Upcoming Bookings */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-6">
          {upcomingBookings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-800">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No tenés reservas activas</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Buscá un turno disponible y reservá tu cancha favorita abonando la seña con Mercado Pago.
              </p>
              <button
                onClick={onNewBookingClick}
                className="px-6 py-3 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-lime-500/20 cursor-pointer"
              >
                Reservar Mi Cancha Ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingBookings.map((b) => (
                <div 
                  key={b.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-lime-500/20 text-lime-300 border border-lime-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        Confirmada • Seña MP Pagada
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-1.5">{b.courtName}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-lime-400" /> Padel Point - Av. del Deporte 1450
                      </p>
                    </div>
                    <span className="font-mono text-xs text-lime-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      #{b.id}
                    </span>
                  </div>

                  {/* Date & Time Highlight */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Fecha del Partido</p>
                      <p className="font-bold text-slate-100 text-sm">{b.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Horario (90 min)</p>
                      <p className="font-bold text-lime-400 text-sm">{b.timeSlot.label}</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-1 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Seña Abonada (Mercado Pago):</span>
                      <span className="text-cyan-400 font-bold">${b.depositPaid.toLocaleString('es-AR')} ARS</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> Saldo a pagar en el club:
                      </span>
                      <span>${b.remainingBalance.toLocaleString('es-AR')} ARS</span>
                    </div>
                  </div>

                  {/* Calendar Sync & Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sincronización & Acciones</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <a
                        href={getGoogleCalendarUrl(b)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>Google Calendar</span>
                      </a>

                      <a
                        href={`/api/bookings/${b.id}/ical`}
                        download
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" />
                        <span>Descargar .ICS</span>
                      </a>
                    </div>

                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar Reserva</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: History & Cancellations */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-base font-bold text-white">Historial de Partidos y Reservas Canceladas</h3>
          
          {pastOrCancelledBookings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No tenés cancelaciones ni historial previo.</p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {pastOrCancelledBookings.map((b) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      CANCELADA
                    </span>
                    <h4 className="font-bold text-slate-200 mt-1">{b.courtName}</h4>
                    <p className="text-slate-400">{b.date} • {b.timeSlot.label}</p>
                    {b.cancelReason && (
                      <p className="text-rose-300 text-[11px] mt-0.5">Motivo: {b.cancelReason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-slate-400">#{b.id}</p>
                    <p className="text-slate-400 font-medium">Seña ${b.depositPaid} ARS</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings & Notifications */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-xl">
          <h3 className="text-base font-bold text-white">Configuración de Recordatorios</h3>
          
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <p className="font-bold text-slate-200">Notificaciones en el Navegador</p>
                <p className="text-slate-400 text-[11px]">Recibí alertas 2 horas antes de tu partido.</p>
              </div>
              <input
                type="checkbox"
                checked={profile.notificationsEnabled}
                onChange={(e) => setProfile({ ...profile, notificationsEnabled: e.target.checked })}
                className="w-5 h-5 accent-lime-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <p className="font-bold text-slate-200">Recordatorios vía WhatsApp</p>
                <p className="text-slate-400 text-[11px]">Recibí un mensaje automatizado el día del partido.</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-lime-400 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Cancelar Reserva de Turno</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de cancelar el partido para la <strong>{cancellingBooking.courtName}</strong> el día <strong>{cancellingBooking.date}</strong> en el horario <strong>{cancellingBooking.timeSlot.label}</strong>?
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">Política de Cancelación del Club:</p>
              <p>• Cancelando con más de 2 horas de anticipación: la seña se reintegra o acredita para tu próximo partido.</p>
              <p>• Cancelando con menos de 2 horas de anticipación: la seña no es reembolsable.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Motivo de cancelación (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Imprevisto de salud, lluvia..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            {cancelSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
                {cancelSuccessMsg}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Procesando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
