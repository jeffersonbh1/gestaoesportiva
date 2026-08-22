import React, { useState } from 'react';
import { Jogador, EquipeJogador, EquipeMembro } from '../../types';
import StarRating from './StarRating';
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  Shield, 
  Mail, 
  Star, 
  Check, 
  X, 
  Search, 
  Sparkles, 
  Link as LinkIcon,
  HelpCircle,
  Crown,
  Share2,
  Calendar
} from 'lucide-react';

interface TeamManagementTabProps {
  currentJogador: Jogador;
  equipes: EquipeJogador[];
  membros: EquipeMembro[];
  jogadores: Jogador[];
  onSaveEquipe: (equipe: EquipeJogador, initialMembers: { email: string; nome: string; rating: number }[]) => void;
  onAddMembro: (equipeId: string, email: string, nome: string, rating: number) => void;
  onRemoveMembro: (equipeId: string, jogadorId: string) => void;
  onSelectTeamForMatch: (equipeId: string) => void;
}

export default function TeamManagementTab({
  currentJogador,
  equipes,
  membros,
  jogadores,
  onSaveEquipe,
  onAddMembro,
  onRemoveMembro,
  onSelectTeamForMatch,
}: TeamManagementTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<EquipeJogador | null>(null);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [tempMembers, setTempMembers] = useState<{ email: string; nome: string; rating: number }[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberNome, setNewMemberNome] = useState('');
  const [newMemberRating, setNewMemberRating] = useState<number>(3);

  // Add Member to existing team state
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberNome, setAddMemberNome] = useState('');
  const [addMemberRating, setAddMemberRating] = useState<number>(3);

  // Filter teams relevant to the current user (either created by user or user is a member)
  const myEquipes = equipes.filter((eq) => {
    const isCreator = eq.criadoPorJogadorId === currentJogador.id;
    const isMember = membros.some(
      (m) => m.equipeId === eq.id && (m.jogadorId === currentJogador.id || m.email?.toLowerCase() === currentJogador.email.toLowerCase())
    );
    return isCreator || isMember;
  });

  const filteredEquipes = myEquipes.filter((eq) =>
    eq.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setNewTeamName('');
    // By default, include the logged-in player as the first member with their rating
    setTempMembers([
      {
        email: currentJogador.email,
        nome: currentJogador.nomeApelido,
        rating: Math.round(currentJogador.classificacaoGeral) || 4,
      },
    ]);
    setNewMemberEmail('');
    setNewMemberNome('');
    setNewMemberRating(3);
    setIsCreateModalOpen(true);
  };

  const handleAddTempMember = () => {
    if (!newMemberEmail.trim() || !newMemberNome.trim()) return;
    const cleanEmail = newMemberEmail.trim().toLowerCase();

    // Check if already in list
    if (tempMembers.some((m) => m.email.toLowerCase() === cleanEmail)) {
      alert('Este e-mail já foi adicionado na lista.');
      return;
    }

    setTempMembers((prev) => [
      ...prev,
      {
        email: cleanEmail,
        nome: newMemberNome.trim(),
        rating: newMemberRating,
      },
    ]);

    setNewMemberEmail('');
    setNewMemberNome('');
    setNewMemberRating(3);
  };

  const handleRemoveTempMember = (email: string) => {
    setTempMembers((prev) => prev.filter((m) => m.email !== email));
  };

  const handleSaveNewTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newEquipe: EquipeJogador = {
      id: `eq-${Date.now()}`,
      nome: newTeamName.trim(),
      criadoPorJogadorId: currentJogador.id,
      criadoPorNome: currentJogador.nomeApelido,
      criadoEm: new Date().toISOString(),
    };

    onSaveEquipe(newEquipe, tempMembers);
    setIsCreateModalOpen(false);
  };

  const handleAddMemberToExistingTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForMembers || !addMemberEmail.trim() || !addMemberNome.trim()) return;

    onAddMembro(
      selectedTeamForMembers.id,
      addMemberEmail.trim().toLowerCase(),
      addMemberNome.trim(),
      addMemberRating
    );

    setAddMemberEmail('');
    setAddMemberNome('');
    setAddMemberRating(3);
  };

  // Get members of a specific team
  const getTeamMembers = (equipeId: string) => {
    return membros.filter((m) => m.equipeId === equipeId);
  };

  return (
    <div className="space-y-6">
      {/* Top Explanation & Action Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-blue-200 border border-white/15">
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Vínculo Automático por E-mail</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Minhas Equipes & Atletas Vinculados
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Quando você adiciona um jogador informando o e-mail dele, esta equipe fica <strong className="text-amber-300">automaticamente disponível</strong> no painel dele assim que ele fizer login.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Criar Nova Equipe</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome da equipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
          <span>Total: <strong className="text-slate-900">{filteredEquipes.length}</strong> equipe(s) vinculada(s)</span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredEquipes.map((equipe) => {
          const isCreator = equipe.criadoPorJogadorId === currentJogador.id;
          const teamMembros = getTeamMembers(equipe.id);
          const avgStars = teamMembros.length > 0
            ? (teamMembros.reduce((acc, m) => acc + (m.classificacaoNaEquipe || 3), 0) / teamMembros.length).toFixed(1)
            : '0.0';

          return (
            <div
              key={equipe.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {isCreator ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded-full border border-amber-200">
                          <Crown className="h-3 w-3 text-amber-600" />
                          Criada por Você
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-800 font-extrabold text-[10px] rounded-full border border-blue-200">
                          <LinkIcon className="h-3 w-3 text-blue-600" />
                          Vínculo Automático ({equipe.criadoPorNome ? `Criador: ${equipe.criadoPorNome}` : 'Grupo'})
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                      {equipe.nome}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Nível Médio</span>
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-black text-slate-800">{avgStars}</span>
                    </div>
                  </div>
                </div>

                {/* Team Roster Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      Atletas Cadastrados ({teamMembros.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamForMembers(equipe)}
                      className="text-blue-600 hover:text-blue-700 hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      + Gerenciar Membros
                    </button>
                  </div>

                  {teamMembros.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Nenhum atleta cadastrado nesta equipe.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {teamMembros.map((m) => (
                        <div
                          key={m.jogadorId}
                          className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-800 truncate">
                              {m.nomeApelido || 'Jogador'}
                              {m.email?.toLowerCase() === currentJogador.email.toLowerCase() && (
                                <span className="text-[10px] text-blue-600 font-semibold ml-1">(Você)</span>
                              )}
                            </p>
                            {m.email && (
                              <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                            )}
                          </div>
                          <StarRating rating={m.classificacaoNaEquipe || 3} size="xs" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeamForMembers(equipe)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Membros & Níveis</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTeamForMatch(equipe.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-blue-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Sortear Times Deste Grupo</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredEquipes.length === 0 && (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhuma equipe encontrada</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Você ainda não possui equipes cadastradas ou vinculadas ao seu e-mail ({currentJogador.email}). Crie sua primeira equipe agora!
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              Criar Primeira Equipe
            </button>
          </div>
        )}
      </div>

      {/* MODAL: CRIAR NOVA EQUIPE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Shield className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Cadastrar Nova Equipe
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cadastre os atletas por e-mail e eles terão acesso automático
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTeam} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome da Equipe / Grupo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vôlei dos Amigos de Quinta"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Add Member Box */}
              <div className="space-y-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    Cadastrar Jogador na Equipe
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold">
                    Vínculo Automático
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome / Apelido do Atleta *"
                    value={newMemberNome}
                    onChange={(e) => setNewMemberNome(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="E-mail do Atleta *"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Classificação (1 a 5 ⭐):</span>
                    <StarRating
                      rating={newMemberRating}
                      interactive
                      onChange={(r) => setNewMemberRating(r)}
                      size="md"
                      showNumber
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTempMember}
                    disabled={!newMemberEmail.trim() || !newMemberNome.trim()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      newMemberEmail.trim() && newMemberNome.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar à Lista</span>
                  </button>
                </div>
              </div>

              {/* Members Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  Atletas nesta Equipe ({tempMembers.length}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {tempMembers.map((m) => (
                    <div
                      key={m.email}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {m.nome}
                          {m.email.toLowerCase() === currentJogador.email.toLowerCase() && (
                            <span className="text-[10px] text-blue-600 font-semibold ml-1.5">(Você - Criador)</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{m.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <StarRating rating={m.rating} size="sm" />
                        {m.email.toLowerCase() !== currentJogador.email.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTempMember(m.email)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTeamName.trim() || tempMembers.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Salvar Equipe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERENCIAR MEMBROS DA EQUIPE EXISTENTE */}
      {selectedTeamForMembers && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Atletas: {selectedTeamForMembers.nome}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Adicione novos membros ou gerencie a classificação técnica
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeamForMembers(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Add member form */}
              <form onSubmit={handleAddMemberToExistingTeam} className="space-y-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  Adicionar Novo Atleta à Equipe
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome / Apelido *"
                    value={addMemberNome}
                    onChange={(e) => setAddMemberNome(e.target.value)}
                    required
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="E-mail *"
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    required
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Classificação:</span>
                    <StarRating
                      rating={addMemberRating}
                      interactive
                      onChange={(r) => setAddMemberRating(r)}
                      size="md"
                      showNumber
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Atleta</span>
                  </button>
                </div>
              </form>

              {/* Members List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  Membros Cadastrados:
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getTeamMembers(selectedTeamForMembers.id).map((m) => (
                    <div
                      key={m.jogadorId}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {m.nomeApelido || 'Jogador'}
                          {m.email?.toLowerCase() === currentJogador.email.toLowerCase() && (
                            <span className="text-[10px] text-blue-600 font-semibold ml-1.5">(Você)</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{m.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <StarRating rating={m.classificacaoNaEquipe || 3} size="sm" showNumber />
                        <button
                          type="button"
                          onClick={() => onRemoveMembro(selectedTeamForMembers.id, m.jogadorId)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remover da equipe"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTeamForMembers(null)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
