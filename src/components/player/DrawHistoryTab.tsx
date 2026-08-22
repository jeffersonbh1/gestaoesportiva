import React, { useState } from 'react';
import { SorteioHistorico, EquipeJogador, Jogador } from '../../types';
import StarRating from './StarRating';
import { 
  History, 
  Calendar, 
  Clock, 
  User, 
  Scale, 
  Shuffle, 
  Share2, 
  Check, 
  Search, 
  Filter, 
  ShieldCheck, 
  Trophy,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DrawHistoryTabProps {
  sorteios: SorteioHistorico[];
  equipes: EquipeJogador[];
  currentJogador: Jogador;
}

export default function DrawHistoryTab({
  sorteios,
  equipes,
  currentJogador,
}: DrawHistoryTabProps) {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDrawId, setExpandedDrawId] = useState<string | null>(null);

  const filteredSorteios = sorteios.filter((s) => {
    const matchesTeam = selectedTeamFilter === 'all' || s.equipeId === selectedTeamFilter;
    const matchesSearch =
      !searchTerm ||
      s.realizadoPorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.equipeNome && s.equipeNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.timesResultado.some((tr) => tr.jogadorNome.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTeam && matchesSearch;
  });

  const handleCopyHistoryWhatsApp = (sorteio: SorteioHistorico) => {
    const dateObj = new Date(sorteio.realizadoEm);
    const formattedDate = dateObj.toLocaleDateString('pt-BR');
    const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const algoText =
      sorteio.algoritmoUtilizado === 'equilibrado'
        ? '⚖️ Equilíbrio Técnico (Média por Estrelas ⭐)'
        : '🎲 Totalmente Aleatório (Sorte Pura)';

    // Group items by identificadorTime
    const teamsMap: Record<string, typeof sorteio.timesResultado> = {};
    sorteio.timesResultado.forEach((tr) => {
      if (!teamsMap[tr.identificadorTime]) {
        teamsMap[tr.identificadorTime] = [];
      }
      teamsMap[tr.identificadorTime].push(tr);
    });

    let msg = `🏐 *ARENA FAHEL BEACH - HISTÓRICO DE SORTEIO* 🏐\n\n`;
    msg += `🏆 *Equipe:* ${sorteio.equipeNome || 'Equipe'}\n`;
    msg += `📅 *Data/Hora:* ${formattedDate} às ${formattedTime}\n`;
    msg += `👤 *Sorteado por:* ${sorteio.realizadoPorNome}\n`;
    msg += `⚙️ *Modo:* ${algoText}\n`;
    msg += `👥 *Formato:* ${sorteio.quantidadePorTime} atletas por time\n`;
    msg += `────────────────────────\n\n`;

    Object.entries(teamsMap).forEach(([teamName, players]) => {
      if (teamName !== 'Espera / Próximos') {
        const avg = (players.reduce((acc, p) => acc + p.classificacao, 0) / players.length).toFixed(1);
        msg += `🔷 *${teamName.toUpperCase()}* (Média: ⭐ ${avg})\n`;
        players.forEach((p) => {
          msg += `  • ${p.jogadorNome} (⭐ ${p.classificacao})\n`;
        });
        msg += `\n`;
      }
    });

    if (teamsMap['Espera / Próximos'] && teamsMap['Espera / Próximos'].length > 0) {
      msg += `⏳ *LISTA DE ESPERA / PRÓXIMOS:*\n`;
      teamsMap['Espera / Próximos'].forEach((p) => {
        msg += `  • ${p.jogadorNome} (⭐ ${p.classificacao})\n`;
      });
      msg += `\n`;
    }

    msg += `────────────────────────\n`;
    msg += `_Registro de auditoria permanente verificado no sistema_`;

    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(sorteio.id);
      setTimeout(() => setCopiedId(null), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Histórico & Auditoria de Sorteios
            </h2>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Registro transparente e permanente de quem realizou cada sorteio, o algoritmo utilizado e a composição dos times.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
          Total de registros: <strong className="text-slate-900">{filteredSorteios.length}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por responsável ou atleta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 shrink-0">Filtrar por Equipe:</span>
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as Equipes</option>
            {equipes.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Feed List */}
      <div className="space-y-4">
        {filteredSorteios.map((sorteio) => {
          const dateObj = new Date(sorteio.realizadoEm);
          const formattedDate = dateObj.toLocaleDateString('pt-BR');
          const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          // Group by team identifier
          const teamsMap: Record<string, typeof sorteio.timesResultado> = {};
          sorteio.timesResultado.forEach((tr) => {
            if (!teamsMap[tr.identificadorTime]) {
              teamsMap[tr.identificadorTime] = [];
            }
            teamsMap[tr.identificadorTime].push(tr);
          });

          const isExpanded = expandedDrawId === sorteio.id;

          return (
            <div
              key={sorteio.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-blue-200 transition space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded-full border border-blue-200">
                      🏆 {sorteio.equipeNome || 'Equipe'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        sorteio.algoritmoUtilizado === 'equilibrado'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {sorteio.algoritmoUtilizado === 'equilibrado' ? (
                        <>
                          <Scale className="h-3 w-3" />
                          <span>Algoritmo Equilibrado</span>
                        </>
                      ) : (
                        <>
                          <Shuffle className="h-3 w-3" />
                          <span>Algoritmo Aleatório</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      • {sorteio.quantidadePorTime} por time
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                      Sorteado por: <span className="text-blue-700">{sorteio.realizadoPorNome}</span>
                      {sorteio.realizadoPorEmail && (
                        <span className="text-[10px] text-slate-400 font-mono">({sorteio.realizadoPorEmail})</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formattedDate} às {formattedTime}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyHistoryWhatsApp(sorteio)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      copiedId === sorteio.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {copiedId === sorteio.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copiar WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Roster of Teams */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(teamsMap).map(([teamName, players]) => {
                  const isWaiting = teamName === 'Espera / Próximos';
                  const avg = (players.reduce((acc, p) => acc + p.classificacao, 0) / players.length).toFixed(1);

                  return (
                    <div
                      key={teamName}
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between ${
                        isWaiting
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 font-black">
                          <span className={isWaiting ? 'text-amber-900' : 'text-slate-900'}>
                            {teamName}
                          </span>
                          {!isWaiting && (
                            <span className="text-[10px] bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded-md">
                              ⭐ {avg}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {players.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-800 truncate pr-1">
                                {p.jogadorNome}
                              </span>
                              <StarRating rating={p.classificacao} size="xs" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredSorteios.length === 0 && (
          <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <History className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhum sorteio registrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Quando você ou qualquer membro da equipe realizar um sorteio na aba "Organizar Partida", o histórico detalhado aparecerá aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
