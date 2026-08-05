import { Court, Booking, RentalType, Teacher, Student } from '../types';

export const INITIAL_COURTS: Court[] = [
  {
    id: 'court-1',
    name: 'Arena Areia 1 - Copacabana',
    type: 'Areia',
    status: 'Disponível',
    pricePerHour: 90,
    description: 'Quadra de areia fina premium, ideal para vôlei de praia e futevôlei.',
  },
  {
    id: 'court-2',
    name: 'Arena Areia 2 - Ipanema',
    type: 'Areia',
    status: 'Disponível',
    pricePerHour: 90,
    description: 'Iluminação de LED de alta performance e sistema de drenagem avançado.',
  },
  {
    id: 'court-3',
    name: 'Quadra Central - Coberta',
    type: 'Coberta',
    status: 'Disponível',
    pricePerHour: 120,
    description: 'Piso de madeira amortecido e cobertura termoacústica.',
  },
  {
    id: 'court-4',
    name: 'Quadra 4 - Poliesportiva',
    type: 'Poliesportiva',
    status: 'Disponível',
    pricePerHour: 100,
    description: 'Quadra rápida multiuso perfeita para vôlei de quadra tradicional.',
  }
];

// Helper to get formatted dates relative to today
const getRelativeDate = (offsetDays: number): string => {
  const date = new Date('2026-07-07T12:00:00'); // Use standard baseline from context
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export const getInitialBookings = (): Booking[] => {
  const today = getRelativeDate(0);
  const yesterday = getRelativeDate(-1);
  const tomorrow = getRelativeDate(1);

  return [
    {
      id: 'book-1',
      courtId: 'court-1',
      customerName: 'Rodrigo Silva',
      customerPhone: '(11) 98765-4321',
      date: today,
      startTime: '08:00',
      endTime: '09:30',
      sport: 'Vôlei de Areia',
      totalValue: 135,
      paymentStatus: 'Pago',
      paymentMethod: 'Pix',
      notes: 'Mensalistas, trazer bola reserva.',
      createdAt: new Date('2026-07-06T15:00:00').toISOString(),
      players: [
        {
          id: 'mock-p1',
          name: 'Matheus Santos',
          email: 'matheus@gmail.com',
          phone: '(11) 98222-3333',
          hasPaid: true,
          amount: 45
        },
        {
          id: 'mock-p2',
          name: 'Pedro Ramos',
          email: 'pedro@gmail.com',
          phone: '(11) 98333-4444',
          hasPaid: true,
          amount: 45
        }
      ]
    },
    {
      id: 'book-2',
      courtId: 'court-1',
      customerName: 'Mariana Costa',
      customerPhone: '(21) 99123-4567',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      sport: 'Beach Tennis',
      totalValue: 90,
      paymentStatus: 'Pago',
      paymentMethod: 'Cartão de Crédito',
      notes: 'Aluguel de raquetes incluso.',
      createdAt: new Date('2026-07-06T17:30:00').toISOString(),
    },
    {
      id: 'book-3',
      courtId: 'court-2',
      customerName: 'Lucas Oliveira',
      customerPhone: '(31) 99888-7766',
      date: today,
      startTime: '09:00',
      endTime: '11:00',
      sport: 'Futevôlei',
      totalValue: 180,
      paymentStatus: 'Pendente',
      paymentMethod: 'Pix',
      notes: 'Solicitou rede regulada para futevôlei.',
      createdAt: new Date('2026-07-07T08:15:00').toISOString(),
      players: [
        {
          id: 'mock-p3',
          name: 'Thiago Pereira',
          email: 'thiago@gmail.com',
          phone: '(31) 98888-1111',
          hasPaid: true,
          amount: 45
        },
        {
          id: 'mock-p4',
          name: 'Bruno Matos',
          email: 'bruno@gmail.com',
          phone: '(31) 98888-2222',
          hasPaid: false,
          amount: 45
        },
        {
          id: 'mock-p5',
          name: 'Diego Souza',
          email: 'diego@gmail.com',
          phone: '(31) 98888-3333',
          hasPaid: false,
          amount: 45
        }
      ]
    },
    {
      id: 'book-4',
      courtId: 'court-3',
      customerName: 'Ana Julia Souza',
      customerPhone: '(11) 97777-1122',
      date: today,
      startTime: '18:00',
      endTime: '20:00',
      sport: 'Vôlei de Quadra',
      totalValue: 240,
      paymentStatus: 'Pago',
      paymentMethod: 'Pix',
      notes: 'Grupo de vôlei do bairro.',
      createdAt: new Date('2026-07-05T10:00:00').toISOString(),
    },
    {
      id: 'book-5',
      courtId: 'court-4',
      customerName: 'Carlos Eduardo',
      customerPhone: '(19) 98111-2233',
      date: today,
      startTime: '14:00',
      endTime: '15:30',
      sport: 'Vôlei de Quadra',
      totalValue: 150,
      paymentStatus: 'Pendente',
      paymentMethod: 'Dinheiro',
      notes: 'Vai pagar na recepção ao chegar.',
      createdAt: new Date('2026-07-07T09:00:00').toISOString(),
    },
    // Past Booking (Yesterday)
    {
      id: 'book-6',
      courtId: 'court-1',
      customerName: 'Fernanda Lima',
      customerPhone: '(11) 99345-6789',
      date: yesterday,
      startTime: '17:00',
      endTime: '18:30',
      sport: 'Vôlei de Areia',
      totalValue: 135,
      paymentStatus: 'Pago',
      paymentMethod: 'Cartão de Débito',
      createdAt: new Date('2026-07-05T14:20:00').toISOString(),
    },
    // Future Booking (Tomorrow)
    {
      id: 'book-7',
      courtId: 'court-2',
      customerName: 'Gabriel Santos',
      customerPhone: '(21) 98877-6655',
      date: tomorrow,
      startTime: '08:00',
      endTime: '09:00',
      sport: 'Beach Tennis',
      totalValue: 90,
      paymentStatus: 'Pendente',
      paymentMethod: 'Pix',
      notes: 'Aniversariante do dia.',
      createdAt: new Date('2026-07-07T11:00:00').toISOString(),
    }
  ];
};

export const INITIAL_RENTAL_TYPES: RentalType[] = [
  { id: 'rental-1', name: 'Aluguel', description: 'Locação avulsa ou horista da quadra', isDefault: true },
  { id: 'rental-2', name: 'Day-use', description: 'Uso liberado durante todo o período de funcionamento', isDefault: true },
  { id: 'rental-3', name: 'Aula de futevôlei', description: 'Aula com professor especializado na modalidade futevôlei', isDefault: true },
  { id: 'rental-4', name: 'Aula de beach tennis', description: 'Aula com professor especializado em beach tennis', isDefault: true },
  { id: 'rental-5', name: 'Eventos', description: 'Reserva para eventos, torneios ou aniversários', isDefault: true },
  { id: 'rental-6', name: 'Manutenção', description: 'Bloqueio de horário para manutenção ou limpeza da quadra', isDefault: true }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'teacher-1',
    name: 'Prof. Lucas Mendes',
    phone: '(11) 99876-5432',
    sport: 'Futevôlei',
    email: 'lucas.mendes@arena.com',
    pricePerClass: 120,
    status: 'Ativo',
    notes: 'Especialista em treino funcional de areia e técnica de futevôlei'
  },
  {
    id: 'teacher-2',
    name: 'Profa. Carolina Silva',
    phone: '(11) 98765-4321',
    sport: 'Beach Tennis',
    email: 'carolina.silva@arena.com',
    pricePerClass: 110,
    status: 'Ativo',
    notes: 'Ex-atleta profissional de Beach Tennis'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-1',
    name: 'Gabriel Santos',
    phone: '(11) 97777-1111',
    sport: 'Futevôlei',
    teacherId: 'teacher-1',
    teacherName: 'Prof. Lucas Mendes',
    level: 'Intermediário',
    status: 'Ativo',
    monthlyFee: 240
  },
  {
    id: 'student-2',
    name: 'Mariana Costa',
    phone: '(11) 96666-2222',
    sport: 'Beach Tennis',
    teacherId: 'teacher-2',
    teacherName: 'Profa. Carolina Silva',
    level: 'Iniciante',
    status: 'Ativo',
    monthlyFee: 220
  }
];
