import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Phone,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Send,
  AlertCircle,
  X,
  Sparkles,
  UserPlus,
  Edit3,
  Check,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { Booking, MatchPlayer, Court } from '../types';
import { isMatchOrganizer, getOrganizerToken, claimMatchOwnership } from '../lib/openMatchAuth';
import { EditOpenMatchModal } from './EditOpenMatchModal';
import { useAuth } from '../lib/AuthContext';

interface OpenMatchesViewProps {
  openMatches: Booking[];
  courts: Court[];
  onRefresh: () => void;
  onCreateOpenMatch: () => void;
  onRequestFixedSlot: () => void;
  onOpenAuthModal?: () => void;
}

const CATEGORIES = [
  'Todas las Categorías',
  '7ma Categoría',
  '6ta / 7ma Categoría',
  '6ta Categoría',
  '5ta Categoría',
  '4ta Categoría',
  'Principiantes',
  'Mixto / Libre'
];

export const OpenMatchesView: React.FC<OpenMatchesViewProps> = ({
  openMatches,
  courts,
  onRefresh,
  onCreateOpenMatch,
  onRequestFixedSlot,
  onOpenAuthModal
}) => {
  const { currentUser, isEmailVerified, userData } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Todas las Categorías');
  const [joiningMatch, setJoiningMatch] = useState<Booking | null>(null);

  // Modal for Organizer to Edit Match
  const [editingMatch, setEditingMatch] = useState<Booking | null>(null);

  // Modal for user to verify/claim ownership with their phone
  const [claimingMatch, setClaimingMatch] = useState<Booking | null>(null);
  const [claimPhoneInput, setClaimPhoneInput] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  // Form for joining a match
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerCategory, setPlayerCategory] = useState('5ta Categoría');
  const [preferredSide, setPreferredSide] = useState<'Drive' | 'Revés' | 'Ambos'>('Ambos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-fill player info if authenticated
  useEffect(() => {
    if (currentUser) {
      setPlayerName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      if (userData?.phone) {
        setPlayerPhone(userData.phone);
      }
    }
  }, [currentUser, userData]);

  // Filter matches
  const filteredMatches = openMatches.filter((m) => {
    if (selectedCategory === 'Todas las Categorías') return true;
    return m.matchCategory?.toLowerCase().includes(selectedCategory.toLowerCase()) || m.matchCategory === selectedCategory;
  });

  // Quick toggle status for organizers
  const handleQuickToggleStatus = async (
    match: Booking,
    newStatus: 'buscando_jugadores' | 'partido_completo'
  ) => {
    const token = getOrganizerToken(match.id) || match.creatorToken;
    try {
      const res = await fetch(`/api/bookings/${match.id}/open-match`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-creator-token': token || ''
        },
        body: JSON.stringify({
          creatorToken: token,
          userPhone: match.userPhone,
          openMatchStatus: newStatus
        })
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo actualizar el estado.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    }
  };

  // Claim ownership form submit
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
        setEditingMatch(target);
        onRefresh();
      }, 700);
    } else {
      setClaimError('El teléfono ingresado no coincide con el titular de la reserva.');
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningMatch) return;
    if (!playerName.trim()) {
      setErrorMessage('Por favor ingresá tu nombre completo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/bookings/${joiningMatch.id}/join-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          playerPhone: playerPhone.trim(),
          playerCategory,
          preferredSide
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`¡Excelente! Te sumaste al partido en ${joiningMatch.courtName}.`);
        setTimeout(() => {
          setJoiningMatch(null);
          setPlayerName('');
          setPlayerPhone('');
          setSuccessMessage('');
          onRefresh();
        }, 1200);
      } else {
        setErrorMessage(data.error || 'No fue posible sumarse al partido.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al conectarse con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Falta Uno Community */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs">
            <Users className="w-3.5 h-3.5" />
            <span>Comunidad de Jugadores • Falta Uno</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            ¿Te falta 1 para el partido o jugás solo?
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm">
            Sumate a los partidos abiertos con jugadores de tu misma categoría o armá un turno y dejá los lugares libres para que se complete el cuarteto.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              if (!currentUser || !isEmailVerified) {
                onOpenAuthModal?.();
                return;
              }
              onCreateOpenMatch();
            }}
            className="px-5 py-3 bg-white hover:bg-amber-50 text-amber-900 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>+ Crear Partido Abierto</span>
          </button>

          <button
            onClick={() => {
              if (!currentUser || !isEmailVerified) {
                onOpenAuthModal?.();
                return;
              }
              onRequestFixedSlot();
            }}
            className="px-5 py-3 bg-black/20 hover:bg-black/30 border border-white/30 text-white font-black text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Solicitar Turno Fijo</span>
          </button>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Open Matches Cards Grid */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">No hay partidos abiertos en esta categoría</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              ¡Sé el primero en abrir un partido! Reservá cualquier horario disponible en la grilla y publicalo para que otros 3 jugadores se sumen.
            </p>
          </div>
          <button
            onClick={() => {
              if (!currentUser || !isEmailVerified) {
                onOpenAuthModal?.();
                return;
              }
              onCreateOpenMatch();
            }}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Partido Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map((match) => {
            const players = match.players || [];
            const playersCount = players.length;
            const missingPlayers = Math.max(0, 4 - playersCount);
            const isComplete = match.openMatchStatus === 'partido_completo' || playersCount >= 4;
            const isOrganizer = isMatchOrganizer(match);

            return (
              <div
                key={match.id}
                className={`bg-white rounded-3xl border p-5 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between ${
                  isOrganizer ? 'border-amber-400 ring-2 ring-amber-300/50' : 'border-slate-200'
                }`}
              >
                {/* Header of Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isComplete
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : missingPlayers === 1
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isComplete ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Partido Completo • Conseguidos</span>
                        </>
                      ) : missingPlayers === 1 ? (
                        <span>🔥 ¡FALTA 1 JUGADOR!</span>
                      ) : (
                        <span>Faltan {missingPlayers} jugadores</span>
                      )}
                    </span>

                    <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg">
                      {match.matchCategory || '5ta Categoría'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 line-clamp-1">{match.courtName}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        {match.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        {match.timeSlot.startTime} hs (90 min)
                      </span>
                    </div>
                  </div>

                  {/* Organizer Badge or Originator Info */}
                  {isOrganizer ? (
                    <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">👑</span>
                        <div>
                          <p className="font-black text-amber-900">Sos el organizador</p>
                          <p className="text-[10px] text-amber-800">Solo vos podés editar este partido</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Tu Reserva
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
                      <span>Organizado por: <strong className="text-slate-800">{match.userName}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setClaimingMatch(match);
                          setClaimPhoneInput('');
                          setClaimError('');
                          setClaimSuccess('');
                        }}
                        className="text-[10px] text-sky-600 hover:text-sky-800 hover:underline font-bold cursor-pointer"
                      >
                        ¿Sos vos? Verificate
                      </button>
                    </div>
                  )}
                </div>

                {/* Registered Players List */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
                    <span>Jugadores Anotados ({playersCount}/4):</span>
                    <span className="text-slate-700 font-mono">${(match.totalPrice / 4).toLocaleString('es-AR')}/jugador</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((idx) => {
                      const pl = players[idx];
                      if (pl) {
                        return (
                          <div
                            key={pl.id || idx}
                            className="p-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-xs"
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {pl.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-[11px]">
                                {pl.name} {pl.isHost ? '👑' : ''}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {pl.preferredSide || 'Ambos'}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="p-2 border border-dashed border-slate-300 rounded-xl flex items-center gap-2 text-slate-400 bg-white/40"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            ?
                          </div>
                          <span className="text-[11px] font-medium italic">Lugar Libre</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="space-y-2 pt-1">
                  {isOrganizer ? (
                    // ORGANIZER ACTIONS
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setEditingMatch(match)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar Partido y Gestionar Cupos</span>
                      </button>

                      {isComplete ? (
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStatus(match, 'buscando_jugadores')}
                          className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-300"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-800" />
                          <span>Volver a Buscar (Marcar que Falta 1)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStatus(match, 'partido_completo')}
                          className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Marcar: Ya Conseguimos los Jugadores</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    // NON-ORGANIZER ACTIONS
                    <div className="space-y-2">
                      {!isComplete ? (
                        <button
                          onClick={() => {
                            if (!currentUser || !isEmailVerified) {
                              onOpenAuthModal?.();
                              return;
                            }
                            setJoiningMatch(match);
                            setPlayerCategory(match.matchCategory || '5ta Categoría');
                            setPlayerName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
                            if (userData?.phone) {
                              setPlayerPhone(userData.phone);
                            }
                            setErrorMessage('');
                          }}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>¡Sumarme a este Partido!</span>
                        </button>
                      ) : (
                        <div className="w-full py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-center font-black text-xs rounded-xl flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>¡PARTIDO COMPLETO! Ya se consiguieron los jugadores</span>
                        </div>
                      )}

                      {match.userPhone && (
                        <a
                          href={`https://wa.me/${match.userPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hola ${match.userName}, te escribo por el partido abierto de Punto Padel del ${match.date} a las ${match.timeSlot.startTime} hs en ${match.courtName}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Escribir al Organizador por WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT OPEN MATCH MODAL (FOR ORGANIZER ONLY) */}
      {editingMatch && (
        <EditOpenMatchModal
          isOpen={!!editingMatch}
          booking={editingMatch}
          onClose={() => setEditingMatch(null)}
          onUpdated={(updated) => {
            onRefresh();
          }}
        />
      )}

      {/* VERIFY / CLAIM ORGANIZER OWNERSHIP MODAL */}
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

      {/* JOIN MATCH MODAL */}
      {joiningMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                  Completar Cuarteto
                </span>
                <h3 className="text-xl font-black text-slate-900">Sumarme al Partido</h3>
                <p className="text-xs text-slate-500">
                  {joiningMatch.courtName} — {joiningMatch.date} a las {joiningMatch.timeSlot.startTime} hs
                </p>
              </div>
              <button
                onClick={() => setJoiningMatch(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-black text-emerald-900">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Rodrigo Tapia"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp de Contacto (Opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+54 9 11 5566-7788"
                    value={playerPhone}
                    onChange={(e) => setPlayerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={playerCategory}
                      onChange={(e) => setPlayerCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="4ta Categoría">4ta Categoría</option>
                      <option value="5ta Categoría">5ta Categoría</option>
                      <option value="6ta Categoría">6ta Categoría</option>
                      <option value="7ma Categoría">7ma Categoría</option>
                      <option value="Principiante">Principiante</option>
                      <option value="Mixto / Libre">Mixto / Libre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lado de Juego
                    </label>
                    <select
                      value={preferredSide}
                      onChange={(e) => setPreferredSide(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Ambos">Ambos / Indistinto</option>
                      <option value="Drive">Drive (Derecha)</option>
                      <option value="Revés">Revés (Izquierda)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                  <p className="font-bold">Pago en el Club:</p>
                  <p className="text-[11px] text-amber-800">
                    Abonás tu parte (${(joiningMatch.totalPrice / 4).toLocaleString('es-AR')}) directamente en el mostrador antes de entrar a la cancha.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setJoiningMatch(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Anotando...' : 'Confirmar y Sumarme'}</span>
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
