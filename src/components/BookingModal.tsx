import React, { useState, useEffect } from 'react';
import { Court, Booking, Player, SportType, BookingType, PaymentStatus, PaymentMethod, RentalType } from '../types';
import { INITIAL_RENTAL_TYPES } from '../data/mockData';
import { TIME_SLOTS, formatCurrency, getBookingOverlap, formatPhoneNumber, timeToMinutes } from '../utils';
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
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  bookings: Booking[];
  rentalTypes?: RentalType[];
  selectedDate: string;
  presetCourtId?: string;
  presetStartTime?: string;
  editingBooking?: Booking; // If provided, edit mode
  onSaveBooking: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  isAdmin?: boolean;
}

export default function BookingModal({
  isOpen,
  onClose,
  courts,
  bookings,
  rentalTypes = INITIAL_RENTAL_TYPES,
  selectedDate,
  presetCourtId,
  presetStartTime,
  editingBooking,
  onSaveBooking,
  onDeleteBooking,
  isAdmin = true
}: BookingModalProps) {
  
  // Fields state
  const [courtId, setCourtId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [sport, setSport] = useState<SportType>('Vôlei de Areia');
  const [bookingType, setBookingType] = useState<BookingType>('Aluguel');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pendente');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [notes, setNotes] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  
  // Real-time calculated price
  const [totalValue, setTotalValue] = useState(0);
  const [isCustomPrice, setIsCustomPrice] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  // Safe delete state instead of native confirm()
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        setBookingType(editingBooking.bookingType || 'Aluguel');
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
        
        setSport('Vôlei de Areia');
        setBookingType('Aluguel');
        setPaymentStatus('Pendente');
        setPaymentMethod('Pix');
        setNotes('');
        setPlayers([]);
        setIsCustomPrice(false);
      }
    }
  }, [isOpen, editingBooking, presetCourtId, presetStartTime, selectedDate, courts]);

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

  }, [courtId, date, startTime, endTime, bookings, courts, editingBooking, isCustomPrice, bookingType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overlapWarning) return;
    const finalCustomerName = customerName.trim() || (bookingType === 'Manutenção' ? 'Manutenção da Quadra' : '');
    const finalCustomerPhone = customerPhone.trim() || (bookingType === 'Manutenção' ? '-' : '');
    if (!finalCustomerName) return;

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={bookingType === 'Manutenção' ? "Motivo ou Descrição da Manutenção" : "Nome do Cliente"}
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
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name} ({court.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <BookmarkCheck className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value as SportType)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="Vôlei de Areia">🏐 Vôlei de Areia</option>
                  <option value="Futevôlei">⚽ Futevôlei</option>
                  <option value="Beach Tennis">🎾 Beach Tennis</option>
                  <option value="Vôlei de Quadra">👟 Vôlei de Quadra</option>
                </select>
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as BookingType)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-700 cursor-pointer"
                >
                  {rentalTypes.map((rt) => (
                    <option key={rt.id} value={rt.name}>
                      📌 {rt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalValue}
                  onChange={(e) => {
                    setTotalValue(Math.max(0, Number(e.target.value)));
                    setIsCustomPrice(true);
                  }}
                  className="w-28 text-right text-base font-black text-slate-900 bg-white border border-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs font-mono"
                  placeholder="0.00"
                  title="Valor do aluguel (clique para editar)"
                />
              </div>
            </div>
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
          <div className="p-6 pt-3 border-t border-slate-100 flex justify-between items-center gap-3 shrink-0 bg-slate-50/50">
            {editingBooking && onDeleteBooking && isAdmin ? (
              <div>
                {confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteBooking(editingBooking.id);
                      onClose();
                    }}
                    className="px-3 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Confirmar Exclusão
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
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
