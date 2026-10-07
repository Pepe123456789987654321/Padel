import React from 'react';
import { X, Bell, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-white">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Notificaciones & Recordatorios</h3>
              <p className="text-xs text-slate-400">Alertas automáticas de partidos y señas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Notifications */}
        <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-semibold">No tienes notificaciones pendientes.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border text-xs space-y-1 transition-all ${
                  notif.read
                    ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                    : 'bg-slate-950 border-lime-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {notif.type === 'reminder' && <Calendar className="w-3.5 h-3.5 text-lime-400" />}
                    {notif.type === 'confirmation' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    {notif.type === 'cancellation' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-slate-500">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{notif.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <button
            onClick={onMarkAllAsRead}
            className="text-slate-400 hover:text-lime-400 font-semibold transition-colors"
          >
            Marcar todas como leídas
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
