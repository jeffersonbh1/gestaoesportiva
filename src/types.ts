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
  isContractor?: boolean;
  isCustom?: boolean;
}

export interface BookingStudent {
  studentId: string;
  studentName: string;
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
  students?: BookingStudent[];
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
  id?: string;
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
  notes?: string;
}

export interface AwardQuestion {
  id: string;
  title: string;
  subtitle: string;
  iconName?: string;
  sport?: string;
  active: boolean;
  createdAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string; // ex: Atacante, Levantador, Defesa
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  description?: string;
  members: TeamMember[];
  createdAt?: string;
}

export interface Torcedor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  favoriteTeam?: string;
  bookingId?: string;
  createdAt?: string;
}

export interface AvaliacaoJogo {
  id: string;
  bookingId: string;
  voterType: 'jogador' | 'torcedor';
  jogadorId?: string;
  torcedorId?: string;
  evaluatorName?: string;
  perguntaId?: string;
  ratedPlayerName?: string;
  rating: number;
  notes?: string;
  createdAt?: string;
}

// ================= Bar Module Types =================
export type BarCategory = 'Bebidas' | 'Petiscos' | 'Espetinhos' | 'Sanduíches' | 'Outros';

export interface BarProduct {
  id: string;
  name: string;
  category: BarCategory | string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: 'un' | 'porção' | 'kg' | string;
  description?: string;
  active: boolean;
  imageUrl?: string;
}

export interface BarSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt?: string;
}

export interface BarComandaItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: string;
}

export interface BarComanda {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  location?: string; // ex: 'Mesa 04', 'Quadra 1', 'Balcão'
  items: BarComandaItem[];
  status: 'Aberta' | 'Fechada' | 'Cancelada';
  openedAt: string;
  closedAt?: string;
  date: string; // YYYY-MM-DD
  discount: number;
  totalAmount: number;
  finalAmount: number;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  origemVenda?: 'comanda' | 'balcão';
}

export interface BarSale {
  id: string;
  code: string;
  comandaId?: string;
  customerName?: string;
  customerPhone?: string;
  location?: string; // ex: 'Quadra 1', 'Mesa 2', 'Balcão'
  items: BarSaleItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod | 'Fiado / Comanda';
  paymentStatus: PaymentStatus;
  status: 'Concluída' | 'Cancelada';
  createdAt: string; // ISO or formatted date
  date: string; // YYYY-MM-DD
  notes?: string;
  origemVenda?: 'comanda' | 'balcão';
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'Entrada' | 'Saída (Venda)' | 'Ajuste / Perda' | 'Cancelamento Venda';
  quantity: number;
  reason: string;
  createdAt: string;
  user?: string;
}

