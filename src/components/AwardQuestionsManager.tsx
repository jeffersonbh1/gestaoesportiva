import React, { useState } from 'react';
import { AwardQuestion } from '../types';
import { 
  Crown, 
  Flame, 
  Smile, 
  Zap, 
  Trophy, 
  Star, 
  Target, 
  Award, 
  Heart, 
  ThumbsUp, 
  Shield, 
  Volleyball,
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  RotateCcw, 
  HelpCircle,
  CheckCircle,
  Eye,
  Sparkles
} from 'lucide-react';

export const INITIAL_AWARD_QUESTIONS: AwardQuestion[] = [
  {
    id: 'mvp',
    title: 'Dono da Quadra (MVP)',
    subtitle: 'Quem jogou demais, fez os melhores pontos e decidiu a partida?',
    iconName: 'Crown',
    sport: 'Todos',
    active: true
  },
  {
    id: 'joy',
    title: 'Resenha Pura (O Mais Alegre)',
    subtitle: 'Quem manteve a vibe lá em cima, fez piada e alegrou o jogo?',
    iconName: 'Smile',
    sport: 'Todos',
    active: true
  },
  {
    id: 'effort',
    title: 'Sangue no Olho (Mais Esforçado)',
    subtitle: 'Quem deu a vida em cada bola, correu na areia e não desistiu nunca?',
    iconName: 'Flame',
    sport: 'Todos',
    active: true
  },
  {
    id: 'play',
    title: 'Ponto de Placa (A Melhor Jogada)',
    subtitle: 'Quem protagonizou a jogada mais bonita (peixinho, cortada ou defesa inacreditável)?',
    iconName: 'Zap',
    sport: 'Todos',
    active: true
  }
];

export const AVAILABLE_ICONS = [
  { name: 'Crown', icon: Crown, label: 'Coroa' },
  { name: 'Flame', icon: Flame, label: 'Chama' },
  { name: 'Smile', icon: Smile, label: 'Sorriso' },
  { name: 'Zap', icon: Zap, label: 'Raio' },
  { name: 'Trophy', icon: Trophy, label: 'Troféu' },
  { name: 'Star', icon: Star, label: 'Estrela' },
  { name: 'Target', icon: Target, label: 'Alvo' },
  { name: 'Award', icon: Award, label: 'Medalha' },
  { name: 'Heart', icon: Heart, label: 'Coração' },
  { name: 'ThumbsUp', icon: ThumbsUp, label: 'Positivo' },
  { name: 'Volleyball', icon: Volleyball, label: 'Bola' },
  { name: 'Shield', icon: Shield, label: 'Escudo' },
];

export function getIconComponent(iconName?: string): React.ElementType {
  const found = AVAILABLE_ICONS.find(i => i.name === iconName);
  return found ? found.icon : Crown;
}

interface AwardQuestionsManagerProps {
  questions: AwardQuestion[];
  onSaveQuestions: (questions: AwardQuestion[]) => void;
  sportsList?: string[];
}

