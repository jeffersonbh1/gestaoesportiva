import React, { useState } from 'react';
import { Booking, Court, PaymentStatus } from '../types';
import { formatCurrency } from '../utils';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentHistoryProps {
  bookings: Booking[];
  courts: Court[];
  onUpdatePaymentStatus: (bookingId: string, status: PaymentStatus) => void;
}

export default function PaymentHistory({ bookings, courts, onUpdatePaymentStatus }: PaymentHistoryProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pago' | 'Pendente'>('Todos');
  const [courtFilter, setCourtFilter] = useState('Todos');
  const [dateRange, setDateRange] = useState<'Todos' | 'Hoje' | 'Ontem' | '7dias'>('Todos');
  
  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Helper date conversions
  const getTodayDate = () => '2026-07-07'; // Match static mock date base
  const getYesterdayDate = () => '2026-07-06';

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    // 1. Search term
    const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.customerPhone.includes(searchTerm);
    
    // 2. Status
    const matchesStatus = statusFilter === 'Todos' || b.paymentStatus === statusFilter;

    // 3. Court
    const matchesCourt = courtFilter === 'Todos' || b.courtId === courtFilter;

    // 4. Date Range
    let matchesDate = true;
    if (dateRange === 'Hoje') {
      matchesDate = b.date === getTodayDate();
    } else if (dateRange === 'Ontem') {
      matchesDate = b.date === getYesterdayDate();
    } else if (dateRange === '7dias') {
      const bDate = new Date(b.date);
      const reference = new Date(getTodayDate());
      const diffTime = Math.abs(reference.getTime() - bDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesDate = diffDays <= 7;
    }

    return matchesSearch && matchesStatus && matchesCourt && matchesDate;
  });

  // Calculations on filtered results
  const totalPaid = filteredBookings
    .filter(b => b.paymentStatus === 'Pago')
    .reduce((sum, b) => sum + b.totalValue, 0);

  const totalPending = filteredBookings
    .filter(b => b.paymentStatus === 'Pendente')
    .reduce((sum, b) => sum + b.totalValue, 0);

  const copyPixKey = () => {
    setCopiedLink(true);
    navigator.clipboard.writeText('arena.volei.pix@pagamentos.com');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => setPrinting(false), 2000);
  };

  return (
    <div id="payment-history-view" className="space-y-6">
      
      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recebido (Pago)</span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalPaid)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">A Receber (Pendente)</span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalPending)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Filtrado</span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalPaid + totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Filter Options Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por cliente ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Quick Dates */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {(['Todos', 'Hoje', 'Ontem', '7dias'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setDateRange(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  dateRange === opt 
                    ? 'bg-white text-slate-800 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {opt === 'Todos' ? 'Histórico' : opt === '7dias' ? 'Últimos 7 dias' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Filters Row */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>

          {/* Court Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Quadra:</span>
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none"
            >
              <option value="Todos">Todas as Quadras</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>{court.name}</option>
              ))}
            </select>
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
                <th className="py-4 px-6 text-right">Comprovante</th>
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

                      {/* Comprovante */}
                      <td className="py-4 px-6 text-right">
                        <button
                          id={`receipt-btn-${b.id}`}
                          onClick={() => setSelectedReceipt(b)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 rounded-lg text-slate-400 transition inline-flex items-center gap-1 cursor-pointer text-xs font-bold"
                        >
                          <FileText className="h-4 w-4" /> Comprovante
                        </button>
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
                >
                  <Printer className="h-4 w-4" />
                  {printing ? '...' : ''}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
