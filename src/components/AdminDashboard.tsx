import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  DollarSign,
  Users,
  Activity,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart2,
  Building2,
  RefreshCw,
  AlertCircle,
  UserCheck,
  UserPlus,
  Trash2,
  KeyRound,
  ArrowLeft,
  Phone,
  CreditCard,
  Ban,
  AlertTriangle,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Printer,
  PieChart as PieChartIcon,
  Receipt,
  CalendarDays,
  ArrowUpRight,
  Sparkles,
  Download,
  FileSpreadsheet,
  Send
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { Court, TimeSlot, Booking, CourtBlock, StatsSummary, AdminUser, FixedSlotRequest } from '../types';
import { TIME_SLOTS } from '../data/initialData';
import { exportBookingsToExcel } from '../lib/exportExcel';

interface AdminDashboardProps {
  onExitAdmin?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Admin Data State
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookingsList, setAllBookingsList] = useState<Booking[]>([]);
  const [fixedSlots, setFixedSlots] = useState<FixedSlotRequest[]>([]);
  const [fixedSlotFilter, setFixedSlotFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [blocks, setBlocks] = useState<CourtBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab state inside admin
  const [adminTab, setAdminTab] = useState<'grid' | 'table' | 'analytics' | 'courts' | 'admins' | 'fixed_slots'>('grid');

  // Filter Date for Grid
  const todayStr = new Date().toISOString().split('T')[0];
  const [gridDate, setGridDate] = useState<string>(todayStr);

  // Revenue & Income in Pesos Filter State ("Ingresos en pesos como yo quiera verlos")
  const [revenueFilterMode, setRevenueFilterMode] = useState<'single' | 'range' | 'preset'>('single');
  const [revenueSingleDate, setRevenueSingleDate] = useState<string>(todayStr);
  const [revenueStartDate, setRevenueStartDate] = useState<string>(todayStr);
  const [revenueEndDate, setRevenueEndDate] = useState<string>(todayStr);
  const [revenuePreset, setRevenuePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [revenueStats, setRevenueStats] = useState<StatsSummary | null>(null);
  const [revenueCourtFilter, setRevenueCourtFilter] = useState<string>('all');
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);

  // Search & Filter in Table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'cancelled'>('all');

  // Manual Reservation Modal State
  const [manualSlotModal, setManualSlotModal] = useState<{ court: Court; slot: TimeSlot } | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMethod, setManualMethod] = useState<'Efectivo en Club' | 'Mercado Pago'>('Efectivo en Club');

  // Admin Block Slot Modal State
  const [blockModal, setBlockModal] = useState<{ court: Court; slot: TimeSlot } | null>(null);
  const [blockReason, setBlockReason] = useState('Mantenimiento de iluminación');

  // Cancel / Delete Booking Modal State
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);
  const [cancelActionType, setCancelActionType] = useState<'cancel' | 'delete'>('cancel');
  const [cancelQuickReason, setCancelQuickReason] = useState('Canceló el cliente por teléfono / WhatsApp');
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  // Add Admin Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Administrador Principal' | 'Administrador' | 'Recepción / Canchero'>('Administrador');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');

  // Fetch admin users for login selector
  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const users: AdminUser[] = await res.json();
        setAdminUsers(users);
        if (users.length > 0 && !selectedAdminId) {
          setSelectedAdminId(users[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching admin users', e);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, courtsRes, bookingsRes, allBookingsRes, blocksRes, usersRes, fixedSlotsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/courts'),
        fetch(`/api/bookings?date=${gridDate}`),
        fetch('/api/bookings'),
        fetch('/api/admin/blocks'),
        fetch('/api/admin/users'),
        fetch('/api/fixed-slot-requests')
      ]);

      const statsData = await statsRes.json();
      const courtsData = await courtsRes.json();
      const bookingsData = await bookingsRes.json();
      const allBookingsData = await allBookingsRes.json();
      const blocksData = await blocksRes.json();
      const usersData = await usersRes.json();
      const fixedSlotsData = await fixedSlotsRes.json();

      setStats(statsData);
      setCourts(courtsData);
      setBookings(bookingsData);
      setAllBookingsList(allBookingsData);
      setBlocks(blocksData);
      setAdminUsers(usersData);
      setFixedSlots(fixedSlotsData);
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFixedSlotStatus = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/fixed-slot-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setFixedSlots((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      } else {
        alert('No se pudo actualizar el estado del turno fijo.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const fetchFilteredRevenue = async () => {
    setIsLoadingRevenue(true);
    try {
      let query = '';
      if (revenueFilterMode === 'single') {
        query = `?date=${revenueSingleDate}`;
      } else if (revenueFilterMode === 'range') {
        query = `?startDate=${revenueStartDate}&endDate=${revenueEndDate}`;
      } else if (revenueFilterMode === 'preset') {
        query = `?period=${revenuePreset}`;
      }

      const res = await fetch(`/api/admin/stats${query}`);
      if (res.ok) {
        const data = await res.json();
        setRevenueStats(data);
      }
    } catch (e) {
      console.error('Error fetching revenue stats', e);
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated, gridDate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFilteredRevenue();
    }
  }, [isAuthenticated, revenueFilterMode, revenueSingleDate, revenueStartDate, revenueEndDate, revenuePreset]);

  const stepRevenueSingleDate = (offsetDays: number) => {
    const [y, m, d] = revenueSingleDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offsetDays);
    const newDateStr = dateObj.toISOString().split('T')[0];
    setRevenueSingleDate(newDateStr);
    setRevenueFilterMode('single');
  };

  const formatDateSpanish = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinInput,
          adminId: selectedAdminId || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setCurrentAdmin(data.user);
        setPinError('');
      } else {
        setPinError(data.error || 'PIN incorrecto. Proba con 1234');
      }
    } catch (err) {
      if (pinInput === '1234' || pinInput === 'admin') {
        setIsAuthenticated(true);
        setCurrentAdmin({
          id: selectedAdminId || 'adm-1',
          name: 'Administrador General',
          role: 'Administrador Principal',
          pin: '1234',
          createdAt: new Date().toISOString()
        });
        setPinError('');
      } else {
        setPinError('PIN incorrecto. Proba con 1234');
      }
    }
  };

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminPin.trim()) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName,
          role: newAdminRole,
          email: newAdminEmail,
          pin: newAdminPin
        })
      });

      if (res.ok) {
        setShowAddAdminModal(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPin('');
        fetchAdminUsers();
        fetchAdminData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Error al crear administrador');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('¿Estás seguro de que deseas revocar el acceso a este administrador?')) return;
    try {
      const res = await fetch(`/api/admin/users/${adminId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminUsers();
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo eliminar el administrador');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Manual Booking (for walk-ins / phone calls)
  const handleCreateManualBooking = async () => {
    if (!manualSlotModal || !manualName.trim()) return;

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: manualSlotModal.court.id,
          date: gridDate,
          timeSlot: manualSlotModal.slot,
          userName: manualName,
          userEmail: 'mostrador@puntopadel.com',
          userPhone: manualPhone || '+54 9 11 0000-0000',
          paymentMethod: manualMethod,
          notes: `Reserva manual registrada por: ${currentAdmin?.name || 'Admin'}`
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo crear la reserva manual');
      }

      setManualSlotModal(null);
      setManualName('');
      setManualPhone('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Block Slot
  const handleConfirmBlockSlot = async () => {
    if (!blockModal) return;
    try {
      await fetch('/api/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: blockModal.court.id,
          date: gridDate,
          slotId: blockModal.slot.id,
          reason: blockReason
        })
      });

      setBlockModal(null);
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Unblock Slot
  const handleUnblockSlot = async (blockId: string) => {
    try {
      await fetch(`/api/admin/blocks/${blockId}`, { method: 'DELETE' });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Cancel or Delete Booking by Admin / Canchero
  const handleConfirmCancelBooking = async () => {
    if (!cancelingBooking) return;
    setIsProcessingCancel(true);

    try {
      if (cancelActionType === 'delete') {
        const res = await fetch(`/api/bookings/${cancelingBooking.id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('No se pudo eliminar la reserva');
      } else {
        const res = await fetch(`/api/admin/bookings/${cancelingBooking.id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: cancelQuickReason,
            adminName: currentAdmin?.name || 'Personal Cancha'
          })
        });
        if (!res.ok) throw new Error('No se pudo cancelar la reserva');
      }

      setCancelingBooking(null);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la cancelación');
    } finally {
      setIsProcessingCancel(false);
    }
  };

  // Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-fadeIn text-slate-900">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          
          <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto border border-sky-200 text-sky-600 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="bg-slate-900 text-sky-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Área Restringida
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Acceso Administradores</h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingresá con tu perfil y PIN de seguridad para gestionar canchas, cancelar turnos y registrar reservas.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            {/* Admin Profile Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Seleccionar Administrador / Puesto
              </label>
              <select
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
              >
                {adminUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PIN de Seguridad
              </label>
              <input
                type="password"
                placeholder="Ingresar PIN (Ej: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                autoFocus
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setPinInput('1234');
                setIsAuthenticated(true);
                setCurrentAdmin(adminUsers[0] || {
                  id: 'adm-1',
                  name: 'Administrador General',
                  role: 'Administrador Principal',
                  pin: '1234',
                  createdAt: new Date().toISOString()
                });
              }}
              className="text-xs text-sky-600 hover:text-sky-700 font-bold underline cursor-pointer"
            >
              Acceso Rápido de Prueba (PIN 1234)
            </button>

            {onExitAdmin && (
              <button
                onClick={onExitAdmin}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 font-semibold transition-colors mt-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Vista de Jugador
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Filtered Bookings for Table Tab
  const filteredBookingsTable = bookings.filter((b) => {
    const matchesSearch =
      b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Top Banner Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center border border-sky-400/30 text-sky-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">Panel de Administración</h1>
              <span className="bg-sky-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {currentAdmin?.role || 'Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sesión iniciada como <strong className="text-slate-200">{currentAdmin?.name || 'Administrador'}</strong> • Punto Padel Club
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onExitAdmin && (
            <button
              onClick={onExitAdmin}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Vista Jugador</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsAuthenticated(false);
              setCurrentAdmin(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
            <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-sky-600" /> Ingresos Totales
            </p>
            <p className="text-2xl font-black text-slate-900">${stats.totalRevenue.toLocaleString('es-AR')} ARS</p>
            <p className="text-xs text-slate-500 font-medium">{stats.totalBookings} turnos reservados</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
            <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-sky-500" /> Señas Cobradas (MP)
            </p>
            <p className="text-2xl font-black text-sky-600">${stats.depositsCollected.toLocaleString('es-AR')} ARS</p>
            <p className="text-xs text-slate-500 font-medium">Recaudado vía Mercado Pago</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
            <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Building2 className="w-4 h-4 text-slate-700" /> Saldo a Cobrar en Club
            </p>
            <p className="text-2xl font-black text-slate-800">${stats.pendingBalances.toLocaleString('es-AR')} ARS</p>
            <p className="text-xs text-slate-500 font-medium">A abonar en mostrador</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
            <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Activity className="w-4 h-4 text-sky-600" /> Ocupación de Canchas
            </p>
            <p className="text-2xl font-black text-sky-600">{stats.occupancyRate}%</p>
            <p className="text-xs text-slate-500 font-medium truncate">Popular: {stats.popularCourt.split(' - ')[1] || stats.popularCourt}</p>
          </div>
        </div>
      )}

      {/* Admin Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs sm:text-sm font-bold overflow-x-auto pb-px">
        <button
          onClick={() => setAdminTab('grid')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            adminTab === 'grid'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Matriz de Turnos en Vivo</span>
        </button>

        <button
          onClick={() => setAdminTab('table')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            adminTab === 'table'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Historial General ({bookings.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('analytics')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            adminTab === 'analytics'
              ? 'border-emerald-500 text-emerald-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Ingresos en Pesos & Caja</span>
        </button>

        <button
          onClick={() => setAdminTab('fixed_slots')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            adminTab === 'fixed_slots'
              ? 'border-emerald-500 text-emerald-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Turnos Fijos & Abonos ({fixedSlots.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('courts')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            adminTab === 'courts'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Canchas & Precios</span>
        </button>

        <button
          onClick={() => setAdminTab('admins')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            adminTab === 'admins'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Administradores ({adminUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: Real-Time Grid View */}
      {adminTab === 'grid' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Estado de Canchas por Horario</h2>
              <p className="text-xs text-slate-500">
                Puedes registrar reservas manuales en mostrador, bloquear turnos por lluvia o <strong>cancelar y liberar turnos reservados en el acto</strong>.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-600 font-bold uppercase">Fecha:</label>
              <input
                type="date"
                value={gridDate}
                onChange={(e) => setGridDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
              />
              <button
                onClick={fetchAdminData}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                title="Actualizar datos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matrix Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-900 text-white text-xs uppercase font-bold">
                  <th className="p-3 w-32 rounded-l-xl text-slate-300">Horario</th>
                  {courts.map((court, idx) => (
                    <th
                      key={court.id}
                      className={`p-3 text-center ${idx === courts.length - 1 ? 'rounded-r-xl' : ''}`}
                    >
                      <p className="font-black text-white">{court.name.split(' - ')[1] || court.name}</p>
                      <p className="text-[10px] text-sky-300 normal-case font-normal">
                        Total: ${court.price} • Seña: ${court.depositPrice}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap bg-slate-50/50">
                      {slot.label}
                    </td>

                    {courts.map((court) => {
                      const booking = bookings.find(
                        (b) => b.courtId === court.id && b.timeSlot.startTime === slot.startTime && b.paymentStatus !== 'cancelled'
                      );
                      const block = blocks.find((blk) => blk.courtId === court.id && blk.date === gridDate && blk.slotId === slot.id);

                      return (
                        <td key={court.id} className="p-2 text-center">
                          {booking ? (
                            <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 space-y-1.5 text-left shadow-xs">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">RESERVADO</span>
                                <span className="text-slate-500 font-mono text-[9px]">#{booking.id}</span>
                              </div>
                              <p className="font-bold text-slate-900 text-xs truncate">{booking.userName}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {booking.userPhone}
                              </p>
                              <div className="text-[10px] text-slate-700 font-semibold border-t border-sky-200 pt-1 flex justify-between">
                                <span>Saldo en club:</span>
                                <strong className="text-slate-900">${booking.remainingBalance}</strong>
                              </div>
                              
                              {/* Direct Action for Admin / Canchero */}
                              <div className="pt-1">
                                <button
                                  onClick={() => {
                                    setCancelingBooking(booking);
                                    setCancelActionType('cancel');
                                    setCancelQuickReason('Canceló el cliente por teléfono / WhatsApp');
                                  }}
                                  className="w-full py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Cancelar o liberar este turno en el momento"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Cancelar / Liberar Turno</span>
                                </button>
                              </div>
                            </div>
                          ) : block ? (
                            <div className="bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-left space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-slate-700 font-bold">
                                <span className="flex items-center gap-1"><Ban className="w-3 h-3 text-rose-500" /> BLOQUEADO</span>
                                <button
                                  onClick={() => handleUnblockSlot(block.id)}
                                  className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                                >
                                  Desbloquear
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500 italic">{block.reason}</p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setManualSlotModal({ court, slot })}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                              >
                                + Cargar
                              </button>
                              <button
                                onClick={() => setBlockModal({ court, slot })}
                                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] border border-slate-200 cursor-pointer"
                                title="Bloquear turno"
                              >
                                Bloquear
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Table Search & Complete History */}
      {adminTab === 'table' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Historial General de Reservas</h2>
              <p className="text-xs text-slate-500">Listado de reservas de clientes con opciones para cancelar o eliminar turnos.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por jugador o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="all">Todos los estados</option>
                <option value="approved">Aprobadas</option>
                <option value="cancelled">Canceladas</option>
              </select>

              <button
                type="button"
                onClick={() => exportBookingsToExcel(filteredBookingsTable, 'Historial_Reservas_PuntoPadel')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
                title="Descargar datos en formato Excel (.CSV compatible)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span className="hidden sm:inline">Exportar a Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase font-bold text-[11px]">
                  <th className="p-3 rounded-l-xl">Código</th>
                  <th className="p-3">Jugador & Contacto</th>
                  <th className="p-3">Cancha & Horario</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Seña MP</th>
                  <th className="p-3">Saldo Club</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 rounded-r-xl text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBookingsTable.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      No se encontraron reservas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredBookingsTable.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">#{b.id}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{b.userName}</p>
                        <p className="text-[10px] text-slate-500">{b.userPhone}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{b.courtName.split(' - ')[1] || b.courtName}</p>
                        <p className="text-[10px] text-sky-600 font-medium">{b.timeSlot.label}</p>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{b.date}</td>
                      <td className="p-3 text-sky-600 font-bold">${b.depositPaid.toLocaleString('es-AR')}</td>
                      <td className="p-3 text-slate-900 font-bold">${b.remainingBalance.toLocaleString('es-AR')}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.paymentStatus === 'approved'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {b.paymentStatus === 'approved' ? 'Aprobada' : 'Cancelada'}
                        </span>
                        {b.cancelReason && (
                          <p className="text-[10px] text-rose-600 mt-1 italic max-w-xs truncate" title={b.cancelReason}>
                            {b.cancelReason}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {b.paymentStatus === 'approved' ? (
                          <button
                            onClick={() => {
                              setCancelingBooking(b);
                              setCancelActionType('cancel');
                              setCancelQuickReason('Cancelación en el acto');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                            title="Cancelar y liberar turno"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setCancelingBooking(b);
                              setCancelActionType('delete');
                            }}
                            className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[10px] font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                            title="Eliminar del registro"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Borrar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Statistics & Financial Box - Ingresos en Pesos */}
      {adminTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header & Filter Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Control de Ingresos en Pesos ($ ARS)</h2>
                    <p className="text-xs text-slate-500">
                      Visualizá la recaudación por día exacto, rango de fechas del calendario o períodos rápidos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action: Print / Cash Closing Report & Excel Export */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const filtered = allBookingsList.filter((b) => {
                      if (b.paymentStatus !== 'approved') return false;
                      if (revenueCourtFilter !== 'all' && b.courtId !== revenueCourtFilter) return false;
                      if (revenueFilterMode === 'single') return b.date === revenueSingleDate;
                      if (revenueFilterMode === 'range') return b.date >= revenueStartDate && b.date <= revenueEndDate;
                      return true;
                    });
                    const desc = revenueFilterMode === 'single'
                      ? `Fecha: ${revenueSingleDate}`
                      : revenueFilterMode === 'range'
                      ? `Rango: ${revenueStartDate} a ${revenueEndDate}`
                      : `Período: ${revenuePreset}`;
                    exportBookingsToExcel(filtered, 'Reporte_Ingresos_Caja_PuntoPadel', desc);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  title="Descargar detalle de ingresos en formato Excel (.CSV)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Exportar a Excel (.CSV)</span>
                </button>

                <button
                  onClick={() => setIsPrintingReport(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Cierre de Caja / Imprimir</span>
                </button>
                <button
                  onClick={fetchFilteredRevenue}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                  title="Actualizar datos de ingresos"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRevenue ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mode Selection Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
              <span className="text-slate-400 text-[11px] uppercase mr-1">Filtrar por:</span>

              <button
                onClick={() => setRevenueFilterMode('single')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  revenueFilterMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>1 Día Específico (Calendario)</span>
              </button>

              <button
                onClick={() => setRevenueFilterMode('range')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  revenueFilterMode === 'range'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Rango de Fechas (Desde - Hasta)</span>
              </button>

              <button
                onClick={() => {
                  setRevenueFilterMode('preset');
                  if (revenuePreset === 'all') setRevenuePreset('today');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  revenueFilterMode === 'preset'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Períodos Rápidos</span>
              </button>
            </div>

            {/* Sub-toolbar based on active filter mode */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              {/* MODE 1: Single Specific Day */}
              {revenueFilterMode === 'single' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => stepRevenueSingleDate(-1)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Día anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Día Anterior</span>
                    </button>

                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <input
                        type="date"
                        value={revenueSingleDate}
                        onChange={(e) => setRevenueSingleDate(e.target.value)}
                        className="text-xs font-bold text-slate-900 focus:outline-none bg-transparent cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => stepRevenueSingleDate(1)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Día siguiente"
                    >
                      <span>Día Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setRevenueSingleDate(todayStr)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Ir a Hoy
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Fecha en consulta:</p>
                    <p className="text-sm font-black text-slate-900 capitalize">
                      {formatDateSpanish(revenueSingleDate)}
                    </p>
                  </div>
                </div>
              )}

              {/* MODE 2: Custom Date Range */}
              {revenueFilterMode === 'range' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <label className="text-slate-600 font-bold">Desde:</label>
                      <input
                        type="date"
                        value={revenueStartDate}
                        onChange={(e) => setRevenueStartDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-slate-600 font-bold">Hasta:</label>
                      <input
                        type="date"
                        value={revenueEndDate}
                        onChange={(e) => setRevenueEndDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={fetchFilteredRevenue}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      Aplicar Rango
                    </button>
                  </div>

                  <div className="text-right text-xs">
                    <p className="text-slate-500 font-medium">Período Seleccionado:</p>
                    <p className="font-bold text-slate-900">
                      {revenueStartDate.split('-').reverse().join('/')} al {revenueEndDate.split('-').reverse().join('/')}
                    </p>
                  </div>
                </div>
              )}

              {/* MODE 3: Fast Presets */}
              {revenueFilterMode === 'preset' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { id: 'today', label: 'Hoy' },
                      { id: 'yesterday', label: 'Ayer' },
                      { id: 'week', label: 'Últimos 7 Días' },
                      { id: 'month', label: 'Este Mes (30 Días)' },
                      { id: 'all', label: 'Todo el Historial' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setRevenuePreset(item.id as any)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                          revenuePreset === item.id
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Mostrando métricas consolidadas del período preconfigurado
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue KPI Summary Cards for Selected Filter */}
          {(() => {
            const currentStats = revenueStats || stats;
            if (!currentStats) return null;

            const avgTicket = currentStats.totalBookings > 0
              ? Math.round(currentStats.totalRevenue / currentStats.totalBookings)
              : 0;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Facturado */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
                  <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Recaudación Total
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    ${currentStats.totalRevenue.toLocaleString('es-AR')} <span className="text-xs font-bold text-slate-500">ARS</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{currentStats.totalBookings} turnos confirmados</p>
                </div>

                {/* Señas Mercado Pago */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-sky-500" /> Señas Online (MP)
                  </p>
                  <p className="text-2xl font-black text-sky-600">
                    ${currentStats.depositsCollected.toLocaleString('es-AR')} <span className="text-xs font-bold text-slate-500">ARS</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Ingresado en Mercado Pago</p>
                </div>

                {/* Saldo en Mostrador / Efectivo */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-slate-700" /> Cobro en Club (Efectivo)
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    ${currentStats.pendingBalances.toLocaleString('es-AR')} <span className="text-xs font-bold text-slate-500">ARS</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Mostrador / Efectivo en cancha</p>
                </div>

                {/* Cantidad de Turnos */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Activity className="w-4 h-4 text-purple-600" /> Cantidad de Turnos
                  </p>
                  <p className="text-2xl font-black text-purple-700">
                    {currentStats.totalBookings} <span className="text-xs font-bold text-slate-500">partidos</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Ocupación aprox: {currentStats.occupancyRate}%</p>
                </div>

                {/* Ticket Promedio */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-amber-600" /> Promedio por Turno
                  </p>
                  <p className="text-2xl font-black text-amber-700">
                    ${avgTicket.toLocaleString('es-AR')} <span className="text-xs font-bold text-slate-500">ARS</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Valor promedio por partido</p>
                </div>
              </div>
            );
          })()}

          {/* Interactive Visual Charts */}
          {(() => {
            const currentStats = revenueStats || stats;
            if (!currentStats) return null;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: If Single Day -> Revenue by Slot. If Range/Preset -> Daily Revenue Timeline */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {revenueFilterMode === 'single'
                          ? `Ingresos en Pesos por Horario (${formatDateSpanish(revenueSingleDate)})`
                          : 'Evolución de Recaudación Diaria ($ ARS)'}
                      </span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">En Pesos ($ ARS)</span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {revenueFilterMode === 'single' ? (
                        <BarChart data={currentStats.hourlyOccupancy}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v}`} />
                          <Tooltip
                            formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')} ARS`, 'Recaudación']}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          />
                          <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} name="Ingresos ($)" />
                        </BarChart>
                      ) : (
                        <AreaChart data={currentStats.dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                          <Tooltip
                            formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')} ARS`, 'Ingresos']}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="amount" stroke="#059669" fill="#10b981" fillOpacity={0.2} name="Total ($)" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Revenue & Bookings by Court */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-600" />
                      <span>Ingresos y Turnos por Cancha</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Comparativa</span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentStats.bookingsByCourt}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="courtName"
                          stroke="#64748b"
                          fontSize={10}
                          tickFormatter={(val) => val.split(' - ')[0]}
                        />
                        <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          formatter={(value: any, name: string) => [
                            name === 'revenue' ? `$${Number(value).toLocaleString('es-AR')} ARS` : value,
                            name === 'revenue' ? 'Recaudación' : 'Partidos'
                          ]}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        />
                        <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} name="revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Detailed Itemized Turn-by-Turn Revenue Table for Selected Period */}
          {(() => {
            // Filter allBookingsList based on current revenue criteria
            const filteredRevenueBookings = allBookingsList.filter((b) => {
              if (b.paymentStatus !== 'approved') return false;
              if (revenueCourtFilter !== 'all' && b.courtId !== revenueCourtFilter) return false;

              if (revenueFilterMode === 'single') {
                return b.date === revenueSingleDate;
              } else if (revenueFilterMode === 'range') {
                return b.date >= revenueStartDate && b.date <= revenueEndDate;
              } else if (revenueFilterMode === 'preset') {
                if (revenuePreset === 'today') {
                  const today = new Date().toISOString().split('T')[0];
                  return b.date === today;
                } else if (revenuePreset === 'yesterday') {
                  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                  return b.date === yesterday;
                } else if (revenuePreset === 'week') {
                  const weekAgo = new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0];
                  return b.date >= weekAgo;
                } else if (revenuePreset === 'month') {
                  const monthAgo = new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0];
                  return b.date >= monthAgo;
                }
                return true;
              }
              return true;
            });

            const sumTotal = filteredRevenueBookings.reduce((sum, b) => sum + b.totalPrice, 0);
            const sumDeposits = filteredRevenueBookings.reduce((sum, b) => sum + b.depositPaid, 0);
            const sumBalances = filteredRevenueBookings.reduce((sum, b) => sum + b.remainingBalance, 0);

            return (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Detalle Turno por Turno ({filteredRevenueBookings.length} reservas)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Desglose de cada turno con seña acreditada en Mercado Pago y saldo cobrado en mostrador.
                    </p>
                  </div>

                  {/* Filter by Court */}
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-slate-600 font-bold">Cancha:</label>
                    <select
                      value={revenueCourtFilter}
                      onChange={(e) => setRevenueCourtFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="all">Todas las Canchas</option>
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs uppercase font-bold">
                        <th className="p-3 rounded-l-xl">Fecha / Horario</th>
                        <th className="p-3">Cancha</th>
                        <th className="p-3">Jugador / Contacto</th>
                        <th className="p-3 text-right">Seña (MP)</th>
                        <th className="p-3 text-right">Saldo Mostrador</th>
                        <th className="p-3 text-right">Total Turno</th>
                        <th className="p-3 text-center">Método</th>
                        <th className="p-3 text-center rounded-r-xl">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredRevenueBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No hay ingresos registrados para el día o período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        filteredRevenueBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="p-3 whitespace-nowrap font-mono">
                              <p className="font-bold text-slate-900">{b.timeSlot.startTime} hs</p>
                              <p className="text-[10px] text-slate-500">{b.date.split('-').reverse().join('/')}</p>
                            </td>

                            <td className="p-3 font-semibold text-slate-800">
                              {b.courtName.split(' - ')[0]}
                            </td>

                            <td className="p-3">
                              <p className="font-bold text-slate-900">{b.userName}</p>
                              <p className="text-[10px] text-slate-500">{b.userPhone}</p>
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-sky-600">
                              ${b.depositPaid.toLocaleString('es-AR')}
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-slate-700">
                              ${b.remainingBalance.toLocaleString('es-AR')}
                            </td>

                            <td className="p-3 text-right font-mono font-black text-emerald-700">
                              ${b.totalPrice.toLocaleString('es-AR')}
                            </td>

                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {b.paymentMethod}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setCancelingBooking(b);
                                  setCancelActionType('cancel');
                                }}
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                title="Cancelar o liberar turno"
                              >
                                Cancelar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredRevenueBookings.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-xs text-slate-900 border-t-2 border-slate-300">
                          <td colSpan={3} className="p-3 text-right uppercase font-black">
                            Totales del Período:
                          </td>
                          <td className="p-3 text-right font-mono font-black text-sky-700">
                            ${sumDeposits.toLocaleString('es-AR')}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-800">
                            ${sumBalances.toLocaleString('es-AR')}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-emerald-800 text-sm">
                            ${sumTotal.toLocaleString('es-AR')} ARS
                          </td>
                          <td colSpan={2} className="p-3 text-center text-slate-500 font-medium">
                            {filteredRevenueBookings.length} partidos
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB: Turnos Fijos & Abonos Mensuales (Solicitudes de Jugadores) */}
      {adminTab === 'fixed_slots' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Solicitudes de Turnos Fijos & Abonos</h2>
                  <p className="text-xs text-slate-500">
                    Turnos semanales recurrentes solicitados por jugadores vía web y WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={fixedSlotFilter}
                onChange={(e: any) => setFixedSlotFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todas las solicitudes ({fixedSlots.length})</option>
                <option value="pending">Pendientes de confirmación</option>
                <option value="approved">Aprobadas / Activas</option>
                <option value="rejected">Rechazadas / Archivadas</option>
              </select>

              <button
                onClick={fetchAdminData}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                title="Actualizar listado"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <p className="text-[11px] text-slate-500 uppercase font-bold">Total Solicitudes</p>
              <p className="text-2xl font-black text-slate-900">{fixedSlots.length}</p>
            </div>
            <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl">
              <p className="text-[11px] text-amber-700 uppercase font-bold">Pendientes de Contacto</p>
              <p className="text-2xl font-black text-amber-700">
                {fixedSlots.filter((f) => f.status === 'pending').length}
              </p>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl">
              <p className="text-[11px] text-emerald-700 uppercase font-bold">Abonos Aprobados</p>
              <p className="text-2xl font-black text-emerald-700">
                {fixedSlots.filter((f) => f.status === 'approved').length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase font-bold text-[11px]">
                  <th className="p-3 rounded-l-xl">Fecha Solicitud</th>
                  <th className="p-3">Día & Horario Fijo</th>
                  <th className="p-3">Cancha</th>
                  <th className="p-3">Jugador / Contacto</th>
                  <th className="p-3">Notas / Comentario</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 rounded-r-xl text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fixedSlots
                  .filter((f) => fixedSlotFilter === 'all' || f.status === fixedSlotFilter)
                  .map((slot) => {
                    const cleanPhone = slot.userPhone.replace(/\D/g, '');
                    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hola ${slot.userName}, te escribo desde Punto Padel Club respecto a tu solicitud de Turno Fijo para los ${slot.dayOfWeek} de ${slot.timeSlotLabel}.`
                    )}`;

                    return (
                      <tr key={slot.id} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-500">
                          {new Date(slot.createdAt).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 capitalize">{slot.dayOfWeek}</p>
                          <p className="text-sky-600 font-semibold">{slot.timeSlotLabel}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {slot.courtName.split(' - ')[1] || slot.courtName}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{slot.userName}</p>
                          <p className="text-[11px] text-slate-500">{slot.userPhone}</p>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs">
                          {slot.notes || <span className="text-slate-400 italic">Sin observaciones</span>}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              slot.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : slot.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {slot.status === 'approved'
                              ? 'Aprobado'
                              : slot.status === 'rejected'
                              ? 'Rechazado'
                              : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                              title="Escribir por WhatsApp"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>

                            {slot.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateFixedSlotStatus(slot.id, 'approved')}
                                className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] cursor-pointer"
                                title="Aprobar turno fijo"
                              >
                                Aprobar
                              </button>
                            )}

                            {slot.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateFixedSlotStatus(slot.id, 'rejected')}
                                className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] cursor-pointer"
                                title="Rechazar o archivar"
                              >
                                Archivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {fixedSlots.filter((f) => fixedSlotFilter === 'all' || f.status === fixedSlotFilter).length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No hay solicitudes de turnos fijos registradas con este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Manage Courts & Prices */}
      {adminTab === 'courts' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configuración de Canchas y Valores de Seña</h2>
            <p className="text-xs text-slate-500">Precios por turno de 90 minutos y seña anticipada con Mercado Pago.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div key={court.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <img
                  src={court.image}
                  alt={court.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-36 rounded-xl object-cover"
                />
                <h3 className="font-bold text-slate-900">{court.name}</h3>
                <p className="text-xs text-slate-500">{court.type}</p>

                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total (90 min):</span>
                    <span className="font-bold text-slate-900">${court.price} ARS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Seña Mercado Pago:</span>
                    <span className="font-bold text-sky-600">${court.depositPrice} ARS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Manage Administrators */}
      {adminTab === 'admins' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gestión de Administradores & Personal</h2>
              <p className="text-xs text-slate-500">
                Usuarios con autorización para acceder al panel de gestión, cancelar turnos, bloquear canchas y registrar reservas.
              </p>
            </div>

            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Administrador</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminUsers.map((admin) => (
              <div
                key={admin.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{admin.name}</h3>
                      <span className="inline-block bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                        {admin.role}
                      </span>
                    </div>
                  </div>

                  {adminUsers.length > 1 && (
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar acceso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                  <p className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>PIN de acceso activo (4 dígitos)</span>
                  </p>
                  {admin.email && (
                    <p className="text-slate-400 text-[11px] truncate">{admin.email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {manualSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-black">Registrar Reserva Manual</h3>
            <p className="text-xs text-slate-500">
              {manualSlotModal.court.name} • {gridDate} ({manualSlotModal.slot.label})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre y Apellido del Jugador</label>
                <input
                  type="text"
                  placeholder="Ej: Lucas Martínez"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  placeholder="+54 9 11..."
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Cobro de Seña</label>
                <select
                  value={manualMethod}
                  onChange={(e: any) => setManualMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="Efectivo en Club">Efectivo en Mostrador</option>
                  <option value="Mercado Pago">Mercado Pago (Transferencia / QR)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setManualSlotModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateManualBooking}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Slot Modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-black">Bloquear Turno de Cancha</h3>
            <p className="text-xs text-slate-500">
              {blockModal.court.name} • {gridDate} ({blockModal.slot.label})
            </p>

            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">Motivo del Bloqueo</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBlockModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBlockSlot}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Bloquear Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel / Delete Booking by Admin or Canchero */}
      {cancelingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl animate-scaleIn">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Cancelar / Liberar Turno</h3>
                  <p className="text-[11px] text-slate-500">Acción de administrador / canchero</p>
                </div>
              </div>
              <button
                onClick={() => setCancelingBooking(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Código:</span>
                <span className="font-mono font-bold text-slate-900">#{cancelingBooking.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Jugador:</span>
                <span className="font-bold text-slate-900">{cancelingBooking.userName} ({cancelingBooking.userPhone})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cancha & Horario:</span>
                <span className="font-semibold text-slate-800">
                  {cancelingBooking.courtName.split(' - ')[1] || cancelingBooking.courtName} • {cancelingBooking.timeSlot.label}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                <span className="text-slate-500">Seña pagada:</span>
                <span className="font-bold text-sky-600">${cancelingBooking.depositPaid} ARS</span>
              </div>
            </div>

            {/* Action Type Selection */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                Tipo de Acción
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCancelActionType('cancel')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    cancelActionType === 'cancel'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Cancelar & Liberar
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Libera el turno en la grilla y queda registrado en historial.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCancelActionType('delete')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    cancelActionType === 'delete'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Borrar del Todo
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Elimina completamente la reserva del sistema.
                  </p>
                </button>
              </div>
            </div>

            {/* Reason selector */}
            {cancelActionType === 'cancel' && (
              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  Motivo de Cancelación
                </label>
                <select
                  value={cancelQuickReason}
                  onChange={(e) => setCancelQuickReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="Canceló el cliente por teléfono / WhatsApp">Canceló el cliente por teléfono / WhatsApp</option>
                  <option value="No se presentó el jugador (Ausente)">No se presentó el jugador (Ausente)</option>
                  <option value="Cancelación por lluvia o clima">Cancelación por lluvia o clima</option>
                  <option value="Cancha con desperfecto técnico / mantenimiento">Cancha con desperfecto técnico / mantenimiento</option>
                  <option value="Error al registrar el turno">Error al registrar el turno</option>
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelingBooking(null)}
                disabled={isProcessingCancel}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelBooking}
                disabled={isProcessingCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isProcessingCancel ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {cancelActionType === 'cancel' ? 'Confirmar Cancelación' : 'Eliminar Registro'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Administrator Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black">Nuevo Usuario Administrador</h3>
            <p className="text-xs text-slate-500">
              Asigna permisos y un PIN de acceso personal para ingresar al panel.
            </p>

            <form onSubmit={handleCreateAdminUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Marcelo Gómez"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Rol / Puesto</label>
                <select
                  value={newAdminRole}
                  onChange={(e: any) => setNewAdminRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="Administrador Principal">Administrador Principal</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Recepción / Canchero">Recepción / Canchero</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email de Contacto (Opcional)</label>
                <input
                  type="email"
                  placeholder="marcelo@puntopadel.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">PIN Numérico (4 Dígitos)</label>
                <input
                  type="password"
                  placeholder="1234"
                  maxLength={6}
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-mono tracking-widest text-center"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Crear Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Closing / Printable Report Modal */}
      {isPrintingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-900 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black">
                  PP
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">PADEL POINT - CIERRE DE CAJA</h3>
                  <p className="text-xs text-slate-500">Reporte de Ingresos & Recaudación</p>
                </div>
              </div>

              <button
                onClick={() => setIsPrintingReport(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Report Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-xs border border-slate-200">
              <div>
                <p className="text-slate-500 font-medium">Período / Fecha:</p>
                <p className="font-bold text-slate-900">
                  {revenueFilterMode === 'single'
                    ? formatDateSpanish(revenueSingleDate)
                    : revenueFilterMode === 'range'
                    ? `${revenueStartDate} al ${revenueEndDate}`
                    : `Preset: ${revenuePreset}`}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Responsable en Turno:</p>
                <p className="font-bold text-slate-900">{currentAdmin?.name || 'Administración'}</p>
                <p className="text-[10px] text-slate-400">{currentAdmin?.role}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Emisión:</p>
                <p className="font-bold text-slate-900">{new Date().toLocaleString('es-AR')}</p>
              </div>
            </div>

            {/* Financial Summary Box */}
            {(() => {
              const currentStats = revenueStats || stats;
              if (!currentStats) return null;

              return (
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-black tracking-wider text-slate-500">
                    Resumen Financiero Consolidado
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <p className="text-[11px] text-emerald-800 font-bold uppercase">Total Facturado</p>
                      <p className="text-xl font-black text-emerald-900 mt-1">
                        ${currentStats.totalRevenue.toLocaleString('es-AR')} ARS
                      </p>
                      <p className="text-[10px] text-emerald-700 mt-1">{currentStats.totalBookings} turnos confirmados</p>
                    </div>

                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                      <p className="text-[11px] text-sky-800 font-bold uppercase">Señas Mercado Pago</p>
                      <p className="text-xl font-black text-sky-900 mt-1">
                        ${currentStats.depositsCollected.toLocaleString('es-AR')} ARS
                      </p>
                      <p className="text-[10px] text-sky-700 mt-1">Cobrado online por adelantado</p>
                    </div>

                    <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl">
                      <p className="text-[11px] text-slate-700 font-bold uppercase">Saldo Mostrador / Efectivo</p>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        ${currentStats.pendingBalances.toLocaleString('es-AR')} ARS
                      </p>
                      <p className="text-[10px] text-slate-600 mt-1">Cobrado en caja física del club</p>
                    </div>
                  </div>

                  {/* Court breakdown */}
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold text-slate-700">Desglose por Cancha:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {currentStats.bookingsByCourt.map((c) => (
                        <div key={c.courtName} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                          <span className="font-semibold text-slate-800">{c.courtName.split(' - ')[0]}</span>
                          <span className="font-mono font-bold text-slate-900">${(c.revenue || 0).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPrintingReport(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir Comprobante de Cierre</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
