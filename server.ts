import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_COURTS, TIME_SLOTS } from './src/data/initialData.js';
import { Booking, CourtBlock, Court, StatsSummary, AdminUser, FixedSlotRequest, MatchPlayer } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface LocalDB {
  courts: Court[];
  bookings: Booking[];
  blocks: CourtBlock[];
  admins: AdminUser[];
  fixedSlotRequests: FixedSlotRequest[];
}

const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'adm-1',
    name: 'Administrador General',
    role: 'Administrador Principal',
    pin: '1234',
    email: 'admin@puntopadel.com',
    createdAt: new Date().toISOString()
  },
  {
    id: 'adm-2',
    name: 'Recepción Mostrador',
    role: 'Recepción / Canchero',
    pin: '1234',
    email: 'recepcion@puntopadel.com',
    createdAt: new Date().toISOString()
  }
];

function loadDB(): LocalDB {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.admins || parsed.admins.length === 0) {
        parsed.admins = DEFAULT_ADMINS;
      }
      if (!parsed.fixedSlotRequests) {
        parsed.fixedSlotRequests = [];
      }
      return parsed;
    } catch (e) {
      console.error('Error reading db.json, re-initializing', e);
    }
  }

  // Generate seed sample bookings for realistic initial state across multiple days
  const now = new Date();
  const getOffsetDateStr = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getOffsetDateStr(0);
  const yesterdayStr = getOffsetDateStr(-1);
  const dayBeforeYesterdayStr = getOffsetDateStr(-2);
  const threeDaysAgoStr = getOffsetDateStr(-3);
  const tomorrowStr = getOffsetDateStr(1);

  const seedBookings: Booking[] = [
    // Today Bookings
    {
      id: 'res-101',
      courtId: 'c1',
      courtName: 'Cancha 1 - Cristal WPT Indoor',
      date: todayStr,
      timeSlot: { startTime: '14:30', endTime: '16:00', label: '14:30' },
      userName: 'Liga ponja vs bruno',
      userEmail: 'liga.ponja@gmail.com',
      userPhone: '+54 9 11 4522-8901',
      totalPrice: 18000,
      depositPaid: 6000,
      remainingBalance: 12000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      mercadoPagoPreferenceId: 'MP-PREF-991201',
      mercadoPagoPaymentId: 'MP-PAY-884102',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      notes: 'Partido de Liga'
    },
    {
      id: 'res-102',
      courtId: 'c2',
      courtName: 'Cancha 2 - Panorámica Exterior',
      date: todayStr,
      timeSlot: { startTime: '14:30', endTime: '16:00', label: '14:30' },
      userName: 'Liga rama vs alva',
      userEmail: 'liga.rama@hotmail.com',
      userPhone: '+54 9 11 6723-1190',
      totalPrice: 15000,
      depositPaid: 5000,
      remainingBalance: 10000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      mercadoPagoPreferenceId: 'MP-PREF-991202',
      mercadoPagoPaymentId: 'MP-PAY-884103',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'res-103',
      courtId: 'c1',
      courtName: 'Cancha 1 - Cristal WPT Indoor',
      date: todayStr,
      timeSlot: { startTime: '16:00', endTime: '17:30', label: '16:00' },
      userName: 'Gabi Veletti',
      userEmail: 'gabi.veletti@gmail.com',
      userPhone: '+54 9 11 3102-9988',
      totalPrice: 18000,
      depositPaid: 6000,
      remainingBalance: 12000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      mercadoPagoPreferenceId: 'MP-PREF-991203',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'res-104',
      courtId: 'c2',
      courtName: 'Cancha 2 - Panorámica Exterior',
      date: todayStr,
      timeSlot: { startTime: '16:00', endTime: '17:30', label: '16:00' },
      userName: 'M&M Pádel',
      userEmail: 'm.m@padel.com',
      userPhone: '+54 9 11 8821-3310',
      totalPrice: 15000,
      depositPaid: 5000,
      remainingBalance: 10000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: 'res-105',
      courtId: 'c1',
      courtName: 'Cancha 1 - Cristal WPT Indoor',
      date: todayStr,
      timeSlot: { startTime: '20:30', endTime: '22:00', label: '20:30' },
      userName: 'Gustavo Peralta',
      userEmail: 'gustavo.padel@gmail.com',
      userPhone: '+54 9 11 5510-4499',
      totalPrice: 18000,
      depositPaid: 6000,
      remainingBalance: 12000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
      isOpenMatch: true,
      matchCategory: '5ta Categoría',
      maxPlayers: 4,
      openMatchStatus: 'buscando_jugadores',
      creatorToken: 'tok-gustavo-105',
      players: [
        {
          id: 'pl-105-1',
          name: 'Gustavo Peralta',
          phone: '+54 9 11 5510-4499',
          category: '5ta Categoría',
          preferredSide: 'Drive',
          joinedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          isHost: true
        },
        {
          id: 'pl-105-2',
          name: 'Lucas Rossi',
          phone: '+54 9 11 3499-1122',
          category: '5ta Categoría',
          preferredSide: 'Revés',
          joinedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          isHost: false
        },
        {
          id: 'pl-105-3',
          name: 'Martín Díaz',
          phone: '+54 9 11 6710-8822',
          category: '5ta Categoría',
          preferredSide: 'Ambos',
          joinedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
          isHost: false
        }
      ]
    },
    {
      id: 'res-106',
      courtId: 'c3',
      courtName: 'Cancha 3 - Club Master Techada',
      date: todayStr,
      timeSlot: { startTime: '19:00', endTime: '20:30', label: '19:00' },
      userName: 'Matías Gomez',
      userEmail: 'matias.gomez@padel.com',
      userPhone: '+54 9 11 4433-2211',
      totalPrice: 16500,
      depositPaid: 5500,
      remainingBalance: 11000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      isOpenMatch: true,
      matchCategory: '6ta / 7ma Categoría',
      maxPlayers: 4,
      openMatchStatus: 'buscando_jugadores',
      creatorToken: 'tok-matias-106',
      players: [
        {
          id: 'pl-106-1',
          name: 'Matías Gomez',
          phone: '+54 9 11 4433-2211',
          category: '6ta / 7ma Categoría',
          preferredSide: 'Drive',
          joinedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          isHost: true
        },
        {
          id: 'pl-106-2',
          name: 'Nicolás Vega',
          phone: '+54 9 11 8899-7766',
          category: '6ta / 7ma Categoría',
          preferredSide: 'Revés',
          joinedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          isHost: false
        }
      ]
    },
    // Yesterday Bookings
    {
      id: 'res-095',
      courtId: 'c1',
      courtName: 'Cancha 1 - Cristal WPT Indoor',
      date: yesterdayStr,
      timeSlot: { startTime: '19:00', endTime: '20:30', label: '19:00' },
      userName: 'Martín Zeballos',
      userEmail: 'mzeballos@gmail.com',
      userPhone: '+54 9 11 7733-2211',
      totalPrice: 18000,
      depositPaid: 6000,
      remainingBalance: 12000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString()
    },
    {
      id: 'res-096',
      courtId: 'c3',
      courtName: 'Cancha 3 - Club Master Techada',
      date: yesterdayStr,
      timeSlot: { startTime: '20:30', endTime: '22:00', label: '20:30' },
      userName: 'Joaquín Navarro',
      userEmail: 'jnavarro@padel.com',
      userPhone: '+54 9 11 4455-6677',
      totalPrice: 16500,
      depositPaid: 5500,
      remainingBalance: 11000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 1.3).toISOString()
    },
    {
      id: 'res-097',
      courtId: 'c2',
      courtName: 'Cancha 2 - Panorámica Exterior',
      date: yesterdayStr,
      timeSlot: { startTime: '22:00', endTime: '23:30', label: '22:00' },
      userName: 'Federico Baldi',
      userEmail: 'fedebaldi@gmail.com',
      userPhone: '+54 9 11 9988-1122',
      totalPrice: 15000,
      depositPaid: 5000,
      remainingBalance: 10000,
      paymentMethod: 'Efectivo en Club',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 1.4).toISOString()
    },
    // 2 Days Ago Bookings
    {
      id: 'res-088',
      courtId: 'c1',
      courtName: 'Cancha 1 - Cristal WPT Indoor',
      date: dayBeforeYesterdayStr,
      timeSlot: { startTime: '17:30', endTime: '19:00', label: '17:30' },
      userName: 'Tomás Albarracín',
      userEmail: 'tomas.alba@gmail.com',
      userPhone: '+54 9 11 3322-1100',
      totalPrice: 18000,
      depositPaid: 6000,
      remainingBalance: 12000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 2.2).toISOString()
    },
    {
      id: 'res-089',
      courtId: 'c3',
      courtName: 'Cancha 3 - Club Master Techada',
      date: dayBeforeYesterdayStr,
      timeSlot: { startTime: '19:00', endTime: '20:30', label: '19:00' },
      userName: 'Nicolás Soria',
      userEmail: 'nsoria@yahoo.com',
      userPhone: '+54 9 11 6611-9988',
      totalPrice: 16500,
      depositPaid: 5500,
      remainingBalance: 11000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 2.3).toISOString()
    },
    // 3 Days Ago Bookings
    {
      id: 'res-080',
      courtId: 'c2',
      courtName: 'Cancha 2 - Panorámica Exterior',
      date: threeDaysAgoStr,
      timeSlot: { startTime: '20:30', endTime: '22:00', label: '20:30' },
      userName: 'Gonzalo Medina',
      userEmail: 'gmedina@gmail.com',
      userPhone: '+54 9 11 1122-3344',
      totalPrice: 15000,
      depositPaid: 5000,
      remainingBalance: 10000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 3.2).toISOString()
    },
    // Tomorrow Bookings
    {
      id: 'res-110',
      courtId: 'c1',
      courtName: 'Cancha 1 - Cristal WPT Indoor',
      date: tomorrowStr,
      timeSlot: { startTime: '19:00', endTime: '20:30', label: '19:00' },
      userName: 'Claudio Rinaldi',
      userEmail: 'crinaldi@gmail.com',
      userPhone: '+54 9 11 8877-6655',
      totalPrice: 18000,
      depositPaid: 6000,
      remainingBalance: 12000,
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'approved',
      createdAt: new Date().toISOString()
    }
  ];

  const initialDB: LocalDB = {
    courts: INITIAL_COURTS,
    bookings: seedBookings,
    blocks: [
      {
        id: 'block-1',
        courtId: 'c3',
        date: todayStr,
        slotId: 's1',
        reason: 'Mantenimiento de iluminación'
      }
    ],
    admins: DEFAULT_ADMINS,
    fixedSlotRequests: [
      {
        id: 'fix-seed-1',
        userName: 'Claudio Caniggia',
        userPhone: '+54 9 11 5566-7788',
        dayOfWeek: 'Martes',
        startTime: '20:30',
        courtId: 'c1',
        courtName: 'Cancha 1 - Cristal WPT Indoor',
        frequency: 'Semanal (Todos los meses)',
        notes: 'Grupo de 4 jugadores fijos para todo el año',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'approved'
      },
      {
        id: 'fix-seed-2',
        userName: 'Prof. Emiliano Costa',
        userPhone: '+54 9 11 9900-1122',
        dayOfWeek: 'Jueves',
        startTime: '19:00',
        courtId: 'c2',
        courtName: 'Cancha 2 - Panorámica Exterior',
        frequency: 'Semanal (Todos los meses)',
        notes: 'Clases de entrenamiento funcional de pádel',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'pending'
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
  return initialDB;
}

function saveDB(db: LocalDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error saving db.json', e);
  }
}

// Global DB instance
let db = loadDB();

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Courts API
app.get('/api/courts', (req, res) => {
  res.json(db.courts);
});

app.post('/api/courts', (req, res) => {
  const newCourt: Court = {
    id: `c_${Date.now()}`,
    name: req.body.name || 'Nueva Cancha',
    type: req.body.type || 'Techada Cristal',
    surface: req.body.surface || 'Césped Sintético',
    price: Number(req.body.price) || 16000,
    depositPrice: Number(req.body.depositPrice) || 5000,
    image: req.body.image || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
    description: req.body.description || 'Cancha equipada para partidos de alta competencia.',
    features: req.body.features || ['Iluminación LED', 'Paredes de Cristal'],
    isActive: true
  };
  db.courts.push(newCourt);
  saveDB(db);
  res.status(201).json(newCourt);
});

app.put('/api/courts/:id', (req, res) => {
  const { id } = req.params;
  const index = db.courts.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cancha no encontrada' });
  }
  db.courts[index] = { ...db.courts[index], ...req.body };
  saveDB(db);
  res.json(db.courts[index]);
});

