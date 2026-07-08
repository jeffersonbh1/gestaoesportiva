import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Booking, PlayerRating } from '../types';
import { 
  Trophy, 
  Star, 
  User, 
  Calendar, 
  Plus, 
  Search, 
  Sparkles, 
  Users, 
  CheckCircle,
  ThumbsUp,
  Award
} from 'lucide-react';
import { isSupabaseConfigured, dbGetRatings, dbSaveRating } from '../lib/supabase';

interface PlayerRatingManagerProps {
  bookings: Booking[];
}

export default function PlayerRatingManager({ bookings }: PlayerRatingManagerProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [evaluator, setEvaluator] = useState<string>('');
  const [ratedPlayer, setRatedPlayer] = useState<string>('');
  const [stars, setStars] = useState<number>(5);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter bookings to show only those that have players registered
  const eligibleBookings = bookings.filter(b => 
    b.players && b.players.length > 0
  );

  const filteredBookings = eligibleBookings.filter(b => 
    b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.date.includes(searchTerm)
  );

  // Fetch ratings for selected booking
  useEffect(() => {
    async function fetchRatings() {
      if (!selectedBooking) return;
      
      if (isSupabaseConfigured) {
        try {
          setLoading(true);
          const dbData = await dbGetRatings(selectedBooking.id);
          setRatings(dbData);
        } catch (err) {
          console.error("Erro ao carregar avaliações do Supabase:", err);
          loadLocalRatings();
        } finally {
          setLoading(false);
        }
      } else {
        loadLocalRatings();
      }
    }

    function loadLocalRatings() {
      if (!selectedBooking) return;
      const local = localStorage.getItem(`ratings_${selectedBooking.id}`);
      if (local) {
        setRatings(JSON.parse(local));
      } else {
        setRatings([]);
      }
    }

    fetchRatings();
    setEvaluator('');
    setRatedPlayer('');
    setStars(5);
    setMessage(null);
  }, [selectedBooking]);

  const handleSaveLocalRating = (newRating: PlayerRating) => {
    if (!selectedBooking) return;
    const localKey = `ratings_${selectedBooking.id}`;
    const local = localStorage.getItem(localKey);
    let currentRatings: PlayerRating[] = local ? JSON.parse(local) : [];
    
    // Remove if already exists (onConflict)
    currentRatings = currentRatings.filter(
      r => !(r.evaluatorName === newRating.evaluatorName && r.ratedPlayerName === newRating.ratedPlayerName)
    );
    
    const updated = [...currentRatings, newRating];
    localStorage.setItem(localKey, JSON.stringify(updated));
    setRatings(updated);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !evaluator || !ratedPlayer) {
      setMessage({ type: 'error', text: 'Por favor, selecione quem avalia e quem é avaliado.' });
      return;
    }

    if (evaluator === ratedPlayer) {
      setMessage({ type: 'error', text: 'Você não pode se autoavaliar!' });
      return;
    }

    const newRating: PlayerRating = {
      id: `rating-${Date.now()}`,
      bookingId: selectedBooking.id,
      evaluatorName: evaluator,
      ratedPlayerName: ratedPlayer,
      rating: stars
    };

    try {
      setMessage(null);
      if (isSupabaseConfigured) {
        await dbSaveRating(newRating);
        // Refresh from DB
        const updated = await dbGetRatings(selectedBooking.id);
        setRatings(updated);
      } else {
        handleSaveLocalRating(newRating);
      }
      
      setMessage({ type: 'success', text: `Avaliação de ${evaluator} para ${ratedPlayer} salva!` });
      setRatedPlayer('');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Ocorreu um erro ao salvar a avaliação.' });
    }
  };

  // Calculate top 3 players
  const getTop3Players = () => {
    if (!selectedBooking || !selectedBooking.players) return [];

    const playerScores: Record<string, { total: number; count: number }> = {};
    
    // Initialize all players of this booking
    selectedBooking.players.forEach(p => {
      playerScores[p.name] = { total: 0, count: 0 };
    });

    // Populate stars/scores from ratings
    ratings.forEach(r => {
      if (playerScores[r.ratedPlayerName] !== undefined) {
        playerScores[r.ratedPlayerName].total += r.rating;
        playerScores[r.ratedPlayerName].count += 1;
      }
    });

    // Transform into sortable list
    const list = Object.entries(playerScores).map(([name, data]) => {
      const average = data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0;
      return {
        name,
        average,
        totalStars: data.total,
        votesCount: data.count,
      };
    });

    // Sort: 1st by average rating, then by total stars, then by vote count
    return list
      .filter(p => p.votesCount > 0) // Only show players who received at least one evaluation
      .sort((a, b) => b.average - a.average || b.totalStars - a.totalStars)
      .slice(0, 3);
  };

  const top3 = getTop3Players();

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Melhores do Jogo & Avaliações
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Selecione uma partida para que os jogadores avaliem uns aos outros e revelem o Top 3 MVP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Match List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> Selecione a Partida
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou esporte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Bookings List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                  {eligibleBookings.length === 0 
                    ? "Nenhum agendamento com jogadores do racha cadastrados. Adicione jogadores no menu 'Racha & Jogadores'." 
                    : "Nenhuma partida encontrada com o termo buscado."}
                </div>
              ) : (
                filteredBookings.map((b) => {
                  const isSelected = selectedBooking?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                        isSelected 
                          ? 'border-blue-400 bg-blue-50/20' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {b.date.split('-').reverse().join('/')} • {b.startTime}
                          </span>
                          <span className="bg-blue-100 text-blue-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">
                            {b.sport}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          Responsável: {b.customerName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {b.players?.length || 0} jogadores registrados no racha
                        </p>
                      </div>
                      <div className="text-slate-400 shrink-0">
                        <Award className={`h-4.5 w-4.5 transition ${isSelected ? 'text-blue-500 scale-110' : ''}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Evaluation Form and Top 3 MVP Display */}
        <div className="lg:col-span-7 space-y-6">
          {selectedBooking ? (
            <>
              {/* Top 3 Podium Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-yellow-50 rounded-full blur-2xl -z-10"></div>
                
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 mb-6">
                  <Trophy className="h-4.5 w-4.5 text-yellow-500" /> Top 3 Melhores do Jogo (MVP)
                </h3>

                {top3.length === 0 ? (
                  <div className="text-center py-12 px-4 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl">
                    <Sparkles className="h-8 w-8 text-yellow-400 mb-2.5 animate-bounce" />
                    <p className="text-xs font-bold text-slate-700">Ainda sem avaliações computadas</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Use o formulário abaixo para enviar as avaliações dos jogadores e ver o pódio em tempo real!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 mt-2">
                    {/* Podium Order Representation */}
                    {/* We want to show 2nd Place, 1st Place, 3rd Place for classic visual podium effect */}
                    {[
                      top3[1], // 2nd Place (if exists)
                      top3[0], // 1st Place
                      top3[2]  // 3rd Place (if exists)
                    ].map((player, index) => {
                      if (!player) return <div key={`empty-${index}`} className="hidden md:block md:flex-1"></div>;
                      
                      const actualRank = top3.indexOf(player) + 1;
                      
                      // Style configurations
                      const config = {
                        1: {
                          bg: 'bg-yellow-50 border-yellow-200 shadow-md shadow-yellow-50',
                          medalColor: 'text-yellow-500 bg-yellow-100',
                          badge: '🥇 1º Lugar',
                          rankLabel: 'Vencedor do Racha'
                        },
                        2: {
                          bg: 'bg-slate-50 border-slate-200',
                          medalColor: 'text-slate-400 bg-slate-100',
                          badge: '🥈 2º Lugar',
                          rankLabel: 'Segundo MVP'
                        },
                        3: {
                          bg: 'bg-amber-50/50 border-amber-200/60',
                          medalColor: 'text-amber-600 bg-amber-100',
                          badge: '🥉 3º Lugar',
                          rankLabel: 'Terceiro MVP'
                        }
                      }[actualRank as 1 | 2 | 3];

                      return (
                        <motion.div
                          key={player.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex-1 p-4 rounded-xl border flex flex-col justify-between items-center text-center ${config.bg}`}
                        >
                          <div className="space-y-2">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${config.medalColor}`}>
                              {config.badge}
                            </span>
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center mx-auto shadow-sm">
                              {player.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 truncate max-w-[140px]" title={player.name}>
                                {player.name}
                              </h4>
                              <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                {config.rankLabel}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 w-full">
                            <div className="flex items-center justify-center gap-1 text-yellow-500 font-extrabold text-xs">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{player.average}</span>
                              <span className="text-[10px] text-slate-400 font-normal">/5</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 block mt-0.5">
                              {player.votesCount} avaliações recebidas
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Evaluation Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <ThumbsUp className="h-4.5 w-4.5 text-blue-500" /> Avaliar Jogadores da Partida
                </h3>

                {message && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    message.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-800 border border-rose-100'
                  }`}>
                    <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{message.text}</span>
                  </div>
                )}

                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Evaluator Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Quem está avaliando? (Votante)
                      </label>
                      <select
                        value={evaluator}
                        onChange={(e) => setEvaluator(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione o jogador votante...</option>
                        {selectedBooking.players?.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rated Player Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Quem você quer avaliar?
                      </label>
                      <select
                        value={ratedPlayer}
                        onChange={(e) => setRatedPlayer(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione quem vai avaliar...</option>
                        {selectedBooking.players
                          ?.filter(p => p.name !== evaluator)
                          .map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Stars Rating Selector */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Atribuir Estrelas (Nota do Desempenho)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isActive = starValue <= stars;
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setStars(starValue)}
                            className="p-1 transition duration-150 hover:scale-125 cursor-pointer"
                          >
                            <Star 
                              className={`h-7 w-7 transition-colors ${
                                isActive 
                                  ? 'text-yellow-500 fill-yellow-500' 
                                  : 'text-slate-300'
                              }`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      {
                        stars === 5 ? "⭐️ Incrível (MVP do Racha)" :
                        stars === 4 ? "⭐ Muito Bom" :
                        stars === 3 ? "⭐ Regular" :
                        stars === 2 ? "⭐ Abaixo da Média" : "⭐ Ruim"
                      }
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-100"
                  >
                    <CheckCircle className="h-4 w-4" /> Enviar Avaliação
                  </button>
                </form>
              </div>

              {/* Already Voted list log / Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[10px] text-slate-500 font-semibold leading-relaxed">
                <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Informativo de Votação:
                </span>
                <p>
                  Cada participante do racha pode avaliar qualquer outro participante da partida uma vez, atribuindo de 1 a 5 estrelas. O sistema calcula a média ponderada e exibe apenas os 3 melhores do jogo de forma secreta e objetiva no pódio de destaque!
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 bg-blue-50 text-blue-500 rounded-full mb-3">
                <Trophy className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-slate-800">Selecione uma Partida</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Escolha uma partida no menu à esquerda para visualizar e preencher as avaliações dos jogadores cadastrados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
