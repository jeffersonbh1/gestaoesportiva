import React, { useState, useEffect } from 'react';
import { Team, TeamMember } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  UserPlus, 
  Check, 
  X, 
  Search, 
  Shield, 
  Phone, 
  Mail, 
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { dbGetTeams, dbSaveTeam, dbDeleteTeam, isSupabaseConfigured } from '../lib/supabase';

interface TeamsManagerProps {
  sportsList?: string[];
  onTeamsChange?: (teams: Team[]) => void;
}

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Areia Dourada Beach Club',
    sport: 'Beach Tennis',
    description: 'Equipe principal de torneios de fim de semana',
    members: [
      { id: 'm-1', name: 'Lucas Santana', phone: '(31) 99881-2233', email: 'lucas@arena.com', position: 'Atacante' },
      { id: 'm-2', name: 'Mariana Duarte', phone: '(31) 99772-1144', email: 'mariana@arena.com', position: 'Defesa' },
      { id: 'm-3', name: 'Rodrigo Alves', phone: '(31) 98833-4455', position: 'Versátil' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'team-2',
    name: 'Futevôlei dos Amigos',
    sport: 'Futevôlei',
    description: 'Turma do racha de quinta-feira',
    members: [
      { id: 'm-4', name: 'Felipe Ribeiro', phone: '(31) 99123-5566', position: 'Levantador' },
      { id: 'm-5', name: 'Gustavo Santos', phone: '(31) 99344-7788', position: 'Atacante' }
    ],
    createdAt: new Date().toISOString()
  }
];

