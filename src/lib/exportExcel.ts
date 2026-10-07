import { Booking, StatsSummary } from '../types';

/**
 * Exports a list of bookings or revenue report into a clean, Excel-compatible CSV file.
 * Uses UTF-8 BOM (\uFEFF) and semicolon (;) separators so Spanish/Latin American Excel
 * properly separates columns and renders special characters and currency.
 */
export function exportBookingsToExcel(
  bookings: Booking[],
  filenamePrefix: string = 'Reporte_PuntoPadel',
  filterDescription?: string
) {
  if (!bookings || bookings.length === 0) {
    alert('No hay datos disponibles para exportar con los filtros seleccionados.');
    return;
  }

  const headers = [
    'ID Reserva',
    'Fecha',
    'Horario',
    'Cancha',
    'Titular de Reserva',
    'Teléfono',
    'Email',
    'Tipo de Turno',
    'Jugadores Anotados',
    'Categoría',
    'Precio Total ($ ARS)',
    'Seña Abonada MP ($ ARS)',
    'Saldo en Mostrador ($ ARS)',
    'Medio de Pago',
    'Estado de Pago',
    'Fecha de Creación',
    'Notas / Motivo'
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = bookings.map((b) => {
    const isMatch = b.isOpenMatch ? 'Partido Abierto (Falta Uno)' : 'Turno Regular (Cerrado)';
    const playersCount = b.isOpenMatch && b.players ? `${b.players.length}/4 jugadores` : '4/4 jugadores';
    const category = b.matchCategory || '-';

    return [
      escapeCSV(b.id),
      escapeCSV(b.date),
      escapeCSV(b.timeSlot?.startTime ? `${b.timeSlot.startTime} hs` : b.timeSlot?.label || ''),
      escapeCSV(b.courtName),
      escapeCSV(b.userName),
      escapeCSV(b.userPhone || 'No informado'),
      escapeCSV(b.userEmail || ''),
      escapeCSV(isMatch),
      escapeCSV(playersCount),
      escapeCSV(category),
      escapeCSV(b.totalPrice),
      escapeCSV(b.depositPaid),
      escapeCSV(b.remainingBalance),
      escapeCSV(b.paymentMethod),
      escapeCSV(b.paymentStatus === 'approved' ? 'Aprobado' : b.paymentStatus === 'cancelled' ? 'Cancelado' : b.paymentStatus),
      escapeCSV(b.createdAt ? new Date(b.createdAt).toLocaleString('es-AR') : ''),
      escapeCSV(b.cancelReason || b.notes || '')
    ].join(';');
  });

  // Calculate totals
  const totalAmount = bookings.reduce((sum, b) => (b.paymentStatus === 'approved' ? sum + b.totalPrice : sum), 0);
  const totalDeposits = bookings.reduce((sum, b) => (b.paymentStatus === 'approved' ? sum + b.depositPaid : sum), 0);
  const totalBalances = bookings.reduce((sum, b) => (b.paymentStatus === 'approved' ? sum + b.remainingBalance : sum), 0);

  const summaryRow = [
    escapeCSV('TOTALES APROBADOS'),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(`${bookings.filter(b => b.paymentStatus === 'approved').length} turnos`),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(totalAmount),
    escapeCSV(totalDeposits),
    escapeCSV(totalBalances),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(filterDescription ? `Filtro: ${filterDescription}` : '')
  ].join(';');

  // UTF-8 BOM for Excel
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows, '', summaryRow].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
