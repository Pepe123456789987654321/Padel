import React, { useState } from 'react';
import { X, Send, Calendar, Clock, Sparkles, CheckCircle2, ShieldCheck, Building2, HelpCircle } from 'lucide-react';
import { Court } from '../types';
import { TIME_SLOTS } from '../data/initialData';

interface FixedSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
}

const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

export const FixedSlotModal: React.FC<FixedSlotModalProps> = ({
  isOpen,
  onClose,
  courts
}) => {
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Martes');
  const [startTime, setStartTime] = useState('20:30');
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || 'c1');
  const [frequency, setFrequency] = useState<'Semanal (Todos los meses)' | 'Quincenal'>('Semanal (Todos los meses)');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMessage('Por favor ingresá tu nombre completo.');
      return;
    }
    if (!userPhone.trim()) {
      setErrorMessage('Por favor ingresá tu número de WhatsApp para contactarte.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const chosenCourt = courts.find((c) => c.id === selectedCourtId);
    const courtName = chosenCourt ? chosenCourt.name : 'Cualquier cancha disponible';

    try {
      const res = await fetch('/api/fixed-slot-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim(),
          userPhone: userPhone.trim(),
          dayOfWeek,
          startTime,
          courtId: selectedCourtId,
          courtName,
          frequency,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setWhatsappLink(data.whatsappUrl);
        // Automatically open WhatsApp in a new tab
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        setErrorMessage(data.error || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de conexión. Intentalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setUserName('');
    setUserPhone('');
    setNotes('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                Abono Mensual / Cancha Fija
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Solicitar Turno Fijo por WhatsApp
              </h3>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">¡Solicitud Generada con Éxito!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Tu pedido para los días <strong>{dayOfWeek} a las {startTime} hs</strong> quedó registrado en la administración.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-left space-y-2">
              <p className="font-bold text-slate-800">Resumen de tu Turno Fijo:</p>
              <ul className="space-y-1 text-slate-600">
                <li>• <strong>Jugador:</strong> {userName}</li>
                <li>• <strong>Día y Horario:</strong> Todos los {dayOfWeek} — {startTime} hs</li>
                <li>• <strong>Frecuencia:</strong> {frequency}</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Abrir Chat de WhatsApp con el Club</span>
              </a>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar y volver
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Asegurá tu cancha fija todas las semanas para tu grupo de amigos o clases. Completá los datos y te contactaremos por WhatsApp para coordinar el abono mensual.
            </p>

            {/* Day and Time Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Día de la Semana *</span>
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Horario Deseado *</span>
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.startTime}>
                      {slot.startTime} hs ({slot.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Court Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cancha de Preferencia</span>
              </label>
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} (${c.price.toLocaleString('es-AR')})</option>
                ))}
              </select>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo / Titular *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Martín Zeballos"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp de Contacto *
                </label>
                <input
                  type="tel"
                  placeholder="+54 9 11 4455-6677"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Frequency and details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Frecuencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Semanal (Todos los meses)">Semanal (Todos los meses)</option>
                  <option value="Quincenal">Quincenal (Cada 15 días)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas / Comentarios
                </label>
                <input
                  type="text"
                  placeholder="Ej: Somos 4 fijos / o para clases"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isLoading ? 'Enviando...' : 'Pedir por WhatsApp'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
