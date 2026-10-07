import { Booking } from '../types';

const STORAGE_KEY = 'punto_padel_user_open_matches';

export interface SavedMatchOwnership {
  bookingId: string;
  creatorToken: string;
  userPhone: string;
  userName: string;
  savedAt: string;
}

const cleanPhone = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const getStoredOwnerships = (): Record<string, SavedMatchOwnership> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const saveStoredOwnerships = (data: Record<string, SavedMatchOwnership>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save match ownership to localStorage', e);
  }
};

/**
 * Save a newly created booking as owned by this user
 */
export const saveMatchOwnership = (booking: Booking, customToken?: string): void => {
  if (!booking || !booking.id) return;
  const ownerships = getStoredOwnerships();
  const token = customToken || booking.creatorToken || `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  ownerships[booking.id] = {
    bookingId: booking.id,
    creatorToken: token,
    userPhone: booking.userPhone || '',
    userName: booking.userName || '',
    savedAt: new Date().toISOString()
  };

  saveStoredOwnerships(ownerships);
};

/**
 * Check if current user/device is the organizer of the open match
 */
export const isMatchOrganizer = (booking: Booking): boolean => {
  if (!booking || !booking.id) return false;
  const ownerships = getStoredOwnerships();
  const record = ownerships[booking.id];

  if (!record) return false;

  // Verify token if booking has creatorToken
  if (booking.creatorToken && record.creatorToken) {
    return booking.creatorToken === record.creatorToken;
  }

  // Fallback verify by phone
  const cleanRecordPhone = cleanPhone(record.userPhone);
  const cleanBookingPhone = cleanPhone(booking.userPhone);
  if (cleanRecordPhone && cleanBookingPhone) {
    return cleanBookingPhone.endsWith(cleanRecordPhone.slice(-8)) || cleanRecordPhone.endsWith(cleanBookingPhone.slice(-8));
  }

  return true;
};

/**
 * Retrieve creator token for an open match
 */
export const getOrganizerToken = (bookingId: string): string | null => {
  const ownerships = getStoredOwnerships();
  return ownerships[bookingId]?.creatorToken || null;
};

/**
 * Allow a user to verify and claim ownership on another device or tab
 * by matching the WhatsApp / phone number or secret token
 */
export const claimMatchOwnership = (booking: Booking, inputPhoneOrCode: string): boolean => {
  if (!booking || !inputPhoneOrCode) return false;

  const trimmed = inputPhoneOrCode.trim();
  const cleanInput = cleanPhone(trimmed);
  const cleanBooking = cleanPhone(booking.userPhone);

  const matchesPhone = cleanInput.length >= 7 && cleanBooking.length >= 7 && (
    cleanBooking.endsWith(cleanInput.slice(-8)) || cleanInput.endsWith(cleanBooking.slice(-8))
  );

  const matchesToken = booking.creatorToken && (booking.creatorToken === trimmed);

  if (matchesPhone || matchesToken) {
    saveMatchOwnership(booking, matchesToken ? trimmed : booking.creatorToken);
    return true;
  }

  return false;
};