// Time Slots list
app.get('/api/timeslots', (req, res) => {
  res.json(TIME_SLOTS);
});

// Bookings GET with filter by date and court
app.get('/api/bookings', (req, res) => {
  const { date, courtId, email } = req.query;
  let result = db.bookings;

  if (date) {
    result = result.filter((b) => b.date === String(date));
  }
  if (courtId) {
    result = result.filter((b) => b.courtId === String(courtId));
  }
  if (email) {
    result = result.filter((b) => b.userEmail.toLowerCase() === String(email).toLowerCase());
  }

  res.json(result);
});

// Mercado Pago Preference Creation Endpoint
app.post('/api/payments/mercadopago/create-preference', (req, res) => {
  const { courtId, date, timeSlot, userName, userEmail, userPhone } = req.body;

  const court = db.courts.find((c) => c.id === courtId);
  if (!court) {
    return res.status(404).json({ error: 'Cancha invalida' });
  }

  // Check if slot is already booked for this court and date
  const isConflict = db.bookings.some(
    (b) =>
      b.courtId === courtId &&
      b.date === date &&
      b.timeSlot.startTime === timeSlot.startTime &&
      b.paymentStatus !== 'cancelled'
  );

  if (isConflict) {
    return res.status(400).json({ error: 'Este turno ya ha sido reservado por otro jugador.' });
  }

  const preferenceId = `MP-PREF-${Math.floor(100000 + Math.random() * 900000)}`;
  const initPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`;

  res.json({
    preferenceId,
    initPoint,
    sandboxInitPoint: initPoint,
    item: {
      title: `Seña Reserva: ${court.name} (${date} ${timeSlot.label})`,
      quantity: 1,
      currency_id: 'ARS',
      unit_price: court.depositPrice
    },
    totalPrice: court.price,
    depositPrice: court.depositPrice,
    remainingBalance: court.price - court.depositPrice
  });
});

// Confirm Booking with Mercado Pago Payment
app.post('/api/bookings', (req, res) => {
  const {
    courtId,
    date,
    timeSlot,
    userName,
    userEmail,
    userPhone,
    paymentMethod,
    preferenceId,
    paymentId,
    notes,
    isOpenMatch,
    matchCategory,
    playerPreferredSide,
    initialPlayerCount
  } = req.body;

  const court = db.courts.find((c) => c.id === courtId);
  if (!court) {
    return res.status(404).json({ error: 'Cancha no encontrada' });
  }

  // Double check availability
  const isConflict = db.bookings.some(
    (b) =>
      b.courtId === courtId &&
      b.date === date &&
      b.timeSlot.startTime === timeSlot.startTime &&
      b.paymentStatus !== 'cancelled'
  );

  if (isConflict) {
    return res.status(400).json({ error: 'El turno ya fue ocupado.' });
  }

  const newBookingId = `res-${Math.floor(100000 + Math.random() * 900000)}`;

  let playersList: MatchPlayer[] | undefined = undefined;
  let openStatus: 'buscando_jugadores' | 'partido_completo' | undefined = undefined;

  if (isOpenMatch) {
    const count = Math.min(3, Math.max(1, initialPlayerCount || 1));
    playersList = [
      {
        id: `pl-${Date.now()}-1`,
        name: userName,
        phone: userPhone,
        category: matchCategory || '5ta Categoría',
        preferredSide: playerPreferredSide || 'Ambos',
        joinedAt: new Date().toISOString(),
        isHost: true
      }
    ];

    if (count >= 2) {
      playersList.push({
        id: `pl-${Date.now()}-2`,
        name: `${userName} (Acompañante)`,
        phone: userPhone,
        category: matchCategory || '5ta Categoría',
        preferredSide: 'Ambos',
        joinedAt: new Date().toISOString(),
        isHost: false
      });
    }

    if (count >= 3) {
      playersList.push({
        id: `pl-${Date.now()}-3`,
        name: `${userName} (Jugador 3)`,
        phone: userPhone,
        category: matchCategory || '5ta Categoría',
        preferredSide: 'Ambos',
        joinedAt: new Date().toISOString(),
        isHost: false
      });
    }

    openStatus = playersList.length >= 4 ? 'partido_completo' : 'buscando_jugadores';
  }

  const creatorToken = isOpenMatch
    ? req.body.creatorToken || `tok_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    : undefined;

  const isDirect = Boolean(req.body.isDirect || req.body.isDirectBooking);
  const directUrl = req.body.directPaymentUrl || (isDirect ? 'https://mpago.la/1tUpkqU' : undefined);

  const newBooking: Booking = {
    id: newBookingId,
    courtId,
    courtName: court.name,
    date,
    timeSlot,
    userName,
    userEmail,
    userPhone,
    totalPrice: court.price,
    depositPaid: isDirect ? court.price : court.depositPrice,
    remainingBalance: isDirect ? 0 : court.price - court.depositPrice,
    paymentMethod: paymentMethod || (isDirect ? 'Mercado Pago Directo' : 'Mercado Pago'),
    paymentStatus: 'approved',
    mercadoPagoPreferenceId: preferenceId || (isDirect ? 'MP-DIRECT' : `MP-PREF-${Date.now()}`),
    mercadoPagoPaymentId: paymentId || (isDirect ? `MP-DIR-${Date.now()}` : `MP-PAY-${Date.now()}`),
    isDirectBooking: isDirect,
    directPaymentUrl: directUrl,
    createdAt: new Date().toISOString(),
    notes: notes || (isDirect ? 'Reserva Directa vía link oficial https://mpago.la/1tUpkqU' : ''),
    isOpenMatch: !isDirect && !!isOpenMatch,
    matchCategory: !isDirect && isOpenMatch ? matchCategory || '5ta Categoría' : undefined,
    maxPlayers: 4,
    players: isDirect ? undefined : playersList,
    openMatchStatus: isDirect ? undefined : openStatus,
    creatorToken: isDirect ? undefined : creatorToken
  };

  db.bookings.unshift(newBooking);
  saveDB(db);

  res.status(201).json(newBooking);
});

