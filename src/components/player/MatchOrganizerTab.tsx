import React, { useState, useMemo } from 'react';
import { Jogador, EquipeJogador, EquipeMembro, TipoAlgoritmoSorteio, SorteioHistorico } from '../../types';
import StarRating from './StarRating';
import { executeDraw, formatWhatsAppMessage, convertDrawToResultadoItems, DrawResult } from './drawAlgorithm';
import { 
  Sparkles, 
  Users, 
  CheckSquare, 
  Square, 
  Shuffle, 
  Scale, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  ChevronRight,
  AlertCircle,
  Trophy,
  History
} from 'lucide-react';

interface MatchOrganizerTabProps {
  currentJogador: Jogador;
  equipes: EquipeJogador[];
  membros: EquipeMembro[];
  selectedEquipeId?: string;
  onSaveSorteio: (sorteio: SorteioHistorico) => void;
  onNavigateToHistory: () => void;
}

export default function MatchOrganizerTab({
  currentJogador,
  equipes,
  membros,
  selectedEquipeId,
  onSaveSorteio,
  onNavigateToHistory,
}: MatchOrganizerTabProps) {
  // Select active team
  const [activeEquipeId, setActiveEquipeId] = useState<string>(() => {
    if (selectedEquipeId && equipes.some((e) => e.id === selectedEquipeId)) {
      return selectedEquipeId;
    }
    return equipes[0]?.id || '';
  });

  // Keep synced if prop changes
  React.useEffect(() => {
    if (selectedEquipeId && equipes.some((e) => e.id === selectedEquipeId)) {
      setActiveEquipeId(selectedEquipeId);
    }
  }, [selectedEquipeId, equipes]);

  const activeTeam = useMemo(() => {
    return equipes.find((e) => e.id === activeEquipeId);
  }, [equipes, activeEquipeId]);

  const teamMembros = useMemo(() => {
    return membros.filter((m) => m.equipeId === activeEquipeId);
  }, [membros, activeEquipeId]);

  // Presence State (Set of jogadorIds marked as present)
  const [presentPlayerIds, setPresentPlayerIds] = useState<Set<string>>(() => {
    return new Set(teamMembros.map((m) => m.jogadorId));
  });

  // When active team changes, mark all its members present by default
  React.useEffect(() => {
    setPresentPlayerIds(new Set(teamMembros.map((m) => m.jogadorId)));
  }, [activeEquipeId]);

  // Draw Configuration
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(2);
  const [customPlayersPerTeam, setCustomPlayersPerTeam] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<TipoAlgoritmoSorteio>('equilibrado');

  // Draw Result & Feedback
  const [currentDrawResult, setCurrentDrawResult] = useState<DrawResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const effectivePlayersPerTeam = customPlayersPerTeam
    ? parseInt(customPlayersPerTeam, 10) || 2
    : playersPerTeam;

  const togglePlayerPresence = (jogadorId: string) => {
    setPresentPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(jogadorId)) {
        next.delete(jogadorId);
      } else {
        next.add(jogadorId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setPresentPlayerIds(new Set(teamMembros.map((m) => m.jogadorId)));
  };

  const handleDeselectAll = () => {
    setPresentPlayerIds(new Set());
  };

  const handleExecuteDraw = () => {
    if (!activeTeam) return;

    // Filter present players
    const presentList = teamMembros
      .filter((m) => presentPlayerIds.has(m.jogadorId))
      .map((m) => ({
        id: m.jogadorId,
        name: m.nomeApelido || 'Jogador',
        email: m.email,
        rating: m.classificacaoNaEquipe || 3,
      }));

    if (presentList.length < effectivePlayersPerTeam) {
      alert(`Selecione pelo menos ${effectivePlayersPerTeam} jogadores presentes para realizar o sorteio.`);
      return;
    }

    const result = executeDraw(presentList, effectivePlayersPerTeam, algorithm);
    setCurrentDrawResult(result);
    setIsCopied(false);

    // Automatically persist to the permanent audit history
    const sorteioId = `sort-${Date.now()}`;
    const newSorteio: SorteioHistorico = {
      id: sorteioId,
      equipeId: activeTeam.id,
      equipeNome: activeTeam.nome,
      realizadoPorJogadorId: currentJogador.id,
      realizadoPorNome: currentJogador.nomeApelido,
      realizadoPorEmail: currentJogador.email,
      algoritmoUtilizado: algorithm,
      quantidadePorTime: effectivePlayersPerTeam,
      realizadoEm: result.timestamp,
      timesResultado: convertDrawToResultadoItems(result, sorteioId),
    };

    onSaveSorteio(newSorteio);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);
  };

  const handleCopyWhatsApp = () => {
    if (!currentDrawResult || !activeTeam) return;
    const text = formatWhatsAppMessage(currentDrawResult, activeTeam.nome, currentJogador.nomeApelido);

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  const presentCount = teamMembros.filter((m) => presentPlayerIds.has(m.jogadorId)).length;
  const possibleTeamsCount = Math.floor(presentCount / effectivePlayersPerTeam);
  const remainderCount = presentCount % effectivePlayersPerTeam;

  return (
    <div className="space-y-6">
      {/* Team Selection Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Grupo / Equipe Selecionada
          </span>
          <div className="flex items-center gap-3">
            <select
              value={activeEquipeId}
              onChange={(e) => setActiveEquipeId(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              {equipes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  🏆 {eq.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <History className="h-4 w-4 text-slate-500" />
            <span>Ver Histórico de Sorteios</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: 1. Presença & Config | 2. Resultado do Sorteio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configuração e Presença (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Presence Selection Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Lista de Presença do Dia
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Marque quem veio jogar hoje ({presentCount} de {teamMembros.length} presentes)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer transition"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer transition"
                >
                  Nenhum
                </button>
              </div>
            </div>

            {teamMembros.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Esta equipe ainda não possui atletas cadastrados. Vá na aba "Minhas Equipes" para adicionar membros.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {teamMembros.map((m) => {
                  const isPresent = presentPlayerIds.has(m.jogadorId);
                  return (
                    <div
                      key={m.jogadorId}
                      onClick={() => togglePlayerPresence(m.jogadorId)}
                      className={`p-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer select-none ${
                        isPresent
                          ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                          : 'bg-slate-50/70 border-slate-100 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`p-1 rounded-lg ${isPresent ? 'text-blue-600' : 'text-slate-300'}`}>
                          {isPresent ? (
                            <CheckSquare className="h-4 w-4 stroke-[2.5]" />
                          ) : (
                            <Square className="h-4 w-4 stroke-[1.5]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {m.nomeApelido || 'Jogador'}
                            {m.email?.toLowerCase() === currentJogador.email.toLowerCase() && (
                              <span className="text-[10px] text-blue-600 font-semibold ml-1">(Você)</span>
                            )}
                          </p>
                          {m.email && <p className="text-[10px] text-slate-400 truncate">{m.email}</p>}
                        </div>
                      </div>

                      <StarRating rating={m.classificacaoNaEquipe || 3} size="xs" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Draw Setup: Format & Algorithm */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-extrabold text-slate-900 block mb-2">
                1. Formato da Partida (Atletas por Time)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { count: 2, label: 'Duplas (2x2)' },
                  { count: 3, label: 'Trios (3x3)' },
                  { count: 4, label: 'Quartetos (4x4)' },
                  { count: 6, label: 'Sextetos (6x6)' },
                ].map((opt) => (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => {
                      setPlayersPerTeam(opt.count);
                      setCustomPlayersPerTeam('');
                    }}
                    className={`p-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                      playersPerTeam === opt.count && !customPlayersPerTeam
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm font-black">{opt.count}</span>
                    <span className="text-[10px] opacity-80">{opt.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-extrabold text-slate-900 block mb-2">
                2. Modo de Algoritmo para Sorteio
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAlgorithm('equilibrado')}
                  className={`p-3 rounded-2xl text-left border transition cursor-pointer flex items-start gap-2.5 ${
                    algorithm === 'equilibrado'
                      ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${algorithm === 'equilibrado' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block">⚖️ Equilíbrio Técnico</span>
                    <span className="text-[10px] opacity-80 block leading-tight mt-0.5">
                      Monta times equilibrando a média de estrelas ⭐ (1 a 5).
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAlgorithm('aleatorio')}
                  className={`p-3 rounded-2xl text-left border transition cursor-pointer flex items-start gap-2.5 ${
                    algorithm === 'aleatorio'
                      ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${algorithm === 'aleatorio' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Shuffle className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block">🎲 Totalmente Aleatório</span>
                    <span className="text-[10px] opacity-80 block leading-tight mt-0.5">
                      Sorteio puramente por sorte, sem considerar estrelas.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick summary before draw */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Serão formados:</span>
              <span className="font-extrabold text-slate-900">
                {possibleTeamsCount} time(s) completos
                {remainderCount > 0 && ` (${remainderCount} na espera)`}
              </span>
            </div>

            {/* Draw Button */}
            <button
              type="button"
              onClick={handleExecuteDraw}
              disabled={presentCount < effectivePlayersPerTeam}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                presentCount >= effectivePlayersPerTeam
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Realizar Sorteio dos Times Agora</span>
            </button>
          </div>

        </div>

        {/* Right Column: Resultado Visual do Sorteio & Auditoria (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Sorteio gerado e gravado no Histórico Permanente com seu usuário!</span>
              </div>
              <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full font-extrabold">
                Auditado
              </span>
            </div>
          )}

          {currentDrawResult ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              
              {/* Header result info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      {currentDrawResult.algorithm === 'equilibrado' ? '⚖️ Equilíbrio Técnico' : '🎲 Aleatório'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(currentDrawResult.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Times Sorteados: {activeTeam?.nome}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Responsável pelo Sorteio: <strong className="text-slate-800">{currentJogador.nomeApelido}</strong>
                  </p>
                </div>

                {/* WhatsApp copy button */}
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isCopied
                      ? 'bg-emerald-600 text-white shadow-emerald-200'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>Copiar p/ WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              {/* Teams Display Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentDrawResult.teams.map((team, idx) => {
                  const colors = [
                    { header: 'bg-blue-600 text-white', badge: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
                    { header: 'bg-indigo-600 text-white', badge: 'bg-indigo-100 text-indigo-800', border: 'border-indigo-200' },
                    { header: 'bg-rose-600 text-white', badge: 'bg-rose-100 text-rose-800', border: 'border-rose-200' },
                    { header: 'bg-emerald-600 text-white', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' },
                    { header: 'bg-amber-600 text-white', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-200' },
                    { header: 'bg-purple-600 text-white', badge: 'bg-purple-100 text-purple-800', border: 'border-purple-200' },
                  ];
                  const colorScheme = colors[idx % colors.length];

                  return (
                    <div
                      key={team.name}
                      className={`bg-slate-50 rounded-2xl border ${colorScheme.border} overflow-hidden shadow-2xs flex flex-col justify-between`}
                    >
                      <div>
                        <div className={`p-3.5 ${colorScheme.header} flex items-center justify-between`}>
                          <h4 className="text-xs font-black tracking-wide uppercase">
                            {team.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-xs rounded-full text-[11px] font-black text-white">
                            ⭐ Média: {team.averageRating.toFixed(1)}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-2">
                          {team.members.map((m) => (
                            <div
                              key={m.id}
                              className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-slate-800 truncate pr-2">
                                {m.name}
                              </span>
                              <StarRating rating={m.rating} size="xs" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-100/70 border-t border-slate-200 text-center text-[10px] text-slate-500 font-bold">
                        {team.members.length} atleta(s) escalados
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Waiting List if any */}
              {currentDrawResult.waitingList.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Lista de Espera / Próxima Rodada ({currentDrawResult.waitingList.length} atleta(s)):</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentDrawResult.waitingList.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-xl border border-amber-200 text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        {m.name}
                        <StarRating rating={m.rating} size="xs" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExecuteDraw}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span>Sortear Novamente</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Abrir Histórico Completo de Auditoria</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">
                Pronto para Sortear os Times
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Configure a presença dos atletas ao lado, defina a quantidade de jogadores por time e o modo de equilíbrio. O resultado aparecerá aqui com cálculo de médias e botão de envio para o WhatsApp.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
