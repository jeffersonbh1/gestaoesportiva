import React, { useState } from 'react';
import { Court, CourtType, CourtStatus, RentalType, Teacher, Student, SportType, Sport, CourtTypeItem } from '../types';
import { INITIAL_RENTAL_TYPES, INITIAL_TEACHERS, INITIAL_STUDENTS, INITIAL_SPORTS, INITIAL_COURT_TYPES } from '../data/mockData';
import { formatCurrency, formatPhoneNumber } from '../utils';
import { 
  Plus, 
  Settings, 
  MapPin, 
  Activity, 
  DollarSign, 
  Wrench, 
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Info,
  GraduationCap,
  Users,
  FileText,
  Phone,
  Mail,
  Tag,
  Check,
  BookOpen,
  Layers,
  Pencil,
  Trophy
} from 'lucide-react';
import { motion } from 'motion/react';

interface CourtManagerProps {
  courts: Court[];
  onAddCourt: (court: Court) => void;
  onUpdateCourtStatus: (courtId: string, status: CourtStatus) => void;
  onDeleteCourt: (courtId: string) => void;
  rentalTypes?: RentalType[];
  onAddRentalType?: (item: RentalType) => void;
  onDeleteRentalType?: (id: string) => void;
  sports?: Sport[];
  onAddSport?: (sport: Sport) => void;
  onSaveSport?: (sport: Sport) => void;
  onDeleteSport?: (id: string, name?: string) => void;
  courtTypes?: CourtTypeItem[];
  onAddCourtType?: (item: CourtTypeItem) => void;
  onSaveCourtType?: (item: CourtTypeItem) => void;
  onDeleteCourtType?: (id: string, name?: string) => void;
  teachers?: Teacher[];
  onAddTeacher?: (teacher: Teacher) => void;
  onDeleteTeacher?: (id: string) => void;
  students?: Student[];
  onAddStudent?: (student: Student) => void;
  onDeleteStudent?: (id: string) => void;
  isAdmin?: boolean;
}