// ==================== OPEN MATCHES (FALTA UNO) ENDPOINTS ====================

// Get all open matches (active / upcoming)
app.get('/api/open-matches', (req, res) => {
  const openMatches = db.bookings.filter(
    (b) => b.isOpenMatch && b.paymentStatus !== 'cancelled'
  );
  res.json(openMatches);
});

// Join an open match
app.post('/api/bookings/:id/join-match', (req, res) => {
  const { id } = req.params;
  const { playerName, playerPhone, playerCategory, preferredSide } = req.body;

  if (!playerName || !playerName.trim()) {
    return res.status(400).json({ error: 'Por favor ingresá tu nombre completo para sumarte al partido.' });
  }

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Partido no encontrado.' });
  }

  if (!booking.isOpenMatch) {
    return res.status(400).json({ error: 'Esta reserva no está configurada como partido abierto.' });
  }

  if (!booking.players) {
    booking.players = [
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
  }

  if (booking.players.length >= 4) {
    return res.status(400).json({ error: '¡El partido ya se encuentra completo con los 4 jugadores!' });
  }

  const newPlayer: MatchPlayer = {
    id: `pl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: playerName.trim(),
    phone: playerPhone ? playerPhone.trim() : '',
    category: playerCategory || booking.matchCategory || '5ta Categoría',
    preferredSide: preferredSide || 'Ambos',
    joinedAt: new Date().toISOString(),
    isHost: false
  };

  booking.players.push(newPlayer);

  if (booking.players.length >= 4) {
    booking.openMatchStatus = 'partido_completo';
  } else {
    booking.openMatchStatus = 'buscando_jugadores';
  }

  saveDB(db);

  res.json({
    success: true,
    message: `¡Te sumaste con éxito al partido! Ahora son ${booking.players.length}/4 jugadores.`,
    booking,
    player: newPlayer
  });
});

// Leave / Remove player from open match
app.post('/api/bookings/:id/leave-match', (req, res) => {
  const { id } = req.params;
  const { playerId } = req.body;

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking || !booking.players) {
    return res.status(404).json({ error: 'Partido no encontrado.' });
  }

  booking.players = booking.players.filter((p) => p.id !== playerId);
  if (booking.players.length < 4) {
    booking.openMatchStatus = 'buscando_jugadores';
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Jugador removido del partido.',
    booking
  });
});

// Update / Edit Open Match (Restricted strictly to the organizer / creator who made the booking)
app.patch('/api/bookings/:id/open-match', (req, res) => {
  const { id } = req.params;
  const { creatorToken, userPhone, openMatchStatus, matchCategory, notes, players } = req.body;

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Partido no encontrado.' });
  }

  if (!booking.isOpenMatch) {
    return res.status(400).json({ error: 'Esta reserva no está configurada como partido abierto.' });
  }

  // Security check: ONLY creator who made the reservation can edit
  const headerToken = req.headers['x-creator-token'] as string;
  const clientToken = creatorToken || headerToken;

  const cleanReqPhone = userPhone ? String(userPhone).replace(/\D/g, '') : '';
  const cleanBookingPhone = booking.userPhone ? String(booking.userPhone).replace(/\D/g, '') : '';

  const tokenMatches = clientToken && booking.creatorToken && clientToken === booking.creatorToken;
  const phoneMatches = cleanReqPhone && cleanBookingPhone && (
    cleanBookingPhone.endsWith(cleanReqPhone.slice(-8)) || cleanReqPhone.endsWith(cleanBookingPhone.slice(-8))
  );

  // If booking had no creatorToken yet (legacy), establish it with the organizer's token
  if (!booking.creatorToken && clientToken) {
    booking.creatorToken = clientToken;
  }

  const isAuthorized = tokenMatches || phoneMatches || (!booking.creatorToken && !booking.userPhone);

  if (!isAuthorized) {
    return res.status(403).json({
      error: 'Acceso Denegado: Solo el usuario que realizó la reserva puede editar este partido abierto.'
    });
  }

  // Update status if provided: 'buscando_jugadores' vs 'partido_completo'
  if (openMatchStatus === 'buscando_jugadores' || openMatchStatus === 'partido_completo') {
    booking.openMatchStatus = openMatchStatus;
  }

  // Update category
  if (matchCategory) {
    booking.matchCategory = matchCategory;
  }

  // Update notes
  if (typeof notes === 'string') {
    booking.notes = notes;
  }

  // Update players list if provided
  if (Array.isArray(players)) {
    booking.players = players;
    // If not explicitly specified and count reaches 4, auto mark complete
    if (players.length >= 4 && !openMatchStatus) {
      booking.openMatchStatus = 'partido_completo';
    }
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Partido abierto actualizado correctamente.',
    booking
  });
});

// ==================== FIXED SLOT REQUESTS (TURNOS FIJOS / WHATSAPP) ====================

// Get all fixed slot requests
app.get('/api/fixed-slot-requests', (req, res) => {
  res.json(db.fixedSlotRequests || []);
});

// Create a fixed slot request
app.post('/api/fixed-slot-requests', (req, res) => {
  const { userName, userPhone, dayOfWeek, startTime, courtId, courtName, frequency, notes } = req.body;

  if (!userName || !dayOfWeek || !startTime) {
    return res.status(400).json({ error: 'Faltan campos requeridos para la solicitud de turno fijo.' });
  }

  const newRequest: FixedSlotRequest = {
    id: `fix-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userName: userName.trim(),
    userPhone: userPhone ? userPhone.trim() : '',
    dayOfWeek,
    startTime,
    courtId: courtId || 'c1',
    courtName: courtName || 'Cancha 1 - Cristal WPT Indoor',
    frequency: frequency || 'Semanal (Todos los meses)',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  if (!db.fixedSlotRequests) {
    db.fixedSlotRequests = [];
  }
  db.fixedSlotRequests.unshift(newRequest);
  saveDB(db);

  // Generate WhatsApp message and direct link to the club admin
  const clubPhone = '5491155008899'; // Club WhatsApp line
  const message = `🎾 *SOLICITUD DE TURNO FIJO / ABONO - PUNTO PADEL*\n\n` +
    `👤 *Jugador:* ${newRequest.userName}\n` +
    `📱 *Teléfono:* ${newRequest.userPhone || 'No informado'}\n` +
    `📅 *Día semanal:* ${newRequest.dayOfWeek}\n` +
    `⏰ *Horario:* ${newRequest.startTime} hs\n` +
    `🏟️ *Cancha solicitada:* ${newRequest.courtName}\n` +
    `🔁 *Frecuencia:* ${newRequest.frequency}\n` +
    (newRequest.notes ? `📝 *Detalles:* ${newRequest.notes}\n\n` : '\n') +
    `Hola! Quisiera consultar la disponibilidad para reservar este turno fijo semanal para mi grupo. Gracias!`;

  const waUrl = `https://wa.me/${clubPhone}?text=${encodeURIComponent(message)}`;

  res.status(201).json({
    success: true,
    message: 'Solicitud registrada correctamente.',
    request: newRequest,
    whatsappUrl: waUrl
  });
});

// Update fixed slot request status
app.patch('/api/fixed-slot-requests/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!db.fixedSlotRequests) {
    db.fixedSlotRequests = [];
  }

  const reqItem = db.fixedSlotRequests.find((r) => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ error: 'Solicitud no encontrada.' });
  }

  reqItem.status = status;
  saveDB(db);

  res.json({ success: true, request: reqItem });
});

