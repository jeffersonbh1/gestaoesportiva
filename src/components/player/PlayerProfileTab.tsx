import React, { useState } from 'react';
import { Jogador, EquipeJogador, EquipeMembro, SorteioHistorico } from '../../types';
import StarRating from './StarRating';
import { 
  User, 
  Mail, 
  Star, 
  Shield, 
  Trophy, 
  Calendar, 
  Check, 
  Edit, 
  Users, 
  Clock, 
  Sparkles,
  Award,
  ArrowRightLeft
} from 'lucide-react';

interface PlayerProfileTabProps {
  currentJogador: Jogador;
  allJogadores: Jogador[];
  equipes: EquipeJogador[];
  membros: EquipeMembro[];
  sorteios: SorteioHistorico[];
  onUpdateProfile: (updated: Jogador) => void;
  onSwitchJogador: (jogador: Jogador) => void;
  onRegisterNewJogador: (email: string, nome: string, rating: number) => void;
}

export default function PlayerProfileTab({
  currentJogador,
  allJogadores,
  equipes,
  membros,
  sorteios,
  onUpdateProfile,
  onSwitchJogador,
  onRegisterNewJogador,
}: PlayerProfileTabProps) {
  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editNome, setEditNome] = useState(currentJogador.nomeApelido);
  const [editRating, setEditRating] = useState(currentJogador.classificacaoGeral);

  // New Player Registration / Login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginNome, setLoginNome] = useState('');
  const [loginRating, setLoginRating] = useState<number>(4);

  // Stats computation
  const myEquipes = equipes.filter((eq) =>
    membros.some(
      (m) =>
        m.equipeId === eq.id &&
        (m.jogadorId === currentJogador.id || m.email?.toLowerCase() === currentJogador.email.toLowerCase())
    )
  );

  // Draws where current player was drawn in any team
  const myDraws = sorteios.filter((s) =>
    s.timesResultado.some(
      (tr) =>
        tr.jogadorId === currentJogador.id ||
        (tr.jogadorEmail && tr.jogadorEmail.toLowerCase() === currentJogador.email.toLowerCase()) ||
        tr.jogadorNome.toLowerCase() === currentJogador.nomeApelido.toLowerCase()
    )
  );

  // Draws organized by this player
  const drawsOrganizedByMe = sorteios.filter(
    (s) =>
      s.realizadoPorJogadorId === currentJogador.id ||
      (s.realizadoPorEmail && s.realizadoPorEmail.toLowerCase() === currentJogador.email.toLowerCase())
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNome.trim()) return;

    onUpdateProfile({
      ...currentJogador,
      nomeApelido: editNome.trim(),
      classificacaoGeral: editRating,
    });
    setIsEditing(false);
  };

  const handleLoginOrRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    const emailClean = loginEmail.trim().toLowerCase();
    const existing = allJogadores.find((j) => j.email.toLowerCase() === emailClean);

    if (existing) {
      onSwitchJogador(existing);
    } else {
      if (!loginNome.trim()) {
        alert('Por favor informe seu Nome/Apelido para o primeiro cadastro.');
        return;
      }
      onRegisterNewJogador(emailClean, loginNome.trim(), loginRating);
    }

    setIsLoginModalOpen(false);
    setLoginEmail('');
    setLoginNome('');
    setLoginRating(4);
  };

  return (
    <div className="space-y-6">
      {/* Quick Player Switcher Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase">
              Jogador Ativo
            </span>
            <span className="text-xs text-blue-200 font-medium">Sessão do Módulo</span>
          </div>
          <h2 className="text-xl font-black">{currentJogador.nomeApelido}</h2>
          <p className="text-xs text-blue-200 font-mono mt-0.5">{currentJogador.email}</p>
        </div>

        {/* Quick Switch Dropdown / Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-blue-200 px-2">Alternar:</span>
            <select
              value={currentJogador.id}
              onChange={(e) => {
                const found = allJogadores.find((j) => j.id === e.target.value);
                if (found) onSwitchJogador(found);
              }}
              className="bg-white text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              {allJogadores.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nomeApelido} ({j.email})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Cadastrar / Entrar com Outro E-mail</span>
          </button>
        </div>
      </div>

      {/* Profile Overview & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Profile Card (Left) */}
        <div className="md:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Meu Cadastro
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditNome(currentJogador.nomeApelido);
                  setEditRating(currentJogador.classificacaoGeral);
                  setIsEditing(true);
                }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar</span>
              </button>
            </div>

            <div className="text-center space-y-3 py-2">
              <div className="h-20 w-20 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-3xl flex items-center justify-center text-2xl font-black mx-auto shadow-md shadow-blue-200">
                {currentJogador.nomeApelido.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">{currentJogador.nomeApelido}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentJogador.email}</p>
              </div>

              <div className="inline-block p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                  Classificação Geral
                </span>
                <StarRating rating={currentJogador.classificacaoGeral} size="md" showNumber />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-1 text-center">
            <p>Cadastrado no Sistema</p>
            <p className="font-bold text-slate-700">Vôlei & Futevôlei - Fahel Beach</p>
          </div>
        </div>

        {/* Stats & History Summary (Right 2 cols) */}
        <div className="md:col-span-2 space-y-5">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users className="h-5 w-5" />
                <span className="text-xs font-bold text-slate-500">Equipes Vinculadas</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{myEquipes.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Grupos ativos</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Trophy className="h-5 w-5" />
                <span className="text-xs font-bold text-slate-500">Partidas Sorteadas</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{myDraws.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Sorteios escalado(a)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Award className="h-5 w-5" />
                <span className="text-xs font-bold text-slate-500">Sorteios Realizados</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{drawsOrganizedByMe.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Como organizador</p>
            </div>
          </div>

          {/* Teams list where current player is enrolled */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Minha Classificação por Equipe
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {myEquipes.length} equipe(s)
              </span>
            </div>

            {myEquipes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Você ainda não está vinculado a nenhuma equipe. Vá na aba "Minhas Equipes" para criar um grupo ou peça a outro atleta para cadastrar seu e-mail ({currentJogador.email}) na equipe dele!
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {myEquipes.map((eq) => {
                  const myMembership = membros.find(
                    (m) =>
                      m.equipeId === eq.id &&
                      (m.jogadorId === currentJogador.id || m.email?.toLowerCase() === currentJogador.email.toLowerCase())
                  );

                  return (
                    <div
                      key={eq.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-slate-900">{eq.nome}</p>
                        <p className="text-[10px] text-slate-500">
                          {eq.criadoPorJogadorId === currentJogador.id
                            ? 'Criado por Você'
                            : `Criador: ${eq.criadoPorNome || 'Grupo'}`}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Nível no Grupo</span>
                        <StarRating rating={myMembership?.classificacaoNaEquipe || 3} size="sm" showNumber />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Editar Perfil do Atleta</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">E-mail (Identificador)</label>
                <input
                  type="email"
                  value={currentJogador.email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome / Apelido *</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Classificação Geral (1 a 5 ⭐)</label>
                <StarRating
                  rating={editRating}
                  interactive
                  onChange={(r) => setEditRating(r)}
                  size="md"
                  showNumber
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN / REGISTER WITH EMAIL MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Entrar ou Cadastrar Jogador</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Digite o e-mail para carregar automaticamente as equipes vinculadas a você.
              </p>
            </div>

            <form onSubmit={handleLoginOrRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Seu E-mail *</label>
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome / Apelido (para novo cadastro)
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={loginNome}
                  onChange={(e) => setLoginNome(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Classificação Inicial (1 a 5 ⭐)</label>
                <StarRating
                  rating={loginRating}
                  interactive
                  onChange={(r) => setLoginRating(r)}
                  size="md"
                  showNumber
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
