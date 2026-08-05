import React, { useState, useEffect } from 'react';
import { Booking, Court, Player } from '../types';
import { formatCurrency, formatPhoneNumber } from '../utils';
import { 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  CheckCircle, 
  Search, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Phone, 
  Mail, 
  HelpCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerSplitManagerProps {
  bookings: Booking[];
  courts: Court[];
  onSaveBooking: (booking: Booking) => void;
}

// Helper function to recalculate split amounts among players:
// Custom players keep their fixed value. Remaining total is split equally among non-custom players.
function calculatePlayerAmounts(currentPlayers: Player[], totalValue: number): Player[] {
  if (currentPlayers.length === 0) return [];

  const customPlayers = currentPlayers.filter(p => p.isCustom && typeof p.amount === 'number' && p.amount >= 0);
  const sumCustom = customPlayers.reduce((sum, p) => sum + p.amount, 0);
  
  const nonCustomPlayers = currentPlayers.filter(p => !p.isCustom);
  
  const remainingValue = Math.max(0, totalValue - sumCustom);
  const nonCustomShare = nonCustomPlayers.length > 0 
    ? Number((remainingValue / nonCustomPlayers.length).toFixed(2)) 
    : 0;

  return currentPlayers.map(p => {
    if (p.isCustom) {
      return p;
    }
    return {
      ...p,
      amount: nonCustomShare
    };
  });
}

export default function PlayerSplitManager({ bookings, courts, onSaveBooking }: PlayerSplitManagerProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'Todos' | 'Hoje' | 'Futuros'>('Todos');
  
  // New player form state
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerCustomAmount, setPlayerCustomAmount] = useState<string>('');
  
  // Split configuration
  const [isEqualSplit, setIsEqualSplit] = useState(true);
  const [includeContractor, setIncludeContractor] = useState(true);

  const todayISO = new Date().toISOString().split('T')[0];

  // Auto-select default booking if needed
  useEffect(() => {
    if (bookings.length > 0) {
      const exists = bookings.some(b => b.id === selectedBookingId);
      if (!exists) {
        const defaultBooking = bookings.find(b => b.date >= todayISO) || bookings[0];
        if (defaultBooking) {
          setSelectedBookingId(defaultBooking.id);
        }
      }
    }
  }, [bookings, selectedBookingId, todayISO]);

  // Selected booking and court
  const selectedBooking = bookings.find(b => b.id === selectedBookingId);
  const selectedCourt = selectedBooking ? courts.find(c => c.id === selectedBooking.courtId) : null;
  const players = selectedBooking?.players || [];
  const contractorName = selectedBooking?.customerName?.trim() || '';
  const totalValue = selectedBooking?.totalValue || 0;

  // Helper to test if a player object represents the contractor/owner
  const isOwner = (p: Player) => 
    Boolean(p.isContractor) || (Boolean(contractorName) && p.name.trim().toLowerCase() === contractorName.toLowerCase());

  // Keep includeContractor flag synchronized when selecting a booking
  useEffect(() => {
    if (!selectedBooking || !contractorName) return;
    const currentPlayers = selectedBooking.players || [];
    const hasOwner = currentPlayers.some(isOwner);

    if (currentPlayers.length > 0) {
      setIncludeContractor(hasOwner);
    } else {
      // If there are no players recorded yet, default includeContractor to true and auto-add owner
      setIncludeContractor(true);
      const ownerPlayer: Player = {
        id: `owner-${selectedBooking.id}`,
        name: contractorName,
        phone: selectedBooking.customerPhone || undefined,
        hasPaid: selectedBooking.paymentStatus === 'Pago',
        amount: selectedBooking.totalValue || 0,
        isContractor: true,
        isCustom: false
      };
      onSaveBooking({
        ...selectedBooking,
        players: [ownerPlayer]
      });
    }
  }, [selectedBookingId, contractorName]);

  // Filtered bookings list for the picker
  const filteredBookings = bookings.filter(b => {
    const court = courts.find(c => c.id === b.courtId);
    const matchesSearch = 
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (court?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter === 'Hoje') {
      return matchesSearch && b.date === todayISO;
    }
    if (dateFilter === 'Futuros') {
      return matchesSearch && b.date >= todayISO;
    }
    return matchesSearch;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Calculate split values
  const totalParticipantsCount = players.length;
  const equalSplitAmount = totalParticipantsCount > 0 ? Number((totalValue / totalParticipantsCount).toFixed(2)) : 0;

  // Helper to update booking and automatically set status to 'Pago' when total collected equals total booking value
  const updateBookingPlayers = (updatedPlayers: Player[]) => {
    if (!selectedBooking) return;

    const totalVal = selectedBooking.totalValue || 0;
    const totalColl = updatedPlayers
      .filter(p => p.hasPaid)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const isFullyPaid = totalVal > 0 && Math.round(totalColl * 100) >= Math.round(totalVal * 100);

    let newPaymentStatus = selectedBooking.paymentStatus;
    if (isFullyPaid) {
      newPaymentStatus = 'Pago';
    } else if (selectedBooking.paymentStatus === 'Pago' && !isFullyPaid) {
      newPaymentStatus = 'Pendente';
    }

    onSaveBooking({
      ...selectedBooking,
      paymentStatus: newPaymentStatus,
      players: updatedPlayers
    });
  };

  // Toggle handler for equal split flag
  const handleToggleEqualSplit = (checked: boolean) => {
    setIsEqualSplit(checked);
    if (!selectedBooking) return;

    // Reset player list when flag is toggled
    let newPlayers: Player[] = [];
    if (includeContractor && contractorName) {
      const ownerPlayer: Player = {
        id: `owner-${selectedBooking.id}`,
        name: contractorName,
        phone: selectedBooking.customerPhone || undefined,
        hasPaid: selectedBooking.paymentStatus === 'Pago',
        amount: totalValue,
        isContractor: true,
        isCustom: false
      };
      newPlayers = [ownerPlayer];
    }

    updateBookingPlayers(newPlayers);
  };

  // Toggle contractor inclusion
  const handleToggleIncludeContractor = (checked: boolean) => {
    setIncludeContractor(checked);
    if (!selectedBooking) return;

    // Reset player list when flag is toggled
    let newPlayers: Player[] = [];
    if (checked && contractorName) {
      const ownerPlayer: Player = {
        id: `owner-${selectedBooking.id}`,
        name: contractorName,
        phone: selectedBooking.customerPhone || undefined,
        hasPaid: selectedBooking.paymentStatus === 'Pago',
        amount: totalValue,
        isContractor: true,
        isCustom: false
      };
      newPlayers = [ownerPlayer];
    }

    updateBookingPlayers(newPlayers);
  };

  // Equalize/Reset all players to equal division
  const handleEqualizeAll = () => {
    if (!selectedBooking) return;
    setIsEqualSplit(true);
    const count = players.length;
    const share = count > 0 ? Number((totalValue / count).toFixed(2)) : 0;
    const equalizedPlayers = players.map(p => ({
      ...p,
      amount: share,
      isCustom: false
    }));
    updateBookingPlayers(equalizedPlayers);
  };

  // Add new player
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !playerName.trim()) return;

    const newPlayerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const parsedCustom = playerCustomAmount !== '' ? parseFloat(playerCustomAmount) : NaN;
    const hasCustomVal = !isNaN(parsedCustom) && parsedCustom >= 0;

    const newPlayer: Player = {
      id: newPlayerId,
      name: playerName.trim(),
      email: playerEmail.trim() || undefined,
      phone: playerPhone ? formatPhoneNumber(playerPhone) : undefined,
      hasPaid: false,
      amount: hasCustomVal ? parsedCustom : 0,
      isCustom: hasCustomVal || !isEqualSplit
    };

    const updatedPlayers = [...players, newPlayer];

    let finalPlayers: Player[] = [];
    if (isEqualSplit) {
      // If equal split is checked, redistribute equally among all players
      const count = updatedPlayers.length;
      const share = count > 0 ? Number((totalValue / count).toFixed(2)) : 0;
      finalPlayers = updatedPlayers.map(p => ({
        ...p,
        amount: share,
        isCustom: false
      }));
    } else {
      // If equal split is false, keep custom amount for new player and existing players
      newPlayer.amount = hasCustomVal ? parsedCustom : 0;
      finalPlayers = updatedPlayers;
    }

    updateBookingPlayers(finalPlayers);

    setPlayerName('');
    setPlayerEmail('');
    setPlayerPhone('');
    setPlayerCustomAmount('');
  };

  // Remove player
  const handleRemovePlayer = (playerId: string) => {
    if (!selectedBooking) return;
    const removedPlayer = players.find(p => p.id === playerId);
    const updatedPlayers = players.filter(p => p.id !== playerId);

    if (removedPlayer && isOwner(removedPlayer)) {
      setIncludeContractor(false);
    }

    let finalPlayers: Player[] = [];
    if (isEqualSplit) {
      const count = updatedPlayers.length;
      const share = count > 0 ? Number((totalValue / count).toFixed(2)) : 0;
      finalPlayers = updatedPlayers.map(p => ({
        ...p,
        amount: share,
        isCustom: false
      }));
    } else {
      finalPlayers = updatedPlayers;
    }

    updateBookingPlayers(finalPlayers);
  };

  // Toggle player payment status
  const handleTogglePlayerPayment = (playerId: string) => {
    if (!selectedBooking) return;
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        return { ...p, hasPaid: !p.hasPaid };
      }
      return p;
    });

    updateBookingPlayers(updatedPlayers);
  };

  // Mark all paid/pending
  const handleMarkAllStatus = (paid: boolean) => {
    if (!selectedBooking) return;
    const updatedPlayers = players.map(p => ({
      ...p,
      hasPaid: paid
    }));
    updateBookingPlayers(updatedPlayers);
  };

  // Calculate payment stats
  const totalCollected = players.filter(p => p.hasPaid).reduce((sum, p) => sum + p.amount, 0);
  const progressPercent = totalValue > 0 ? Math.min(100, Math.round((totalCollected / totalValue) * 100)) : 0;

  // Safe phone layout format
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerPhone(formatPhoneNumber(e.target.value));
  };

  return (
    <div id="player-split-manager-view" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-2 text-blue-100">
              <Users className="h-3.5 w-3.5" /> Divisão de Custos do Aluguel
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Racha &amp; Rateio de Jogadores</h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
              Gerencie a lista de participantes da partida, divida o valor do aluguel e acompanhe os pagamentos de cada jogador!
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 self-start md:self-auto">
            <TrendingUp className="h-8 w-8 text-blue-200 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Total Arrecadado</span>
              <span className="text-lg font-black text-white">{formatCurrency(totalCollected)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Picker & Right Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Booking Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" /> Selecionar Agendamento
              </h3>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredBookings.length} jogos
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['Todos', 'Hoje', 'Futuros'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    dateFilter === filter 
                      ? 'bg-white text-blue-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por cliente ou quadra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Bookings List Scroll */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <AlertCircle className="h-6 w-6 mx-auto opacity-50" />
                  <p className="text-xs font-medium">Nenhum agendamento encontrado.</p>
                </div>
              ) : (
                filteredBookings.map((b) => {
                  const court = courts.find(c => c.id === b.courtId);
                  const isSelected = b.id === selectedBookingId;
                  const dateFormatted = b.date.split('-').reverse().join('/');
                  const pCount = b.players?.length || 0;

                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBookingId(b.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{b.customerName}</h4>
                          <p className="text-[11px] font-semibold text-blue-600 mt-0.5">{court?.name || 'Quadra'}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-900 shrink-0">
                          {formatCurrency(b.totalValue)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <span className="font-mono">{dateFormatted} ({b.startTime})</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full font-bold ${
                            b.paymentStatus === 'Pago' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60' : 'bg-amber-100 text-amber-800 border border-amber-200/60'
                          }`}>
                            {b.paymentStatus === 'Pago' ? 'Pago' : 'Pendente'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full font-bold ${
                            pCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {pCount} {pCount === 1 ? 'jog.' : 'jogs.'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Booking Details & Player Split Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedBooking ? (
            <>
              {/* Selected Booking Info Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {selectedBooking.sport}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-bold text-slate-600">
                      {selectedBooking.date.split('-').reverse().join('/')} ({selectedBooking.startTime} às {selectedBooking.endTime})
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                      selectedBooking.paymentStatus === 'Pago' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {selectedBooking.paymentStatus === 'Pago' ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" /> Pago
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-amber-600 shrink-0" /> Pendente
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {selectedBooking.customerName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedCourt?.name || 'Quadra'} {selectedBooking.customerPhone ? `• ${selectedBooking.customerPhone}` : ''}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Valor do Aluguel</span>
                  <span className="text-xl font-black text-slate-900">{formatCurrency(totalValue)}</span>
                </div>
              </div>

              {/* Progress/Summary Board */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Visual Stats bar (Col 7) */}
                <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progresso da Arrecadação</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold text-slate-950 tracking-tight">
                        {formatCurrency(totalCollected)}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        de {formatCurrency(totalValue)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 flex-wrap gap-1">
                      <span className="text-xs font-bold text-emerald-600">{progressPercent}% arrecadado</span>
                      <span className="text-xs font-medium text-slate-500">
                        Restante: {formatCurrency(Math.max(0, totalValue - totalCollected))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split Configuration Card (Col 5) */}
                <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Regra do Rateio</span>
                  
                  {/* Division settings toggles */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer py-1 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={isEqualSplit} 
                        onChange={(e) => handleToggleEqualSplit(e.target.checked)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700 leading-tight">Dividir igualmente entre todos</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer py-1 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={includeContractor} 
                        onChange={(e) => handleToggleIncludeContractor(e.target.checked)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700 leading-tight truncate" title={`Incluir dono (${contractorName})`}>
                        Incluir dono {contractorName ? `(${contractorName})` : ''}
                      </span>
                    </label>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <HelpCircle className="h-3.5 w-3.5 shrink-0" title="Número de participantes ativos" />
                      <span className="text-xs font-medium">Participantes:</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {totalParticipantsCount} {totalParticipantsCount === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>

                  {totalParticipantsCount > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {isEqualSplit ? (
                          <span className="text-emerald-700 font-medium block">
                            💡 Divisão igualitária ativa: o valor total é dividido igualmente entre os {totalParticipantsCount} participante(s) ({formatCurrency(equalSplitAmount)} cada).
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium block">
                            💡 Divisão personalizada: cada jogador possui seu valor de racha fixo individual.
                          </span>
                        )}
                      </div>

                      {/* Equalize button */}
                      {!isEqualSplit && (
                        <button
                          onClick={handleEqualizeAll}
                          type="button"
                          className="w-full py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Ativa a divisão igualitária e recalcula o valor igualmente entre todos"
                        >
                          <RefreshCw className="h-3 w-3" /> Redividir Igualmente
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Player Form & Player Control Panels */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Add Player Form (Col 5) */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-blue-500" /> Cadastrar Jogador
                    </h4>

                    <form onSubmit={handleAddPlayer} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome Completo *</label>
                        <input
                          type="text"
                          placeholder="Ex: João Silva"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp / Telefone</label>
                        <input
                          type="text"
                          placeholder="Ex: (11) 98765-4321"
                          value={playerPhone}
                          onChange={handlePhoneInputChange}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">E-mail</label>
                        <input
                          type="email"
                          placeholder="Ex: joao@gmail.com"
                          value={playerEmail}
                          onChange={(e) => setPlayerEmail(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                        />
                      </div>

                      {!isEqualSplit && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Valor do Racha (R$) *
                            </label>
                            <span className="text-[9px] font-semibold text-blue-600 font-bold">
                              Obrigatório
                            </span>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ex: 35.00"
                            value={playerCustomAmount}
                            onChange={(e) => setPlayerCustomAmount(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                            required
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Divisão igualitária desativada: informe o valor a ser cobrado deste jogador.
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-100"
                      >
                        <Plus className="h-4 w-4" /> Adicionar Jogador
                      </button>
                    </form>
                  </div>
                </div>

                {/* Player List Controls & Indicators (Col 7) */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                        <Users className="h-4 w-4 text-blue-500 shrink-0" /> Controle de Jogadores
                      </h4>
                      {players.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMarkAllStatus(true)}
                            className="text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg transition whitespace-nowrap border border-emerald-200/50"
                          >
                            Todos Pagos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAllStatus(false)}
                            className="text-[10px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg transition whitespace-nowrap border border-blue-200/50"
                          >
                            Todos Pendentes
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {players.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <Users className="h-8 w-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-semibold text-slate-400">Nenhum jogador cadastrado ainda</p>
                          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                            Use o formulário ao lado para cadastrar as pessoas que vão rachar a quadra com você.
                          </p>
                        </div>
                      ) : (
                        players.map((p, index) => {
                          const initials = p.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                          const owner = isOwner(p);
                          
                          // Cycle colorful backgrounds for avatars
                          const avatarColors = [
                            'bg-blue-50 text-blue-600',
                            'bg-emerald-50 text-emerald-600',
                            'bg-indigo-50 text-indigo-600',
                            'bg-rose-50 text-rose-600',
                            'bg-cyan-50 text-cyan-600',
                          ];
                          const colorClass = avatarColors[index % avatarColors.length];

                          return (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2.5 min-w-0"
                            >
                              {/* Top Row: Avatar, Player Name, Badges, Phone/Email & Delete Action */}
                              <div className="flex items-start justify-between gap-2 min-w-0">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                                    {initials || 'JG'}
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                      <h5 className="text-xs font-bold text-slate-900 truncate" title={p.name}>
                                        {p.name}
                                      </h5>
                                      {owner && (
                                        <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                          Dono
                                        </span>
                                      )}
                                      {p.isCustom && (
                                        <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0" title="Valor individual fixado pelo organizador">
                                          Fixo
                                        </span>
                                      )}
                                    </div>

                                    {(p.phone || p.email) && (
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                        {p.phone && (
                                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-700 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                                            <Phone className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                                            <span>{p.phone}</span>
                                          </span>
                                        )}
                                        {p.email && (
                                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-[150px]" title={p.email}>
                                            <Mail className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{p.email}</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemovePlayer(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                                  title="Remover Jogador"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Bottom Row: Amount Badge & Status Toggle Button */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor:</span>
                                  <span className="text-xs font-black text-slate-900 bg-white border border-slate-200/90 px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap">
                                    {formatCurrency(p.amount)}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePlayerPayment(p.id)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-90 transition shrink-0 whitespace-nowrap border ${
                                    p.hasPaid 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-blue-50 text-blue-600 border-blue-200'
                                  }`}
                                  title="Clique para alternar o status do pagamento"
                                >
                                  {p.hasPaid ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> Pago
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 text-blue-500 shrink-0" /> Pendente
                                    </>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <Users className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700">Nenhum jogo selecionado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Selecione um agendamento na lista à esquerda para gerenciar o rateio do jogo e os pagamentos de cada jogador.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