// Cancel Booking Endpoint
app.post('/api/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  if (booking.paymentStatus === 'cancelled') {
    return res.status(400).json({ error: 'La reserva ya fue cancelada.' });
  }

  // Cancellation rule verification
  const matchDateTime = new Date(`${booking.date}T${booking.timeSlot.startTime}:00`);
  const now = new Date();
  const diffHours = (matchDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  booking.paymentStatus = 'cancelled';
  booking.cancelReason = reason || 'Cancelado por el usuario';

  saveDB(db);

  let refundInfo = '';
  if (diffHours >= 2) {
    refundInfo = 'Cancelación a tiempo (más de 2 hs de anticipación). La seña será reintegrada o acreditada.';
  } else {
    refundInfo = 'Cancelación fuera de término (menos de 2 hs de anticipación). La seña no es reembolsable.';
  }

  res.json({
    message: 'Reserva cancelada con éxito.',
    booking,
    diffHours: diffHours.toFixed(1),
    refundInfo
  });
});

// Admin / Canchero Direct Cancellation (frees up the slot immediately on the spot)
app.post('/api/admin/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason, adminName } = req.body;

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  booking.paymentStatus = 'cancelled';
  booking.cancelReason = reason || `Cancelado en el acto por administración (${adminName || 'Canchero'})`;
  saveDB(db);

  res.json({
    success: true,
    message: 'Turno cancelado y liberado en el acto.',
    booking
  });
});

