import React, { useState } from 'react';
import { Header } from './components/Header';
import { BookingView } from './components/BookingView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './lib/AuthContext';
import { LogIn, AlertTriangle, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'user' | 'admin'>('user');
  const { currentUser, isEmailVerified, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If loading Firebase auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-xl shadow-sky-950/80 mb-4 animate-pulse">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white">
            <path
              d="M18 6C13.5817 6 10 9.58172 10 14C10 17.5 12.2 20.5 15.3 21.5L14 29C14 29.5523 14.4477 30 15 30H21C21.5523 30 22 29.5523 22 29L20.7 21.5C23.8 20.5 26 17.5 26 14C26 9.58172 22.4183 6 18 6Z"
              fill="currentColor"
              fillOpacity="0.25"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="25" cy="8" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
          </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-sky-400">Punto Padel</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">Cargando sistema de reservas...</p>
      </div>
    );
  }

  // If user is not logged in or email is pending verification, auth modal should be open
  const shouldPromptAuth = !currentUser || !isEmailVerified;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Header with User vs Admin Access Switcher and Auth Status */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Global Notice Banner when not logged in or unverified */}
      {currentView === 'user' && (
        <>
          {!currentUser ? (
            <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white py-2 px-4 border-b border-sky-800/40 text-xs shadow-inner">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium text-slate-200">
                    <strong>Inicio de sesión obligatorio:</strong> Para reservar canchas o sumarte a partidos abiertos, debés ingresar con <strong>Google</strong> o crear tu cuenta con <strong>confirmación por mail</strong>.
                  </span>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Ingresar / Registrarme</span>
                </button>
              </div>
            </div>
          ) : !isEmailVerified ? (
            <div className="bg-amber-500 text-amber-950 py-2.5 px-4 border-b border-amber-600 text-xs font-bold shadow-xs">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-950 shrink-0 animate-bounce" />
                  <span>
                    ¡Confirmá tu correo para poder reservar! Enviamos un enlace de activación a <strong>{currentUser.email}</strong>.
                  </span>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1 bg-amber-950 hover:bg-black text-amber-200 text-xs font-black rounded-xl cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
                >
                  <span>Revisar / Reenviar Correo</span>
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 py-4">
        {currentView === 'user' ? (
          <BookingView
            onGoToProfile={() => setCurrentView('admin')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : (
          <AdminDashboard onExitAdmin={() => setCurrentView('user')} />
        )}
      </main>

      {/* Auth Modal (Google & Email Confirmation) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        canDismiss={true}
      />

      {/* Minimal Clean Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Punto Padel — Sistema de Reserva de Canchas</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <button
              onClick={() => setCurrentView('user')}
              className={`hover:text-slate-300 transition-colors ${currentView === 'user' ? 'text-sky-400 font-bold' : ''}`}
            >
              Vista Jugador
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('admin')}
              className={`hover:text-slate-300 transition-colors ${currentView === 'admin' ? 'text-sky-400 font-bold' : ''}`}
            >
              Acceso Administración
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

