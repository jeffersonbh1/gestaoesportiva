import React, { useState, useEffect } from 'react';
import { Court, Booking, BookingStudent, Player, SportType, BookingType, PaymentStatus, PaymentMethod, RentalType, Sport, Teacher, Student, Team } from '../types';
import { INITIAL_RENTAL_TYPES, INITIAL_SPORTS, INITIAL_TEACHERS, INITIAL_STUDENTS } from '../data/mockData';
import { TIME_SLOTS, formatCurrency, getBookingOverlap, formatPhoneNumber, timeToMinutes, getMensalistaDates } from '../utils';
import { 
  X, 
  Calendar, 
  User, 
  Phone, 
  Clock, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  Receipt,
  FileText,
  BookmarkCheck,
  Smartphone,
  Trash2,
  Wrench,
  GraduationCap,
  UserCheck,
  Plus,
  Users,
  Shield,
  Share2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  bookings: Booking[];
  rentalTypes?: RentalType[];
  sports?: Sport[];
  teachers?: Teacher[];
  students?: Student[];
  teams?: Team[];
  selectedDate: string;
  presetCourtId?: string;
  presetStartTime?: string;
  editingBooking?: Booking; // If provided, edit mode
  onSaveBooking: (booking: Booking | Booking[]) => void;
  onDeleteBooking?: (bookingId: string) => void;
  isAdmin?: boolean;
}

