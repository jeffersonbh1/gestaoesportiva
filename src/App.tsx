import React, { useState, useEffect } from 'react';
import { Court, Booking, CourtStatus, PaymentStatus, User, RentalType, Teacher, Student, Sport, CourtTypeItem } from './types';
import { INITIAL_COURTS, getInitialBookings, INITIAL_RENTAL_TYPES, INITIAL_TEACHERS, INITIAL_STUDENTS, INITIAL_SPORTS, INITIAL_COURT_TYPES } from './data/mockData';
import { 
  isSupabaseConfigured,
  dbGetUsers,
  dbSaveUser,
  dbDeleteUser,
  dbGetCourts,
  dbSaveCourt,
  dbDeleteCourt,
  dbGetBookings,
  dbSaveBooking,
  dbDeleteBooking,
  dbGetSports,
  dbSaveSport,
  dbDeleteSport,
  dbGetCourtTypes,
  dbSaveCourtType,
  dbDeleteCourtType,
  dbGetTeachers,
  dbGetStudents
} from './lib/supabase';
import Dashboard from './components/Dashboard';
import CourtGrid from './components/CourtGrid';
import PaymentHistory from './components/PaymentHistory';
import CourtManager from './components/CourtManager';
import BookingModal from './components/BookingModal';
import PlayerSplitManager from './components/PlayerSplitManager';
import PlayerRatingManager from './components/PlayerRatingManager';
import Login from './components/Login';
import UserManager from './components/UserManager';
import { 
  Calendar, 
  LayoutDashboard, 
  TrendingUp, 
  Settings, 
  Plus, 
  Users, 
  Menu, 
  X,
  Volume2,
  Volleyball,
  LogOut,
  Shield,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // 0. Authentication and User Management States
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('arena_users');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'user-admin',
        username: 'admin',
        password: 'admin123',
        name: 'Admin Arena',
        role: 'Administrador',
        email: 'admin@arenafahelbeach.com.br',
        phone: '(11) 99999-8888'
      },
      {
        id: 'user-standard',
        username: 'usuario',
        password: 'user123',
        name: 'Operador de Arena',
        role: 'Usuário',
        email: 'operador@arenafahelbeach.com.br',
        phone: '(11) 98888-7777'
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('arena_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 1. Core State with Local Storage persistence
  const [courts, setCourts] = useState<Court[]>(() => {
    const saved = localStorage.getItem('arena_courts');
    return saved ? JSON.parse(saved) : INITIAL_COURTS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('arena_bookings');
    return saved ? JSON.parse(saved) : getInitialBookings();
  });

  const [rentalTypes, setRentalTypes] = useState<RentalType[]>(() => {
    const saved = localStorage.getItem('arena_rental_types');
    const parsed: RentalType[] = saved ? JSON.parse(saved) : INITIAL_RENTAL_TYPES;
    if (!parsed.some(r => r.name === 'Manutenção')) {
      return [...parsed, { id: 'rental-manutencao', name: 'Manutenção', description: 'Bloqueio de horário para manutenção ou limpeza da quadra', isDefault: true }];
    }
    return parsed;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('arena_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('arena_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [sports, setSports] = useState<Sport[]>(() => {
    const saved = localStorage.getItem('arena_sports');
    return saved ? JSON.parse(saved) : INITIAL_SPORTS;
  });

  const [courtTypes, setCourtTypes] = useState<CourtTypeItem[]>(() => {
    const saved = localStorage.getItem('arena_court_types');
    return saved ? JSON.parse(saved) : INITIAL_COURT_TYPES;
  });

  // Data atual carregada por padrão ao entrar no sistema
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 2. Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presetCourtId, setPresetCourtId] = useState<string | undefined>(undefined);
  const [presetStartTime, setPresetStartTime] = useState<string | undefined>(undefined);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);

  const [dbLoading, setDbLoading] = useState(isSupabaseConfigured);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load from database if configured
  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured) return;
      try {
        setDbLoading(true);
        setDbError(null);
        const [dbUsers, dbCourts, dbBookings, dbSports, dbCourtTypes, dbTeachers, dbStudents] = await Promise.all([
          dbGetUsers(),
          dbGetCourts(),
          dbGetBookings(),
          dbGetSports(),
          dbGetCourtTypes(),
          dbGetTeachers(),
          dbGetStudents()
        ]);
        
        if (dbUsers.length > 0) setUsers(dbUsers);
        if (dbCourts.length > 0) setCourts(dbCourts);
        setBookings(dbBookings);
        if (dbSports.length > 0) setSports(dbSports);
        if (dbCourtTypes.length > 0) setCourtTypes(dbCourtTypes);
        if (dbTeachers.length > 0) setTeachers(dbTeachers);
        if (dbStudents.length > 0) setStudents(dbStudents);
      } catch (err: any) {
        console.error("Erro ao carregar dados do Supabase:", err);
        setDbError(`Erro ao carregar do Supabase: ${err.message || 'Verifique se executou o script SQL'}`);
      } finally {
        setDbLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('arena_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('arena_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('arena_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('arena_courts', JSON.stringify(courts));
  }, [courts]);

  useEffect(() => {
    localStorage.setItem('arena_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('arena_rental_types', JSON.stringify(rentalTypes));
  }, [rentalTypes]);

  useEffect(() => {
    localStorage.setItem('arena_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('arena_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('arena_sports', JSON.stringify(sports));
  }, [sports]);

  useEffect(() => {
    localStorage.setItem('arena_court_types', JSON.stringify(courtTypes));
  }, [courtTypes]);

  // Handlers for user management actions
  const handleSaveUser = async (user: User) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.map((u) => (u.id === user.id ? user : u));
      }
      return [...prev, user];
    });

    if (isSupabaseConfigured) {
      try {
        await dbSaveUser(user);
        const updated = await dbGetUsers();
        if (updated.length > 0) setUsers(updated);
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao salvar usuário no Supabase:", err);
        setDbError(`Erro ao salvar usuário no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (isSupabaseConfigured) {
      try {
        await dbDeleteUser(userId);
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao excluir usuário no Supabase:", err);
        setDbError(`Erro ao excluir usuário no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Handlers for booking actions
  const handleSaveBooking = async (booking: Booking) => {
    // Atualização otimista no React State
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === booking.id);
      if (exists) {
        return prev.map((b) => (b.id === booking.id ? booking : b));
      }
      return [...prev, booking];
    });

    if (isSupabaseConfigured) {
      try {
        await dbSaveBooking(booking);
        const updated = await dbGetBookings();
        setBookings(updated);
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao salvar agendamento no Supabase:", err);
        setDbError(`Erro ao gravar agendamento no Supabase: ${err.message || 'Verifique os logs'}`);
      }
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    // Optimistically update React state immediately
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    if (isSupabaseConfigured) {
      try {
        await dbDeleteBooking(bookingId);
        const updated = await dbGetBookings();
        // Ensure deleted booking is filtered out from state
        setBookings(updated.filter((b) => b.id !== bookingId));
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao deletar agendamento no Supabase:", err);
        setDbError(`Erro ao deletar agendamento no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: string, status: PaymentStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, paymentStatus: status } : b))
    );

    if (isSupabaseConfigured) {
      try {
        const found = bookings.find((b) => b.id === bookingId);
        if (found) {
          await dbSaveBooking({ ...found, paymentStatus: status });
          const updated = await dbGetBookings();
          setBookings(updated);
          setDbError(null);
        }
      } catch (err: any) {
        console.error("Erro ao atualizar status de pagamento no Supabase:", err);
        setDbError(`Erro ao atualizar pagamento no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Handlers for court management
  const handleAddCourt = async (newCourt: Court) => {
    setCourts((prev) => [...prev, newCourt]);

    if (isSupabaseConfigured) {
      try {
        await dbSaveCourt(newCourt);
        const updated = await dbGetCourts();
        if (updated.length > 0) setCourts(updated);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateCourtStatus = async (courtId: string, status: CourtStatus) => {
    setCourts((prev) =>
      prev.map((c) => (c.id === courtId ? { ...c, status } : c))
    );

    if (isSupabaseConfigured) {
      try {
        const found = courts.find((c) => c.id === courtId);
        if (found) {
          await dbSaveCourt({ ...found, status });
          const updated = await dbGetCourts();
          if (updated.length > 0) setCourts(updated);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteCourt = async (courtId: string) => {
    setCourts((prev) => prev.filter((c) => c.id !== courtId));
    setBookings((prev) => prev.filter((b) => b.courtId !== courtId));

    if (isSupabaseConfigured) {
      try {
        await dbDeleteCourt(courtId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddRentalType = (item: RentalType) => {
    setRentalTypes((prev) => [...prev, item]);
  };

  const handleDeleteRentalType = (id: string) => {
    setRentalTypes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddTeacher = (teacher: Teacher) => {
    setTeachers((prev) => {
      const exists = prev.some((t) => t.id === teacher.id);
      if (exists) return prev.map((t) => (t.id === teacher.id ? teacher : t));
      return [...prev, teacher];
    });
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddStudent = (student: Student) => {
    setStudents((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      if (exists) return prev.map((s) => (s.id === student.id ? student : s));
      return [...prev, student];
    });
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveSport = async (sport: Sport) => {
    setSports((prev) => {
      const exists = prev.some((s) => s.id === sport.id);
      if (exists) {
        return prev.map((s) => (s.id === sport.id ? sport : s));
      }
      return [...prev, sport];
    });

    if (isSupabaseConfigured) {
      try {
        await dbSaveSport(sport);
        const updated = await dbGetSports();
        if (updated.length > 0) setSports(updated);
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao salvar esporte no Supabase:", err);
        setDbError(`Erro ao salvar esporte no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleDeleteSport = async (id: string, name?: string) => {
    setSports((prev) => prev.filter((s) => s.id !== id));
    if (isSupabaseConfigured) {
      try {
        await dbDeleteSport(id, name);
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao excluir esporte no Supabase:", err);
        setDbError(`Erro ao excluir esporte no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleSaveCourtType = async (item: CourtTypeItem) => {
    setCourtTypes((prev) => {
      const exists = prev.some((c) => c.id === item.id);
      if (exists) {
        return prev.map((c) => (c.id === item.id ? item : c));
      }
      return [...prev, item];
    });

    if (isSupabaseConfigured) {
      try {
        await dbSaveCourtType(item);
        const updated = await dbGetCourtTypes();
        if (updated.length > 0) setCourtTypes(updated);
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao salvar tipo de quadra no Supabase:", err);
        setDbError(`Erro ao salvar tipo de quadra no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleDeleteCourtType = async (id: string, name?: string) => {
    setCourtTypes((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured) {
      try {
        await dbDeleteCourtType(id, name);
        setDbError(null);
      } catch (err: any) {
        console.error("Erro ao excluir tipo de quadra no Supabase:", err);
        setDbError(`Erro ao excluir tipo de quadra no Supabase: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Direct trigger when clicking an empty hour slot
  const handleSelectSlot = (courtId: string, startTime: string) => {
    setPresetCourtId(courtId);
    setPresetStartTime(startTime);
    setEditingBooking(undefined);
    setIsModalOpen(true);
  };

  // View/Edit booking trigger
  const handleViewBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setPresetCourtId(undefined);
    setPresetStartTime(undefined);
    setIsModalOpen(true);
  };

  // Quick helper to jump from dashboard buttons
  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} users={users} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white text-slate-800 shrink-0 md:sticky md:top-0 md:h-screen flex flex-col justify-between border-r border-slate-200 z-30 overflow-y-auto">
        <div>
          {/* Brand/Logo */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Volleyball className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-800 leading-tight">
                  Arena Fahel Beach
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gestão Esportiva</p>
              </div>
            </div>
            
            {/* Mobile menu switch */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-slate-50 rounded-lg md:hidden text-slate-400 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Database connection status */}
          <div className={`px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between md:flex ${mobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Banco</span>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Supabase
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-100">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Local (Offline)
              </span>
            )}
          </div>

          {/* Date Selector sidebar controller */}
          <div className={`p-5 border-b border-slate-100 space-y-2 md:block ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              Visualizar Data
            </label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Navigation Links */}
          <nav className={`p-4 space-y-1 md:block ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <button
              id="nav-dashboard"
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              Painel Geral
            </button>

            <button
              id="nav-scheduler"
              onClick={() => { setActiveTab('agendamentos'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'agendamentos' 
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              Quadras & Horários
            </button>

            <button
              id="nav-financeiro"
              onClick={() => { setActiveTab('financeiro'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'financeiro' 
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="h-4.5 w-4.5" />
              Histórico Financeiro
            </button>

            <button
              id="nav-racha"
              onClick={() => { setActiveTab('racha'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'racha' 
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              Racha & Jogadores
            </button>

            <button
              id="nav-avaliacoes"
              onClick={() => { setActiveTab('avaliacoes'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'avaliacoes' 
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Trophy className="h-4.5 w-4.5" />
              Melhores do Jogo
            </button>

            <button
              id="nav-configuracoes"
              onClick={() => { setActiveTab('configuracoes'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'configuracoes' 
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              Gerenciar Quadras
            </button>

            {currentUser.role === 'Administrador' && (
              <button
                id="nav-usuarios"
                onClick={() => { setActiveTab('usuarios'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'usuarios' 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Shield className="h-4.5 w-4.5" />
                Controle de Usuários
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer info with profile & logout */}
        <div className={`p-4 border-t border-slate-100 mt-auto md:block ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          {/* User Profile Card */}
          <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-800 truncate" title={currentUser.name}>
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    currentUser.role === 'Administrador' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Logout button right next to user info */}
            <button
              id="btn-quick-logout"
              onClick={() => {
                setCurrentUser(null);
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
              title="Sair do Painel"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Banner de aviso de conexão/erro do Supabase */}
        {dbError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold shrink-0">⚠️ Supabase:</span>
              <span>{dbError}</span>
            </div>
            <button
              onClick={() => setDbError(null)}
              className="text-amber-600 hover:text-amber-900 font-bold px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard 
                bookings={bookings}
                courts={courts}
                selectedDate={selectedDate}
                onNavigateTab={handleNavigateTab}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
              />
            </motion.div>
          )}

          {activeTab === 'agendamentos' && (
            <motion.div
              key="agendamentos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Timeline Header control */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Quadras</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Gerencie os horários locados para o dia selecionado</p>
                </div>
                <button
                  id="direct-book-btn"
                  onClick={() => {
                    setPresetCourtId(undefined);
                    setPresetStartTime(undefined);
                    setEditingBooking(undefined);
                    setIsModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Novo Agendamento
                </button>
              </div>

              <CourtGrid 
                courts={courts}
                bookings={bookings}
                selectedDate={selectedDate}
                onSelectSlot={handleSelectSlot}
                onViewBooking={handleViewBooking}
              />
            </motion.div>
          )}

          {activeTab === 'financeiro' && (
            <motion.div
              key="financeiro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <PaymentHistory 
                bookings={bookings}
                courts={courts}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
              />
            </motion.div>
          )}

          {activeTab === 'racha' && (
            <motion.div
              key="racha"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <PlayerSplitManager 
                bookings={bookings}
                courts={courts}
                onSaveBooking={handleSaveBooking}
              />
            </motion.div>
          )}

          {activeTab === 'avaliacoes' && (
            <motion.div
              key="avaliacoes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <PlayerRatingManager 
                bookings={bookings}
              />
            </motion.div>
          )}

          {activeTab === 'configuracoes' && (
            <motion.div
              key="configuracoes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <CourtManager 
                courts={courts}
                onAddCourt={handleAddCourt}
                onUpdateCourtStatus={handleUpdateCourtStatus}
                onDeleteCourt={handleDeleteCourt}
                rentalTypes={rentalTypes}
                onAddRentalType={handleAddRentalType}
                onDeleteRentalType={handleDeleteRentalType}
                sports={sports}
                onAddSport={handleSaveSport}
                onSaveSport={handleSaveSport}
                onDeleteSport={handleDeleteSport}
                courtTypes={courtTypes}
                onAddCourtType={handleSaveCourtType}
                onSaveCourtType={handleSaveCourtType}
                onDeleteCourtType={handleDeleteCourtType}
                teachers={teachers}
                onAddTeacher={handleAddTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                students={students}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                isAdmin={currentUser.role === 'Administrador'}
              />
            </motion.div>
          )}

          {activeTab === 'usuarios' && currentUser.role === 'Administrador' && (
            <motion.div
              key="usuarios"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <UserManager 
                users={users}
                currentUser={currentUser}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Booking Form Modals Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <BookingModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            courts={courts}
            bookings={bookings}
            rentalTypes={rentalTypes}
            sports={sports}
            teachers={teachers}
            students={students}
            selectedDate={selectedDate}
            presetCourtId={presetCourtId}
            presetStartTime={presetStartTime}
            editingBooking={editingBooking}
            onSaveBooking={handleSaveBooking}
            onDeleteBooking={handleDeleteBooking}
            isAdmin={currentUser.role === 'Administrador'}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
