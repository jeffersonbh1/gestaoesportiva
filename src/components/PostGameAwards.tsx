import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Booking, AwardQuestion } from '../types';
import { INITIAL_AWARD_QUESTIONS, getIconComponent } from './AwardQuestionsManager';
import { isSupabaseConfigured, dbSaveRating, dbSaveAvaliacaoJogo } from '../lib/supabase';
import { 
  Trophy, 
  Sparkles, 
  Crown, 
  Flame, 
  Smile, 
  Zap, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Coins, 
  Award, 
  UserCheck, 
  ArrowRight,
  ShieldAlert,
  Volleyball
} from 'lucide-react';

export interface AwardCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  badgeBg: string;
  textColor: string;
  ringColor: string;
}

const PALETTES = [
  {
    gradient: 'from-amber-400 via-yellow-400 to-amber-500',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200/80',
    textColor: 'text-amber-700',
    ringColor: 'ring-amber-400 border-amber-400 bg-amber-50/80',
  },
  {
    gradient: 'from-fuchsia-400 via-pink-400 to-purple-500',
    badgeBg: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200/80',
    textColor: 'text-fuchsia-700',
    ringColor: 'ring-fuchsia-400 border-fuchsia-400 bg-fuchsia-50/80',
  },
  {
    gradient: 'from-orange-400 via-rose-400 to-red-500',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-200/80',
    textColor: 'text-orange-700',
    ringColor: 'ring-orange-400 border-orange-400 bg-orange-50/80',
  },
  {
    gradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200/80',
    textColor: 'text-emerald-700',
    ringColor: 'ring-emerald-400 border-emerald-400 bg-emerald-50/80',
  },
  {
    gradient: 'from-blue-400 via-indigo-400 to-purple-500',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200/80',
    textColor: 'text-blue-700',
    ringColor: 'ring-blue-400 border-blue-400 bg-blue-50/80',
  }
];

export function loadAwardCategories(bookingSport?: string): AwardCategory[] {
  let questions: AwardQuestion[] = INITIAL_AWARD_QUESTIONS;
  const saved = localStorage.getItem('arena_award_questions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed;
      }
    } catch (_) {}
  }

  // Filter active questions matching sport or 'Todos'
  const activeQuestions = questions.filter(q => {
    if (!q.active) return false;
    if (!q.sport || q.sport === 'Todos') return true;
    if (!bookingSport) return true;
    return q.sport.toLowerCase() === bookingSport.toLowerCase();
  });

  const finalQuestions = activeQuestions.length > 0 ? activeQuestions : questions.filter(q => q.active);

  return finalQuestions.map((q, index) => {
    const palette = PALETTES[index % PALETTES.length];
    return {
      id: q.id,
      title: q.title,
      subtitle: q.subtitle,
      icon: getIconComponent(q.iconName),
      ...palette
    };
  });
}

interface PostGameAwardsProps {
  selectedBooking: Booking;
  onVoteSubmitted?: (votes: Record<string, string>, voterName: string) => void;
  onClose?: () => void;
  initialVoterName?: string;
}

