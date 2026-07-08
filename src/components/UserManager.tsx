import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  ShieldAlert, 
  Check, 
  Phone, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Search,
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagerProps {
  users: User[];
  currentUser: User;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserManager({ users, currentUser, onSaveUser, onDeleteUser }: UserManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'Todos' | 'Administrador' | 'Usuário'>('Todos');
  
  // Create User Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Usuário');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    // Check if username already exists
    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (usernameExists) {
      setError('Este nome de usuário já está sendo utilizado.');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role
    };

    onSaveUser(newUser);
    setSuccess(`Usuário "${newUser.name}" cadastrado com sucesso!`);

    // Reset Form
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
    setRole('Usuário');

    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteClick = (userId: string) => {
    if (userId === currentUser.id) {
      setError('Você não pode excluir a sua própria conta ativa.');
      return;
    }
    
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && window.confirm(`Tem certeza de que deseja excluir o usuário "${userToDelete.name}"?`)) {
      onDeleteUser(userId);
      setSuccess(`Usuário removido com sucesso.`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter !== 'Todos') {
      return matchesSearch && u.role === roleFilter;
    }
    return matchesSearch;
  });

  return (
    <div id="user-management-view" className="space-y-6 font-sans">
      
      {/* Tab Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Controle de Usuários e Perfis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Gerencie o acesso ao sistema, registre novos funcionários/administradores e configure permissões.
          </p>
        </div>
        <div className="bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">Administrador: {currentUser.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form to register a user (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" /> Registrar Novo Usuário
            </h3>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-pulse">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Alberto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome de Usuário *</label>
                  <input
                    type="text"
                    placeholder="Ex: carlos.admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Perfil / Cargo *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Usuário')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      role === 'Usuário'
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Usuário Padrão
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Administrador')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      role === 'Administrador'
                        ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  placeholder="Ex: carlos@arena.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  placeholder="Ex: (11) 97777-6666"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-100"
              >
                <UserPlus className="h-4 w-4" /> Salvar Usuário
              </button>
            </form>
          </div>

          <div className="bg-slate-100 p-4.5 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed font-semibold">
            <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-500" /> Informativo de Perfis:
            </span>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li><strong className="text-slate-700">Administrador:</strong> Acesso total às configurações, cadastro e exclusão de quadras, controle total de usuários e modificação geral de dados.</li>
              <li><strong className="text-slate-700">Usuário Padrão:</strong> Acesso restrito. Permite visualizar e agendar quadras, cadastrar jogadores e faturar parcelas do "Racha", mas proíbe exclusão de agendamentos ou acesso à área administrativa.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: List of Users (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Header filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> Lista de Usuários do Sistema
              </h3>

              <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                {(['Todos', 'Administrador', 'Usuário'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRoleFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      roleFilter === filter 
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuário por nome, email ou login..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Users grid */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  Nenhum usuário cadastrado encontrado
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

                  return (
                    <div
                      key={user.id}
                      className={`p-3.5 bg-white border rounded-2xl transition flex items-center justify-between ${
                        isCurrent ? 'border-blue-200 bg-blue-50/10' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                          user.role === 'Administrador' 
                            ? 'bg-blue-500 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {initials || 'JG'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{user.name}</span>
                            {isCurrent && (
                              <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                Você
                              </span>
                            )}
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                              user.role === 'Administrador'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {user.role === 'Administrador' ? (
                                <Shield className="h-2 w-2" />
                              ) : (
                                <UserIcon className="h-2 w-2" />
                              )}
                              {user.role}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              👤 {user.username}
                            </span>
                            {user.phone && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                📞 {user.phone}
                              </span>
                            )}
                            {user.email && (
                              <span className="text-[10px] text-slate-400">
                                ✉️ {user.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="text-[9px] text-slate-400 font-bold px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                            Ativo
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteClick(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Remover Usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
