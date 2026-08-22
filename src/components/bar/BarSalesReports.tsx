import React, { useState } from 'react';
import { BarSale, BarProduct, StockMovement } from '../../types';
import { formatCurrency, getBrasiliaTodayDate } from '../../utils';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  Search, 
  Calendar, 
  X, 
  Printer, 
  RotateCcw, 
  AlertCircle,
  BarChart3,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react';

interface BarSalesReportsProps {
  sales: BarSale[];
  products: BarProduct[];
  onCancelSale: (saleId: string) => void;
}

export default function BarSalesReports({ sales, products, onCancelSale }: BarSalesReportsProps) {
  const [periodFilter, setPeriodFilter] = useState<'Hoje' | 'Todos'>('Hoje');
  const [paymentFilter, setPaymentFilter] = useState<string>('Todos');
  const [originFilter, setOriginFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Sale for Detailed Modal
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<BarSale | null>(null);

  const todayStr = getBrasiliaTodayDate();

  // Filter Sales
  const filteredSales = sales.filter(s => {
    let matchesPeriod = true;
    if (periodFilter === 'Hoje') {
      matchesPeriod = s.date === todayStr;
    }

    let matchesPayment = true;
    if (paymentFilter !== 'Todos') {
      matchesPayment = s.paymentMethod === paymentFilter;
    }

    let matchesOrigin = true;
    if (originFilter !== 'Todos') {
      const saleOrigem = s.origemVenda || (s.comandaId ? 'comanda' : 'balcão');
      matchesOrigin = saleOrigem === originFilter;
    }

    let matchesSearch = true;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      matchesSearch = s.code.toLowerCase().includes(term) ||
                      (s.customerName || '').toLowerCase().includes(term) ||
                      (s.location || '').toLowerCase().includes(term);
    }

    return matchesPeriod && matchesPayment && matchesOrigin && matchesSearch;
  });

  // Calculate Metrics on Active Sales (non-cancelled)
  const activeSales = filteredSales.filter(s => s.status !== 'Cancelada');

  const totalRevenue = activeSales.reduce((acc, s) => acc + s.finalAmount, 0);
  const totalOrders = activeSales.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate Cost and Profit
  let totalCost = 0;
  activeSales.forEach(s => {
    s.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const costUnit = prod ? prod.costPrice : 0;
      totalCost += costUnit * item.quantity;
    });
  });
  const grossProfit = totalRevenue - totalCost;

  const handleCancelSaleClick = (sale: BarSale) => {
    if (sale.status === 'Cancelada') return;
    if (confirm(`Tem certeza que deseja cancelar a venda #${sale.code}? O estoque dos produtos será restaurado.`)) {
      onCancelSale(sale.id);
      setSelectedSaleDetails(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faturamento do Bar</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{totalOrders} vendas realizadas</p>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lucro Bruto</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(grossProfit)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Custo de produtos: {formatCurrency(totalCost)}</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Pedidos</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrders}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Comandas encerradas</p>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Médio</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{formatCurrency(averageTicket)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Média por pedido</p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPeriodFilter('Hoje')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                periodFilter === 'Hoje'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Vendas de Hoje
            </button>
            <button
              onClick={() => setPeriodFilter('Todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                periodFilter === 'Todos'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Histórico Completo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Código ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>

            {/* Origin Filter */}
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="Todos">Todas as Origens</option>
              <option value="comanda">Comanda</option>
              <option value="balcão">Balcão (Rápida)</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="Todos">Todas as Formas</option>
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Crédito</option>
              <option value="Cartão de Débito">Débito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Fiado / Comanda">Fiado / Comanda</option>
            </select>
          </div>
        </div>

        {/* Sales History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Cliente / Local</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Valor Final</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.map((sale) => {
                  const isComanda = sale.origemVenda === 'comanda' || !!sale.comandaId;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        #{sale.code}
                      </td>

                      <td className="py-3.5 px-4">
                        {isComanda ? (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                            <Receipt className="h-3 w-3" />
                            Comanda
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            <Zap className="h-3 w-3" />
                            Balcão
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {sale.createdAt}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{sale.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{sale.location}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-amber-600 text-sm">
                        {formatCurrency(sale.finalAmount)}
                      </td>

                      <td className="py-3.5 px-4">
                        {sale.status === 'Cancelada' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]">
                            <XCircle className="h-3 w-3" />
                            Cancelada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            Concluída
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedSaleDetails(sale)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Detalhes
                          </button>

                          {sale.status !== 'Cancelada' && (
                            <button
                              onClick={() => handleCancelSaleClick(sale)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Cancelar Venda"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Nenhuma venda encontrada para esse período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSaleDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Venda #{selectedSaleDetails.code}
                  </h3>
                  {selectedSaleDetails.origemVenda === 'comanda' || !!selectedSaleDetails.comandaId ? (
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[10px]">
                      <Receipt className="h-2.5 w-2.5" />
                      Comanda
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                      <Zap className="h-2.5 w-2.5" />
                      Balcão
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{selectedSaleDetails.createdAt}</p>
              </div>
              <button 
                onClick={() => setSelectedSaleDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Origem da Venda:</span>
                <span className="font-bold text-slate-800">
                  {selectedSaleDetails.origemVenda === 'comanda' || !!selectedSaleDetails.comandaId ? 'Comanda de Consumo' : 'Venda Direta / Balcão'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-800">{selectedSaleDetails.customerName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Mesa / Local:</span>
                <span className="font-bold text-slate-800">{selectedSaleDetails.location}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Pagamento:</span>
                <span className="font-bold text-slate-800">{selectedSaleDetails.paymentMethod}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="font-bold text-slate-700">Itens do Pedido:</p>
                {selectedSaleDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              {selectedSaleDetails.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold pt-2 border-t border-slate-200">
                  <span>Desconto Concedido:</span>
                  <span>- {formatCurrency(selectedSaleDetails.discount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                <span>Valor Final:</span>
                <span className="text-amber-600">{formatCurrency(selectedSaleDetails.finalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedSaleDetails.status !== 'Cancelada' && (
                <button
                  onClick={() => handleCancelSaleClick(selectedSaleDetails)}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar Venda
                </button>
              )}

              <button
                onClick={() => setSelectedSaleDetails(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
