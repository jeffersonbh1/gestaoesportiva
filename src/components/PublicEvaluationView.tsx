import React, { useState, useEffect } from 'react';
import { Booking, PlayerRating, Player } from '../types';
import PostGameAwards from './PostGameAwards';
import { 
  Trophy, 
  User, 
  Calendar, 
  Clock,
  MapPin,
  CheckCircle, 
  Award, 
  Sparkles, 
  ShieldAlert, 
  Lock, 
  Users, 
  Phone, 
  ArrowRight, 
  Check,
  Volleyball,
  Crown,
  ChevronLeft,
  UserPlus,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { isSupabaseConfigured, dbGetRatings, dbGetJogadores, dbSaveJogador, dbSaveTorcedor } from '../lib/supabase';

interface PublicEvaluationViewProps {
  booking: Booking;
  courtName?: string;
  onClosePublicView?: () => void;
}

export default function PublicEvaluationView({
  booking,
  courtName = 'Quadra da Arena'
}: PublicEvaluationViewProps) {
  // Identification step state
  const [voterType, setVoterType] = useState<'player' | 'spectator'>('player');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [voterPhone, setVoterPhone] = useState<string>('');

  // Player registration state
  const [showAddPlayerForm, setShowAddPlayerForm] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [currentPlayers, setCurrentPlayers] = useState<Player[]>(() => {
    const localKey = `arena_booking_players_${booking.id}`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_) {}
    }
    return booking.players || [];
  });

  // Step flow: 'identify' -> 'evaluate' -> 'already_voted' -> 'completed' -> 'results'
  const [step, setStep] = useState<'identify' | 'evaluate' | 'already_voted' | 'completed' | 'results'>('identify');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [existingRatings, setExistingRatings] = useState<PlayerRating[]>([]);

  // Check existing ratings and load database players on mount
  useEffect(() => {
    async function checkExisting() {
      if (isSupabaseConfigured) {
        try {
          const dbData = await dbGetRatings(booking.id);
          setExistingRatings(dbData);

          const dbPlayers = await dbGetJogadores(booking.id);
          if (dbPlayers && dbPlayers.length > 0) {
            setCurrentPlayers(dbPlayers);
          }
        } catch (_) {}
      } else {
        const local = localStorage.getItem(`ratings_${booking.id}`);
        if (local) {
          try { setExistingRatings(JSON.parse(local)); } catch (_) {}
        }
      }
    }
    checkExisting();
  }, [booking.id]);

  // Derived voter name
  const finalVoterName = voterType === 'player' 
    ? (selectedPlayerName || (currentPlayers[0]?.name || 'Jogador'))
    : customName.trim();

  // Helper to check duplicate vote
  const checkIfAlreadyVoted = (nameToCheck: string, phoneToCheck: string) => {
    const cleanName = nameToCheck.trim().toLowerCase();
    const cleanPhone = phoneToCheck.trim();

    // LocalStorage Check
    const localVoteKey = `arena_voted_${booking.id}_${cleanName}`;
    const localPhoneVoteKey = cleanPhone ? `arena_voted_phone_${booking.id}_${cleanPhone}` : null;
    if (localStorage.getItem(localVoteKey) || (localPhoneVoteKey && localStorage.getItem(localPhoneVoteKey))) {
      return true;
    }

    // Database/State Check
    const hasDbVote = existingRatings.some(r => r.evaluatorName.trim().toLowerCase() === cleanName);
    return hasDbVote;
  };

  // Add new player dynamically
  const handleAddNewPlayer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    // Check if player already exists
    const exists = currentPlayers.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setSelectedPlayerName(trimmed);
      setShowAddPlayerForm(false);
      setNewPlayerName('');
      return;
    }

    const newPlayerObj: Player = {
      id: `p_dyn_${Date.now()}`,
      name: trimmed,
      hasPaid: false,
      amount: 0
    };

    if (isSupabaseConfigured) {
      const savedDbPlayer = await dbSaveJogador(newPlayerObj, booking.id);
      if (savedDbPlayer) {
        newPlayerObj.id = savedDbPlayer.id;
      }
    }

    const updated = [...currentPlayers, newPlayerObj];
    setCurrentPlayers(updated);
    localStorage.setItem(`arena_booking_players_${booking.id}`, JSON.stringify(updated));
    setSelectedPlayerName(trimmed);
    setNewPlayerName('');
    setShowAddPlayerForm(false);
    setValidationError(null);
  };

  // Handle identification submission
  const handleProceedToEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (voterType === 'player' && !selectedPlayerName) {
      if (currentPlayers.length > 0) {
        setSelectedPlayerName(currentPlayers[0].name);
      } else {
        setValidationError('Por favor, cadastre ou selecione seu nome de jogador.');
        return;
      }
    }

    if (voterType === 'spectator') {
      if (!customName.trim()) {
        setValidationError('Por favor, digite seu nome completo.');
        return;
      }
      if (!voterPhone.trim() || voterPhone.trim().length < 8) {
        setValidationError('Por favor, informe seu telefone/WhatsApp para validação.');
        return;
      }

      // Save torcedor to database
      if (isSupabaseConfigured) {
        await dbSaveTorcedor({
          name: customName.trim(),
          phone: voterPhone.trim(),
          bookingId: booking.id
        });
      }
    }

    const voterNameToVerify = voterType === 'player' 
      ? (selectedPlayerName || currentPlayers[0]?.name || 'Jogador')
      : customName.trim();

    if (checkIfAlreadyVoted(voterNameToVerify, voterPhone)) {
      setStep('already_voted');
      return;
    }

    setStep('evaluate');
  };

  // Handle vote completion from PostGameAwards
  const handleAwardVoteSubmitted = (votes: Record<string, string>, voterNameSubmitted: string) => {
    const cleanName = (voterNameSubmitted || finalVoterName).trim().toLowerCase();
    localStorage.setItem(`arena_voted_${booking.id}_${cleanName}`, 'true');
    if (voterPhone) {
      localStorage.setItem(`arena_voted_phone_${booking.id}_${voterPhone.trim()}`, 'true');
    }

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6']
      });
    } catch (_) {}

    setStep('completed');
  };

  const bookingWithUpdatedPlayers: Booking = {
    ...booking,
    players: currentPlayers
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      <div className="max-w-2xl mx-auto w-full space-y-5">
        
        {/* HEADER BANNER - NO CUSTOMER NAME, SHOW DATE, TIME, SPORT & COURT */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="px-3.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Avaliação de Partida
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="h-7 w-7 text-amber-500 shrink-0" />
              Partida de {booking.sport}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
              {courtName}
            </p>
          </div>

          {/* Date & Time Highlights */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-black">Data do Jogo</span>
                <span>{booking.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-black">Horário</span>
                <span>{booking.startTime} às {booking.endTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: IDENTIFICATION SCREEN (LIGHT THEME) */}
        {step === 'identify' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Identificação do Votante
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Selecione seu nome ou cadastre-se para liberar o painel de avaliação.
              </p>
            </div>

            {validationError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleProceedToEvaluation} className="space-y-5">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVoterType('player')}
                  className={`py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                    voterType === 'player'
                      ? 'bg-white text-blue-700 shadow-md border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Sou Jogador(a)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVoterType('spectator')}
                  className={`py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                    voterType === 'spectator'
                      ? 'bg-white text-blue-700 shadow-md border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Sou Torcedor/Espectador</span>
                </button>
              </div>

              {/* Player Selector & Registration */}
              {voterType === 'player' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Selecione seu nome na partida:
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowAddPlayerForm(!showAddPlayerForm)}
                      className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>{showAddPlayerForm ? 'Ver Lista' : '+ Cadastrar Jogador'}</span>
                    </button>
                  </div>

                  {/* Add Player Inline Form */}
                  {showAddPlayerForm ? (
                    <div className="p-4 bg-slate-50 border border-blue-200 rounded-2xl space-y-3">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Plus className="h-4 w-4 text-blue-600" />
                        Cadastrar Novo Jogador na Partida
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Digite o nome do jogador"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddNewPlayer()}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ) : (
                    currentPlayers.length > 0 ? (
                      <select
                        value={selectedPlayerName}
                        onChange={(e) => setSelectedPlayerName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Clique para escolher seu nome --</option>
                        {currentPlayers.map((p) => (
                          <option key={p.id} value={p.name}>
                            👤 {p.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                        <p className="text-xs text-amber-800 font-bold">Nenhum jogador cadastrado nesta partida ainda.</p>
                        <button
                          type="button"
                          onClick={() => setShowAddPlayerForm(true)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                        >
                          + Cadastrar Primeiro Jogador
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Spectator Inputs */}
              {voterType === 'spectator' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Seu Nome Completo *</label>
                    <input 
                      type="text"
                      placeholder="Ex: Carlos Silva"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Seu Telefone / WhatsApp * (Validação Anti-Voto Duplo)</label>
                    <input 
                      type="tel"
                      placeholder="(31) 99999-8888"
                      value={voterPhone}
                      onChange={(e) => setVoterPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Anti-fraud disclaimer */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                <Lock className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">
                  <strong>Segurança da Pesquisa:</strong> É permitida apenas 1 (uma) avaliação por participante para garantir votações imparciais nos destaques do jogo.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Iniciar Avaliação dos Jogadores</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Direct Link to View Podium / Results */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('results')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 px-4 py-2.5 rounded-2xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Ver Pódio & Classificação do Racha 🏆</span>
                </button>
              </div>

            </form>
          </motion.div>
        )}

        {/* STEP 2: FULL POST GAME AWARDS EXPERIENCE */}
        {step === 'evaluate' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <PostGameAwards
              selectedBooking={bookingWithUpdatedPlayers}
              initialVoterName={finalVoterName}
              onVoteSubmitted={handleAwardVoteSubmitted}
            />
          </motion.div>
        )}

        {/* ALREADY VOTED SCREEN */}
        {step === 'already_voted' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8 shadow-xl text-center space-y-5"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-3xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">
                Avaliação Já Registrada!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
                Verificamos que uma avaliação para a partida de <strong className="text-blue-700">{booking.sport}</strong> já foi enviada em seu nome (<strong>{finalVoterName}</strong>) ou neste dispositivo.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
              Sua resposta já está contabilizada na computação dos Melhores do Jogo!
            </div>

            <button
              type="button"
              onClick={() => setStep('results')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Crown className="h-4.5 w-4.5 shrink-0" />
              <span>Ver Classificação & Pódio do Racha 🏆</span>
            </button>
          </motion.div>
        )}

        {/* COMPLETED SUCCESS SCREEN */}
        {step === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Avaliação Enviada com Sucesso!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Obrigado por votar nos Melhores do Jogo da Arena!
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold">
                🏆 Seus votos foram contabilizados nos resultados da partida!
              </div>

              <button
                type="button"
                onClick={() => setStep('results')}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Crown className="h-5 w-5 shrink-0" />
                <span>Ver Pódio & Resultado Final 🏆</span>
              </button>
            </div>

            {/* Embedded Podium */}
            <PostGameAwards
              selectedBooking={bookingWithUpdatedPlayers}
              initialVoterName={finalVoterName}
              initialFinished={true}
            />
          </motion.div>
        )}

        {/* DEDICATED RESULTS SCREEN */}
        {step === 'results' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="text-xs font-black text-slate-900">Resultado & Pódio dos Mais Votados</span>
              </div>
              <button
                type="button"
                onClick={() => setStep('identify')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
              >
                ⬅️ Tela Inicial
              </button>
            </div>

            <PostGameAwards
              selectedBooking={bookingWithUpdatedPlayers}
              initialVoterName={finalVoterName}
              initialFinished={true}
            />
          </motion.div>
        )}

      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-[11px] text-slate-400 font-medium">
        Arena Esportiva • Sistema de Gestão de Quadras & Avaliações do Jogo
      </footer>

    </div>
  );
}