// Admin / Canchero Permanent Delete Booking
app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = db.bookings.length;
  db.bookings = db.bookings.filter((b) => b.id !== id);

  if (db.bookings.length === initialLength) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  saveDB(db);
  res.json({ success: true, message: 'Reserva eliminada definitivamente del sistema y turno liberado.' });
});

// Admin Court Block Slot
app.get('/api/admin/blocks', (req, res) => {
  res.json(db.blocks);
});

app.post('/api/admin/blocks', (req, res) => {
  const { courtId, date, slotId, reason } = req.body;
  const newBlock: CourtBlock = {
    id: `block-${Date.now()}`,
    courtId,
    date,
    slotId,
    reason: reason || 'Bloqueado por administrador'
  };
  db.blocks.push(newBlock);
  saveDB(db);
  res.status(201).json(newBlock);
});

app.delete('/api/admin/blocks/:id', (req, res) => {
  const { id } = req.params;
  db.blocks = db.blocks.filter((b) => b.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// Admin Users Authentication & Management Endpoints
app.post('/api/admin/login', (req, res) => {
  const { pin, adminId } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'Debes ingresar un PIN de acceso.' });
  }

  // Master PIN check or specific admin check
  if (pin === '1234' || pin === 'admin') {
    const adminUser = adminId ? db.admins.find((a) => a.id === adminId) : db.admins[0];
    return res.json({
      success: true,
      user: adminUser || {
        id: 'adm-root',
        name: 'Administrador General',
        role: 'Administrador Principal',
        email: 'admin@puntopadel.com'
      }
    });
  }

  // Check against specific admin pin
  const matchedAdmin = db.admins.find((a) => (adminId ? a.id === adminId && a.pin === pin : a.pin === pin));
  if (matchedAdmin) {
    return res.json({
      success: true,
      user: {
        id: matchedAdmin.id,
        name: matchedAdmin.name,
        role: matchedAdmin.role,
        email: matchedAdmin.email
      }
    });
  }

  return res.status(401).json({ error: 'PIN incorrecto. Proba con 1234' });
});

