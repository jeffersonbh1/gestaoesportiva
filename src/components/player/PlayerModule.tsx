import React, { useState, useEffect } from 'react';
import { Jogador, EquipeJogador, EquipeMembro, SorteioHistorico } from '../../types';
import { 
  INITIAL_JOGADORES, 
  INITIAL_EQUIPES, 
  INITIAL_EQUIPE_MEMBROS, 
  INITIAL_SORTEIOS 
} from '../../data/mockPlayersTeamsData';
import { 
  isSupabaseConfigured,
  dbGetJogadores,
  dbSaveJogador,
  dbGetEquipes,
  dbSaveEquipe,
  dbGetEquipeMembros,
  dbSaveEquipeMembro,
  dbDeleteEquipeMembro,
  dbGetSorteiosHistorico,
  dbSaveSorteioHistorico
} from '../../lib/supabase';
import TeamManagementTab from './TeamManagementTab';
import MatchOrganizerTab from './MatchOrganizerTab';
import DrawHistoryTab from './DrawHistoryTab';
import PlayerProfileTab from './PlayerProfileTab';
import { 
  Users, 
  Sparkles, 
  History, 
  User, 
  Volleyball, 
  ArrowLeft, 
  Shield, 
  Star,
  CheckCircle,
  Link as LinkIcon
} from 'lucide-react';

interface PlayerModuleProps {
  onBackToHub?: () => void;
  onNavigateToCourts?: () => void;
  onNavigateToBar?: () => void;
}

type TabType = 'teams' | 'organize' | 'history' | 'profile';

