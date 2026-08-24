import React, { useState, useMemo } from 'react';
import { Booking, Court, PaymentStatus } from '../types';
import { formatCurrency, getBrasiliaTodayDate, shiftDateString } from '../utils';
import { 
  Search, 
  Calendar, 
  Filter, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  Sparkles,
  Smartphone,
  Copy,
  Printer,
  X,
  Trash2,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PaymentHistoryProps {
  bookings: Booking[];
  courts: Court[];
  onUpdatePaymentStatus: (bookingId: string, status: PaymentStatus) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatMonthYear = (ym: string) => {
  if (!ym || !ym.includes('-')) return ym;
  const [y, m] = ym.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  const shortYear = y.slice(2);
  return `${MONTH_NAMES[monthIdx] || m}/${shortYear}`;
};

const SPORT_COLORS: { [key: string]: string } = {
  'Futevôlei': '#10b981',
  'Beach Tennis': '#0ea5e9',
  'Vôlei de Praia': '#f59e0b',
  'Funcional': '#8b5cf6',
  'Outro': '#64748b',
};

const DEFAULT_CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

export default function PaymentHistory({ bookings, courts, onUpdatePaymentStatus, onDeleteBooking }: PaymentHistoryProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pago' | 'Pendente'>('Todos');
  const [courtFilter, setCourtFilter] = useState('Todos');
  const [datePreset, setDatePreset] = useState<'todos' | 'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_anterior' | 'personalizado'>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Delete confirmation state
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  // Helper date conversions (fuso horário de Brasília)
  const getTodayDate = () => getBrasiliaTodayDate();
  const getYesterdayDate = () => shiftDateString(getBrasiliaTodayDate(), -1);

  // Apply quick date preset
  const handleApplyPreset = (preset: 'todos' | 'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_anterior') => {
    setDatePreset(preset);
    const today = getTodayDate();

    if (preset === 'todos') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'hoje') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'ontem') {
      const yesterday = getYesterdayDate();
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else if (preset === '7dias') {
      setStartDate(shiftDateString(today, -6));
      setEndDate(today);
    } else if (preset === '30dias') {
      setStartDate(shiftDateString(today, -29));
      setEndDate(today);
    } else if (preset === 'este_mes') {
      const [y, m] = today.split('-').map(Number);
      const start = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'mes_anterior') {
      const [y, m] = today.split('-').map(Number);
      const prevDate = new Date(Date.UTC(y, m - 2, 1));
      const py = prevDate.getUTCFullYear();
      const pm = prevDate.getUTCMonth() + 1;
      const start = `${py}-${String(pm).padStart(2, '0')}-01`;
      const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      const end = `${py}-${String(pm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setDatePreset('personalizado');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('Todos');
    setCourtFilter('Todos');
    setDatePreset('todos');
    setStartDate('');
    setEndDate('');
  };

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    // 1. Search term
    const matchesSearch = !searchTerm.trim() || 
                          b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.customerPhone.includes(searchTerm) ||
                          (b.sport || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Status
    const matchesStatus = statusFilter === 'Todos' || b.paymentStatus === statusFilter;

    // 3. Court
    const matchesCourt = courtFilter === 'Todos' || b.courtId === courtFilter;

    // 4. Date Range
    let matchesDate = true;
    if (startDate && b.date < startDate) matchesDate = false;
    if (endDate && b.date > endDate) matchesDate = false;

    return matchesSearch && matchesStatus && matchesCourt && matchesDate;
  });

  // Calculations on filtered results
  const totalPaid = filteredBookings
    .filter(b => b.paymentStatus === 'Pago')
    .reduce((sum, b) => sum + b.totalValue, 0);

  const totalPending = filteredBookings
    .filter(b => b.paymentStatus === 'Pendente')
    .reduce((sum, b) => sum + b.totalValue, 0);

  // Group monthly volume for BarChart
  const monthlyChartData = useMemo(() => {
    const map: { [key: string]: { monthKey: string; monthLabel: string; pago: number; pendente: number; total: number; count: number } } = {};

    for (const b of filteredBookings) {
      if (!b.date) continue;
      const monthKey = b.date.slice(0, 7); // "YYYY-MM"
      if (!map[monthKey]) {
        map[monthKey] = {
          monthKey,
          monthLabel: formatMonthYear(monthKey),
          pago: 0,
          pendente: 0,
          total: 0,
          count: 0
        };
      }
      const val = Number(b.totalValue) || 0;
      map[monthKey].total += val;
      if (b.paymentStatus === 'Pago') {
        map[monthKey].pago += val;
      } else {
        map[monthKey].pendente += val;
      }
      map[monthKey].count += 1;
    }

    return Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredBookings]);

  // Group values by sport for PieChart
  const sportsChartData = useMemo(() => {
    const map: { [key: string]: { name: string; value: number; pago: number; pendente: number; count: number } } = {};
    let totalAll = 0;

    for (const b of filteredBookings) {
      const sportName = b.sport || 'Futevôlei';
      if (!map[sportName]) {
        map[sportName] = { name: sportName, value: 0, pago: 0, pendente: 0, count: 0 };
      }
      const val = Number(b.totalValue) || 0;
      map[sportName].value += val;
      if (b.paymentStatus === 'Pago') {
        map[sportName].pago += val;
      } else {
        map[sportName].pendente += val;
      }
      map[sportName].count += 1;
      totalAll += val;
    }

    return Object.values(map)
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({
        ...item,
        color: SPORT_COLORS[item.name] || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length],
        percent: totalAll > 0 ? (item.value / totalAll) * 100 : 0
      }));
  }, [filteredBookings]);

  // Custom tooltips for recharts
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex justify-between items-center">
            <span>{data.monthLabel}</span>
            <span className="text-[10px] text-slate-400 font-normal">{data.count} agendamento(s)</span>
          </p>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Recebido (Pago):</span>
            <span className="font-bold font-mono">{formatCurrency(data.pago)}</span>
          </div>
          <div className="flex justify-between items-center text-blue-400">
            <span>Pendente:</span>
            <span className="font-bold font-mono">{formatCurrency(data.pendente)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-white font-bold">
            <span>Total:</span>
            <span className="font-mono text-emerald-300">{formatCurrency(data.total)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 min-w-[160px]">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span className="truncate">{data.name}</span>
          </p>
          <div className="flex justify-between items-center text-slate-300 pt-0.5">
            <span>Valor:</span>
            <span className="font-bold font-mono text-white">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Participação:</span>
            <span className="font-semibold text-emerald-400">{data.percent.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[10px]">
            <span>Agendamentos:</span>
            <span>{data.count}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const copyPixKey = () => {
    setCopiedLink(true);
    navigator.clipboard.writeText('arena.volei.pix@pagamentos.com');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => setPrinting(false), 2000);
  };

  const isAnyFilterActive = searchTerm !== '' || statusFilter !== 'Todos' || courtFilter !== 'Todos' || startDate !== '' || endDate !== '' || datePreset !== 'todos';

  return (
    <div id="payment-history-view" className="space-y-6">
      
      {/* Financial Metrics Strip - Responsive Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Recebido (Pago) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0 transition hover:shadow-md">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate" title="Recebido (Pago)">
              Recebido (Pago)
            </span>
            <span 
              className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight block truncate mt-0.5"
              title={formatCurrency(totalPaid)}
            >
              {formatCurrency(totalPaid)}
            </span>
          </div>
        </div>

        {/* A Receber (Pendente) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0 transition hover:shadow-md">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl shrink-0">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate" title="A Receber (Pendente)">
              A Receber (Pendente)
            </span>
            <span 
              className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight block truncate mt-0.5"
              title={formatCurrency(totalPending)}
            >
              {formatCurrency(totalPending)}
            </span>
          </div>
        </div>

        {/* Total Filtrado */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0 sm:col-span-2 lg:col-span-1 transition hover:shadow-md">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl shrink-0">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate" title="Total Filtrado">
              Total Filtrado
            </span>
            <span 
              className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight block truncate mt-0.5"
              title={formatCurrency(totalPaid + totalPending)}
            >
              {formatCurrency(totalPaid + totalPending)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Options Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Search & Quick Presets */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por cliente, telefone ou esporte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'hoje', label: 'Hoje' },
              { id: 'ontem', label: 'Ontem' },
              { id: '7dias', label: '7 dias' },
              { id: '30dias', label: '30 dias' },
              { id: 'este_mes', label: 'Este Mês' },
              { id: 'mes_anterior', label: 'Mês Passado' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleApplyPreset(opt.id as any)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  datePreset === opt.id 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date Pickers and Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Custom Date Filter */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="text-slate-400 font-bold uppercase text-[10px]">De:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                title="Data inicial"
              />
              <span className="text-slate-400 font-bold uppercase text-[10px] ml-1">Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                title="Data final"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none text-xs cursor-pointer"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>

            {/* Court Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Quadra:</span>
              <select
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none text-xs cursor-pointer"
              >
                <option value="Todos">Todas as Quadras</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters button */}
          {isAnyFilterActive && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
              title="Limpar todos os filtros"
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Charts Section: Volume por Mês & Valores por Esporte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico 1: Volume Financeiro por Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Volume Financeiro por Mês
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Comparativo de valores pagos e pendentes por mês
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Pago
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                Pendente
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {monthlyChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <BarChart3 className="h-8 w-8 mb-2 text-slate-300" />
                <span>Nenhum dado financeiro para o período selecionado</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="pago" name="Pago" fill="#10b981" radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="pendente" name="Pendente" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Valores por Esporte */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-blue-500" />
                Valores por Esporte
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Distribuição e receita gerada por modalidade
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
              Total: {formatCurrency(totalPaid + totalPending)}
            </span>
          </div>

          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            {sportsChartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <PieIcon className="h-8 w-8 mb-2 text-slate-300" />
                <span>Nenhum dado por esporte no período selecionado</span>
              </div>
            ) : (
              <>
                <div className="h-44 sm:h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sportsChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {sportsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {sportsChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-700 truncate text-xs">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold font-mono text-slate-900 block text-xs">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.percent.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table & List View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-4">Quadra</th>
                <th className="py-4 px-4">Data e Hora</th>
                <th className="py-4 px-4">Esporte</th>
                <th className="py-4 px-4">Forma</th>
                <th className="py-4 px-4">Valor</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum registro de faturamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const court = courts.find(c => c.id === b.courtId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/40 transition">
                      {/* Cliente */}
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">{b.customerName}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{b.customerPhone || 'Sem telefone'}</p>
                      </td>

                      {/* Quadra */}
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        {court?.name || 'Quadra'}
                      </td>

                      {/* Data e Hora */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-700">{b.date.split('-').reverse().join('/')}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{b.startTime} - {b.endTime}</p>
                      </td>

                      {/* Esporte */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">
                            {b.sport}
                          </span>
                          {b.bookingType && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                              {b.bookingType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                        {b.paymentMethod}
                      </td>

                      {/* Valor */}
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {formatCurrency(b.totalValue)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => onUpdatePaymentStatus(b.id, b.paymentStatus === 'Pago' ? 'Pendente' : 'Pago')}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-90 ${
                            b.paymentStatus === 'Pago'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${b.paymentStatus === 'Pago' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                          {b.paymentStatus}
                        </button>
                      </td>

                      {/* Ações: Comprovante e Excluir */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`receipt-btn-${b.id}`}
                            onClick={() => setSelectedReceipt(b)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 rounded-lg text-slate-400 transition inline-flex items-center gap-1 cursor-pointer text-xs font-bold"
                            title="Ver Comprovante"
                          >
                            <FileText className="h-4 w-4" /> Comprovante
                          </button>
                          {onDeleteBooking && (
                            <button
                              id={`delete-btn-${b.id}`}
                              onClick={() => setBookingToDelete(b)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition inline-flex items-center cursor-pointer text-xs font-bold"
                              title="Excluir Agendamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* High Fidelity Receipt Popup Panel */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-w-sm w-full"
            >
              {/* Receipt Top header representing tickets */}
              <div className="bg-slate-950 p-6 text-white text-center relative">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setSelectedReceipt(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <h4 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center justify-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> COMPROVANTE ESPORTIVO <Sparkles className="h-4 w-4" />
                </h4>
                <p className="text-xs text-slate-400 mt-1">Arena Fahel Beach</p>
                <div className="mt-4 text-xs font-mono text-slate-500">
                  ID: #{selectedReceipt.id.toUpperCase()}
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-4 bg-slate-50 font-sans">
                <div className="space-y-2 border-b border-dashed border-slate-200 pb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">CLIENTE</span>
                    <span className="text-slate-800 font-black">{selectedReceipt.customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">CONTATO</span>
                    <span className="text-slate-800 font-mono">{selectedReceipt.customerPhone || '-'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">QUADRA</span>
                    <span className="text-slate-800 font-black">
                      {courts.find(c => c.id === selectedReceipt.courtId)?.name || 'Quadra'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-b border-dashed border-slate-200 pb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">DATA</span>
                    <span className="text-slate-800 font-bold">{selectedReceipt.date.split('-').reverse().join('/')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">HORÁRIO</span>
                    <span className="text-slate-800 font-mono font-bold">
                      {selectedReceipt.startTime} - {selectedReceipt.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">MODALIDADE</span>
                    <span className="text-slate-800 font-black">{selectedReceipt.sport}</span>
                  </div>
                  {selectedReceipt.bookingType && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">TIPO DE AGENDAMENTO</span>
                      <span className="text-slate-800 font-black">{selectedReceipt.bookingType}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">FORMA DE PAGAMENTO</span>
                    <span className="text-slate-800 font-semibold">{selectedReceipt.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">STATUS</span>
                    <span className={`font-black ${selectedReceipt.paymentStatus === 'Pago' ? 'text-emerald-600' : 'text-blue-500'}`}>
                      {selectedReceipt.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Big Price Tag */}
                  <div className="pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-800">VALOR TOTAL</span>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(selectedReceipt.totalValue)}</span>
                  </div>
                </div>

                {/* Simulated QR Code for Pix/Share */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-2 mt-4 text-center">
                  <div className="h-28 w-28 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* Simulated visual QR Code lines */}
                    <div className="grid grid-cols-4 gap-1 p-2 w-full h-full opacity-60">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`rounded ${i % 3 === 0 || i % 5 === 0 ? 'bg-slate-800' : 'bg-transparent'}`} />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 font-mono text-[9px] font-bold text-slate-600">
                      QR CODE PIX
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Escaneie para realizar ou comprovar o pagamento</p>
                </div>
              </div>

              {/* Action buttons inside the receipt popup */}
              <div className="p-4 bg-slate-100 flex gap-2">
                <button
                  onClick={copyPixKey}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-200"
                >
                  <Copy className="h-4 w-4" />
                  {copiedLink ? 'Copiado!' : 'Copiar Chave Pix'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                  title="Imprimir Comprovante"
                >
                  <Printer className="h-4 w-4" />
                  {printing ? '...' : ''}
                </button>
                {onDeleteBooking && (
                  <button
                    onClick={() => {
                      const toDelete = selectedReceipt;
                      setSelectedReceipt(null);
                      setBookingToDelete(toDelete);
                    }}
                    className="px-3 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    title="Excluir Agendamento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {bookingToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 max-w-sm w-full text-center space-y-4"
            >
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Agendamento</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja excluir o agendamento de <strong className="text-slate-800">{bookingToDelete.customerName}</strong> ({bookingToDelete.date.split('-').reverse().join('/')} às {bookingToDelete.startTime})?
                </p>
                <p className="text-[11px] text-rose-600 font-semibold mt-2">Esta ação removerá o registro do sistema.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteBooking) {
                      onDeleteBooking(bookingToDelete.id);
                    }
                    setBookingToDelete(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
