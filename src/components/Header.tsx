import React from 'react';
import { Shield, User, LogOut, LogIn, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface HeaderProps {
  currentView: 'user' | 'admin';
  onSelectView: (view: 'user' | 'admin') => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onSelectView, onOpenAuthModal }) => {
  const { currentUser, userData, isEmailVerified, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        
        {/* Logo & Brand Name */}
        <button
          onClick={() => onSelectView('user')}
          className="flex items-center gap-3 text-left cursor-pointer group shrink-0"
        >
          {/* Custom Punto Padel Vector Logo */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-950/50 border border-sky-300/30 group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-white"
            >
              {/* Padel Racket Shape */}
              <path
                d="M18 6C13.5817 6 10 9.58172 10 14C10 17.5 12.2 20.5 15.3 21.5L14 29C14 29.5523 14.4477 30 15 30H21C21.5523 30 22 29.5523 22 29L20.7 21.5C23.8 20.5 26 17.5 26 14C26 9.58172 22.4183 6 18 6Z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Racket Holes */}
              <circle cx="15" cy="12" r="1" fill="currentColor" />
              <circle cx="18" cy="12" r="1" fill="currentColor" />
              <circle cx="21" cy="12" r="1" fill="currentColor" />
              <circle cx="16.5" cy="15" r="1" fill="currentColor" />
              <circle cx="19.5" cy="15" r="1" fill="currentColor" />
              
              {/* Vibrant Sky Blue "Punto" Accent */}
              <circle cx="25" cy="8" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-white uppercase">
                PUNTO
              </span>
              <span className="font-black text-xl tracking-tight text-sky-400 uppercase">
                PADEL
              </span>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse ml-0.5" title="Sistema Activo"></span>
            </div>
            <span className="text-[11px] text-slate-400 block -mt-1 font-semibold tracking-wide">
              {currentView === 'admin' ? 'Panel de Administración' : 'Reserva de Canchas'}
            </span>
          </div>
        </button>

        {/* Right Section: User Status + View Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Authenticated User pill or Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl px-2 sm:px-3 py-1.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Usuario'}
                  className="w-7 h-7 rounded-full object-cover border border-sky-400/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden md:block text-left min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </p>
                  {isEmailVerified ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Cuenta Verificada" />
                  ) : (
                    <button
                      onClick={onOpenAuthModal}
                      className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold hover:bg-amber-400/20 cursor-pointer"
                      title="Email pendiente de confirmación"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Verificar</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {currentUser.email}
                </p>
              </div>

              {!isEmailVerified && (
                <button
                  onClick={onOpenAuthModal}
                  className="md:hidden text-[10px] text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg flex items-center gap-1 font-bold cursor-pointer"
                  title="Confirmar email"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Confirmar</span>
                </button>
              )}

              <button
                onClick={() => logout()}
                title="Cerrar sesión"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer ml-0.5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Iniciar Sesión</span>
              <span className="sm:hidden">Ingresar</span>
            </button>
          )}

          {/* Access Separation: User vs Admin Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => onSelectView('user')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'user'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Jugador</span>
            </button>

            <button
              onClick={() => onSelectView('admin')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
