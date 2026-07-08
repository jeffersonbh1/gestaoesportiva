import React from 'react';
import { Booking, Court } from '../types';
import { formatCurrency } from '../utils';
import { 
  DollarSign, 
  Calendar, 
  Percent, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  bookings: Booking[];
  courts: Court[];
  selectedDate: string;
  onNavigateTab: (tab: string) => void;
  onUpdatePaymentStatus: (bookingId: string, status: 'Pago' | 'Pendente') => void;
}

export default function Dashboard({ 
  bookings, 
  courts, 
  selectedDate, 
  onNavigateTab,
  onUpdatePaymentStatus 
}: DashboardProps) {
  
  // Filter today's bookings
  const todayBookings = bookings.filter(b => b.date === selectedDate);
  
  // 1. Calculate active bookings today
  const activeBookingsCount = todayBookings.length;
  
  // 2. Calculate faturamento (revenue) today
  const todayRevenuePaid = todayBookings
    .filter(b => b.paymentStatus === 'Pago')
    .reduce((sum, b) => sum + b.totalValue, 0);
    
  const todayRevenuePending = todayBookings
    .filter(b => b.paymentStatus === 'Pendente')
    .reduce((sum, b) => sum + b.totalValue, 0);

  const totalRevenueAllTime = bookings
    .filter(b => b.paymentStatus === 'Pago')
    .reduce((sum, b) => sum + b.totalValue, 0);
  
  // 3. Calculate occupation rate today
  // Say there are 15 hourly slots available (07:00 to 22:00) per court.
  const TOTAL_SLOTS_PER_COURT = 15; 
  const totalPossibleHours = courts.filter(c => c.status !== 'Manutenção').length * TOTAL_SLOTS_PER_COURT;
  
  // Calculate total booked hours today
  const totalBookedHoursToday = todayBookings.reduce((sum, b) => {
    const [startH, startM] = b.startTime.split(':').map(Number);
    const [endH, endM] = b.endTime.split(':').map(Number);
    const diffHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
    return sum + diffHours;
  }, 0);
  
  const occupationRate = totalPossibleHours > 0 
    ? Math.min(Math.round((totalBookedHoursToday / totalPossibleHours) * 100), 100) 
    : 0;

  // 4. Court status counters
  const courtStatusCounts = courts.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    { Disponível: 0, Ocupada: 0, Manutenção: 0 }
  );

  // 5. Sport type distribution
  const sportCounts = bookings.reduce((acc, b) => {
    acc[b.sport] = (acc[b.sport] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBookingsAllTime = bookings.length;

  // 6. Revenue per court breakdown
  const courtRevenueData = courts.map(court => {
    const courtBookings = bookings.filter(b => b.courtId === court.id && b.paymentStatus === 'Pago');
    const value = courtBookings.reduce((sum, b) => sum + b.totalValue, 0);
    return {
      name: court.name,
      value
    };
  });
  
  const maxCourtRevenue = Math.max(...courtRevenueData.map(c => c.value), 1);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Painel Operacional 🏐</h2>
          <p className="text-slate-500 text-sm mt-1">
            Resumos e estatísticas para o dia <span className="font-semibold text-blue-600">{selectedDate.split('-').reverse().join('/')}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistema Ativo
          </div>
          <button 
            id="quick-book-btn"
            onClick={() => onNavigateTab('agendamentos')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Faturamento */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Hoje</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(todayRevenuePaid)}</h3>
            <p className="text-xs text-blue-500 mt-1 flex items-center gap-1 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              {formatCurrency(todayRevenuePending)} pendentes
            </p>
          </div>
        </motion.div>

        {/* Card Taxa Ocupacao */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa de Ocupação</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{occupationRate}%</h3>
              <span className="text-xs text-slate-400 font-medium">de slots diários</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${occupationRate}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Card Agendamentos */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jogos de Hoje</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{activeBookingsCount}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Agendamentos confirmados hoje
            </p>
          </div>
        </motion.div>

        {/* Card Quadras Disponiveis */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status das Quadras</span>
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center">
            <div className="bg-emerald-50 rounded-lg p-1.5 border border-emerald-100">
              <div className="text-sm font-bold text-emerald-600">{courtStatusCounts.Disponível}</div>
              <div className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider">Livres</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-1.5 border border-blue-100">
              <div className="text-sm font-bold text-blue-600">{courtStatusCounts.Ocupada}</div>
              <div className="text-[9px] text-blue-700 font-semibold uppercase tracking-wider">Uso</div>
            </div>
            <div className="bg-rose-50 rounded-lg p-1.5 border border-rose-100">
              <div className="text-sm font-bold text-rose-600">{courtStatusCounts.Manutenção}</div>
              <div className="text-[9px] text-rose-700 font-semibold uppercase tracking-wider">Mnt</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Financial & Sport Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-bold text-slate-900 tracking-tight">Faturamento por Quadra (Geral)</h4>
                <p className="text-xs text-slate-400">Total arrecadado em pagamentos confirmados</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400">Total Histórico</span>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalRevenueAllTime)}</p>
              </div>
            </div>

            {/* Custom Visual Bar Chart */}
            <div className="space-y-4">
              {courtRevenueData.map((court, idx) => {
                const percent = (court.value / maxCourtRevenue) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-semibold">{court.name}</span>
                      <span className="text-slate-900 font-bold">{formatCurrency(court.value)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="bg-blue-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sports Preferences Analytics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 tracking-tight mb-4">Esportes Mais Praticados</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Vôlei de Areia', 'Futevôlei', 'Vôlei de Quadra', 'Beach Tennis'].map((sport, idx) => {
                const count = sportCounts[sport] || 0;
                const pct = totalBookingsAllTime > 0 ? Math.round((count / totalBookingsAllTime) * 100) : 0;
                
                // Color mapping
                const colorMap: Record<string, {bg: string, text: string, border: string, fill: string}> = {
                  'Vôlei de Areia': { bg: 'bg-blue-50/50', text: 'text-blue-600', border: 'border-blue-100', fill: 'bg-blue-500' },
                  'Futevôlei': { bg: 'bg-blue-50/50', text: 'text-blue-600', border: 'border-blue-100', fill: 'bg-blue-500' },
                  'Vôlei de Quadra': { bg: 'bg-blue-50/50', text: 'text-blue-600', border: 'border-blue-100', fill: 'bg-blue-500' },
                  'Beach Tennis': { bg: 'bg-emerald-50/50', text: 'text-emerald-600', border: 'border-emerald-100', fill: 'bg-emerald-500' },
                };
                
                const style = colorMap[sport] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', fill: 'bg-slate-500' };

                return (
                  <div key={idx} className={`p-4 rounded-xl border ${style.border} ${style.bg} flex flex-col justify-between h-28`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Esporte</span>
                      <span className={`text-xs font-bold ${style.text} line-clamp-1`}>{sport}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-extrabold text-slate-950">{count}</span>
                      <span className="text-xs text-slate-500 ml-1 font-medium">jogos ({pct}%)</span>
                      <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className={`h-full ${style.fill}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 3: Agenda Highlights & Unpaid alert */}
        <div className="space-y-6">
          {/* Unpaid / Pending Alert Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-500" />
                Pendentes de Pagamento ({todayBookings.filter(b => b.paymentStatus === 'Pendente').length})
              </h4>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1 flex-1">
              {todayBookings.filter(b => b.paymentStatus === 'Pendente').length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <span>Nenhum pagamento pendente hoje!</span>
                </div>
              ) : (
                todayBookings
                  .filter(b => b.paymentStatus === 'Pendente')
                  .map((b) => {
                    const courtName = courts.find(c => c.id === b.courtId)?.name || 'Quadra';
                    return (
                      <div key={b.id} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex justify-between items-center transition">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{b.customerName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{courtName}</p>
                          <p className="text-[10px] text-blue-600 font-mono font-bold mt-0.5">{b.startTime} - {b.endTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800">{formatCurrency(b.totalValue)}</p>
                          <button
                            id={`pay-btn-${b.id}`}
                            onClick={() => onUpdatePaymentStatus(b.id, 'Pago')}
                            className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-semibold transition cursor-pointer"
                          >
                            Receber
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Next appointments of the day */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Próximos Jogos Hoje</h5>
              <div className="space-y-2.5">
                {todayBookings.slice(0, 3).map((b) => {
                  const courtName = courts.find(c => c.id === b.courtId)?.name || 'Quadra';
                  return (
                    <div key={b.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-mono font-bold">
                        {b.startTime}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{b.customerName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{courtName} • {b.sport}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    </div>
                  );
                })}
                {todayBookings.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">Sem mais jogos agendados para hoje.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