export default function CourtManager({ 
  courts, 
  onAddCourt, 
  onUpdateCourtStatus, 
  onDeleteCourt,
  rentalTypes = INITIAL_RENTAL_TYPES,
  onAddRentalType,
  onDeleteRentalType,
  sports = INITIAL_SPORTS,
  onAddSport,
  onSaveSport,
  onDeleteSport,
  courtTypes = INITIAL_COURT_TYPES,
  onAddCourtType,
  onSaveCourtType,
  onDeleteCourtType,
  teachers = INITIAL_TEACHERS,
  onAddTeacher,
  onDeleteTeacher,
  students = INITIAL_STUDENTS,
  onAddStudent,
  onDeleteStudent,
  isAdmin = true
}: CourtManagerProps) {
  
  // New Court form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CourtType>('Areia');
  const [status, setStatus] = useState<CourtStatus>('Disponível');
  const [pricePerHour, setPricePerHour] = useState(90);
  const [description, setDescription] = useState('');

  // Click again to delete helper
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDelRentalId, setConfirmDelRentalId] = useState<string | null>(null);
  const [confirmDelTeacherId, setConfirmDelTeacherId] = useState<string | null>(null);
  const [confirmDelStudentId, setConfirmDelStudentId] = useState<string | null>(null);
  const [confirmDelSportId, setConfirmDelSportId] = useState<string | null>(null);
  const [confirmDelCourtTypeId, setConfirmDelCourtTypeId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCourt: Court = {
      id: `court-${Date.now()}`,
      name: name.trim(),
      type,
      status,
      pricePerHour,
      description: description.trim() || undefined
    };

    onAddCourt(newCourt);
    
    // Reset form
    setName('');
    setType('Areia');
    setStatus('Disponível');
    setPricePerHour(90);
    setDescription('');
    setShowAddForm(false);
  };

  // Submenu Navigation State
  const [activeSubTab, setActiveSubTab] = useState<'quadras' | 'esportes' | 'tipos_aluguel' | 'professores' | 'alunos'>('quadras');

  // Sport form state (Create/Edit)
  const [showAddSportForm, setShowAddSportForm] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [sportName, setSportName] = useState('');
  const [sportDescription, setSportDescription] = useState('');

  // CourtType form state (Create/Edit)
  const [showAddCourtTypeForm, setShowAddCourtTypeForm] = useState(false);
  const [editingCourtType, setEditingCourtType] = useState<CourtTypeItem | null>(null);
  const [courtTypeName, setCourtTypeName] = useState('');
  const [courtTypeDescription, setCourtTypeDescription] = useState('');

  // New RentalType form state
  const [showAddRentalTypeForm, setShowAddRentalTypeForm] = useState(false);
  const [rentalName, setRentalName] = useState('');
  const [rentalDescription, setRentalDescription] = useState('');

  // New Teacher form state
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherSport, setTeacherSport] = useState<SportType>('Futevôlei');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPrice, setTeacherPrice] = useState(120);
  const [teacherStatus, setTeacherStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [teacherNotes, setTeacherNotes] = useState('');

  // New Student form state
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentSport, setStudentSport] = useState<SportType>('Futevôlei');
  const [studentTeacherId, setStudentTeacherId] = useState('');
  const [studentLevel, setStudentLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Iniciante');
  const [studentFee, setStudentFee] = useState(240);
  const [studentStatus, setStudentStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const handleCreateRentalType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalName.trim()) return;
    const newItem: RentalType = {
      id: `rental-${Date.now()}`,
      name: rentalName.trim(),
      description: rentalDescription.trim() || undefined,
      isDefault: false
    };
    onAddRentalType?.(newItem);
    setRentalName('');
    setRentalDescription('');
    setShowAddRentalTypeForm(false);
  };

  const handleSaveSportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sportName.trim()) return;

    if (editingSport) {
      const updated: Sport = {
        ...editingSport,
        name: sportName.trim(),
        description: sportDescription.trim() || undefined
      };
      if (onSaveSport) {
        onSaveSport(updated);
      } else {
        onAddSport?.(updated);
      }
    } else {
      const newSport: Sport = {
        id: `sport-${Date.now()}`,
        name: sportName.trim(),
        description: sportDescription.trim() || undefined,
        active: true
      };
      onAddSport?.(newSport);
    }

    setSportName('');
    setSportDescription('');
    setEditingSport(null);
    setShowAddSportForm(false);
  };

  const handleSaveCourtTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtTypeName.trim()) return;

    if (editingCourtType) {
      const updated: CourtTypeItem = {
        ...editingCourtType,
        name: courtTypeName.trim(),
        description: courtTypeDescription.trim() || undefined
      };
      if (onSaveCourtType) {
        onSaveCourtType(updated);
      } else {
        onAddCourtType?.(updated);
      }
    } else {
      const newType: CourtTypeItem = {
        id: `type-${Date.now()}`,
        name: courtTypeName.trim(),
        description: courtTypeDescription.trim() || undefined,
        active: true
      };
      onAddCourtType?.(newType);
    }

    setCourtTypeName('');
    setCourtTypeDescription('');
    setEditingCourtType(null);
    setShowAddCourtTypeForm(false);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherPhone.trim()) return;
    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      name: teacherName.trim(),
      phone: teacherPhone.trim(),
      sport: teacherSport,
      email: teacherEmail.trim() || undefined,
      pricePerClass: teacherPrice > 0 ? teacherPrice : undefined,
      status: teacherStatus,
      notes: teacherNotes.trim() || undefined
    };
    onAddTeacher?.(newTeacher);
    setTeacherName('');
    setTeacherPhone('');
    setTeacherEmail('');
    setTeacherPrice(120);
    setTeacherNotes('');
    setShowAddTeacherForm(false);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim()) return;
    const teacherObj = (teachers || []).find(t => t.id === studentTeacherId);
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name: studentName.trim(),
      phone: studentPhone.trim(),
      sport: studentSport,
      teacherId: teacherObj?.id,
      teacherName: teacherObj?.name,
      level: studentLevel,
      status: studentStatus,
      monthlyFee: studentFee > 0 ? studentFee : undefined
    };
    onAddStudent?.(newStudent);
    setStudentName('');
    setStudentPhone('');
    setStudentTeacherId('');
    setStudentLevel('Iniciante');
    setStudentFee(240);
    setShowAddStudentForm(false);
  };

  return (
    <div id="court-manager-view" className="space-y-6">
      
      {/* Submenu Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveSubTab('quadras')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'quadras'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="h-4 w-4" />
          Quadras Esportivas
        </button>
        <button
          onClick={() => setActiveSubTab('esportes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'esportes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="h-4 w-4 text-amber-500" />
          Esportes
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/50 font-mono">
            {sports.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('tipos_aluguel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'tipos_aluguel'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4 text-emerald-500" />
          Tipos de Aluguel
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/50 font-mono">
            {rentalTypes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('professores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'professores'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Professores
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/50 font-mono">
            {teachers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('alunos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'alunos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          Alunos
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/50 font-mono">
            {students.length}
          </span>
        </button>
      </div>

      {/* 1. QUADRAS SUBTAB */}
      {activeSubTab === 'quadras' && (
        <div className="space-y-6">
          {/* Configure Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
            <Settings className="h-5 w-5 text-blue-500" />
            Configuração das Quadras
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Cadastre novas quadras esportivas, ajuste valores de locação e alterne status de manutenção.
          </p>
        </div>
        {isAdmin ? (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Fechar Form' : 'Nova Quadra'}
          </button>
        ) : (
          <div className="bg-slate-50 border border-slate-200 text-slate-500 px-3.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            Visualização de Leitura
          </div>
        )}
      </div>

      {/* Add New Court Form */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl"
        >
          <h4 className="font-bold text-slate-950 mb-4 text-xs uppercase tracking-wider">Cadastrar Nova Quadra</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome da Quadra</label>
                <input 
                   type="text" 
                  placeholder="Ex: Arena Sunset, Quadra Premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Tipo de Quadra</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CourtType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700"
                >
                  {courtTypes.map((ct) => (
                    <option key={ct.id} value={ct.name}>
                      🏟️ {ct.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Valor por Hora (R$)</label>
                <input 
                  type="number" 
                  placeholder="90"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CourtStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700"
                >
                  <option value="Disponível">Disponível</option>
                  <option value="Ocupada">Ocupada</option>
                  <option value="Manutenção">Manutenção</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Descrição / Diferenciais (Opcional)</label>
              <textarea 
                placeholder="Ex: Sistema de som acústico, areia branca tratada antitérmica..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-lg shadow-blue-200"
              >
                Salvar Quadra
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Courts list cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courts.map((court) => {
          return (
            <div 
              key={court.id} 
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                      {court.type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      court.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700' :
                      court.status === 'Ocupada' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {court.status}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(court.pricePerHour)} / hr</span>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-2.5 tracking-tight">{court.name}</h4>
                {court.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{court.description}</p>
                )}
              </div>

              {/* Fast Controls Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center gap-3">
                <div className="flex gap-1">
                  {(['Disponível', 'Manutenção'] as CourtStatus[]).map((st) => (
                    <button
                      key={st}
                      id={`btn-status-${court.id}-${st}`}
                      onClick={() => onUpdateCourtStatus(court.id, st)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        court.status === st 
                          ? st === 'Disponível' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'Disponível' ? '✔️ Liberar' : '🔧 Manutenção'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    confirmDeleteId === court.id ? (
                      <button
                        id={`btn-confirm-del-${court.id}`}
                        onClick={() => {
                          onDeleteCourt(court.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        id={`btn-del-court-${court.id}`}
                        onClick={() => {
                          setConfirmDeleteId(court.id);
                          setTimeout(() => setConfirmDeleteId(null), 4000); // clear after 4 seconds
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition cursor-pointer"
                        title="Excluir Quadra"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      Restrito
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
        </div>
      )}

      {/* 2. ESPORTES SUBTAB */}
      {activeSubTab === 'esportes' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
                <Trophy className="h-5 w-5 text-amber-500" />
                Cadastro & Edição de Esportes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Cadastre e edite as modalidades esportivas praticadas na arena (ex: Vôlei de Areia, Futevôlei, Beach Tennis).
              </p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => {
                  setEditingSport(null);
                  setSportName('');
                  setSportDescription('');
                  setShowAddSportForm(!showAddSportForm);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {showAddSportForm ? 'Fechar Form' : 'Novo Esporte'}
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-200 text-slate-500 px-3.5 py-1.5 rounded-xl text-[10px] font-bold">
                Visualização de Leitura
              </div>
            )}
          </div>

          {/* Form Create/Edit */}
          {showAddSportForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl"
            >
              <h4 className="font-bold text-slate-950 mb-4 text-xs uppercase tracking-wider">
                {editingSport ? 'Editar Esporte' : 'Cadastrar Novo Esporte'}
              </h4>
              <form onSubmit={handleSaveSportSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Esporte *</label>
                  <input
                    type="text"
                    placeholder="Ex: Futevôlei, Pickleball, Beach Tennis"
                    value={sportName}
                    onChange={(e) => setSportName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Descrição / Detalhes (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Regulamento oficial, altura da rede 2,20m..."
                    value={sportDescription}
                    onChange={(e) => setSportDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSportForm(false);
                      setEditingSport(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {editingSport ? 'Salvar Alterações' : 'Cadastrar Esporte'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* List of Sports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sports.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                      {item.name}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Ativo
                    </span>
                  </div>
                  {item.description ? (
                    <p className="text-xs text-slate-500 font-medium mt-1">{item.description}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">Sem descrição cadastrada</p>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingSport(item);
                        setSportName(item.name);
                        setSportDescription(item.description || '');
                        setShowAddSportForm(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Editar esporte"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>

                    {confirmDelSportId === item.id ? (
                      <button
                        onClick={() => {
                          onDeleteSport?.(item.id, item.name);
                          setConfirmDelSportId(null);
                        }}
                        className="px-2.5 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDelSportId(item.id);
                          setTimeout(() => setConfirmDelSportId(null), 4000);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition cursor-pointer"
                        title="Excluir esporte"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TIPOS DE ALUGUEL SUBTAB */}
      {activeSubTab === 'tipos_aluguel' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
                <FileText className="h-5 w-5 text-amber-500" />
                Cadastro de Tipos de Aluguel
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Gerencie os itens de cadastro para o tipo de agendamento (ex: Aluguel, Day-use, Aula de futevôlei, Eventos), permitindo incluir ou excluir opções.
              </p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => setShowAddRentalTypeForm(!showAddRentalTypeForm)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {showAddRentalTypeForm ? 'Fechar Form' : 'Novo Tipo'}
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-200 text-slate-500 px-3.5 py-1.5 rounded-xl text-[10px] font-bold">
                Visualização de Leitura
              </div>
            )}
          </div>

          {/* Form */}
          {showAddRentalTypeForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl"
            >
              <h4 className="font-bold text-slate-950 mb-4 text-xs uppercase tracking-wider">Incluir Novo Tipo de Aluguel</h4>
              <form onSubmit={handleCreateRentalType} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Tipo (Ex: Aluguel, Torneio Avulso, Clínica)</label>
                  <input
                    type="text"
                    placeholder="Ex: Torneio Avulso"
                    value={rentalName}
                    onChange={(e) => setRentalName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Descrição / Finalidade (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Reserva especial para competições de fim de semana"
                    value={rentalDescription}
                    onChange={(e) => setRentalDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddRentalTypeForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-lg shadow-amber-200"
                  >
                    Incluir Cadastro
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Rental Types List / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rentalTypes.map((rt) => (
              <div
                key={rt.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      📌 Tipo de Agendamento
                    </span>
                    {rt.isDefault ? (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        Padrão do Sistema
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Personalizado
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2.5 tracking-tight">{rt.name}</h4>
                  {rt.description ? (
                    <p className="text-xs text-slate-500 mt-1 font-medium">{rt.description}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">Sem descrição detalhada</p>
                  )}
                </div>

                {/* Footer with Delete Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Disponível no agendamento
                  </span>
                  {isAdmin && (
                    confirmDelRentalId === rt.id ? (
                      <button
                        onClick={() => {
                          onDeleteRentalType?.(rt.id);
                          setConfirmDelRentalId(null);
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        Confirmar Exclusão
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDelRentalId(rt.id);
                          setTimeout(() => setConfirmDelRentalId(null), 4000);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition cursor-pointer"
                        title="Excluir item de cadastro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PROFESSORES SUBTAB */}
      {activeSubTab === 'professores' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                Cadastro de Professores e Instrutores
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Cadastre e gerencie os professores responsáveis pelas aulas de Futevôlei, Beach Tennis e Vôlei de Areia.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddTeacherForm(!showAddTeacherForm)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {showAddTeacherForm ? 'Fechar Form' : 'Novo Professor'}
              </button>
            )}
          </div>

          {/* Add Teacher Form */}
          {showAddTeacherForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl"
            >
              <h4 className="font-bold text-slate-950 mb-4 text-xs uppercase tracking-wider">Cadastrar Novo Professor</h4>
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Professor</label>
                    <input
                      type="text"
                      placeholder="Ex: Prof. Lucas Mendes"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 99876-5432"
                      value={teacherPhone}
                      onChange={(e) => setTeacherPhone(formatPhoneNumber(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Modalidade Esportiva</label>
                    <select
                      value={teacherSport}
                      onChange={(e) => setTeacherSport(e.target.value as SportType)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="Vôlei de Areia">🏐 Vôlei de Areia</option>
                      <option value="Futevôlei">⚽ Futevôlei</option>
                      <option value="Vôlei de Quadra">👟 Vôlei de Quadra</option>
                      <option value="Beach Tennis">🎾 Beach Tennis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Valor por Aula / Hora (R$)</label>
                    <input
                      type="number"
                      placeholder="120"
                      value={teacherPrice}
                      onChange={(e) => setTeacherPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">E-mail (Opcional)</label>
                    <input
                      type="email"
                      placeholder="lucas@arena.com"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Observações / Especialidade</label>
                    <input
                      type="text"
                      placeholder="Ex: Treinamento avançado de futevôlei"
                      value={teacherNotes}
                      onChange={(e) => setTeacherNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddTeacherForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-lg shadow-blue-200"
                  >
                    Salvar Professor
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Teachers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(new Map(teachers.map((t) => [t.name.trim().toLowerCase(), t])).values()).map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                        {teacher.sport}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                        Ativo
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(teacher.pricePerClass || 0)} / aula
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2.5 tracking-tight flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    {teacher.name}
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono">{teacher.phone}</span>
                    </div>
                    {teacher.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{teacher.email}</span>
                      </div>
                    )}
                    {teacher.notes && (
                      <p className="text-xs text-slate-500 italic mt-1">{teacher.notes}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium">Professor Cadastrado</span>
                  {isAdmin && (
                    confirmDelTeacherId === teacher.id ? (
                      <button
                        onClick={() => {
                          onDeleteTeacher?.(teacher.id);
                          setConfirmDelTeacherId(null);
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        Confirmar Exclusão
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDelTeacherId(teacher.id);
                          setTimeout(() => setConfirmDelTeacherId(null), 4000);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition cursor-pointer"
                        title="Excluir Professor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ALUNOS SUBTAB */}
      {activeSubTab === 'alunos' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
                <Users className="h-5 w-5 text-emerald-500" />
                Cadastro de Alunos e Praticantes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Matricule e gerencie os alunos nas modalidades esportivas e organize mensalidades.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {showAddStudentForm ? 'Fechar Form' : 'Novo Aluno'}
              </button>
            )}
          </div>

          {/* Add Student Form */}
          {showAddStudentForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl"
            >
              <h4 className="font-bold text-slate-950 mb-4 text-xs uppercase tracking-wider">Matricular Novo Aluno</h4>
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Aluno</label>
                    <input
                      type="text"
                      placeholder="Ex: Gabriel Santos"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 97777-1111"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(formatPhoneNumber(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Modalidade Esportiva</label>
                    <select
                      value={studentSport}
                      onChange={(e) => setStudentSport(e.target.value as SportType)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="Vôlei de Areia">🏐 Vôlei de Areia</option>
                      <option value="Futevôlei">⚽ Futevôlei</option>
                      <option value="Vôlei de Quadra">👟 Vôlei de Quadra</option>
                      <option value="Beach Tennis">🎾 Beach Tennis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Professor Responsável</label>
                    <select
                      value={studentTeacherId}
                      onChange={(e) => setStudentTeacherId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="">Selecione um professor...</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Nível Técnico</label>
                    <select
                      value={studentLevel}
                      onChange={(e) => setStudentLevel(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Mensalidade (R$)</label>
                    <input
                      type="number"
                      placeholder="240"
                      value={studentFee}
                      onChange={(e) => setStudentFee(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-lg shadow-emerald-200"
                  >
                    Matricular Aluno
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Students Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(new Map(students.map((s) => [s.name.trim().toLowerCase(), s])).values()).map((student) => (
              <div
                key={student.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                        {student.sport}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.level === 'Iniciante' ? 'bg-emerald-50 text-emerald-700' :
                        student.level === 'Intermediário' ? 'bg-blue-50 text-blue-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {student.level}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(student.monthlyFee || 0)} / mês
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2.5 tracking-tight flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    {student.name}
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono">{student.phone}</span>
                    </div>
                    {student.teacherName && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                        <span>Prof.: {student.teacherName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium">Aluno Matriculado</span>
                  {isAdmin && (
                    confirmDelStudentId === student.id ? (
                      <button
                        onClick={() => {
                          onDeleteStudent?.(student.id);
                          setConfirmDelStudentId(null);
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        Confirmar Exclusão
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDelStudentId(student.id);
                          setTimeout(() => setConfirmDelStudentId(null), 4000);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition cursor-pointer"
                        title="Excluir Aluno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
