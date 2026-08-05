import React from 'react';
import { Court, Booking } from '../types';
import { TIME_SLOTS, formatCurrency, timeToMinutes } from '../utils';
import { 
  Plus, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles,
  Phone,
  User,
  Flame
} from 'lucide-react';
import { motion } from 'motion/react';

interface CourtGridProps {
  courts: Court[];
  bookings: Booking[];
  selectedDate: string;
  onSelectSlot: (courtId: string, time: string) => void;
  onViewBooking: (booking: Booking) => void;
}

export default function CourtGrid({ 
  courts, 
  bookings, 
  selectedDate, 
  onSelectSlot,
  onViewBooking 
}: CourtGridProps) {

  // Current timeline highlight helper
  const isCurrentTimeSlot = (timeStr: string): boolean => {
    const currentHour = 13; // Set to mock currentTime hour 13:54 from metadata
    const slotHour = parseInt(timeStr.split(':')[0], 10);
    return currentHour === slotHour;
  };

  // Find a booking that falls into a specific court, date, and hour slot
  const getBookingForSlot = (courtId: string, hourStr: string): Booking | undefined => {
    const slotMinutesStart = timeToMinutes(hourStr);
    const slotMinutesEnd = slotMinutesStart + 60; // 1-hour interval standard display

    return bookings.find(b => {
      if (b.courtId !== courtId || b.date !== selectedDate) return false;
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      // Check if slot overlaps with booking
      return slotMinutesStart < bEnd && bStart < slotMinutesEnd;
    });
  };

  return (
    <div id="court-grid-view" className="space-y-8">
      {/* Visual Indicator of Availability */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Status de Ocupação em Tempo Real
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Visualize a grade de horários de cada quadra. Clique em um horário vazio para criar um agendamento.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 bg-slate-100 border border-slate-300 rounded"></span>
              <span className="text-slate-600">Livre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 bg-blue-600 rounded"></span>
              <span className="text-blue-800 font-bold">Vôlei Areia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 bg-amber-500 rounded"></span>
              <span className="text-amber-900 font-bold">Futevôlei</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 bg-purple-600 rounded"></span>
              <span className="text-purple-900 font-bold">Vôlei Quadra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 bg-emerald-600 rounded"></span>
              <span className="text-emerald-900 font-bold">Beach Tennis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 bg-stone-800 border border-amber-500 rounded"></span>
              <span className="text-stone-800 font-bold">Manutenção</span>
            </div>
          </div>
        </div>
      </div>

      {/* Courts Cards with Timelines */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {courts.map((court) => {
          return (
            <motion.div 
              key={court.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                court.status === 'Manutenção' ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'
              }`}
            >
              {/* Court Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      court.type === 'Areia' ? 'bg-blue-50 text-blue-600' :
                      court.type === 'Saibro' ? 'bg-amber-50 text-amber-700' :
                      court.type === 'Coberta' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {court.type === 'Areia' ? '🌴 Areia Praia' :
                       court.type === 'Saibro' ? '🥎 Saibro' :
                       court.type === 'Coberta' ? '🏠 Coberta' : '👟 Poliesportiva'}
                    </span>
                    
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      court.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700' :
                      court.status === 'Ocupada' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {court.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-1.5 tracking-tight">
                    {court.name}
                  </h4>
                  {court.description && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">{court.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor / Hora</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(court.pricePerHour)}</span>
                </div>
              </div>

              {/* Time Table Grid */}
              <div className="p-5">
                <span className="text-xs font-bold text-slate-400 block mb-3 uppercase tracking-wider">Grade de Horários Hoje</span>
                
                {court.status === 'Manutenção' ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Quadra Temporariamente Indisponível</p>
                      <p className="text-xs text-slate-400 mt-0.5">Em manutenção periódica para melhor atendê-los.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((time) => {
                      const booking = getBookingForSlot(court.id, time);
                      const isCurrent = isCurrentTimeSlot(time);
                      
                      if (booking) {
                        // Color styles based on sport for visual appeal
                        const sportStyles: Record<string, { card: string; badge: string }> = {
                          'Vôlei de Areia': {
                            card: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700',
                            badge: 'bg-blue-950/60 text-blue-100 border border-blue-400/30'
                          },
                          'Futevôlei': {
                            card: 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600',
                            badge: 'bg-slate-950 text-amber-300'
                          },
                          'Vôlei de Quadra': {
                            card: 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-700',
                            badge: 'bg-purple-950/60 text-purple-100 border border-purple-400/30'
                          },
                          'Beach Tennis': {
                            card: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700',
                            badge: 'bg-emerald-950/60 text-emerald-100 border border-emerald-400/30'
                          },
                        };

                        const isMaintenance = booking.bookingType === 'Manutenção';
                        const activeStyle = isMaintenance ? {
                          card: 'bg-stone-800 hover:bg-stone-900 text-amber-300 border border-amber-500/40 border-dashed',
                          badge: 'bg-amber-500 text-stone-950 font-black'
                        } : (sportStyles[booking.sport] || {
                          card: 'bg-slate-700 hover:bg-slate-800 text-white border border-slate-600',
                          badge: 'bg-slate-950 text-slate-200'
                        });

                        return (
                          <div 
                            key={time}
                            id={`slot-${court.id}-${time}`}
                            onClick={() => onViewBooking(booking)}
                            title={`Agendamento: ${booking.startTime} às ${booking.endTime}`}
                            className={`p-2.5 rounded-xl cursor-pointer transition text-left flex flex-col justify-between h-14 ${activeStyle.card} relative group shadow-sm`}
                          >
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-xs font-bold font-mono tracking-tight" title={`Horário total: ${booking.startTime} às ${booking.endTime}`}>
                                {time}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${activeStyle.badge} truncate max-w-[95px]`}>
                                {isMaintenance ? 'MANUTENÇÃO' : booking.sport}
                              </span>
                            </div>
                            <div className="mt-1 truncate flex items-center justify-between">
                              <span className="text-[11px] font-bold tracking-tight block truncate">
                                {booking.customerName}
                              </span>
                              {(booking.students && booking.students.length > 0) && (
                                <span className="text-[9px] font-extrabold px-1 py-0.2 bg-blue-100 text-blue-800 rounded-xs shrink-0 ml-1">
                                  {booking.students.length} 🎓
                                </span>
                              )}
                            </div>
                            
                            {/* Hover Details Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200 z-20 shadow-xl border border-slate-700">
                              {((booking.bookingType || '').toLowerCase().includes('aula') || booking.teacherName) ? (
                                <>
                                  <div className="font-bold flex items-center gap-1 text-blue-300">
                                    👨‍🏫 Prof: {booking.teacherName || booking.customerName}
                                  </div>
                                  {booking.students && booking.students.length > 0 ? (
                                    <div className="mt-1 text-slate-200 text-[10px]">
                                      <span className="font-bold text-amber-300">🎓 Alunos ({booking.students.length}):</span>{' '}
                                      {booking.students.map(s => s.studentName).join(', ')}
                                    </div>
                                  ) : booking.studentName ? (
                                    <div className="mt-1 text-slate-200 text-[10px]">
                                      <span className="font-bold text-amber-300">🎓 Aluno:</span> {booking.studentName}
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <div className="font-bold flex items-center gap-1 text-slate-100"><User className="h-3.5 w-3.5 text-blue-400" /> {booking.customerName}</div>
                              )}
                              
                              <div className="mt-1 font-mono text-[10px] text-slate-300"><Phone className="h-3 w-3 inline mr-1 text-slate-400" /> {booking.customerPhone}</div>
                              <div className="mt-1 font-semibold text-blue-300">🏐 {booking.sport}</div>
                              {booking.bookingType && (
                                <div className="mt-0.5 font-semibold text-amber-300">📌 {booking.bookingType}</div>
                              )}
                              <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-emerald-400 font-bold flex items-center justify-between">
                                <span>🕒 Horário Total:</span>
                                <span className="font-mono">{booking.startTime} às {booking.endTime}</span>
                              </div>
                              <div className="mt-0.5 text-slate-300 text-[10px] flex justify-between">
                                <span>Valor:</span>
                                <span className="font-bold">{formatCurrency(booking.totalValue)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={time}
                          id={`slot-empty-${court.id}-${time}`}
                          onClick={() => onSelectSlot(court.id, time)}
                          className={`p-2.5 border rounded-xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition flex flex-col justify-between h-14 text-left ${
                            isCurrent ? 'border-blue-400 bg-blue-50/10' : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono font-medium text-slate-500">{time}</span>
                            {isCurrent && (
                              <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 group-hover:text-blue-500">
                            <Plus className="h-3 w-3" /> Agendar
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