export default function PostGameAwards({ selectedBooking, onVoteSubmitted, onClose, initialVoterName }: PostGameAwardsProps) {
  // Dynamically load active categories from registered questions
  const categories = useMemo(() => {
    return loadAwardCategories(selectedBooking.sport);
  }, [selectedBooking.sport]);

  // Current Voter state
  const [voterName, setVoterName] = useState<string>(() => {
    if (initialVoterName) return initialVoterName;
    return selectedBooking.players && selectedBooking.players.length > 0
      ? selectedBooking.players[0].name
      : selectedBooking.customerName;
  });

  // Category index (0 to categories.length - 1)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);
  
  // Slide direction: 1 for next, -1 for back
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Selected player ID for the current category
  const [selectedPlayerPerCategory, setSelectedPlayerPerCategory] = useState<Record<string, string>>({});

  // Completed / Finished state
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // All players in this booking
  const allPlayers = selectedBooking.players || [];

  // Filter out the current voting user so they don't vote on themselves
  const eligibleNominees = allPlayers.filter(p => p.name.toLowerCase() !== voterName.toLowerCase());

  const currentCategory = categories[currentCategoryIndex] || categories[0];
  const progressPercent = categories.length > 0 
    ? Math.round(((currentCategoryIndex + 1) / categories.length) * 100)
    : 0;

  // Get current selection
  const currentSelectedPlayerId = currentCategory ? (selectedPlayerPerCategory[currentCategory.id] || '') : '';

  // Handle Player Select
  const handleSelectPlayer = (playerId: string) => {
    if (!currentCategory) return;
    setSelectedPlayerPerCategory(prev => ({
      ...prev,
      [currentCategory.id]: playerId
    }));
  };

  // Next category handler
  const handleConfirmVote = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setSlideDirection(1);
      setCurrentCategoryIndex(prev => prev + 1);
    } else {
      triggerCompletion();
    }
  };

  // Skip category handler
  const handleSkipCategory = () => {
    if (currentCategory) {
      setSelectedPlayerPerCategory(prev => {
        const next = { ...prev };
        delete next[currentCategory.id];
        return next;
      });
    }

    if (currentCategoryIndex < categories.length - 1) {
      setSlideDirection(1);
      setCurrentCategoryIndex(prev => prev + 1);
    } else {
      triggerCompletion();
    }
  };

  // Back button handler
  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setSlideDirection(-1);
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };


  // Trigger celebration & completion
  const triggerCompletion = () => {
    setIsFinished(true);

    // Save votes to database if Supabase is configured
    if (isSupabaseConfigured) {
      Object.entries(selectedPlayerPerCategory).forEach(([catId, votedPlayerId]) => {
        const votedPlayerObj = eligibleNominees.find(p => p.id === votedPlayerId || p.name === votedPlayerId);
        const votedPlayerName: string = votedPlayerObj ? votedPlayerObj.name : String(votedPlayerId || '');
        
        if (votedPlayerName) {
          dbSaveRating({
            bookingId: selectedBooking.id,
            evaluatorName: voterName,
            ratedPlayerName: votedPlayerName,
            rating: 5,
            createdAt: new Date().toISOString()
          });

          dbSaveAvaliacaoJogo({
            bookingId: selectedBooking.id,
            voterType: 'jogador',
            evaluatorName: voterName,
            perguntaId: catId,
            ratedPlayerName: votedPlayerName,
            rating: 5,
          });
        }
      });
    }

    // Launch Confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899']
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#F59E0B', '#10B981', '#6366F1']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#EC4899', '#3B82F6', '#F59E0B']
        });
      }, 250);
    } catch (e) {
      console.log('Confetti error:', e);
    }

    if (onVoteSubmitted) {
      onVoteSubmitted(selectedPlayerPerCategory, voterName);
    }
  };

  // Restart / Revote
  const handleRestart = () => {
    setIsFinished(false);
    setCurrentCategoryIndex(0);
    setSelectedPlayerPerCategory({});
  };

  // Helper for player initials
  const getPlayerInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Variants for slide transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.97
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: 'easeOut'
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.97,
      transition: {
        duration: 0.18,
        ease: 'easeIn'
      }
    })
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden relative max-w-2xl mx-auto my-2">
      {/* Subtle Top Gradient Glow */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/10 via-yellow-400/5 to-transparent pointer-events-none"></div>

      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 relative z-10 bg-slate-50/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5 text-slate-900">
              Premiação do Jogo <Sparkles className="h-4 w-4 text-amber-500" />
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              Avaliação Pós-Partida • {selectedBooking.sport}
            </p>
          </div>
        </div>

        {/* Voter Selector Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs">
          <UserCheck className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <div className="text-left">
            <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Votando como</span>
            <select
              value={voterName}
              onChange={(e) => {
                setVoterName(e.target.value);
                setSelectedPlayerPerCategory({});
              }}
              className="bg-transparent text-slate-900 text-[11px] font-bold focus:outline-none cursor-pointer pr-1"
            >
              {allPlayers.map((p) => (
                <option key={p.id} value={p.name} className="bg-white text-slate-900">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. TOP PROGRESS BAR */}
      <div className="px-5 pt-4 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
          <span className="flex items-center gap-1.5 text-[11px] text-amber-600 font-extrabold">
            <Award className="h-3.5 w-3.5 text-amber-500" /> Categoria {currentCategoryIndex + 1} de {categories.length}
          </span>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">
            {progressPercent}% concluído
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-1 border border-slate-200/60">
          {categories.map((cat, idx) => {
            const isDone = idx < currentCategoryIndex || (isFinished && selectedPlayerPerCategory[cat.id]);
            const isCurrent = idx === currentCategoryIndex && !isFinished;
            return (
              <div
                key={cat.id}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  isDone 
                    ? 'bg-emerald-500 shadow-xs' 
                    : isCurrent 
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 animate-pulse' 
                    : 'bg-slate-200/80'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="p-4 sm:p-6 min-h-[380px] flex flex-col justify-between relative overflow-hidden bg-slate-50/40">
        {!isFinished ? (
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={currentCategory.id}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5 flex-1"
            >
              {/* 2. DYNAMIC CATEGORY HEADER */}
              <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-yellow-50/60 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-start gap-3.5 relative z-10">
                  <div className={`p-3 rounded-2xl bg-gradient-to-tr ${currentCategory.gradient} text-slate-950 font-black shadow-md shrink-0 mt-0.5`}>
                    <currentCategory.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1 ${currentCategory.badgeBg}`}>
                      {currentCategory.title.split(' ')[0]} Award
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                      {currentCategory.title}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                      {currentCategory.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. PLAYER SELECTION GRID */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Volleyball className="h-3.5 w-3.5 text-blue-500" /> Escolha um participante (Toque para votar):
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {eligibleNominees.length} atletas
                  </span>
                </div>

                {eligibleNominees.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Nenhum outro jogador disponível nesta partida</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      Adicione mais participantes na aba 'Racha &amp; Jogadores' para que possam votar uns nos outros!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {eligibleNominees.map((player, idx) => {
                      const isSelected = currentSelectedPlayerId === player.id || currentSelectedPlayerId === player.name;
                      
                      // Assign visual Team A or Team B
                      const teamLetter = idx % 2 === 0 ? 'A' : 'B';
                      const teamBadgeClass = teamLetter === 'A' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200/80' 
                        : 'bg-amber-50 text-amber-800 border-amber-200/80';

                      return (
                        <motion.button
                          key={player.id}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleSelectPlayer(player.id || player.name)}
                          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative cursor-pointer flex flex-col justify-between min-h-[100px] ${
                            isSelected 
                              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/80 shadow-md shadow-amber-500/10'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          {/* Selection Checkmark Badge */}
                          {isSelected && (
                            <motion.div 
                              initial={{ scale: 0 }} 
                              animate={{ scale: 1 }}
                              className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs z-10"
                            >
                              <CheckCircle className="h-3.5 w-3.5 stroke-[3]" />
                            </motion.div>
                          )}

                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar */}
                            <div className={`h-9 w-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 border ${
                              isSelected 
                                ? 'bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 border-amber-300 shadow-sm' 
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {getPlayerInitials(player.name)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight" title={player.name}>
                                {player.name}
                              </h4>
                              <div className="mt-1 flex items-center gap-1">
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-md border ${teamBadgeClass}`}>
                                  Time {teamLetter}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px]">
                            <span className="text-slate-400 font-medium">Votar neste atleta</span>
                            <span className={isSelected ? 'text-amber-700 font-bold' : 'text-slate-400 font-semibold'}>
                              {isSelected ? 'Selecionado' : '+ Voto'}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* COMPLETION VIEW */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-6 px-4 text-center space-y-6 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 font-black animate-bounce">
                <Trophy className="h-10 w-10" />
              </div>
              <Sparkles className="h-6 w-6 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Votação Concluída com Sucesso! 🏆
              </h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Obrigado por registrar seus votos, <strong className="text-amber-700">{voterName}</strong>! Seus votos foram computados na classificação do racha.
              </p>
            </div>

            {/* Rewards Card */}
            <div className="w-full max-w-md bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center justify-center gap-1">
                <Coins className="h-3.5 w-3.5 text-amber-500" /> Recompensas do Votante
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 text-center">
                  <span className="text-lg font-black text-amber-700 block">+150 XP</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Experiência de Quadra</span>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 text-center">
                  <span className="text-lg font-black text-emerald-700 block">+50 Moedas</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Fahel Arena Coins</span>
                </div>
              </div>

              {/* Summary of Votes */}
              <div className="mt-3 pt-3 border-t border-slate-100 text-left space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Resumo dos seus votos:</span>
                {categories.map(cat => {
                  const chosenPlayerId = selectedPlayerPerCategory[cat.id];
                  const chosenPlayer = eligibleNominees.find(p => p.id === chosenPlayerId || p.name === chosenPlayerId);
                  return (
                    <div key={cat.id} className="flex justify-between items-center text-xs py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-200/60">
                      <span className="text-slate-600 font-medium truncate max-w-[150px]">{cat.title.split('(')[0]}</span>
                      <span className="font-bold text-slate-900 truncate max-w-[120px]">
                        {chosenPlayer ? chosenPlayer.name : 'Pulou voto'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <RotateCcw className="h-4 w-4" /> Votar com Outro Jogador
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Ver Hall da Fama <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* 5. ACTION BUTTONS (STICKY BOTTOM BAR) */}
      {!isFinished && (
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 relative z-10">
          {/* Back button */}
          {currentCategoryIndex > 0 ? (
            <button
              type="button"
              onClick={handlePreviousCategory}
              className="px-3.5 py-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Voltar Categoria"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          ) : (
            <div className="w-10"></div>
          )}

          {/* Secondary Skip button */}
          <button
            type="button"
            onClick={handleSkipCategory}
            className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer transition hover:underline"
          >
            Pular Categoria
          </button>

          {/* Primary Confirm Vote button */}
          <button
            type="button"
            onClick={handleConfirmVote}
            disabled={!currentSelectedPlayerId}
            className={`px-5 py-3 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 ${
              currentSelectedPlayerId
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-500/20 hover:brightness-105 active:scale-95'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <span>{currentCategoryIndex === categories.length - 1 ? 'Finalizar Votação 🏆' : 'Confirmar Voto'}</span>
            <ChevronRight className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
      )}
    </div>
  );
}
