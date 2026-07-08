import { Booking } from './types';

// Format currency to BRL
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Format phone number
export const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15);
};

// Check if two time ranges overlap (e.g., "08:00"-"09:30" and "09:00"-"10:00")
export const isTimeOverlapping = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const [h1Start, m1Start] = start1.split(':').map(Number);
  const [h1End, m1End] = end1.split(':').map(Number);
  const [h2Start, m2Start] = start2.split(':').map(Number);
  const [h2End, m2End] = end2.split(':').map(Number);

  const t1Start = h1Start * 60 + m1Start;
  const t1End = h1End * 60 + m1End;
  const t2Start = h2Start * 60 + m2Start;
  const t2End = h2End * 60 + m2End;

  return t1Start < t2End && t2Start < t1End;
};

// Check if a court is occupied at a specific date and time slot
export const getBookingOverlap = (
  bookings: Booking[],
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Booking | null => {
  const filtered = bookings.filter(
    (b) => b.courtId === courtId && b.date === date && b.id !== excludeBookingId
  );
  
  for (const b of filtered) {
    if (isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)) {
      return b;
    }
  }
  return null;
};

// Generate list of hourly intervals from 07:00 to 22:00
export const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

// Helper to get time in minutes for visual offsets
export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};
