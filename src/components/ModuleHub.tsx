import React from 'react';
import { Volleyball, UtensilsCrossed, Sparkles, ChevronRight, ShoppingBag, Calendar, ArrowRight, Users, Scale, Link as LinkIcon, ShieldCheck } from 'lucide-react';

interface ModuleHubProps {
  onSelectQuadras: () => void;
  onSelectBar: () => void;
  onSelectJogador?: () => void;
}

export default function ModuleHub({ onSelectQuadras, onSelectBar, onSelectJogador }: ModuleHubProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-8 text-center">
        {/* Header Title */}
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Arena Fahel Beach - Sistema Integrado
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Selecione o Módulo Desejado
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Escolha abaixo o módulo do sistema para iniciar o atendimento da arena, realizar vendas no bar ou organizar os sorteios e equipes dos atletas.
          </p>
        </div>

        {/* Three Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Module 1: Agendamento de Quadras */}
          <div 
            onClick={onSelectQuadras}
            className="group relative bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="h-13 w-13 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-sm">
                <Volleyball className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Quadras & Agenda
                </h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Gestão completa de horários, reservas de quadras de areia e poliesportivas, professores, turmas e divisão de contas.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  🗓️ Agenda
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  🎾 Quadras
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  💰 Financeiro
                </span>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-blue-600 group-hover:text-blue-700">
              <span>Acessar Quadras</span>
              <div className="h-7 w-7 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-full flex items-center justify-center transition-all">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Module 2: Gerenciar Bar */}
          <div 
            onClick={onSelectBar}
            className="group relative bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-amber-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="h-13 w-13 bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-sm">
                <UtensilsCrossed className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  Bar & Vendas (PDV)
                </h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Controle de comandas, vendas no balcão, cadastro de cardápio, gestão de estoque e relatórios de faturamento.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  🍺 Bebidas & Petiscos
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  🛒 Caixa (PDV)
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  📦 Estoque
                </span>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-amber-600 group-hover:text-amber-700">
              <span>Acessar Bar</span>
              <div className="h-7 w-7 bg-amber-50 group-hover:bg-amber-500 group-hover:text-white rounded-full flex items-center justify-center transition-all">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Module 3: Módulo do Jogador & Sorteios */}
          <div 
            onClick={onSelectJogador}
            className="group relative bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="h-13 w-13 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-sm">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Jogador & Sorteios
                </h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Vínculo automático de equipes por e-mail, algoritmo de sorteio equilibrado ou aleatório, histórico transparente e WhatsApp.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  ⭐ Estrelas (1 a 5)
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  ⚖️ Sorteio Equilibrado
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  🛡️ Auditoria & WhatsApp
                </span>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-emerald-600 group-hover:text-emerald-700">
              <span>Acessar Módulo Jogador</span>
              <div className="h-7 w-7 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-full flex items-center justify-center transition-all">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
