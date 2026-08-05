import React, { useState } from 'react';
import { User } from '../types';
import { Volleyball, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

export default function Login({ onLogin, users }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate small latency for realistic visual feel
    setTimeout(() => {
      const foundUser = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );

      setLoading(false);
      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Usuário ou senha incorretos. Tente novamente.');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
          <Volleyball className="h-9 w-9 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          Arena Fahel Beach
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 uppercase tracking-widest font-bold">
          Sistema de Gestão Esportiva
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl border border-slate-200/60 rounded-3xl sm:px-10 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Acesse sua conta</h3>
            <p className="text-xs text-slate-400 mt-1">Insira suas credenciais para gerenciar agendamentos e jogadores.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Nome de Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Seu usuário"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Verificando...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-slate-400 font-semibold">
          Arena Fahel Beach v2.4 • Feito com foco e precisão
        </p>
      </div>
    </div>
  );
}
