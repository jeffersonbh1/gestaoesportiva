import React, { useState } from 'react';
import { Court, CourtType, CourtStatus } from '../types';
import { formatCurrency } from '../utils';
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
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface CourtManagerProps {
  courts: Court[];
  onAddCourt: (court: Court) => void;
  onUpdateCourtStatus: (courtId: string, status: CourtStatus) => void;
  onDeleteCourt: (courtId: string) => void;
  isAdmin?: boolean;
}

export default function CourtManager({ 
  courts, 
  onAddCourt, 
  onUpdateCourtStatus, 
  onDeleteCourt,
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

  return (
    <div id="court-manager-view" className="space-y-6">
      
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
                  <option value="Areia">🌴 Areia Praia</option>
                  <option value="Coberta">🏠 Coberta</option>
                  <option value="Saibro">🥎 Saibro</option>
                  <option value="Poliesportiva">👟 Poliesportiva</option>
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
  );
}