export default function PlayerModule({
  onBackToHub,
  onNavigateToCourts,
  onNavigateToBar,
}: PlayerModuleProps) {
  // Active Sub-tab
  const [activeTab, setActiveTab] = useState<TabType>('organize');

  // Selected Team for match organization
  const [selectedTeamIdForMatch, setSelectedTeamIdForMatch] = useState<string>('');

  // 1. Jogadores State
  const [jogadores, setJogadores] = useState<Jogador[]>(() => {
    const saved = localStorage.getItem('arena_jogadores_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return INITIAL_JOGADORES;
  });

  // Current active logged-in Jogador
  const [currentJogador, setCurrentJogador] = useState<Jogador>(() => {
    const savedId = localStorage.getItem('arena_current_jogador_id');
    if (savedId) {
      const found = jogadores.find((j) => j.id === savedId);
      if (found) return found;
    }
    return jogadores[0] || INITIAL_JOGADORES[0];
  });

  // 2. Equipes State
  const [equipes, setEquipes] = useState<EquipeJogador[]>(() => {
    const saved = localStorage.getItem('arena_equipes_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return INITIAL_EQUIPES;
  });

  // 3. Equipe Membros State
  const [membros, setMembros] = useState<EquipeMembro[]>(() => {
    const saved = localStorage.getItem('arena_equipe_membros_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return INITIAL_EQUIPE_MEMBROS;
  });

  // 4. Sorteios Historico State
  const [sorteios, setSorteios] = useState<SorteioHistorico[]>(() => {
    const saved = localStorage.getItem('arena_sorteios_historico');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return INITIAL_SORTEIOS;
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync with Supabase on mount if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Load Jogadores
      dbGetJogadores()
        .then((dbJog) => {
          if (dbJog && dbJog.length > 0) {
            setJogadores(dbJog);
            localStorage.setItem('arena_jogadores_data', JSON.stringify(dbJog));
          }
        })
        .catch((e) => console.warn('Supabase jogadores fallback:', e));

      // Load Equipes
      dbGetEquipes()
        .then((dbEq) => {
          if (dbEq && dbEq.length > 0) {
            setEquipes(dbEq);
            localStorage.setItem('arena_equipes_data', JSON.stringify(dbEq));
          }
        })
        .catch((e) => console.warn('Supabase equipes fallback:', e));

      // Load Membros
      dbGetEquipeMembros()
        .then((dbMem) => {
          if (dbMem && dbMem.length > 0) {
            setMembros(dbMem);
            localStorage.setItem('arena_equipe_membros_data', JSON.stringify(dbMem));
          }
        })
        .catch((e) => console.warn('Supabase membros fallback:', e));

      // Load Sorteios
      dbGetSorteiosHistorico()
        .then((dbSort) => {
          if (dbSort && dbSort.length > 0) {
            setSorteios(dbSort);
            localStorage.setItem('arena_sorteios_historico', JSON.stringify(dbSort));
          }
        })
        .catch((e) => console.warn('Supabase sorteios fallback:', e));
    }
  }, []);

  // Save to LocalStorage helpers
  const saveJogadoresState = (newJogadores: Jogador[]) => {
    setJogadores(newJogadores);
    localStorage.setItem('arena_jogadores_data', JSON.stringify(newJogadores));
  };

  const saveEquipesState = (newEquipes: EquipeJogador[]) => {
    setEquipes(newEquipes);
    localStorage.setItem('arena_equipes_data', JSON.stringify(newEquipes));
  };

  const saveMembrosState = (newMembros: EquipeMembro[]) => {
    setMembros(newMembros);
    localStorage.setItem('arena_equipe_membros_data', JSON.stringify(newMembros));
  };

  const saveSorteiosState = (newSorteios: SorteioHistorico[]) => {
    setSorteios(newSorteios);
    localStorage.setItem('arena_sorteios_historico', JSON.stringify(newSorteios));
  };

  // Handlers for Player actions
  const handleSwitchJogador = (jogador: Jogador) => {
    setCurrentJogador(jogador);
    localStorage.setItem('arena_current_jogador_id', jogador.id);
    setFeedback({
      type: 'success',
      text: `Sessão alternada para ${jogador.nomeApelido} (${jogador.email})`,
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRegisterNewJogador = async (email: string, nome: string, rating: number) => {
    const newJog: Jogador = {
      id: `jog-${Date.now()}`,
      email: email.toLowerCase().trim(),
      nomeApelido: nome.trim(),
      classificacaoGeral: rating,
      criadoEm: new Date().toISOString(),
    };

    const nextJogadores = [...jogadores, newJog];
    saveJogadoresState(nextJogadores);
    setCurrentJogador(newJog);
    localStorage.setItem('arena_current_jogador_id', newJog.id);

    if (isSupabaseConfigured) {
      try {
        await dbSaveJogador(newJog);
      } catch (err) {
        console.warn('Erro ao salvar novo jogador no Supabase:', err);
      }
    }

    setFeedback({
      type: 'success',
      text: `Jogador ${nome} cadastrado com sucesso!`,
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleUpdateProfile = async (updated: Jogador) => {
    const next = jogadores.map((j) => (j.id === updated.id ? updated : j));
    saveJogadoresState(next);
    setCurrentJogador(updated);

    if (isSupabaseConfigured) {
      try {
        await dbSaveJogador(updated);
      } catch (err) {
        console.warn('Erro ao atualizar jogador no Supabase:', err);
      }
    }

    setFeedback({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveEquipe = async (
    newEquipe: EquipeJogador,
    initialMembers: { email: string; nome: string; rating: number }[]
  ) => {
    const nextEquipes = [newEquipe, ...equipes];
    saveEquipesState(nextEquipes);

    // Create / ensure players exist and add to membros
    let updatedJogadores = [...jogadores];
    const newMembrosToAdd: EquipeMembro[] = [];

    for (const m of initialMembers) {
      const emailLower = m.email.toLowerCase().trim();
      let foundJog = updatedJogadores.find((j) => j.email.toLowerCase() === emailLower);

      if (!foundJog) {
        foundJog = {
          id: `jog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          email: emailLower,
          nomeApelido: m.nome.trim(),
          classificacaoGeral: m.rating,
          criadoEm: new Date().toISOString(),
        };
        updatedJogadores.push(foundJog);
        if (isSupabaseConfigured) {
          dbSaveJogador(foundJog).catch(console.warn);
        }
      }

      const membro: EquipeMembro = {
        equipeId: newEquipe.id,
        jogadorId: foundJog.id,
        classificacaoNaEquipe: m.rating,
        inseridoEm: new Date().toISOString(),
        nomeApelido: foundJog.nomeApelido,
        email: foundJog.email,
      };

      newMembrosToAdd.push(membro);
      if (isSupabaseConfigured) {
        dbSaveEquipeMembro(membro).catch(console.warn);
      }
    }

    saveJogadoresState(updatedJogadores);
    const nextMembros = [...membros, ...newMembrosToAdd];
    saveMembrosState(nextMembros);

    if (isSupabaseConfigured) {
      try {
        await dbSaveEquipe(newEquipe);
      } catch (err) {
        console.warn('Erro ao salvar equipe no Supabase:', err);
      }
    }

    setFeedback({
      type: 'success',
      text: `Equipe "${newEquipe.nome}" criada com ${newMembrosToAdd.length} membros vinculados!`,
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAddMembro = async (equipeId: string, email: string, nome: string, rating: number) => {
    const emailLower = email.toLowerCase().trim();
    let updatedJogadores = [...jogadores];
    let foundJog = updatedJogadores.find((j) => j.email.toLowerCase() === emailLower);

    if (!foundJog) {
      foundJog = {
        id: `jog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        email: emailLower,
        nomeApelido: nome.trim(),
        classificacaoGeral: rating,
        criadoEm: new Date().toISOString(),
      };
      updatedJogadores.push(foundJog);
      saveJogadoresState(updatedJogadores);
      if (isSupabaseConfigured) {
        dbSaveJogador(foundJog).catch(console.warn);
      }
    }

    const membro: EquipeMembro = {
      equipeId,
      jogadorId: foundJog.id,
      classificacaoNaEquipe: rating,
      inseridoEm: new Date().toISOString(),
      nomeApelido: foundJog.nomeApelido,
      email: foundJog.email,
    };

    const nextMembros = [...membros.filter((m) => !(m.equipeId === equipeId && m.jogadorId === foundJog!.id)), membro];
    saveMembrosState(nextMembros);

    if (isSupabaseConfigured) {
      try {
        await dbSaveEquipeMembro(membro);
      } catch (err) {
        console.warn('Erro ao salvar membro no Supabase:', err);
      }
    }

    setFeedback({
      type: 'success',
      text: `Atleta ${nome} adicionado com sucesso! A equipe agora estará disponível no acesso dele.`,
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleRemoveMembro = async (equipeId: string, jogadorId: string) => {
    const nextMembros = membros.filter(
      (m) => !(m.equipeId === equipeId && m.jogadorId === jogadorId)
    );
    saveMembrosState(nextMembros);

    if (isSupabaseConfigured) {
      try {
        await dbDeleteEquipeMembro(equipeId, jogadorId);
      } catch (err) {
        console.warn('Erro ao deletar membro no Supabase:', err);
      }
    }

    setFeedback({ type: 'success', text: 'Atleta removido da equipe.' });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSaveSorteio = async (sorteio: SorteioHistorico) => {
    const nextSorteios = [sorteio, ...sorteios];
    saveSorteiosState(nextSorteios);

    if (isSupabaseConfigured) {
      try {
        await dbSaveSorteioHistorico(sorteio);
      } catch (err) {
        console.warn('Erro ao persistir sorteio no Supabase:', err);
      }
    }
  };

  const handleSelectTeamForMatch = (equipeId: string) => {
    setSelectedTeamIdForMatch(equipeId);
    setActiveTab('organize');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-12">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand & Return */}
            <div className="flex items-center gap-3">
              {onBackToHub && (
                <button
                  type="button"
                  onClick={onBackToHub}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Voltar ao Hub de Módulos"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                  <Volleyball className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-slate-900 leading-tight">
                    Módulo do Jogador & Sorteios
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Arena Fahel Beach • Vôlei & Futevôlei
                  </p>
                </div>
              </div>
            </div>

            {/* Middle: Sub-Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('organize')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'organize'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Organizar & Sortear</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('teams')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'teams'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Minhas Equipes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Histórico & Auditoria</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'profile'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Meu Perfil</span>
              </button>
            </div>

            {/* Right: Active Player Badge & Quick Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-xs font-bold text-blue-900 transition cursor-pointer"
                title="Ver/Alterar Atleta Ativo"
              >
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  {currentJogador.nomeApelido.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {currentJogador.nomeApelido}
                </span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md">
                  ⭐ {currentJogador.classificacaoGeral.toFixed(1)}
                </span>
              </button>
            </div>

          </div>

          {/* Mobile Sub-Tabs bar */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('organize')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 ${
                activeTab === 'organize' ? 'bg-blue-600 text-white' : 'text-slate-600'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Sortear</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teams')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 ${
                activeTab === 'teams' ? 'bg-blue-600 text-white' : 'text-slate-600'
              }`}
            >
              <Users className="h-3 w-3" />
              <span>Equipes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 ${
                activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-600'
              }`}
            >
              <History className="h-3 w-3" />
              <span>Histórico</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 ${
                activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-600'
              }`}
            >
              <User className="h-3 w-3" />
              <span>Perfil</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1">
        {activeTab === 'organize' && (
          <MatchOrganizerTab
            currentJogador={currentJogador}
            equipes={equipes}
            membros={membros}
            selectedEquipeId={selectedTeamIdForMatch}
            onSaveSorteio={handleSaveSorteio}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'teams' && (
          <TeamManagementTab
            currentJogador={currentJogador}
            equipes={equipes}
            membros={membros}
            jogadores={jogadores}
            onSaveEquipe={handleSaveEquipe}
            onAddMembro={handleAddMembro}
            onRemoveMembro={handleRemoveMembro}
            onSelectTeamForMatch={handleSelectTeamForMatch}
          />
        )}

        {activeTab === 'history' && (
          <DrawHistoryTab
            sorteios={sorteios}
            equipes={equipes}
            currentJogador={currentJogador}
          />
        )}

        {activeTab === 'profile' && (
          <PlayerProfileTab
            currentJogador={currentJogador}
            allJogadores={jogadores}
            equipes={equipes}
            membros={membros}
            sorteios={sorteios}
            onUpdateProfile={handleUpdateProfile}
            onSwitchJogador={handleSwitchJogador}
            onRegisterNewJogador={handleRegisterNewJogador}
          />
        )}
      </main>
    </div>
  );
}
