import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, CreditCard, Lock, CheckCircle2, ArrowRight, Loader2, Sparkles, Building2 } from 'lucide-react';
import { Court, TimeSlot } from '../types';
import { saveMatchOwnership } from '../lib/openMatchAuth';

interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court;
  date: string;
  timeSlot: TimeSlot;
  userName: string;
  userEmail: string;
  userPhone: string;
  notes?: string;
  isOpenMatch?: boolean;
  matchCategory?: string;
  playerPreferredSide?: 'Drive' | 'Revés' | 'Ambos';
  initialPlayerCount?: number;
  onPaymentSuccess: (bookingData: any) => void;
}

export const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  isOpen,
  onClose,
  court,
  date,
  timeSlot,
  userName,
  userEmail,
  userPhone,
  notes,
  isOpenMatch,
  matchCategory,
  playerPreferredSide,
  initialPlayerCount,
  onPaymentSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'mp_account' | 'qr' | 'card'>('mp_account');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('4509 •••• •••• 8821');
  const [cardHolder, setCardHolder] = useState(userName || 'JUAN PEREZ');
  const [cardExp, setCardExp] = useState('11/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // Create Mercado Pago Preference call to backend
      const prefResponse = await fetch('/api/payments/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: court.id,
          date,
          timeSlot,
          userName,
          userEmail,
          userPhone
        })
      });

      if (!prefResponse.ok) {
        const errorData = await prefResponse.json();
        throw new Error(errorData.error || 'No se pudo crear la preferencia de Mercado Pago');
      }

      const prefData = await prefResponse.json();

      // Simulate Mercado Pago checkout approval delay (1.2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Post final booking to server
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: court.id,
          date,
          timeSlot,
          userName,
          userEmail,
          userPhone,
          notes,
          paymentMethod: paymentMethod === 'card' ? 'Tarjeta de Crédito' : 'Mercado Pago',
          preferenceId: prefData.preferenceId,
          paymentId: `MP-PAY-${Math.floor(10000000 + Math.random() * 90000000)}`,
          isOpenMatch: !!isOpenMatch,
          matchCategory,
          playerPreferredSide,
          initialPlayerCount
        })
      });

      if (!bookingResponse.ok) {
        const err = await bookingResponse.json();
        throw new Error(err.error || 'Error al guardar la reserva');
      }

      const confirmedBooking = await bookingResponse.json();
      if (confirmedBooking.isOpenMatch) {
        saveMatchOwnership(confirmedBooking);
      }
      setIsProcessing(false);
      onPaymentSuccess(confirmedBooking);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Error en el procesamiento del pago');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-white">
        
        {/* Mercado Pago Branded Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cyan-100 hover:text-white bg-slate-900/30 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-cyan-950/60 border border-cyan-300/40 text-cyan-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              Mercado Pago Checkout
            </span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">Pago Seguro de Seña</h3>
          <p className="text-cyan-100 text-xs mt-1">
            Garantizá tu reserva abonando la seña requerida por el club.
          </p>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Order Summary Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cancha Reservada</p>
                <h4 className="font-bold text-slate-100">{court.name}</h4>
                <p className="text-xs text-lime-400 font-medium">
                  {date} • {timeSlot.label}
                </p>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono border border-slate-700">
                90 minutos
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Valor Total del Turno:</span>
                <span className="font-semibold text-slate-200">${court.price.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className="flex justify-between text-cyan-400 font-bold text-sm pt-1">
                <span className="flex items-center gap-1">
                  Seña a pagar con Mercado Pago:
                </span>
                <span>${court.depositPrice.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className="flex justify-between text-amber-400 font-medium">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Saldo a abonar en el club:
                </span>
                <span>${(court.price - court.depositPrice).toLocaleString('es-AR')} ARS</span>
              </div>
            </div>
          </div>

          {/* Direct MP Link option */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-2xl flex items-center justify-between text-xs text-cyan-200">
            <span className="flex items-center gap-1.5 font-medium">
              <span>¿Pago directo?</span>
              <a
                href="https://mpago.la/1tUpkqU"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-cyan-300 hover:text-white font-mono"
              >
                https://mpago.la/1tUpkqU
              </a>
            </span>
            <a
              href="https://mpago.la/1tUpkqU"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] rounded-lg transition-colors"
            >
              Abrir
            </a>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Seleccionar Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('mp_account')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                  paymentMethod === 'mp_account'
                    ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-[11px] font-bold text-center leading-tight">Dinero en MP</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qr')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                  paymentMethod === 'qr'
                    ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-5 h-5 text-cyan-400" />
                <span className="text-[11px] font-bold text-center leading-tight">Escanear QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                  paymentMethod === 'card'
                    ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <span className="text-[11px] font-bold text-center leading-tight">Tarjeta Crédito</span>
              </button>
            </div>
          </div>

          {/* Contextual Payment Details */}
          {paymentMethod === 'mp_account' && (
            <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-2xl p-4 text-xs text-cyan-200 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Pago Instantáneo con tu cuenta de Mercado Pago</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Te debitaremos <strong>${court.depositPrice.toLocaleString('es-AR')} ARS</strong> de tu saldo de Mercado Pago o tarjetas guardadas en la app. La confirmación es inmediata en tiempo real.
              </p>
            </div>
          )}

          {paymentMethod === 'qr' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center border-4 border-cyan-500/40 shadow-inner">
                {/* SVG QR Code Simulation */}
                <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm11-2h7v7h-7V2zm2 2v3h3V4h-3zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm3 3h2v2h-2v-2zm-3 2h3v3h-3v-3zm-2-2h2v2h-2v-2zm-1-3h3v2h-3v-2zm-3 5h2v3h-2v-3zm2-3h2v2h-2v-2z" />
                </svg>
              </div>
              <p className="text-xs text-cyan-300 font-bold">Escaneá con la app de Mercado Pago</p>
              <p className="text-[10px] text-slate-400">
                Abrí la app de Mercado Pago en tu celular y escaneá este código QR para abonar los ${court.depositPrice.toLocaleString('es-AR')} ARS.
              </p>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Número de Tarjeta</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Titular</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Venc. / CVC</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono text-center focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono text-center focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Action Pay Button */}
          <button
            id="btn-confirm-mp-pay"
            disabled={isProcessing}
            onClick={handleProcessPayment}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Procesando pago en Mercado Pago...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-slate-950" />
                <span>Pagar Seña de ${court.depositPrice.toLocaleString('es-AR')} ARS</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transacción encriptada de 256 bits procesada por Mercado Pago Argentina.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