export default function AwardQuestionsManager({ 
  questions, 
  onSaveQuestions,
  sportsList = ['Todos', 'Futevôlei', 'Vôlei', 'Beach Tennis', 'Funcional Areia']
}: AwardQuestionsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AwardQuestion | null>(null);
  const [filterSport, setFilterSport] = useState<string>('Todos');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formIconName, setFormIconName] = useState('Crown');
  const [formSport, setFormSport] = useState('Todos');
  const [formActive, setFormActive] = useState(true);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormIconName('Crown');
    setFormSport('Todos');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q: AwardQuestion) => {
    setEditingQuestion(q);
    setFormTitle(q.title);
    setFormSubtitle(q.subtitle);
    setFormIconName(q.iconName || 'Crown');
    setFormSport(q.sport || 'Todos');
    setFormActive(q.active);
    setIsModalOpen(true);
  };

  const handleToggleActive = (questionId: string) => {
    const updated = questions.map(q => {
      if (q.id === questionId) {
        return { ...q, active: !q.active };
      }
      return q;
    });
    onSaveQuestions(updated);
  };

  const handleDelete = (questionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta pergunta da pesquisa?')) {
      const updated = questions.filter(q => q.id !== questionId);
      onSaveQuestions(updated);
      setMessage({ type: 'success', text: 'Pergunta removida com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Deseja restaurar as perguntas padrão do sistema? Suas perguntas personalizadas serão mantidas.')) {
      const existingIds = new Set(questions.map(q => q.id));
      const missingDefaults = INITIAL_AWARD_QUESTIONS.filter(d => !existingIds.has(d.id));
      const updated = [...questions, ...missingDefaults];
      onSaveQuestions(updated);
      setMessage({ type: 'success', text: 'Perguntas padrão restauradas!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingQuestion) {
      // Edit existing
      const updated = questions.map(q => {
        if (q.id === editingQuestion.id) {
          return {
            ...q,
            title: formTitle.trim(),
            subtitle: formSubtitle.trim(),
            iconName: formIconName,
            sport: formSport,
            active: formActive
          };
        }
        return q;
      });
      onSaveQuestions(updated);
      setMessage({ type: 'success', text: 'Pergunta atualizada com sucesso!' });
    } else {
      // Create new
      const newQuestion: AwardQuestion = {
        id: `q-${Date.now()}`,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        iconName: formIconName,
        sport: formSport,
        active: formActive,
        createdAt: new Date().toISOString()
      };
      onSaveQuestions([...questions, newQuestion]);
      setMessage({ type: 'success', text: 'Nova pergunta cadastrada e adicionada à pesquisa!' });
    }

    setIsModalOpen(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // Filtered questions
  const filteredQuestions = questions.filter(q => {
    if (filterSport === 'Todos') return true;
    return q.sport === 'Todos' || q.sport === filterSport;
  });

  const activeCount = questions.filter(q => q.active).length;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-500" /> Cadastro de Perguntas da Pesquisa Pós-Jogo
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Gerencie e personalize as categorias que aparecem para os atletas votarem ao final de cada partida.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Restaurar Perguntas Padrão"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restaurar Padrões</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Nova Pergunta</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/80">
            {activeCount} {activeCount === 1 ? 'pergunta ativa' : 'perguntas ativas'} na pesquisa
          </span>
          <span className="text-slate-400 font-normal">| Total de {questions.length} cadastradas</span>
        </div>

        {/* Sport Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Filtrar por Esporte:</span>
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            {sportsList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredQuestions.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <Sparkles className="h-8 w-8 text-amber-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Nenhuma pergunta encontrada</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              Clique em "Nova Pergunta" para cadastrar uma nova categoria de votação pós-jogo.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const IconComp = getIconComponent(q.iconName);

            return (
              <div 
                key={q.id}
                className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                  q.active 
                    ? 'bg-white border-slate-200/90 shadow-xs hover:border-amber-300' 
                    : 'bg-slate-50/70 border-slate-200/50 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl font-black shrink-0 ${
                        q.active 
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 shadow-sm' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            q.active 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}>
                            {q.active ? 'Ativa na Pesquisa' : 'Inativa'}
                          </span>

                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {q.sport || 'Todos'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-1 leading-snug">
                          {q.title}
                        </h4>
                      </div>
                    </div>

                    {/* Quick Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(q.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer border ${
                        q.active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={q.active ? 'Desativar Pergunta' : 'Ativar Pergunta'}
                    >
                      {q.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 font-medium pl-1 mt-1 leading-relaxed">
                    "{q.subtitle}"
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Ícone: {q.iconName || 'Crown'}</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(q)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT QUESTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingQuestion ? 'Editar Pergunta da Pesquisa' : 'Cadastrar Nova Pergunta'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Configure como ela aparecerá para os atletas no formulário pós-partida
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {/* Question Title */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Título da Pergunta / Categoria *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Dono da Quadra, Melhor Saque, Peixinho do Ano"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                />
              </div>

              {/* Question Subtitle / Guidance */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Subtítulo / Pergunta de Orientação ao Votante
                </label>
                <textarea
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Ex: Quem fez os pontos mais marcantes e decidiu a partida para a equipe?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
                />
              </div>

              {/* Icon Selector Grid */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Escolha o Ícone da Categoria
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconC = item.icon;
                    const isSelected = formIconName === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormIconName(item.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400 font-black' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={item.label}
                      >
                        <IconC className="h-5 w-5" />
                        <span className="text-[8px] font-bold truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sport & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Esporte Aplicável
                  </label>
                  <select
                    value={formSport}
                    onChange={(e) => setFormSport(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {sportsList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Status na Pesquisa
                  </label>
                  <select
                    value={formActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormActive(e.target.value === 'active')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="active">🟢 Ativa na Votação</option>
                    <option value="inactive">⚪ Inativa (Pausada)</option>
                  </select>
                </div>
              </div>

              {/* Live Card Preview Box */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-1">
                <span className="text-[9px] font-extrabold uppercase text-amber-800 flex items-center gap-1">
                  <Eye className="h-3 w-3 text-amber-600" /> Prévia de Exibição na Pesquisa:
                </span>
                <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs flex items-center gap-3">
                  {(() => {
                    const PreviewIcon = getIconComponent(formIconName);
                    return (
                      <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 font-black shrink-0">
                        <PreviewIcon className="h-5 w-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <h5 className="text-xs font-black text-slate-900 leading-tight">
                      {formTitle || 'Título da Categoria'}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                      {formSubtitle || 'Descrição da orientação para os jogadores...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{editingQuestion ? 'Salvar Alterações' : 'Cadastrar Pergunta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