app.get('/api/admin/users', (req, res) => {
  const safeAdmins = db.admins.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    email: a.email,
    createdAt: a.createdAt,
    hasPin: Boolean(a.pin)
  }));
  res.json(safeAdmins);
});

app.post('/api/admin/users', (req, res) => {
  const { name, role, pin, email } = req.body;
  if (!name || !pin) {
    return res.status(400).json({ error: 'Nombre y PIN son requeridos.' });
  }

  const newAdmin: AdminUser = {
    id: `adm-${Date.now()}`,
    name,
    role: role || 'Administrador',
    pin,
    email: email || '',
    createdAt: new Date().toISOString()
  };

  db.admins.push(newAdmin);
  saveDB(db);

  res.status(201).json({
    id: newAdmin.id,
    name: newAdmin.name,
    role: newAdmin.role,
    email: newAdmin.email,
    createdAt: newAdmin.createdAt
  });
});

app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  if (db.admins.length <= 1) {
    return res.status(400).json({ error: 'No puedes eliminar el único administrador del sistema.' });
  }
  db.admins = db.admins.filter((a) => a.id !== id);
  saveDB(db);
  res.json({ success: true });
});

app.put('/api/admin/users/:id/pin', (req, res) => {
  const { id } = req.params;
  const { currentPin, newPin } = req.body;

  const admin = db.admins.find((a) => a.id === id);
  if (!admin) {
    return res.status(404).json({ error: 'Administrador no encontrado.' });
  }

  if (currentPin !== admin.pin && currentPin !== '1234' && currentPin !== 'admin') {
    return res.status(401).json({ error: 'El PIN actual es incorrecto.' });
  }

  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'El nuevo PIN debe tener al menos 4 dígitos.' });
  }

  admin.pin = newPin;
  saveDB(db);

  res.json({ success: true, message: 'PIN actualizado correctamente.' });
});

