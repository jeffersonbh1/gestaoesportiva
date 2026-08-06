import React, { useState } from 'react';
import { AwardQuestion, Team } from '../types';
import AwardQuestionsManager from './AwardQuestionsManager';
import TeamsManager from './TeamsManager';
import { SQL_SCHEMA_SCRIPT } from '../lib/supabase';
import { 
  Award, 
  Users, 
  Database, 
  Copy, 
  Check, 
  HelpCircle, 
  Sparkles, 
  Code,
  ShieldCheck,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EvaluationModuleProps {
  questions: AwardQuestion[];
  onSaveQuestions: (questions: AwardQuestion[]) => void;
  sportsList?: string[];
  onTeamsChange?: (teams: Team[]) => void;
}

export default function EvaluationModule({
  questions,
  onSaveQuestions,
  sportsList = ['Todos', 'Futevôlei', 'Beach Tennis', 'Vôlei de Areia', 'Funcional Areia'],
  onTeamsChange
}: EvaluationModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'perguntas' | 'times' | 'script'>('perguntas');
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-blue-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Painel de Avaliação & Equipes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Avaliação & Gestão de Times
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              Configure as perguntas da pesquisa pós-jogo, gerencie os times e seus participantes, e consulte os scripts SQL de integração com o banco de dados.
            </p>
          </div>

          {/* SubTab Toggle Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shrink-0">
            <button
              onClick={() => setActiveSubTab('perguntas')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'perguntas'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Perguntas de Avaliação</span>
            </button>

            <button
              onClick={() => setActiveSubTab('times')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'times'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Criar & Gerenciar Times</span>
            </button>

            <button
              onClick={() => setActiveSubTab('script')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'script'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Script SQL / Banco</span>
            </button>
          </div>
        </div>
      </div>

      {/* SubTab Contents */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'perguntas' && (
          <motion.div
            key="perguntas-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <AwardQuestionsManager 
              questions={questions}
              onSaveQuestions={onSaveQuestions}
              sportsList={sportsList}
            />
          </motion.div>
        )}

        {activeSubTab === 'times' && (
          <motion.div
            key="times-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <TeamsManager 
              sportsList={sportsList.filter(s => s !== 'Todos')}
              onTeamsChange={onTeamsChange}
            />
          </motion.div>
        )}

        {activeSubTab === 'script' && (
          <motion.div
            key="script-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Server className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">Script SQL de Criação das Tabelas</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Execute este script no Editor SQL do seu projeto Supabase ou PostgreSQL para criar todas as tabelas necessárias.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyScript}
                className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  copiedScript
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                }`}
              >
                {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedScript ? 'Script Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            {/* Code Box */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 overflow-hidden shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                  <Code className="h-4 w-4 text-emerald-400" />
                  <span>schema_arena.sql</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  PostgreSQL / Supabase Ready
                </span>
              </div>

              <pre className="text-xs font-mono text-emerald-400/90 overflow-x-auto p-4 bg-slate-900/80 rounded-2xl border border-slate-800 leading-relaxed max-h-[500px] overflow-y-auto">
                {SQL_SCHEMA_SCRIPT}
              </pre>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white mb-1">Como vincular este script ao seu banco Supabase:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Acesse o dashboard do <strong>Supabase</strong> e abra seu projeto.</li>
                    <li>No menu lateral, clique em <strong>SQL Editor</strong>.</li>
                    <li>Cole o código SQL acima e clique em <strong>Run</strong> (Executar).</li>
                    <li>Todas as tabelas de quadras, agendamentos, times, membros e avaliações serão criadas e vinculadas instantaneamente.</li>
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
