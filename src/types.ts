export type CourtType = 'Areia' | 'Poliesportiva' | 'Saibro' | 'Coberta' | string;
export type CourtStatus = 'Disponível' | 'Ocupada' | 'Manutenção';
export type PaymentStatus = 'Pago' | 'Pendente' | 'Reembolsado';
export type PaymentMethod = 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro';
export type SportType = 'Vôlei de Areia' | 'Futevôlei' | 'Vôlei de Quadra' | 'Beach Tennis' | string;
export type BookingType = 'Aluguel' | 'Day-use' | 'Aula de futevôlei' | 'Aula de beach tennis' | 'Eventos' | string;
export type UserRole = 'Administrador' | 'Usuário';

export interface Sport {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface CourtTypeItem {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
}

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  status: CourtStatus;
  pricePerHour: number;
  description?: string;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  hasPaid: boolean;
  amount: number;
}

export interface Booking {
  id: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  sport: SportType;
  bookingType?: BookingType;
  teacherId?: string;
  teacherName?: string;
  studentId?: string;
  studentName?: string;
  totalValue: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  players?: Player[];
}

export interface DailyTimelineSlot {
  time: string; // HH:MM
  booking?: Booking;
  isAvailable: boolean;
}

export interface PlayerRating {
  id: string;
  bookingId: string;
  evaluatorName: string;
  ratedPlayerName: string;
  rating: number; // 1 to 5 stars
  createdAt?: string;
}

export interface RentalType {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  sport: string;
  email?: string;
  pricePerClass?: number;
  status: 'Ativo' | 'Inativo';
  notes?: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  sport: string;
  teacherId?: string;
  teacherName?: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  status: 'Ativo' | 'Inativo';
  monthlyFee?: number;
}

