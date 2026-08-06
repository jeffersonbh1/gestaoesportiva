import React, { useState, useEffect } from 'react';
import { Booking, PlayerRating } from '../types';
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
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { isSupabaseConfigured, dbGetRatings } from '../lib/supabase';

interface PublicEvaluationViewProps {
  booking: Booking;
  courtName?: string;
  onClosePublicView?: () => void;
}

export default function PublicEvaluationView({
  booking,
  courtName = 'Quadra da Arena',
  onClosePublicView
}: PublicEvaluationViewProps) {
  // Identification step state
  const [voterType, setVoterType] = useState<'player' | 'spectator'>('player');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [voterPhone, setVoterPhone] = useState<string>('');

  // Step flow: 'identify' -> 'evaluate' -> 'already_voted' -> 'completed'
  const [step, setStep] = useState<'identify' | 'evaluate' | 'already_voted' | 'completed'>('identify');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [existingRatings, setExistingRatings] = useState<PlayerRating[]>([]);

  const allPlayers = booking.players || [];

  // Check existing ratings on mount to prevent double voting
  useEffect(() => {
    async function checkExisting() {
      if (isSupabaseConfigured) {
        try {
          const dbData = await dbGetRatings(booking.id);
          setExistingRatings(dbData);
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
    ? (selectedPlayerName || (allPlayers[0]?.name || 'Jogador'))
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

  // Handle identification submission
  const handleProceedToEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (voterType === 'player' && !selectedPlayerName) {
      if (allPlayers.length > 0) {
        setSelectedPlayerName(allPlayers[0].name);
      } else {
        setValidationError('Por favor, digite seu nome de jogador.');
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
    }

    const voterNameToVerify = voterType === 'player' 
      ? (selectedPlayerName || allPlayers[0]?.name || 'Jogador')
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

            {onClosePublicView && (
              <button 
                onClick={onClosePublicView}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <span>Voltar ao Sistema</span>
              </button>
            )}
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
                Selecione seu nome ou informe seus dados para liberar o painel de avaliação.
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

              {/* Player Selector */}
              {voterType === 'player' && (
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    Selecione seu nome na lista da partida:
                  </label>
                  {allPlayers.length > 0 ? (
                    <select
                      value={selectedPlayerName}
                      onChange={(e) => setSelectedPlayerName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Clique para escolher seu nome --</option>
                      {allPlayers.map((p) => (
                        <option key={p.id} value={p.name}>
                          👤 {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <input 
                        type="text"
                        placeholder="Digite seu nome completo de jogador"
                        value={selectedPlayerName}
                        onChange={(e) => setSelectedPlayerName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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
            <button
              type="button"
              onClick={() => setStep('identify')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer px-2 py-1 bg-white rounded-xl border border-slate-200 shadow-2xs w-fit"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar para Identificação</span>
            </button>

            <PostGameAwards
              selectedBooking={booking}
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
            className="bg-white rounded-3xl border border-amber-200 p-8 shadow-xl text-center space-y-4"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-3xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              Avaliação Já Registrada!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
              Verificamos que uma avaliação para a partida de <strong className="text-blue-700">{booking.sport}</strong> já foi enviada em seu nome (<strong>{finalVoterName}</strong>) ou neste dispositivo.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
              Sua resposta já está contabilizada na computação dos Melhores do Jogo!
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep('identify')}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Alterar Identificação
              </button>
            </div>
          </motion.div>
        )}

        {/* COMPLETED SUCCESS SCREEN */}
        {step === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-emerald-200 p-8 shadow-xl text-center space-y-5"
          >
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

            {onClosePublicView && (
              <button
                type="button"
                onClick={onClosePublicView}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs transition cursor-pointer shadow-md"
              >
                Voltar para o Sistema da Arena
              </button>
            )}
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
