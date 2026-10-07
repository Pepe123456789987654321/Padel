import { Court, TimeSlot } from '../types';

export const INITIAL_COURTS: Court[] = [
  {
    id: 'c1',
    name: 'Cancha 1 - Cristal WPT Indoor',
    type: 'Techada Cristal',
    surface: 'Césped Sintético Texturizado Azul WPT',
    price: 18000,
    depositPrice: 6000,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
    description: 'Cancha premium techada de nivel profesional con cristal de 12mm, césped oficial World Padel Tour y grabación de video HD.',
    features: ['Iluminación LED 400W', 'Techada y Climatizada', 'Camaras HD de Grabación', 'Luz Perimetral Pro'],
    isActive: true
  },
  {
    id: 'c2',
    name: 'Cancha 2 - Panorámica Exterior',
    type: 'Exterior Panorámica',
    surface: 'Césped Fibrilado Pro Verde',
    price: 15000,
    depositPrice: 5000,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
    description: 'Excelente cancha al aire libre panorámica, con iluminación nocturna de alta potencia y amplio espacio exterior.',
    features: ['Iluminación Nocturna LED', 'Vista Panorámica Sin Columnas', 'Zona de Descanso Privada', 'Apto para Noche'],
    isActive: true
  },
  {
    id: 'c3',
    name: 'Cancha 3 - Club Master Techada',
    type: 'Cancha Indoor VIP',
    surface: 'Césped Monofilamento Azul Premium',
    price: 16500,
    depositPrice: 5500,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
    description: 'Cancha cubierta resguardada de la intemperie con rebote perfecto, acústica insonorizada y bancos ergonómicos.',
    features: ['Techo Aislante Termoacústico', 'Césped de Alta Densidad', 'Marcador Electrónico', 'Puntuación Digital'],
    isActive: true
  }
];

export const TIME_SLOTS: TimeSlot[] = [
  { id: 's1', startTime: '11:30', endTime: '13:00', label: '11:30', isPeakHour: false },
  { id: 's2', startTime: '13:00', endTime: '14:30', label: '13:00', isPeakHour: false },
  { id: 's3', startTime: '14:30', endTime: '16:00', label: '14:30', isPeakHour: false },
  { id: 's4', startTime: '16:00', endTime: '17:30', label: '16:00', isPeakHour: false },
  { id: 's5', startTime: '17:30', endTime: '19:00', label: '17:30', isPeakHour: true },
  { id: 's6', startTime: '19:00', endTime: '20:30', label: '19:00', isPeakHour: true },
  { id: 's7', startTime: '20:30', endTime: '22:00', label: '20:30', isPeakHour: true },
  { id: 's8', startTime: '22:00', endTime: '23:30', label: '22:00', isPeakHour: true },
  { id: 's9', startTime: '23:30', endTime: '01:00', label: '23:30', isPeakHour: false }
];
