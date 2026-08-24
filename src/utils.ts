import { Booking } from './types';

// Timezone constant for Brasil / Brasilia
export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

// Get current date string 'YYYY-MM-DD' in Brasilia timezone (UTC-3)
export const getBrasiliaTodayDate = (): string => {
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Fallback
  }

  // Fallback: calculate Brasilia local date (UTC-3) from current UTC timestamp
  const now = new Date();
  const brasiliaMs = now.getTime() - (3 * 60 * 60 * 1000);
  const bDate = new Date(brasiliaMs);
  const year = bDate.getUTCFullYear();
  const month = String(bDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(bDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get current hour (0-23) in Brasilia timezone
export const getBrasiliaCurrentHour = (): number => {
  try {
    const hourStr = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      hour: '2-digit',
      hour12: false
    }).format(new Date());
    const parsed = parseInt(hourStr, 10);
    if (!isNaN(parsed)) return parsed;
  } catch (e) {
    // Fallback
  }

  const now = new Date();
  const brasiliaMs = now.getTime() - (3 * 60 * 60 * 1000);
  const bDate = new Date(brasiliaMs);
  return bDate.getUTCHours();
};

// Shift a date string 'YYYY-MM-DD' by offsetDays safely without timezone skew
export const shiftDateString = (dateStr: string, offsetDays: number): string => {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  utcDate.setUTCDate(utcDate.getUTCDate() + offsetDays);
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format currency to BRL
export const formatCurrency = (value: number | string | null | undefined): string => {
  const num = typeof value === 'number' ? value : Number(value);
  const safeNum = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeNum);
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

// Calculate weekly recurring dates for a 30-day period starting from startDateStr
export const getMensalistaDates = (startDateStr: string): string[] => {
  if (!startDateStr) return [];
  const dates: string[] = [];
  const [y, m, d] = startDateStr.split('-').map(Number);
  const startDate = new Date(y, m - 1, d);

  for (let i = 0; ; i += 7) {
    if (i > 30) break;
    const nextDate = new Date(startDate.getTime());
    nextDate.setDate(startDate.getDate() + i);

    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
};
