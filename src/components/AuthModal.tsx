import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean; // if false, it's a mandatory barrier
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false
}) => {
  const {
    currentUser,
    isEmailVerified,
    loginWithGoogle,
    registerWithEmailPassword,
    loginWithEmailPassword,
    resendVerification,
    refreshAuthStatus,
    sendPasswordReset,
    logout
  } = useAuth();

  // Mode: 'login' | 'register' | 'verify' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot'>(
    currentUser && !isEmailVerified ? 'verify' : 'login'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);

  if (!isOpen) return null;

  // If user is logged in but hasn't verified email, force 'verify' screen
  const isUnverifiedState = currentUser && !isEmailVerified;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      if (onClose && canDismiss) {
        onClose();
      }
    } catch (err: any) {
      console.error('Google login error', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('El inicio de sesión con Google fue cancelado.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Dominio no autorizado en Firebase. Contacte al soporte.');
      } else {
        setErrorMsg(err.message || 'Error al iniciar sesión con Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await loginWithEmailPassword(email.trim(), password);
      // Wait for auth to settle
      const verified = await refreshAuthStatus();
      if (!verified) {
        setMode('verify');
      } else if (onClose && canDismiss) {
        onClose();
      }
    } catch (err: any) {
      console.error('Login error', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Correo o contraseña incorrectos. Por favor, verificá tus datos.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('El formato del correo electrónico no es válido.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.');
      } else {
        setErrorMsg(err.message || 'Ocurrió un error al ingresar.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithEmailPassword(email.trim(), password, fullName.trim(), phone.trim());
      setMode('verify');
      setSuccessMsg('¡Cuenta creada con éxito! Enviamos un email de confirmación.');
    } catch (err: any) {
      console.error('Register error', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Por favor, iniciá sesión.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('El correo ingresado no es válido.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('La contraseña es demasiado débil.');
      } else {
        setErrorMsg(err.message || 'Error al crear la cuenta.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await resendVerification();
      setSuccessMsg('¡Correo de confirmación reenviado! Revisá tu casilla o carpeta de spam.');
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 30000); // 30 sec cooldown
    } catch (err: any) {
      console.error('Resend error', err);
      if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Por favor esperá unos instantes antes de volver a solicitar el correo.');
      } else {
        setErrorMsg('No se pudo reenviar el correo. Intentá nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const verified = await refreshAuthStatus();
      if (verified) {
        setSuccessMsg('¡Felicitaciones! Tu correo ha sido verificado con éxito.');
        setTimeout(() => {
          if (onClose && canDismiss) onClose();
        }, 1200);
      } else {
        setErrorMsg('Aún no hemos detectado la confirmación. Hacé clic en el link recibido en tu email y luego volvé a presionar este botón.');
      }
    } catch (err) {
      setErrorMsg('No se pudo verificar el estado en este momento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Ingresá tu correo electrónico.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await sendPasswordReset(email.trim());
      setSuccessMsg('Enviamos las instrucciones para restablecer tu contraseña a tu correo.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setErrorMsg('No existe ninguna cuenta registrada con este correo.');
      } else {
        setErrorMsg('Error al enviar el correo de recuperación.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 text-slate-900 shadow-2xl relative my-auto animate-fadeIn">
        
        {/* Optional Close Button (only if canDismiss) */}
        {canDismiss && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-600/30 mb-1">
            <svg
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
            >
              <path
                d="M18 6C13.5817 6 10 9.58172 10 14C10 17.5 12.2 20.5 15.3 21.5L14 29C14 29.5523 14.4477 30 15 30H21C21.5523 30 22 29.5523 22 29L20.7 21.5C23.8 20.5 26 17.5 26 14C26 9.58172 22.4183 6 18 6Z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="15" cy="12" r="1" fill="currentColor" />
              <circle cx="18" cy="12" r="1" fill="currentColor" />
              <circle cx="21" cy="12" r="1" fill="currentColor" />
              <circle cx="25" cy="8" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            PUNTO <span className="text-sky-500">PADEL</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isUnverifiedState
              ? 'Verificación de Correo Electrónico'
              : mode === 'register'
              ? 'Creá tu cuenta con confirmación por mail'
              : mode === 'forgot'
              ? 'Recuperación de contraseña'
              : 'Iniciá sesión para reservar tu cancha'}
          </p>
        </div>

        {/* Global Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE: EMAIL VERIFICATION REQUIRED (EMAIL CONFIRMATION)                     */}
        {/* ========================================================================= */}
        {isUnverifiedState || mode === 'verify' ? (
          <div className="space-y-4">
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                  Confirmación de Correo Pendiente
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Te enviamos un email de confirmación a{' '}
                  <strong className="text-slate-900 font-bold break-all">
                    {currentUser?.email || email}
                  </strong>
                  . Hacé clic en el enlace del mensaje para activar tu cuenta y comenzar a reservar.
                </p>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-100/60 p-2.5 rounded-xl text-left flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Si no lo ves en tu bandeja de entrada en 1 minuto, revisá tu carpeta de <em>Spam</em> o <em>Correo no deseado</em>.
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={isSubmitting}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>Ya hice clic en el enlace (Verificar ahora)</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSubmitting || resendCooldown}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {resendCooldown
                    ? 'Aguardá unos segundos para reenviar...'
                    : 'Reenviar correo de confirmación'}
                </span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setMode('login');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
                >
                  Cerrar sesión o ingresar con otra cuenta
                </button>
              </div>
            </div>
          </div>
        ) : mode === 'forgot' ? (
          /* ========================================================================= */
          /* MODE: FORGOT PASSWORD                                                     */
          /* ========================================================================= */
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="text-xs text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* MODE: LOGIN OR REGISTER                                                   */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* GOOGLE SIGN IN BUTTON (Prominent top option) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 active:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group hover:border-slate-400"
            >
              {/* Google G Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                O con correo electrónico
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Tabs Switcher between Iniciar Sesión and Registrarse */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('register');
                }}
                className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Form for Login or Register */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setSuccessMsg('');
                        setMode('forgot');
                      }}
                      className="text-[10px] text-sky-600 hover:underline font-bold cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Marcos Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="marcos@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Contraseña * (min 6)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="11 5510 4499"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    Al registrarte, <strong>recibirás un email de confirmación</strong> para verificar tu identidad y habilitar la reserva de canchas.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <span>{isSubmitting ? 'Registrando...' : 'Registrarme y Enviar Confirmación'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
