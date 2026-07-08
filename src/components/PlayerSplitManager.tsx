import React, { useState, useEffect } from 'react';
import { Booking, Court, Player } from '../types';
import { formatCurrency, formatPhoneNumber } from '../utils';
import { 
  Users, 
  Plus, 
  Trash2, 
  Share2, 
  Check, 
  Clock, 
  CheckCircle, 
  Copy, 
  Search, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Phone, 
  Mail, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerSplitManagerProps {
  bookings: Booking[];
  courts: Court[];
  onSaveBooking: (booking: Booking) => void;
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
  
  // Copy state
  const [copiedText, setCopiedText] = useState(false);

  // Set default booking if none is selected
  useEffect(() => {
    if (bookings.length > 0 && !selectedBookingId) {
      // Find today's first booking or first in general
      const today = '2026-07-07';
      const todayBooking = bookings.find(b => b.date === today);
      if (todayBooking) {
        setSelectedBookingId(todayBooking.id);
      } else {
        setSelectedBookingId(bookings[0].id);
      }
    }
  }, [bookings, selectedBookingId]);

  // Find selected booking and its court
  const selectedBooking = bookings.find(b => b.id === selectedBookingId);
  const selectedCourt = selectedBooking ? courts.find(c => c.id === selectedBooking.courtId) : null;
  const players = selectedBooking?.players || [];

  // Filtered bookings list for the picker
  const filteredBookings = bookings.filter(b => {
    const court = courts.find(c => c.id === b.courtId);
    const matchesSearch = 
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (court?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter === 'Hoje') {
      return matchesSearch && b.date === '2026-07-07';
    }
    if (dateFilter === 'Futuros') {
      return matchesSearch && b.date >= '2026-07-07';
    }
    return matchesSearch;
  }).sort((a, b) => {
    // Sort by date then startTime
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Calculate split values
  const contractorName = selectedBooking?.customerName || '';
  const totalValue = selectedBooking?.totalValue || 0;
  
  // Helper: total number of participants
  const totalParticipantsCount = players.length + (includeContractor ? 1 : 0);
  
  // Auto-calculated amount per person if equal split is active
  const equalSplitAmount = totalParticipantsCount > 0 ? Number((totalValue / totalParticipantsCount).toFixed(2)) : 0;

  // Handle equal split adjustments
  useEffect(() => {
    if (selectedBooking && isEqualSplit) {
      // Automatically adjust players amount to equalSplitAmount
      const updatedPlayers = players.map(p => ({
        ...p,
        amount: equalSplitAmount
      }));
      
      // Only trigger save if they actually changed to avoid loop
      const changed = JSON.stringify(players) !== JSON.stringify(updatedPlayers);
      if (changed) {
        onSaveBooking({
          ...selectedBooking,
          players: updatedPlayers
        });
      }
    }
  }, [equalSplitAmount, isEqualSplit, selectedBooking]);

  // Add new player
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !playerName.trim()) return;

    const newPlayerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Determine player amount
    let playerAmt = equalSplitAmount;
    if (!isEqualSplit) {
      playerAmt = playerCustomAmount ? Math.max(0, parseFloat(playerCustomAmount)) : 0;
    }

    const newPlayer: Player = {
      id: newPlayerId,
      name: playerName.trim(),
      email: playerEmail.trim() || undefined,
      phone: playerPhone ? formatPhoneNumber(playerPhone) : undefined,
      hasPaid: false,
      amount: playerAmt
    };

    // Construct updated players list
    const updatedPlayers = [...players, newPlayer];

    // If it's an equal split, the addition of a player changes the count,
    // so we must recalculate all players' shares based on the new count.
    let finalPlayers = updatedPlayers;
    if (isEqualSplit) {
      const newParticipantCount = updatedPlayers.length + (includeContractor ? 1 : 0);
      const newEqualAmt = Number((totalValue / newParticipantCount).toFixed(2));
      finalPlayers = updatedPlayers.map(p => ({
        ...p,
        amount: newEqualAmt
      }));
    }

    onSaveBooking({
      ...selectedBooking,
      players: finalPlayers
    });

    // Reset player inputs
    setPlayerName('');
    setPlayerEmail('');
    setPlayerPhone('');
    setPlayerCustomAmount('');
  };

  // Remove player
  const handleRemovePlayer = (playerId: string) => {
    if (!selectedBooking) return;
    const updatedPlayers = players.filter(p => p.id !== playerId);

    let finalPlayers = updatedPlayers;
    if (isEqualSplit) {
      const newParticipantCount = updatedPlayers.length + (includeContractor ? 1 : 0);
      const newEqualAmt = newParticipantCount > 0 ? Number((totalValue / newParticipantCount).toFixed(2)) : 0;
      finalPlayers = updatedPlayers.map(p => ({
        ...p,
        amount: newEqualAmt
      }));
    }

    onSaveBooking({
      ...selectedBooking,
      players: finalPlayers
    });
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

    onSaveBooking({
      ...selectedBooking,
      players: updatedPlayers
    });
  };

  // Mark all paid/pending
  const handleMarkAllStatus = (paid: boolean) => {
    if (!selectedBooking) return;
    const updatedPlayers = players.map(p => ({
      ...p,
      hasPaid: paid
    }));
    onSaveBooking({
      ...selectedBooking,
      players: updatedPlayers
    });
  };

  // Calculate payment stats
  const playersPaidSum = players.filter(p => p.hasPaid).reduce((sum, p) => sum + p.amount, 0);
  const contractorAmount = includeContractor ? equalSplitAmount : 0;
  // Let's assume contractor paid if the general booking status is "Pago", or just treat their split individually.
  // We'll give a toggle to denote if the contractor has completed their share.
  // To avoid adding contractor state inside Booking, we can store contractor payment status in localStorage or just assume true/false.
  // Actually, let's keep it simple: we can represent the contractor in the list as a virtual player that is always paid if booking is paid, 
  // or simple toggle local state, or let the user click to denote they have contributed!
  // To make it persistent and neat, let's store whether contractor has paid in the booking's notes or just default to their share paid status.
  // Even better, let's just make contractor payment toggleable! Where is it saved? We can store it as a special player or we can inspect b.paymentStatus.
  // If the general booking status is "Pago", the contractor definitely paid. Let's just tie the contractor paid state to whether they paid their part or the general booking is paid.
  const contractorHasPaid = selectedBooking?.paymentStatus === 'Pago';

  const totalCollected = playersPaidSum + (includeContractor && contractorHasPaid ? contractorAmount : 0);
  const progressPercent = totalValue > 0 ? Math.min(100, Math.round((totalCollected / totalValue) * 100)) : 0;

  // Generate WhatsApp text
  const generateWhatsAppMessage = () => {
    if (!selectedBooking) return '';
    const dateFormatted = selectedBooking.date.split('-').reverse().join('/');
    const shareAmount = isEqualSplit ? equalSplitAmount : (players[0]?.amount || 0);
    
    let text = `🎾 *DIVISÃO DO JOGO - ARENA FAHEL BEACH* 🎾\n\n`;
    text += `📅 *Data:* ${dateFormatted}\n`;
    text += `⏰ *Horário:* ${selectedBooking.startTime} às ${selectedBooking.endTime}\n`;
    text += `🏟️ *Quadra:* ${selectedCourt?.name || 'Quadra Esportiva'}\n`;
    text += `🏆 *Esporte:* ${selectedBooking.sport}\n`;
    text += `💰 *Valor Total da Quadra:* ${formatCurrency(totalValue)}\n`;
    
    if (isEqualSplit) {
      text += `👤 *Valor por Pessoa:* *${formatCurrency(shareAmount)}* (${totalParticipantsCount} participantes)\n`;
    }
    
    const pixKey = selectedBooking.customerPhone || 'financeiro@arenavolei.com.br';
    text += `🔑 *Chave Pix (Celular):* ${pixKey}\n\n`;
    text += `--- 👥 *LISTA DE PAGAMENTO* ---\n`;
    
    if (includeContractor) {
      text += `${contractorHasPaid ? '✅' : '⏳'} ${contractorName} (Dono) - ${formatCurrency(shareAmount)}\n`;
    }
    
    players.forEach(p => {
      text += `${p.hasPaid ? '✅' : '⏳'} ${p.name} - ${formatCurrency(p.amount)}\n`;
    });
    
    text += `\n📊 *Arrecadado:* ${formatCurrency(totalCollected)} de ${formatCurrency(totalValue)} (${progressPercent}%)\n`;
    text += `\n*Favor enviar o comprovante após realizar o Pix!* 🚀`;
    return text;
  };

  const copyToClipboard = () => {
    const text = generateWhatsAppMessage();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Safe phone layout format
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerPhone(formatPhoneNumber(e.target.value));
  };

  return (
    <div id="player-split-manager-view" className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Racha & Divisão de Custos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Cadastre os jogadores que participarão do jogo, divida o valor do aluguel da quadra e controle os pagamentos individuais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Rent Picker List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" /> Selecionar Aluguel
            </h3>

            {/* Filter controls */}
            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl">
              {(['Todos', 'Hoje', 'Futuros'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dateFilter === filter 
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou quadra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
            </div>

            {/* Bookings List container */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  Nenhum agendamento encontrado
                </div>
              ) : (
                filteredBookings.map((b) => {
                  const court = courts.find(c => c.id === b.courtId);
                  const isSelected = b.id === selectedBookingId;
                  const dateParts = b.date.split('-');
                  const shortDate = `${dateParts[2]}/${dateParts[1]}`;
                  const pCount = b.players?.length || 0;

                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBookingId(b.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50/70 border-blue-200 shadow-xs' 
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            b.date === '2026-07-07' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {shortDate}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {b.startTime} - {b.endTime}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight line-clamp-1">
                          {b.customerName}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                          {court?.name || 'Sem Quadra'}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-slate-900">
                          {formatCurrency(b.totalValue)}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                          pCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Users className="h-2.5 w-2.5" />
                          {pCount} {pCount === 1 ? 'jog.' : 'jogs.'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Split Config & Player Registry */}
        <div className="lg:col-span-8 space-y-6">
          {selectedBooking ? (
            <div className="space-y-6">
              
              {/* Selected Booking Info Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                      {selectedBooking.sport}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      📅 {selectedBooking.date.split('-').reverse().join('/')} • ⏰ {selectedBooking.startTime} às {selectedBooking.endTime}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 mt-1.5 tracking-tight">
                    {selectedCourt?.name || 'Quadra Selecionada'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Aluguel contratado por <strong className="text-slate-800 font-bold">{contractorName}</strong> ({selectedBooking.customerPhone || 'Sem telefone'})
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Valor do Aluguel</span>
                  <span className="text-xl font-black text-slate-900">{formatCurrency(totalValue)}</span>
                </div>
              </div>

              {/* Progress/Summary Board */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Visual Stats bar */}
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
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-bold text-emerald-600">{progressPercent}% arrecadado</span>
                      <span className="text-xs font-medium text-slate-500">
                        Restante: {formatCurrency(Math.max(0, totalValue - totalCollected))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split Configuration Card */}
                <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Regra do Rateio</span>
                  
                  {/* Division settings toggle */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer py-1">
                      <input 
                        type="checkbox" 
                        checked={isEqualSplit} 
                        onChange={(e) => setIsEqualSplit(e.target.checked)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">Dividir igualmente entre todos</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer py-1">
                      <input 
                        type="checkbox" 
                        checked={includeContractor} 
                        onChange={(e) => setIncludeContractor(e.target.checked)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">Incluir dono ({contractorName})</span>
                    </label>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <HelpCircle className="h-3.5 w-3.5" title="Número de participantes ativos" />
                      <span className="text-xs font-medium">Participantes:</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {totalParticipantsCount} {totalParticipantsCount === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>

                  {isEqualSplit && totalParticipantsCount > 0 && (
                    <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Cada participante:</span>
                      <span className="text-base font-black text-blue-600">{formatCurrency(equalSplitAmount)}</span>
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valor do Racha (R$) *</label>
                          <input
                            type="number"
                            placeholder="Ex: 35.00"
                            value={playerCustomAmount}
                            onChange={(e) => setPlayerCustomAmount(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                            required
                          />
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

                  {/* Share Box */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="h-4 w-4 text-blue-500" /> Cobrança WhatsApp
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Copie o relatório pronto com a lista de pagamentos e a chave Pix para colar no grupo de WhatsApp do seu jogo!
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Copy className="h-4 w-4 text-slate-400" />
                      {copiedText ? 'Copiado para Área de Transferência!' : 'Copiar Texto de Cobrança'}
                    </button>
                  </div>
                </div>

                {/* Player List Controls & Indicators (Col 7) */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                        <Users className="h-4 w-4 text-blue-500" /> Controle de Jogadores
                      </h4>
                      {players.length > 0 && (
                        <div className="flex gap-2 items-center self-start sm:self-auto">
                          <button
                            onClick={() => handleMarkAllStatus(true)}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer bg-emerald-50 px-2 py-1 rounded-md transition"
                          >
                            Todos Pagos
                          </button>
                          <span className="text-slate-300 text-xs">|</span>
                          <button
                            onClick={() => handleMarkAllStatus(false)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer bg-blue-50 px-2 py-1 rounded-md transition"
                          >
                            Todos Pendentes
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      
                      {/* Virtual Contractor Row if included */}
                      {includeContractor && (
                        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {contractorName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate" title={contractorName}>{contractorName}</span>
                                <span className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1.5 py-0.5 rounded-full">Dono</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">Contratante do Aluguel</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <span className="text-xs font-bold text-slate-800">
                              {formatCurrency(equalSplitAmount)}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                              contractorHasPaid 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-blue-50 text-blue-600'
                            }`} title="O status de pagamento do contratante acompanha o status do aluguel geral">
                              {contractorHasPaid ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-emerald-500" /> Pago
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 text-blue-500" /> Pendente
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Regular Players list */}
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
                              className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${colorClass}`}>
                                  {initials || 'JG'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-bold text-slate-900 truncate" title={p.name}>{p.name}</h5>
                                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                    {p.phone && (
                                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-mono">
                                        <Phone className="h-2.5 w-2.5" /> {p.phone}
                                      </span>
                                    )}
                                    {p.email && (
                                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate max-w-[120px]" title={p.email}>
                                        <Mail className="h-2.5 w-2.5" /> {p.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto">
                                <span className="text-xs font-bold text-slate-800">
                                  {formatCurrency(p.amount)}
                                </span>
                                
                                <div className="flex items-center gap-2">
                                  {/* Toggle Payment Badge Button */}
                                  <button
                                    onClick={() => handleTogglePlayerPayment(p.id)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-90 transition shrink-0 ${
                                      p.hasPaid 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-blue-50 text-blue-600'
                                    }`}
                                    title="Clique para alternar o status do pagamento"
                                  >
                                    {p.hasPaid ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 text-emerald-500" /> Pago
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3 text-blue-500" /> Pendente
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleRemovePlayer(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                                    title="Remover Jogador"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white py-16 px-4 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
              <Users className="h-12 w-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Divisão de Custos do Aluguel</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Por favor, selecione um agendamento na barra lateral esquerda para começar a gerenciar os jogadores e organizar a divisão de gastos.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