export default function TeamsManager({ 
  sportsList = ['Beach Tennis', 'Futevôlei', 'Vôlei de Areia', 'Vôlei de Quadra', 'Funcional Areia'],
  onTeamsChange
}: TeamsManagerProps) {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('arena_teams_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return INITIAL_TEAMS;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State for Creating/Editing Team
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form Fields
  const [teamName, setTeamName] = useState('');
  const [teamSport, setTeamSport] = useState(sportsList[0] || 'Beach Tennis');
  const [teamDescription, setTeamDescription] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Member Input State (inside form)
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPosition, setMemberPosition] = useState('');

  // Load from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      setLoading(true);
      dbGetTeams()
        .then((dbData) => {
          if (dbData && dbData.length > 0) {
            setTeams(dbData);
            localStorage.setItem('arena_teams_data', JSON.stringify(dbData));
            if (onTeamsChange) onTeamsChange(dbData);
          }
        })
        .catch((err) => console.warn('Supabase teams load fallback:', err))
        .finally(() => setLoading(false));
    }
  }, []);

  const saveTeamsToState = (newTeams: Team[]) => {
    setTeams(newTeams);
    localStorage.setItem('arena_teams_data', JSON.stringify(newTeams));
    if (onTeamsChange) onTeamsChange(newTeams);
  };

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamSport(sportsList[0] || 'Beach Tennis');
    setTeamDescription('');
    setMembers([]);
    setMemberName('');
    setMemberPhone('');
    setMemberEmail('');
    setMemberPosition('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamSport(team.sport);
    setTeamDescription(team.description || '');
    setMembers(team.members || []);
    setMemberName('');
    setMemberPhone('');
    setMemberEmail('');
    setMemberPosition('');
    setIsModalOpen(true);
  };

  const handleAddMemberToForm = () => {
    if (!memberName.trim()) return;
    const newMember: TeamMember = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: memberName.trim(),
      phone: memberPhone.trim() || undefined,
      email: memberEmail.trim() || undefined,
      position: memberPosition.trim() || undefined
    };
    setMembers(prev => [...prev, newMember]);
    setMemberName('');
    setMemberPhone('');
    setMemberEmail('');
    setMemberPosition('');
  };

  const handleRemoveMemberFromForm = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setLoading(true);
    const newTeam: Team = {
      id: editingTeam?.id || `team-${Date.now()}`,
      name: teamName.trim(),
      sport: teamSport,
      description: teamDescription.trim() || undefined,
      members: members,
      createdAt: editingTeam?.createdAt || new Date().toISOString()
    };

    let updatedTeams: Team[] = [];
    if (editingTeam) {
      updatedTeams = teams.map(t => t.id === editingTeam.id ? newTeam : t);
    } else {
      updatedTeams = [newTeam, ...teams];
    }

    // Attempt Supabase save
    if (isSupabaseConfigured) {
      try {
        const saved = await dbSaveTeam(newTeam);
        if (saved) {
          updatedTeams = updatedTeams.map(t => t.id === newTeam.id ? saved : t);
        }
      } catch (err) {
        console.warn('Erro ao salvar time no Supabase, mantendo local:', err);
      }
    }

    saveTeamsToState(updatedTeams);
    setIsModalOpen(false);
    setLoading(false);
    setFeedback({ type: 'success', text: `Time "${newTeam.name}" salvo com sucesso!` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteTeam = async (teamId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o time "${name}"?`)) return;

    setLoading(true);
    const nextTeams = teams.filter(t => t.id !== teamId);

    if (isSupabaseConfigured) {
      try {
        await dbDeleteTeam(teamId);
      } catch (err) {
        console.warn('Erro ao deletar time do Supabase:', err);
      }
    }

    saveTeamsToState(nextTeams);
    setLoading(false);
    setFeedback({ type: 'success', text: `Time "${name}" removido com sucesso.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Filtered teams list
  const filteredTeams = teams.filter(t => {
    const matchesSport = selectedSport === 'Todos' || t.sport.toLowerCase() === selectedSport.toLowerCase();
    const matchesSearch = !searchTerm || 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSport && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Cadastro & Gestão de Times</h2>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Cadastre as equipes e seus participantes para vinculação rápida nos agendamentos e jogos da arena.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Criar Novo Time</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle className="h-4 w-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por time ou participante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 shrink-0">Modalidade:</span>
          <button
            onClick={() => setSelectedSport('Todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedSport === 'Todos' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {sportsList.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSport(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedSport === s ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => (
          <div key={team.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider mb-1 border border-blue-100">
                    🏆 {team.sport}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                    {team.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(team)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Editar Time e Integrantes"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Excluir Time"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {team.description && (
                <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2">
                  {team.description}
                </p>
              )}

              {/* Members List */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    Participantes
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {team.members.length} atleta(s)
                  </span>
                </div>

                {team.members.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2">
                    Nenhum integrante cadastrado neste time.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {team.members.map((m) => (
                      <div key={m.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{m.name}</p>
                          {(m.position || m.phone) && (
                            <p className="text-[10px] text-slate-500 truncate flex items-center gap-2">
                              {m.position && <span className="font-semibold text-blue-600">{m.position}</span>}
                              {m.phone && <span>{m.phone}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Cadastrado no sistema</span>
              <button
                type="button"
                onClick={() => handleOpenEditModal(team)}
                className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                + Gerenciar Atletas
              </button>
            </div>
          </div>
        ))}

        {filteredTeams.length === 0 && (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhum time encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Clique no botão "Criar Novo Time" acima para adicionar uma equipe e cadastrar os participantes.
            </p>
          </div>
        )}
      </div>

      {/* MODAL CRIAR/EDITAR TIME */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Shield className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingTeam ? 'Editar Time & Integrantes' : 'Cadastrar Novo Time'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Informe o nome do time, esporte e seus participantes</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTeam} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Team General Details */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dados Principais do Time</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Time *</label>
                    <input 
                      type="text"
                      placeholder="Ex: Time Vôlei Ouro Preto"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Esporte / Modalidade *</label>
                    <select
                      value={teamSport}
                      onChange={(e) => setTeamSport(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {sportsList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Descrição / Observações (Opcional)</label>
                  <input 
                    type="text"
                    placeholder="Ex: Equipe de Futevôlei Noturna de Terça-Feira"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Add Member Box */}
              <div className="space-y-3 pt-3 border-t border-slate-100 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  Cadastrar Participantes do Time
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input 
                    type="text"
                    placeholder="Nome do Participante *"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input 
                    type="text"
                    placeholder="Telefone / Celular (opcional)"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input 
                    type="email"
                    placeholder="E-mail (opcional)"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input 
                    type="text"
                    placeholder="Posição/Função (Ex: Atacante, Levantador)"
                    value={memberPosition}
                    onChange={(e) => setMemberPosition(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddMemberToForm}
                  disabled={!memberName.trim()}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    memberName.trim() 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Atleta ao Time</span>
                </button>
              </div>

              {/* Members Enrolled List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  Participantes Adicionados ({members.length}):
                </span>

                {members.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    Nenhum atleta adicionado ainda. Preencha os campos acima e clique em "Adicionar Atleta".
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {members.map((m, idx) => (
                      <div key={m.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{idx + 1}. {m.name}</p>
                          <p className="text-[10px] text-slate-500 flex gap-2">
                            {m.position && <span className="font-semibold text-blue-600">{m.position}</span>}
                            {m.phone && <span>{m.phone}</span>}
                            {m.email && <span>{m.email}</span>}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMemberFromForm(m.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remover atleta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !teamName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-100 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingTeam ? 'Atualizar Time' : 'Salvar Time'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
