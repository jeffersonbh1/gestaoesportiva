import React, { useState } from 'react';
import { StockMovement } from '../../types';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  Search, 
  History, 
  Package 
} from 'lucide-react';

interface BarStockMovementsProps {
  movements: StockMovement[];
}

export default function BarStockMovements({ movements }: BarStockMovementsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Todos');

  const filteredMovements = movements.filter(m => {
    const matchesType = filterType === 'Todos' || m.type === filterType;
    const matchesSearch = m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-amber-500" />
          <h3 className="font-extrabold text-slate-900 text-sm">
            Histórico e Movimentações de Estoque
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Buscar por produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="Entrada">Entradas (Reposição)</option>
            <option value="Saída (Venda)">Saídas (Venda)</option>
            <option value="Ajuste / Perda">Ajustes / Perdas</option>
            <option value="Cancelamento Venda">Devolução (Cancelamento)</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Quantidade</th>
                <th className="py-3 px-4">Motivo / Origem</th>
                <th className="py-3 px-4">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMovements.map((mov) => {
                const isPositive = mov.quantity > 0;

                return (
                  <tr key={mov.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {mov.createdAt}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {mov.productName}
                    </td>

                    <td className="py-3.5 px-4">
                      {mov.type === 'Entrada' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                          Entrada
                        </span>
                      ) : mov.type === 'Saída (Venda)' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Saída (Venda)
                        </span>
                      ) : mov.type === 'Cancelamento Venda' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-[11px]">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Devolução
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 text-[11px]">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Ajuste / Perda
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-extrabold text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? `+${mov.quantity}` : mov.quantity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {mov.reason}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {mov.user || 'Sistema'}
                    </td>
                  </tr>
                );
              })}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhuma movimentação de estoque registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
