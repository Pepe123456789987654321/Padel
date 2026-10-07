import React from 'react';
import { CheckCircle2, Calendar, Download, Share2, ArrowRight, MapPin, Clock, Building2, Check, ShieldCheck } from 'lucide-react';
import { Booking } from '../types';

interface BookingConfirmationProps {
  booking: Booking;
  onGoToProfile: () => void;
  onNewBooking: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onGoToProfile,
  onNewBooking
}) => {
  const [copiedWs, setCopiedWs] = React.useState(false);

  const isDirect = Boolean(booking.isDirectBooking || booking.paymentMethod === 'Mercado Pago Directo' || booking.remainingBalance === 0);
  const directMpUrl = booking.directPaymentUrl || 'https://mpago.la/1tUpkqU';
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directMpUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    const startIso = booking.date.replace(/-/g, '') + 'T' + booking.timeSlot.startTime.replace(':', '') + '00';
    const endIso = booking.date.replace(/-/g, '') + 'T' + booking.timeSlot.endTime.replace(':', '') + '00';
    
    const title = encodeURIComponent(`Partido de Pádel - ${booking.courtName}`);
    const details = encodeURIComponent(
      `Reserva Padel Point #${booking.bookingId || booking.id}\nJugador: ${booking.userName}\n${
        isDirect
          ? `Reserva Directa Abonada al 100% por Mercado Pago: $${booking.totalPrice} ARS (Link: ${directMpUrl})`
          : `Seña abonada con Mercado Pago: $${booking.depositPaid} ARS\nSaldo a abonar en el club: $${booking.remainingBalance} ARS`
      }`
    );
    const location = encodeURIComponent('Padel Point Club - Av. del Deporte 1450');

    return `https://calendar.google.com/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&ctz=America/Argentina/Buenos_Aires`;
  };

  // WhatsApp formatted share text
  const getWhatsAppShareText = () => {
    return encodeURIComponent(
      `🎾 ¡Hay partido de Pádel en Padel Point!\n` +
      `📍 *${booking.courtName}*\n` +
      `📅 *Fecha:* ${booking.date}\n` +
      `⏰ *Horario:* ${booking.timeSlot.label}\n` +
      (isDirect
        ? `⚡ *Reserva Directa 100% abonada con Mercado Pago:* $${booking.totalPrice.toLocaleString('es-AR')} ARS\n💳 *Link de pago oficial:* ${directMpUrl}\n💵 *Saldo restante en club:* $0 (¡Totalmente pagado!)\n`
        : `💳 *Seña pagada:* $${booking.depositPaid.toLocaleString('es-AR')} ARS con Mercado Pago\n💵 *Saldo restante en el club:* $${booking.remainingBalance.toLocaleString('es-AR')} ARS ($${Math.round(booking.remainingBalance / 4).toLocaleString('es-AR')} c/u para los 4)\n`) +
      `¡Nos vemos en la cancha!`
    );
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${getWhatsAppShareText()}`, '_blank');
    setCopiedWs(true);
    setTimeout(() => setCopiedWs(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fadeIn">
      
      {/* Top Banner Ticket */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative text-white">
        
        {/* Header Celebration */}
        <div className={`p-8 text-center relative ${
          isDirect
            ? 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700'
            : 'bg-gradient-to-r from-sky-600 via-sky-500 to-slate-800'
        }`}>
          <div className="w-16 h-16 bg-slate-950 rounded-2xl mx-auto flex items-center justify-center border-2 border-sky-400 shadow-xl mb-4">
            <CheckCircle2 className="w-10 h-10 text-sky-400" />
          </div>
          <span className="bg-slate-950/60 text-sky-300 border border-sky-400/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {isDirect ? '⚡ ¡Reserva Directa Confirmada!' : '¡Reserva Confirmada!'}
          </span>
          <h2 className="text-3xl font-black text-white mt-2">Cancha Reservada con Éxito</h2>
          <p className="text-sky-100 text-sm mt-1">
            {isDirect
              ? 'Abonado 100% con link de Mercado Pago. Tu turno está totalmente asegurado.'
              : 'Seña de Mercado Pago abonada. Tu turno está 100% asegurado en el sistema.'}
          </p>
        </div>

        {/* Ticket Content */}
        <div className="p-8 space-y-6">
          
          {/* Reservation Reference Badge */}
          <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Código de Reserva</p>
              <p className="text-xl font-mono font-bold text-sky-400">{booking.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">Método</p>
              <p className="text-xs font-mono text-cyan-300 font-bold">{booking.paymentMethod || 'Mercado Pago'}</p>
            </div>
          </div>

          {/* Direct Mercado Pago Link Card */}
          {isDirect && (
            <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Link de Pago Oficial Mercado Pago:
                </span>
                <span className="text-[10px] bg-cyan-900 text-cyan-200 px-2 py-0.5 rounded-full font-mono">
                  Directo
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-cyan-900">
                <a
                  href={directMpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-300 hover:text-cyan-200 font-mono underline truncate flex-1"
                >
                  {directMpUrl}
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {copiedLink ? '¡Copiado!' : 'Copiar'}
                </button>
                <a
                  href={directMpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Abrir
                </a>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-1">
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold">
                <MapPin className="w-4 h-4 text-sky-400" /> Cancha & Complejo
              </p>
              <p className="font-bold text-slate-100">{booking.courtName}</p>
              <p className="text-xs text-slate-400">Punto Padel Club</p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-1">
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold">
                <Clock className="w-4 h-4 text-sky-400" /> Fecha & Horario
              </p>
              <p className="font-bold text-slate-100">{booking.date}</p>
              <p className="text-xs text-sky-400 font-semibold">{booking.timeSlot.label} (90 min)</p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desglose de Pago</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Precio Total del Turno (90 min):</span>
                <span className="font-bold">${booking.totalPrice.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className="flex justify-between text-cyan-400 font-bold border-t border-slate-800 pt-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> {isDirect ? 'Abonado 100% con Mercado Pago:' : 'Seña Mercado Pago Pagada:'}
                </span>
                <span>-${booking.depositPaid.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className={`flex justify-between font-extrabold text-base border-t border-slate-800 pt-2 ${
                isDirect ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Saldo a pagar en el club:
                </span>
                <span>{isDirect ? '$0 ARS (¡Totalmente pagado!)' : `$${booking.remainingBalance.toLocaleString('es-AR')} ARS`}</span>
              </div>
            </div>
            {!isDirect && (
              <p className="text-[11px] text-slate-400 pt-1">
                * Podés pagar el saldo restante en efectivo, débito o Mercado Pago directamente en el mostrador del club antes de ingresar a la cancha.
              </p>
            )}
          </div>

          {/* Google Calendar & iCal Integrations */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sincronizar Evento & Compartir
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Add to Google Calendar */}
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Agregar a Google Calendar</span>
              </a>

              {/* Download .ics iCal */}
              <a
                href={`/api/bookings/${booking.id}/ical`}
                download
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Descargar Archivo .ICS</span>
              </a>
            </div>

            {/* WhatsApp Invite Button */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-sky-600/20"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedWs ? '¡Mensaje de WhatsApp Generado!' : 'Compartir Partido en Grupo de WhatsApp'}</span>
              {copiedWs && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Navigation Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={onNewBooking}
              className="text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Hacer otra reserva
            </button>

            <button
              onClick={onGoToProfile}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/10 cursor-pointer"
            >
              <span>Volver a las Reservas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
