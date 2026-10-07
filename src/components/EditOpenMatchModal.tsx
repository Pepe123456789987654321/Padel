import React, { useState } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  UserCheck,
  UserMinus,
  Save,
  Loader2
} from 'lucide-react';
import { Booking, MatchPlayer } from '../types';
import { getOrganizerToken } from '../lib/openMatchAuth';

interface EditOpenMatchModalProps {
  isOpen: boolean;
  booking: Booking;
  onClose: () => void;
  onUpdated: (updated: Booking) => void;
}

export const EditOpenMatchModal: React.FC<EditOpenMatchModalProps> = ({
  isOpen,
  booking,
  onClose,
  onUpdated
}) => {
  // State for players list
  const [players, setPlayers] = useState<MatchPlayer[]>(() => {
    if (booking.players && booking.players.length > 0) {
      return [...booking.players];
    }
    // Default host player
    return [
      {
        id: `pl-${Date.now()}-host`,
        name: booking.userName,
        phone: booking.userPhone,
        category: booking.matchCategory || '5ta Categoría',
        preferredSide: 'Ambos',
        joinedAt: booking.createdAt,
        isHost: true
      }
    ];
  });

  // Open match status
  const [matchStatus, setMatchStatus] = useState<'buscando_jugadores' | 'partido_completo'>(
    booking.openMatchStatus || 'buscando_jugadores'
  );

  // Match category
  const [matchCategory, setMatchCategory] = useState(booking.matchCategory || '5ta Categoría');

  // Notes
  const [notes, setNotes] = useState(booking.notes || '');

  // Add friend inline form
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendCategory, setFriendCategory] = useState(booking.matchCategory || '5ta Categoría');
  const [friendSide, setFriendSide] = useState<'Drive' | 'Revés' | 'Ambos'>('Ambos');

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Add friend to players
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    if (players.length >= 4) {
      alert('Ya están los 4 cupos cubiertos.');
      return;
    }

    const newPlayer: MatchPlayer = {
      id: `pl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: friendName.trim(),
      category: friendCategory,
      preferredSide: friendSide,
      joinedAt: new Date().toISOString(),
      isHost: false
    };

    const nextList = [...players, newPlayer];
    setPlayers(nextList);
    setFriendName('');
    setIsAddingFriend(false);

    // If reached 4 players, auto set to complete
    if (nextList.length >= 4) {
      setMatchStatus('partido_completo');
    }
  };

  // Remove player from slot
  const handleRemovePlayer = (playerId: string) => {
    const target = players.find((p) => p.id === playerId);
    if (target?.isHost) {
      alert('No podés remover al organizador del partido.');
      return;
    }

    const nextList = players.filter((p) => p.id !== playerId);
    setPlayers(nextList);
    // If dropped below 4, offer or set seeking players
    if (nextList.length < 4 && matchStatus === 'partido_completo') {
      // Keep or prompt
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

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
          openMatchStatus: matchStatus,
          matchCategory,
          notes,
          players
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('¡Cambios guardados con éxito!');
        onUpdated(data.booking || data);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage(data.error || 'Error al guardar los cambios.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de comunicación con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const missingCount = Math.max(0, 4 - players.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Gestión de Partido Falta Uno</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">Editar Estado y Jugadores</h3>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-semibold text-slate-800">{booking.courtName}</span>
              <span>•</span>
              <span>{booking.date} a las {booking.timeSlot.startTime} hs</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Badge: Solo el organizador puede editar */}
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-2.5 text-xs text-sky-900">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
          <div>
            <span className="font-bold">Sos el Organizador:</span>{' '}
            <span className="text-sky-800">
              Solo vos ({booking.userName}) podés actualizar cuándo falta gente y cuándo ya se consiguieron los jugadores.
            </span>
          </div>
        </div>

        {/* SECTION 1: ESTADO DEL PARTIDO (FALTA UNO vs CONSEGUIDOS) */}
        <div className="space-y-2.5">
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            ¿En qué estado está el partido ahora?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 1: Buscando Jugadores */}
            <button
              type="button"
              onClick={() => setMatchStatus('buscando_jugadores')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                matchStatus === 'buscando_jugadores'
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <span className="text-base">🔥</span>
                  <span>FALTA GENTE / BUSCANDO</span>
                </span>
                {matchStatus === 'buscando_jugadores' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Se publica en la app que <strong>{missingCount === 1 ? '¡FALTA 1!' : `Faltan ${missingCount}`}</strong> para que otros jugadores se sumen.
              </p>
            </button>

            {/* Opción 2: Ya se consiguieron los jugadores */}
            <button
              type="button"
              onClick={() => setMatchStatus('partido_completo')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                matchStatus === 'partido_completo'
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span className="text-base">✅</span>
                  <span>YA SE CONSIGUIERON</span>
                </span>
                {matchStatus === 'partido_completo' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">
                Marca el partido como <strong>PARTIDO COMPLETO</strong>. Nadie más podrá anotarse y todos sabrán que el cuarteto está listo.
              </p>
            </button>
          </div>
        </div>

        {/* SECTION 2: GESTIÓN DE JUGADORES (4 CUPOS) */}
        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Cuarteto de Jugadores ({players.length}/4)
              </h4>
              <p className="text-[11px] text-slate-500">
                Podés agregar amigos que conseguiste por WhatsApp o remover a quienes se hayan bajado.
              </p>
            </div>

            {players.length < 4 && !isAddingFriend && (
              <button
                type="button"
                onClick={() => setIsAddingFriend(true)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Agregar Amigo</span>
              </button>
            )}
          </div>

          {/* Inline Form to Add a Friend */}
          {isAddingFriend && (
            <form
              onSubmit={handleAddFriend}
              className="p-3 bg-white border border-amber-300 rounded-xl space-y-2.5 animate-fadeIn shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900">Agregar Jugador que conseguí:</span>
                <button
                  type="button"
                  onClick={() => setIsAddingFriend(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nombre de tu amigo *"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="sm:col-span-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  required
                  autoFocus
                />

                <select
                  value={friendCategory}
                  onChange={(e) => setFriendCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800"
                >
                  <option value="4ta Categoría">4ta Categoría</option>
                  <option value="5ta Categoría">5ta Categoría</option>
                  <option value="6ta Categoría">6ta Categoría</option>
                  <option value="7ma Categoría">7ma Categoría</option>
                  <option value="Principiantes">Principiantes</option>
                  <option value="Mixto / Libre">Mixto / Libre</option>
                </select>

                <select
                  value={friendSide}
                  onChange={(e) => setFriendSide(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800"
                >
                  <option value="Ambos">Lado: Ambos</option>
                  <option value="Drive">Lado: Drive</option>
                  <option value="Revés">Lado: Revés</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingFriend(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs"
                >
                  Confirmar Lugar
                </button>
              </div>
            </form>
          )}

          {/* 4 Player Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((slotIdx) => {
              const player = players[slotIdx];

              if (player) {
                return (
                  <div
                    key={player.id || slotIdx}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          player.isHost
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-emerald-400'
                        }`}
                      >
                        {player.isHost ? '👑' : player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {player.name} {player.isHost ? '(Organizador)' : ''}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {player.category || matchCategory} • {player.preferredSide || 'Ambos'}
                        </p>
                      </div>
                    </div>

                    {!player.isHost && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Remover jugador del partido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={slotIdx}
                  className="p-2.5 border border-dashed border-slate-300 rounded-xl flex items-center justify-between gap-2 bg-white/60 text-slate-400"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                      ?
                    </div>
                    <div>
                      <p className="text-xs font-medium italic text-slate-500">Cupo #{slotIdx + 1} Disponible</p>
                      <p className="text-[10px] text-amber-600 font-semibold">Falta 1 jugador</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingFriend(true)}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200 cursor-pointer"
                  >
                    + Sumar
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: CATEGORÍA Y NOTAS ADICIONALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Categoría / Nivel Buscado
            </label>
            <select
              value={matchCategory}
              onChange={(e) => setMatchCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas o requisitos para jugadores
            </label>
            <input
              type="text"
              placeholder="Ej: Llevo tubos de bolas nuevas / Buscamos revés"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Estado y Cupos</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