// iCal Google Calendar Export Endpoint
app.get('/api/bookings/:id/ical', (req, res) => {
  const { id } = req.params;
  const booking = db.bookings.find((b) => b.id === id);

  if (!booking) {
    return res.status(404).send('Booking not found');
  }

  const startIso = booking.date.replace(/-/g, '') + 'T' + booking.timeSlot.startTime.replace(':', '') + '00';
  const endIso = booking.date.replace(/-/g, '') + 'T' + booking.timeSlot.endTime.replace(':', '') + '00';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Padel Point//Reserva de Cancha//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@padelpoint.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;TZID=America/Argentina/Buenos_Aires:${startIso}`,
    `DTEND;TZID=America/Argentina/Buenos_Aires:${endIso}`,
    `SUMMARY:Partido de Pádel - ${booking.courtName}`,
    `DESCRIPTION:Reserva #${booking.id}\\nJugador: ${booking.userName}\\nSaldo restante a pagar en club: $${booking.remainingBalance}`,
    'LOCATION:Padel Point Club - Av. del Deporte 1450',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="partido-padel-${booking.id}.ics"`);
  res.send(icsContent);
});

// Admin Stats with Flexible Date / Range / Single-Day Filter
app.get('/api/admin/stats', (req, res) => {
  const { date, startDate, endDate, period } = req.query;

  let approvedBookings = db.bookings.filter((b) => b.paymentStatus === 'approved');

  // Single specific day filter
  if (date) {
    approvedBookings = approvedBookings.filter((b) => b.date === String(date));
  } else if (startDate && endDate) {
    approvedBookings = approvedBookings.filter(
      (b) => b.date >= String(startDate) && b.date <= String(endDate)
    );
  } else if (period === 'today') {
    const today = new Date().toISOString().split('T')[0];
    approvedBookings = approvedBookings.filter((b) => b.date === today);
  } else if (period === 'yesterday') {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    approvedBookings = approvedBookings.filter((b) => b.date === yesterday);
  } else if (period === 'week') {
    const weekAgo = new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0];
    approvedBookings = approvedBookings.filter((b) => b.date >= weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0];
    approvedBookings = approvedBookings.filter((b) => b.date >= monthAgo);
  }

  const totalRevenue = approvedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const depositsCollected = approvedBookings.reduce((sum, b) => sum + b.depositPaid, 0);
  const pendingBalances = approvedBookings.reduce((sum, b) => sum + b.remainingBalance, 0);

  // Court counts and revenue
  const courtCounts: Record<string, { count: number; revenue: number }> = {};
  db.courts.forEach((c) => {
    courtCounts[c.name] = { count: 0, revenue: 0 };
  });
  approvedBookings.forEach((b) => {
    if (!courtCounts[b.courtName]) {
      courtCounts[b.courtName] = { count: 0, revenue: 0 };
    }
    courtCounts[b.courtName].count += 1;
    courtCounts[b.courtName].revenue += b.totalPrice;
  });

  const bookingsByCourt = Object.entries(courtCounts).map(([courtName, data]) => ({
    courtName,
    count: data.count,
    revenue: data.revenue
  }));

  // Hourly distribution and revenue
  const hourlyMap: Record<string, { occupancy: number; revenue: number }> = {};
  TIME_SLOTS.forEach((slot) => {
    hourlyMap[slot.startTime] = { occupancy: 0, revenue: 0 };
  });
  approvedBookings.forEach((b) => {
    const start = b.timeSlot.startTime;
    if (!hourlyMap[start]) {
      hourlyMap[start] = { occupancy: 0, revenue: 0 };
    }
    hourlyMap[start].occupancy += 1;
    hourlyMap[start].revenue += b.totalPrice;
  });

  const hourlyOccupancy = TIME_SLOTS.map((slot) => ({
    hour: slot.label,
    occupancy: hourlyMap[slot.startTime]?.occupancy || 0,
    revenue: hourlyMap[slot.startTime]?.revenue || 0
  }));

  // Group by date for DailyRevenue list
  const dailyMap: Record<string, { amount: number; deposits: number; balances: number; count: number }> = {};
  
  // Also collect all unique dates from all bookings in DB to have a complete timeline
  const allDates = Array.from(new Set(db.bookings.map((b) => b.date))).sort();
  allDates.forEach((d) => {
    dailyMap[d] = { amount: 0, deposits: 0, balances: 0, count: 0 };
  });

  approvedBookings.forEach((b) => {
    if (!dailyMap[b.date]) {
      dailyMap[b.date] = { amount: 0, deposits: 0, balances: 0, count: 0 };
    }
    dailyMap[b.date].amount += b.totalPrice;
    dailyMap[b.date].deposits += b.depositPaid;
    dailyMap[b.date].balances += b.remainingBalance;
    dailyMap[b.date].count += 1;
  });

  const dailyRevenue = Object.entries(dailyMap)
    .filter(([d, data]) => {
      if (date) return d === date;
      if (startDate && endDate) return d >= startDate && d <= endDate;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, data]) => {
      const parts = d.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
      return {
        date: d,
        formattedDate,
        amount: data.amount,
        deposits: data.deposits,
        balances: data.balances,
        bookingsCount: data.count
      };
    });

  // Calculate occupancy percentage
  const totalSlotsPossible = Math.max(1, db.courts.length * TIME_SLOTS.length);
  const occupancyRate = Math.min(100, Math.round((approvedBookings.length / totalSlotsPossible) * 100));

  let popularCourt = 'Cancha 1 - Cristal WPT Indoor';
  let maxC = -1;
  bookingsByCourt.forEach((bc) => {
    if (bc.count > maxC) {
      maxC = bc.count;
      popularCourt = bc.courtName;
    }
  });

  const stats: StatsSummary = {
    totalBookings: approvedBookings.length,
    totalRevenue,
    depositsCollected,
    pendingBalances,
    occupancyRate,
    popularCourt,
    bookingsByCourt,
    hourlyOccupancy,
    dailyRevenue
  };

  res.json(stats);
});

// ==================== VITE & EXPRESS BOOTSTRAP ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