export default function BookingModal({
  isOpen,
  onClose,
  courts = [],
  bookings,
  rentalTypes = [],
  sports = [],
  teachers = [],
  students = [],
  teams: externalTeams,
  selectedDate,
  presetCourtId,
  presetStartTime,
  editingBooking,
  onSaveBooking,
  onDeleteBooking,
  isAdmin = true
}: BookingModalProps) {
  // Helper to normalize teacher/student names for matching
  const normalizePersonName = (n?: string) => {
    if (!n) return '';
    return n
      .toLowerCase()
      .replace(/^(prof\.|profa\.|professor|professora)\s+/i, '')
      .trim();
  };

  const findTeacher = (
    rawId?: string,
    rawName?: string,
    rawCustomerName?: string,
    teacherList: Teacher[] = []
  ): Teacher | undefined => {
    if (!teacherList || teacherList.length === 0) return undefined;

    // 1. Direct ID match
    if (rawId) {
      const byId = teacherList.find(t => t.id === rawId);
      if (byId) return byId;
    }

    // 2. Try match if rawId itself is a name string
    if (rawId) {
      const normRawId = normalizePersonName(rawId);
      if (normRawId) {
        const byIdName = teacherList.find(t => normalizePersonName(t.name) === normRawId);
        if (byIdName) return byIdName;
      }
    }

    // 3. Match by teacherName
    if (rawName) {
      const normName = normalizePersonName(rawName);
      if (normName) {
        const byName = teacherList.find(t => {
          const tNorm = normalizePersonName(t.name);
          return tNorm === normName || tNorm.includes(normName) || normName.includes(tNorm);
        });
        if (byName) return byName;
      }
    }

    // 4. Match by customerName
    if (rawCustomerName) {
      const normCust = normalizePersonName(rawCustomerName);
      if (normCust) {
        const byCust = teacherList.find(t => {
          const tNorm = normalizePersonName(t.name);
          return tNorm === normCust || tNorm.includes(normCust) || normCust.includes(tNorm);
        });
        if (byCust) return byCust;
      }
    }

    return undefined;
  };
  
  // Fields state
  const [courtId, setCourtId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [sport, setSport] = useState<SportType>((sports[0]?.name as SportType) || '');
  const [bookingType, setBookingType] = useState<BookingType>((rentalTypes[0]?.name as BookingType) || '');
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<BookingStudent[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pendente');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [notes, setNotes] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);

  // Real-time calculated price
  const [totalValue, setTotalValue] = useState(0);
  const [formattedValue, setFormattedValue] = useState('0,00');
  const [isCustomPrice, setIsCustomPrice] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  // Day Use specific state
  const [dayUseQuantity, setDayUseQuantity] = useState<number>(1);
  const [dayUseUnitPrice, setDayUseUnitPrice] = useState<number>(0);

  const handleDayUseQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const qty = isNaN(val) ? 0 : Math.max(0, val);
    setDayUseQuantity(qty);
    const newTotal = qty * dayUseUnitPrice;
    setTotalValue(newTotal);
    setIsCustomPrice(true);
  };

  const handleDayUseUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, '');
    if (!digits) {
      setDayUseUnitPrice(0);
      setTotalValue(0);
      setIsCustomPrice(true);
      return;
    }
    const numeric = parseFloat(digits) / 100;
    setDayUseUnitPrice(numeric);
    const newTotal = dayUseQuantity * numeric;
    setTotalValue(newTotal);
    setIsCustomPrice(true);
  };

  // Keep formattedValue in sync with totalValue
  useEffect(() => {
    setFormattedValue(totalValue.toFixed(2).replace('.', ','));
  }, [totalValue]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, '');
    if (!digits) {
      setFormattedValue('0,00');
      setTotalValue(0);
      setIsCustomPrice(true);
      return;
    }
    const numeric = parseFloat(digits) / 100;
    setFormattedValue(numeric.toFixed(2).replace('.', ','));
    setTotalValue(numeric);
    setIsCustomPrice(true);
  };

  // Safe delete state instead of native confirm()
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Teams list
  const [allTeams, setAllTeams] = useState<Team[]>(externalTeams || []);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  useEffect(() => {
    if (externalTeams && externalTeams.length > 0) {
      setAllTeams(externalTeams);
    } else {
      const saved = localStorage.getItem('arena_teams_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setAllTeams(parsed);
        } catch (_) {}
      }
    }
  }, [externalTeams, isOpen]);

  const handleSelectTeam = (teamIdVal: string) => {
    setSelectedTeamId(teamIdVal);
    if (!teamIdVal) return;

    const team = allTeams.find(t => t.id === teamIdVal);
    if (team) {
      setCustomerName(team.name);
      if (team.sport) {
        setSport(team.sport as SportType);
      }
      if (team.members && team.members.length > 0) {
        const teamPlayers: Player[] = team.members.map((m, idx) => ({
          id: `pl-team-${Date.now()}-${idx}`,
          name: m.name,
          email: m.email,
          phone: m.phone,
          hasPaid: false,
          amount: 0
        }));
        setPlayers(teamPlayers);
        if (team.members[0]?.phone) {
          setCustomerPhone(team.members[0].phone);
        }
      }
    }
  };

  // Initialize fields on mount or change
  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      if (editingBooking) {
        setCourtId(editingBooking.courtId);
        setCustomerName(editingBooking.customerName);
        setCustomerPhone(editingBooking.customerPhone);
        setDate(editingBooking.date);
        setStartTime(editingBooking.startTime);
        setEndTime(editingBooking.endTime);
        setSport(editingBooking.sport);
        const editingType = editingBooking.bookingType || 'Aluguel';
        setBookingType(editingType);
        if (editingType.toLowerCase().includes('day use')) {
          setDayUseQuantity(1);
          setDayUseUnitPrice(editingBooking.totalValue ?? 0);
        } else {
          setDayUseQuantity(1);
          setDayUseUnitPrice(0);
        }
        
        const matchedT = findTeacher(
          editingBooking.teacherId,
          editingBooking.teacherName,
          editingBooking.customerName,
          teachers
        );
        const resolvedTeacherId = matchedT ? matchedT.id : (editingBooking.teacherId || '');
        const resolvedTeacherName = matchedT ? matchedT.name : (editingBooking.teacherName || editingBooking.customerName || '');

        setTeacherId(resolvedTeacherId);
        setTeacherName(resolvedTeacherName);
        setStudentId(editingBooking.studentId || '');
        setStudentName(editingBooking.studentName || '');
        
        if (editingBooking.students && editingBooking.students.length > 0) {
          setSelectedStudents(editingBooking.students);
        } else if (editingBooking.studentId || editingBooking.studentName) {
          setSelectedStudents([{
            studentId: editingBooking.studentId || `st-${Date.now()}`,
            studentName: editingBooking.studentName || 'Aluno'
          }]);
        } else {
          setSelectedStudents([]);
        }

        setPaymentStatus(editingBooking.paymentStatus);
        setPaymentMethod(editingBooking.paymentMethod);
        setNotes(editingBooking.notes || '');
        setPlayers(editingBooking.players || []);
        setTotalValue(editingBooking.totalValue ?? 0);
        setIsCustomPrice(true);
      } else {
        setCourtId(presetCourtId || courts[0]?.id || '');
        setCustomerName('');
        setCustomerPhone('');
        setDate(selectedDate);
        setStartTime(presetStartTime || '08:00');
        
        // Default end time to 1 hour after start
        const nextHourNum = parseInt((presetStartTime || '08:00').split(':')[0]) + 1;
        const nextHourStr = `${nextHourNum.toString().padStart(2, '0')}:00`;
        setEndTime(nextHourStr);
        
        setSport((sports[0]?.name as SportType) || '');
        const initType = (rentalTypes[0]?.name as BookingType) || '';
        setBookingType(initType);
        if (initType.toLowerCase().includes('day use')) {
          const initPrice = courts[0]?.pricePerHour || 30;
          setDayUseQuantity(1);
          setDayUseUnitPrice(initPrice);
          setTotalValue(initPrice);
          setIsCustomPrice(true);
        } else {
          setDayUseQuantity(1);
          setDayUseUnitPrice(0);
        }
        setTeacherId('');
        setTeacherName('');
        setStudentId('');
        setStudentName('');
        setSelectedStudents([]);
        setPaymentStatus('Pendente');
        setPaymentMethod('Pix');
        setNotes('');
        setPlayers([]);
        setIsCustomPrice(false);
      }
    }
  }, [isOpen, editingBooking, presetCourtId, presetStartTime, selectedDate, courts]);

  // Re-resolve teacher if teachers array updates or modal opens
  useEffect(() => {
    if (isOpen && (editingBooking || teacherId || teacherName)) {
      const matched = findTeacher(
        teacherId || editingBooking?.teacherId,
        teacherName || editingBooking?.teacherName,
        customerName || editingBooking?.customerName,
        teachers
      );
      if (matched && matched.id !== teacherId) {
        setTeacherId(matched.id);
        setTeacherName(matched.name);
      }
    }
  }, [teachers, isOpen]);

  const handleAddSelectedStudent = (studentIdVal: string) => {
    if (!studentIdVal) return;
    const found = students.find(s => s.id === studentIdVal);
    const name = found ? found.name : studentIdVal;
    if (!selectedStudents.some(s => s.studentId === studentIdVal || s.studentName === name)) {
      setSelectedStudents(prev => [...prev, { studentId: studentIdVal, studentName: name }]);
    }
  };

  const handleRemoveStudent = (index: number) => {
    setSelectedStudents(prev => prev.filter((_, i) => i !== index));
  };

  // Handle auto-updating calculated value & overlap checks
  useEffect(() => {
    const selectedCourt = courts.find(c => c.id === courtId);
    if (!selectedCourt) return;

    // Calculate duration in hours
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const diffHours = (endMin - startMin) / 60;

    if (!isCustomPrice) {
      if (bookingType === 'Manutenção') {
        setTotalValue(0);
      } else if (diffHours > 0) {
        setTotalValue(diffHours * selectedCourt.pricePerHour);
      } else {
        setTotalValue(0);
      }
    }

    // Overlap checks
    if (startMin >= endMin) {
      setOverlapWarning('Horário de início deve ser anterior ao horário de fim.');
      return;
    }

    const isMensalista = (bookingType || '').toLowerCase().includes('mensalista');

    if (isMensalista) {
      const dates = getMensalistaDates(date);
      let conflictFound: { date: string; overlap: Booking } | null = null;

      for (const d of dates) {
        const overlap = getBookingOverlap(
          bookings,
          courtId,
          d,
          startTime,
          endTime,
          editingBooking?.id
        );
        if (overlap) {
          conflictFound = { date: d, overlap };
          break;
        }
      }

      if (conflictFound) {
        const [cy, cm, cd] = conflictFound.date.split('-');
        const formattedDate = `${cd}/${cm}/${cy}`;
        setOverlapWarning(
          `Indisponível para Mensalista! Conflito no dia ${formattedDate} (${conflictFound.overlap.startTime} - ${conflictFound.overlap.endTime}) com ${conflictFound.overlap.customerName}. Nenhum agendamento será registrado.`
        );
      } else {
        setOverlapWarning(null);
      }
    } else {
      const overlap = getBookingOverlap(
        bookings,
        courtId,
        date,
        startTime,
        endTime,
        editingBooking?.id
      );

      if (overlap) {
        setOverlapWarning(`Indisponível! Conflito com agendamento de ${overlap.customerName} (${overlap.startTime} - ${overlap.endTime})`);
      } else {
        setOverlapWarning(null);
      }
    }

  }, [courtId, date, startTime, endTime, bookings, courts, editingBooking, isCustomPrice, bookingType]);

  const isClassBooking = (bookingType || '').toLowerCase().includes('aula');
  const isDayUse = (bookingType || '').toLowerCase().includes('day use');
  const isMensalista = (bookingType || '').toLowerCase().includes('mensalista');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overlapWarning) return;
    
    let finalCustomerName = customerName.trim();
    if (isClassBooking) {
      finalCustomerName = teacherName.trim() || customerName.trim() || 'Prof. da Aula';
    } else if (!finalCustomerName) {
      if (bookingType === 'Manutenção') {
        finalCustomerName = 'Manutenção da Quadra';
      }
    }
    const finalCustomerPhone = customerPhone.trim() || (bookingType === 'Manutenção' || isClassBooking ? '-' : '');
    if (!finalCustomerName) return;

    if (isMensalista) {
      const dates = getMensalistaDates(date);

      // Strict check: Verify NO conflict exists on ANY date in the 30-day period
      let conflictFound: { date: string; overlap: Booking } | null = null;
      for (const d of dates) {
        const overlap = getBookingOverlap(
          bookings,
          courtId,
          d,
          startTime,
          endTime,
          editingBooking?.id
        );
        if (overlap) {
          conflictFound = { date: d, overlap };
          break;
        }
      }

      if (conflictFound) {
        const [cy, cm, cd] = conflictFound.date.split('-');
        const formattedDate = `${cd}/${cm}/${cy}`;
        setOverlapWarning(
          `Já existe outro agendamento registrado no período! Conflito no dia ${formattedDate} (${conflictFound.overlap.startTime} - ${conflictFound.overlap.endTime}) com ${conflictFound.overlap.customerName}. O agendamento mensalista foi cancelado.`
        );
        return; // STOP! Cancel entire process!
      }

      // No conflict found! Register all bookings in the 30-day period
      const now = Date.now();
      const savedBookings: Booking[] = dates.map((d, index) => ({
        id: (editingBooking && index === 0) ? editingBooking.id : `book-${now}-${index}`,
        courtId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        date: d,
        startTime,
        endTime,
        sport,
        bookingType,
        teacherId: teacherId || undefined,
        teacherName: teacherName || undefined,
        students: selectedStudents.length > 0 ? selectedStudents : (isClassBooking ? selectedStudents : undefined),
        studentId: selectedStudents[0]?.studentId || studentId || undefined,
        studentName: selectedStudents[0]?.studentName || studentName || undefined,
        totalValue,
        paymentStatus,
        paymentMethod,
        notes: notes.trim() ? `${notes.trim()} (Mensalista ${index + 1}/${dates.length})` : undefined,
        createdAt: editingBooking?.createdAt || new Date().toISOString(),
        players
      }));

      onSaveBooking(savedBookings);
      onClose();
      return;
    }

    const saved: Booking = {
      id: editingBooking?.id || `book-${Date.now()}`,
      courtId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      date,
      startTime,
      endTime,
      sport,
      bookingType,
      teacherId: teacherId || undefined,
      teacherName: teacherName || undefined,
      students: selectedStudents.length > 0 ? selectedStudents : (isClassBooking ? selectedStudents : undefined),
      studentId: selectedStudents[0]?.studentId || studentId || undefined,
      studentName: selectedStudents[0]?.studentName || studentName || undefined,
      totalValue,
      paymentStatus,
      paymentMethod,
      notes: notes.trim() || undefined,
      createdAt: editingBooking?.createdAt || new Date().toISOString(),
      players
    };

    onSaveBooking(saved);
    onClose();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(formatPhoneNumber(e.target.value));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 tracking-tight">
              <Receipt className="h-5 w-5 text-blue-500" />
              {editingBooking ? 'Editar Agendamento' : 'Novo Agendamento Online'}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Insira as informações do cliente e o horário do jogo
            </p>
          </div>
          <button 
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 text-slate-500 cursor-pointer"
            title="Fechar Tela"
          >
            <X className="h-4 w-4" />
            <span>Fechar</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* Scrollable Form Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Customer Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Informações do Cliente</span>
              <button
                type="button"
                onClick={() => {
                  if (bookingType === 'Manutenção') {
                    setBookingType('Aluguel');
                    setCustomerName('');
                    setCustomerPhone('');
                    setIsCustomPrice(false);
                  } else {
                    setBookingType('Manutenção');
                    setCustomerName('Manutenção da Quadra');
                    setCustomerPhone('-');
                    setTotalValue(0);
                    setIsCustomPrice(true);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  bookingType === 'Manutenção'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
                title="Marcar este horário como manutenção ou bloqueio da quadra"
              >
                <Wrench className="h-3.5 w-3.5" />
                {bookingType === 'Manutenção' ? '✔ Horário em Manutenção' : 'Marcar como Manutenção'}
              </button>
            </div>

            {/* Quick Team Link Selector */}
            {bookingType !== 'Manutenção' && allTeams.length > 0 && (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => handleSelectTeam(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="">🏆 Vincular Time / Equipe Cadastrada (Opcional)...</option>
                    {allTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        🏆 {t.name} ({t.sport} - {t.members?.length || 0} atletas)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={bookingType === 'Manutenção' ? "Motivo ou Descrição da Manutenção" : "Nome do Cliente / Time"}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800"
                  required={bookingType !== 'Manutenção'}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Telefone (opcional)"
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Court, Sport & Booking Type Selection */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quadra, Esporte & Tipo</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-700 cursor-pointer"
                >
                  {courts.length === 0 ? (
                    <option value="">-- Nenhuma Quadra Cadastrada --</option>
                  ) : (
                    courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} ({court.type})
                      </option>
                    ))
                  )}
                  {courtId && !courts.some(c => c.id === courtId) && (
                    <option value={courtId}>
                      {editingBooking?.courtId === courtId ? 'Quadra do agendamento' : courtId}
                    </option>
                  )}
                </select>
              </div>
              <div className="relative">
                <BookmarkCheck className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value as SportType)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-700 cursor-pointer"
                >
                  {sports.length === 0 ? (
                    <option value="">-- Nenhum Esporte Cadastrado --</option>
                  ) : (
                    sports.map((s) => (
                      <option key={s.id} value={s.name}>
                        🏆 {s.name}
                      </option>
                    ))
                  )}
                  {sport && !sports.some(s => s.name === sport) && (
                    <option value={sport}>
                      🏆 {sport}
                    </option>
                  )}
                </select>
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={bookingType}
                  onChange={(e) => {
                    const newType = e.target.value as BookingType;
                    setBookingType(newType);
                    if (newType.toLowerCase().includes('day use')) {
                      const defaultUnit = totalValue > 0 ? totalValue : (courts.find(c => c.id === courtId)?.pricePerHour || 30);
                      const qty = dayUseQuantity || 1;
                      setDayUseQuantity(qty);
                      setDayUseUnitPrice(defaultUnit);
                      setTotalValue(qty * defaultUnit);
                      setIsCustomPrice(true);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-700 cursor-pointer"
                >
                  {rentalTypes.length === 0 ? (
                    <option value="">-- Nenhum Tipo Cadastrado --</option>
                  ) : (
                    rentalTypes.map((rt) => (
                      <option key={rt.id} value={rt.name}>
                        📌 {rt.name}
                      </option>
                    ))
                  )}
                  {bookingType && !rentalTypes.some(rt => rt.name === bookingType) && (
                    <option value={bookingType}>
                      📌 {bookingType}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Professor & Alunos Section (Enabled when bookingType contains Aula) */}
          {isClassBooking && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span>Vínculo de Aula (Professor & Alunos)</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  {selectedStudents.length} Aluno(s) nesta aula
                </span>
              </div>

              {/* Professor Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  Professor Responsável *
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => {
                    const idVal = e.target.value;
                    setTeacherId(idVal);
                    const found = teachers.find(t => t.id === idVal);
                    const tName = found ? found.name : idVal;
                    setTeacherName(tName);
                    setCustomerName(tName);
                    if (found?.phone) setCustomerPhone(found.phone);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Selecione o Professor --</option>
                  {Array.from(new Map(teachers.map((t) => [t.name.trim().toLowerCase(), t])).values()).map((t) => (
                    <option key={t.id} value={t.id}>
                      👨‍🏫 {t.name} ({t.sport})
                    </option>
                  ))}
                  {teacherId && !teachers.some(t => t.id === teacherId) && (
                    <option value={teacherId}>
                      👨‍🏫 {teacherName || teacherId}
                    </option>
                  )}
                </select>
              </div>

              {/* Alunos Selection (Multiple Registered Students) */}
              <div className="space-y-3 pt-1 border-t border-blue-200/40">
                <label className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  Adicionar Aluno(s) Cadastrado(s) à Aula *
                </label>

                {/* Registered Student Selection */}
                <div className="flex gap-2">
                  <select
                    id="registered-student-select"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSelectedStudent(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="">+ Selecionar Aluno Cadastrado...</option>
                    {Array.from(new Map(students.map((s) => [s.name.trim().toLowerCase(), s])).values()).map((s) => (
                      <option key={s.id} value={s.id}>
                        🎓 {s.name} ({s.sport} - {s.level})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enrolled Students Badge List */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-blue-900 block mb-1.5">
                    Alunos Incluídos ({selectedStudents.length}):
                  </span>
                  {selectedStudents.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-2.5 bg-white/80 border border-blue-200/80 rounded-xl">
                      {selectedStudents.map((st, idx) => (
                        <span
                          key={st.studentId || idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs"
                        >
                          <User className="h-3 w-3 text-blue-600" />
                          {st.studentName}
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(idx)}
                            className="ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded-full transition cursor-pointer"
                            title="Remover aluno da aula"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white/60 border border-dashed border-blue-200 rounded-xl text-center">
                      <p className="text-[11px] text-slate-400 italic font-medium">
                        Nenhum aluno adicionado ainda. Selecione um aluno cadastrado na lista acima.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Date & Time Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Data & Horários</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  required
                />
              </div>

              <div className="relative">
                <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {/* Generate slots ending up to 23:30 */}
                  {TIME_SLOTS.concat(['23:00']).map((slot) => {
                    const [h] = slot.split(':');
                    const slotHalf = `${h}:30`;
                    return (
                      <React.Fragment key={slot}>
                        <option value={slot}>{slot}</option>
                        {slot !== '23:00' && <option value={slotHalf}>{slotHalf}</option>}
                      </React.Fragment>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Mensalista Recurrence Preview */}
            {isMensalista && date && (
              <div className="mt-2 p-3 bg-blue-50/90 border border-blue-200/90 rounded-xl text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
                <Calendar className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold block text-blue-950">
                    🗓️ Recorrência Mensalista (30 Dias)
                  </span>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Este agendamento será repetido semanalmente por 30 dias no mesmo horário e quadra (
                    <span className="font-bold">{getMensalistaDates(date).length} sessões</span>):
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {getMensalistaDates(date).map((d) => {
                      const [cy, cm, cd] = d.split('-');
                      return (
                        <span key={d} className="px-2 py-0.5 bg-blue-100/90 text-blue-950 rounded-md font-mono text-[10px] font-bold border border-blue-200/80 shadow-2xs">
                          {cd}/{cm}/{cy}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Faturamento e Pagamento</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Pago')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      paymentStatus === 'Pago' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Pendente')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      paymentStatus === 'Pendente' 
                        ? 'bg-blue-500 text-white shadow-xs' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Pendente
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="Pix">📱 Pix</option>
                  <option value="Cartão de Crédito">💳 Crédito</option>
                  <option value="Cartão de Débito">💳 Débito</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                </select>
              </div>
            </div>

            {/* Price Preview / Editable Rental Value */}
            {isDayUse ? (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 flex items-center gap-1.5">
                    ☀️ Day Use: Multiplicação (Qtd × Valor Unitário)
                  </span>
                  {isCustomPrice && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPrice(false);
                        const defaultUnit = courts.find(c => c.id === courtId)?.pricePerHour || 30;
                        setDayUseQuantity(1);
                        setDayUseUnitPrice(defaultUnit);
                        setTotalValue(defaultUnit);
                      }}
                      className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full font-semibold transition cursor-pointer"
                      title="Restaurar padrão da tabela da quadra"
                    >
                      Restaurar tabela
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  {/* Quantidade */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={dayUseQuantity || ''}
                      onChange={handleDayUseQuantityChange}
                      className="w-full text-center text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-mono"
                      placeholder="1"
                    />
                  </div>

                  {/* Valor Unitário */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                      Valor Unitário (R$)
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={dayUseUnitPrice.toFixed(2).replace('.', ',')}
                        onChange={handleDayUseUnitPriceChange}
                        className="w-full text-right text-sm font-black text-slate-900 bg-transparent focus:outline-none font-mono"
                        placeholder="00,00"
                      />
                    </div>
                  </div>

                  {/* Valor Total / Aluguel */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                      Valor do Aluguel
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-slate-500">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formattedValue}
                        onChange={handleCurrencyChange}
                        className="w-full text-right text-sm font-black text-slate-900 bg-transparent focus:outline-none font-mono"
                        placeholder="00,00"
                        title="Valor do aluguel (calculado automaticamente Qtd x Unitário)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Valor do Aluguel (R$):</span>
                  {isCustomPrice && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPrice(false);
                        const selectedCourt = courts.find(c => c.id === courtId);
                        const startMin = timeToMinutes(startTime);
                        const endMin = timeToMinutes(endTime);
                        const diffHours = (endMin - startMin) / 60;
                        if (selectedCourt && diffHours > 0) {
                          setTotalValue(diffHours * selectedCourt.pricePerHour);
                        } else {
                          setTotalValue(0);
                        }
                      }}
                      className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full font-semibold transition cursor-pointer"
                      title="Restaurar valor automático da tabela da quadra"
                    >
                      Restaurar tabela
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-500">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formattedValue}
                    onChange={handleCurrencyChange}
                    className="w-28 text-right text-base font-black text-slate-900 bg-white border border-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs font-mono"
                    placeholder="00,00"
                    title="Valor do aluguel (mascara 00,00)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <textarea 
              placeholder="Observações adicionais (ex: trazer bola, regulagem de rede)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-16 resize-none font-medium text-slate-800"
            />
          </div>

          {/* Overlap warnings */}
          {overlapWarning && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2.5 text-xs text-rose-800 font-medium animate-pulse">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{overlapWarning}</span>
            </div>
          )}

          </div>

          {/* Actions Footer */}
          <div className="p-6 pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 shrink-0 bg-slate-50/50">
            {editingBooking ? (
              <div className="flex items-center gap-2">
                {(() => {
                  const currentCourt = courts.find(c => c.id === courtId || c.id === editingBooking.courtId);
                  const isCourtMaintenance = currentCourt?.status === 'Manutenção';
                  const isBookingMaintenance = bookingType === 'Manutenção' || (bookingType || '').toLowerCase().includes('manutenção') || (editingBooking.bookingType || '').toLowerCase().includes('manutenção');
                  const isMaintenance = isCourtMaintenance || isBookingMaintenance;

                  return (
                    <button
                      type="button"
                      disabled={isMaintenance}
                      onClick={() => {
                        if (isMaintenance) return;
                        const origin = window.location.origin + window.location.pathname;
                        window.open(`${origin}?eval=${editingBooking.id}`, '_blank');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs ${
                        isMaintenance
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 border border-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      }`}
                      title={isMaintenance ? 'Quadra/Agendamento em manutenção - Link de avaliação indisponível' : 'Abrir página de avaliação pública do jogo'}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Link de Avaliação</span>
                    </button>
                  );
                })()}

                {onDeleteBooking && (
                  <div>
                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-700">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteBooking(editingBooking.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!!overlapWarning}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer ${
                  overlapWarning 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-100'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
