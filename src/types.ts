export type CourtType = 'Areia' | 'Poliesportiva' | 'Saibro' | 'Coberta';
export type CourtStatus = 'Disponível' | 'Ocupada' | 'Manutenção';
export type PaymentStatus = 'Pago' | 'Pendente' | 'Reembolsado';
export type PaymentMethod = 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro';
export type SportType = 'Vôlei de Areia' | 'Futevôlei' | 'Vôlei de Quadra' | 'Beach Tennis';
export type UserRole = 'Administrador' | 'Usuário';

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
