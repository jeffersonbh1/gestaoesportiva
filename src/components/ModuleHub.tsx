import React from 'react';
import { Volleyball, UtensilsCrossed, Sparkles, ChevronRight, ShoppingBag, Calendar, ArrowRight } from 'lucide-react';

interface ModuleHubProps {
  onSelectQuadras: () => void;
  onSelectBar: () => void;
}

export default function ModuleHub({ onSelectQuadras, onSelectBar }: ModuleHubProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 text-center">
        {/* Header Title */}
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Arena Fahel Beach - Sistema de Gestão
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Selecione o Módulo Desejado
          </h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Escolha abaixo o módulo do sistema para iniciar o atendimento, gerenciar agendamentos ou realizar vendas no bar.
          </p>
        </div>

        {/* Two Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Module 1: Agendamento de Quadras */}
          <div 
            onClick={onSelectQuadras}
            className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="h-14 w-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-sm">
                <Volleyball className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Agendamento de Quadras
                </h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Gestão completa de horários, reservas de quadras de areia e poliesportivas, professores, turmas de alunos, comissão e divisão de contas de jogos.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  🗓️ Agenda & Timeline
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  🎾 Quadras
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  💰 Financeiro
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  🏆 Avaliações
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-black text-blue-600 group-hover:text-blue-700">
              <span>Acessar Módulo Quadras</span>
              <div className="h-8 w-8 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-full flex items-center justify-center transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Module 2: Gerenciar Bar */}
          <div 
            onClick={onSelectBar}
            className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-amber-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="h-14 w-14 bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-sm">
                <UtensilsCrossed className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  Gerenciar Bar
                </h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Sistema de caixa (PDV) e vendas para bebidas geladas, petiscos, espetinhos e sanduíches, com cadastro de cardápio e controle automático de estoque.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  🍺 Bebidas & Petiscos
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  🛒 Caixa (PDV)
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  📦 Controle Estoque
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  📊 Relatórios
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-black text-amber-600 group-hover:text-amber-700">
              <span>Gerenciar Bar</span>
              <div className="h-8 w-8 bg-amber-50 group-hover:bg-amber-500 group-hover:text-white rounded-full flex items-center justify-center transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
