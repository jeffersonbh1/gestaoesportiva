import React, { useState } from 'react';
import { BarComanda, BarComandaItem, BarProduct, BarSale, PaymentMethod } from '../../types';
import { formatCurrency, getBrasiliaTodayDate } from '../../utils';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  Receipt, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Check, 
  X, 
  Trash2, 
  Printer, 
  Share2, 
  Minus, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign,
  Terminal,
  XCircle,
  Database,
  Copy,
  Zap
} from 'lucide-react';

interface BarComandasManagerProps {
  comandas: BarComanda[];
  products: BarProduct[];
  onOpenComanda: (newComanda: BarComanda) => void;
  onAddItemToComanda: (comandaId: string, itemsToAdd: BarComandaItem[]) => void;
  onRemoveItemFromComanda: (comandaId: string, itemId: string) => void;
  onCloseComanda: (comandaId: string, paymentMethod: PaymentMethod | string, discount: number, finalAmount: number, notes?: string) => void;
  onCancelComanda: (comandaId: string) => void;
  onSwitchToDirectSale?: () => void;
}

export default function BarComandasManager({
  comandas,
  products,
  onOpenComanda,
  onAddItemToComanda,
  onRemoveItemFromComanda,
  onCloseComanda,
  onCancelComanda,
  onSwitchToDirectSale
}: BarComandasManagerProps) {
  // Filters and Tab view
  const [statusFilter, setStatusFilter] = useState<'Aberta' | 'Fechada' | 'Todas'>('Aberta');
  const [searchTerm, setSearchTerm] = useState('');

  // Active Modals State
  const [isNewComandaModalOpen, setIsNewComandaModalOpen] = useState(false);
  const [selectedComandaToAddItems, setSelectedComandaToAddItems] = useState<BarComanda | null>(null);
  const [selectedComandaForReceipt, setSelectedComandaForReceipt] = useState<BarComanda | null>(null);
  const [selectedComandaToClose, setSelectedComandaToClose] = useState<BarComanda | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // New Comanda Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newLocation, setNewLocation] = useState('Balcão');
  const [newNotes, setNewNotes] = useState('');

  // Add Items Modal State
  const [addCategory, setAddCategory] = useState('Todas');
  const [addSearch, setAddSearch] = useState('');
  const [selectedAddCart, setSelectedAddCart] = useState<{ product: BarProduct; quantity: number }[]>([]);

  // Close Comanda Checkout State
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod | string>('Pix');
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  const categories = ['Todas', 'Bebidas', 'Petiscos', 'Espetinhos', 'Sanduíches', 'Outros'];

  // Filter Comandas
  const filteredComandas = comandas.filter(c => {
    const matchesStatus = statusFilter === 'Todas' || c.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      c.code.toLowerCase().includes(term) ||
      c.customerName.toLowerCase().includes(term) ||
      c.customerPhone.toLowerCase().includes(term) ||
      (c.location || '').toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const openComandas = comandas.filter(c => c.status === 'Aberta');
  const totalOpenAmount = openComandas.reduce((acc, c) => acc + c.finalAmount, 0);

  // Handle Open New Comanda Form Submit
  const handleCreateComandaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      alert('Por favor, informe o Nome do cliente.');
      return;
    }

    const todayStr = getBrasiliaTodayDate();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const openedAtStr = `${todayStr} ${hours}:${minutes}`;

    // Generate code
    const nextCodeNumber = comandas.length + 1;
    const codeStr = `#${String(nextCodeNumber).padStart(3, '0')}`;

    const newComanda: BarComanda = {
      id: `cmd-${Date.now()}`,
      code: codeStr,
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim(),
      location: newLocation.trim() || 'Balcão',
      items: [],
      status: 'Aberta',
      openedAt: openedAtStr,
      date: todayStr,
      discount: 0,
      totalAmount: 0,
      finalAmount: 0,
      notes: newNotes.trim() || undefined,
      origemVenda: 'comanda'
    };

    onOpenComanda(newComanda);

    // Reset Form and close creation modal
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewLocation('Balcão');
    setNewNotes('');
    setIsNewComandaModalOpen(false);

    // Direcionar imediatamente para a tela de cadastrar / lançar itens na comanda
    setSelectedComandaToAddItems(newComanda);
    setSelectedAddCart([]);
    setAddCategory('Todas');
    setAddSearch('');
  };

  // Handle Add Items Cart Helpers
  const updateAddCartQty = (product: BarProduct, delta: number) => {
    setSelectedAddCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(item => item.product.id !== product.id);
        }
        if (newQty > product.stock) {
          alert(`Estoque máximo disponível: ${product.stock} unidades.`);
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
      } else {
        if (delta <= 0) return prev;
        if (product.stock <= 0) {
          alert('Produto esgotado no estoque.');
          return prev;
        }
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  // Submit Items to Comanda
  const handleConfirmAddItems = () => {
    if (!selectedComandaToAddItems || selectedAddCart.length === 0) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const itemsToAdd: BarComandaItem[] = selectedAddCart.map(cartItem => ({
      id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: cartItem.product.id,
      productName: cartItem.product.name,
      quantity: cartItem.quantity,
      unitPrice: cartItem.product.price,
      totalPrice: cartItem.product.price * cartItem.quantity,
      addedAt: timeStr
    }));

    onAddItemToComanda(selectedComandaToAddItems.id, itemsToAdd);

    // Reset and close
    setSelectedAddCart([]);
    setSelectedComandaToAddItems(null);
  };

  // Copy WhatsApp Receipt text
  const handleShareWhatsAppReceipt = (comanda: BarComanda) => {
    let text = `*ARENA FAHEL BEACH - COMANDA ${comanda.code}*\n`;
    text += `👤 *Cliente:* ${comanda.customerName}\n`;
    text += `📱 *Telefone:* ${comanda.customerPhone}\n`;
    text += `📍 *Local:* ${comanda.location || 'Balcão'}\n`;
    text += `🕒 *Abertura:* ${comanda.openedAt}\n\n`;
    text += `*ITENS CONSUMIDOS:*\n`;

    comanda.items.forEach(item => {
      text += `• ${item.quantity}x ${item.productName} (${formatCurrency(item.unitPrice)}) = ${formatCurrency(item.totalPrice)}\n`;
    });

    if (comanda.discount > 0) {
      text += `\n*Desconto:* -${formatCurrency(comanda.discount)}\n`;
    }

    text += `\n💰 *TOTAL A PAGAR: ${formatCurrency(comanda.finalAmount)}*\n`;
    text += `\nObrigado pela preferência! 🏖️🎾`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = comanda.customerPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  // Complete Close Comanda
  const handleFinishCloseComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComandaToClose) return;

    const subtotal = selectedComandaToClose.totalAmount;
    const finalVal = Math.max(0, subtotal - checkoutDiscount);

    onCloseComanda(
      selectedComandaToClose.id,
      checkoutPaymentMethod,
      checkoutDiscount,
      finalVal,
      checkoutNotes
    );

    setSelectedComandaToClose(null);
    setCheckoutDiscount(0);
    setCashGiven('');
    setCheckoutNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Comandas do Bar & Arena
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Controle do consumo dos clientes na arena com fechamento de conta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onSwitchToDirectSale && (
              <button
                type="button"
                onClick={onSwitchToDirectSale}
                className="flex-1 sm:flex-none px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                title="Ir para tela de Venda Rápida Direta no Balcão"
              >
                <Zap className="h-4 w-4 fill-current" />
                Venda Sem Comanda
              </button>
            )}

            <button
              onClick={() => setIsNewComandaModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Abrir Nova Comanda
            </button>
          </div>
        </div>

        {/* Stats summary banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Comandas Abertas</p>
              <p className="text-xl font-black text-amber-900 mt-0.5">{openComandas.length} comandas</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total em Aberto</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(totalOpenAmount)}</p>
            </div>
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Registradas</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{comandas.length} comandas</p>
            </div>
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(['Aberta', 'Fechada', 'Todas'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'Aberta' ? `Abertas (${openComandas.length})` : st === 'Fechada' ? 'Fechadas' : 'Todas'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, telefone, mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Comandas Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredComandas.map((comanda) => {
          const isOpen = comanda.status === 'Aberta';
          const totalItemsCount = comanda.items.reduce((acc, i) => acc + i.quantity, 0);

          return (
            <div
              key={comanda.id}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isOpen 
                  ? 'border-amber-300 shadow-md hover:border-amber-500' 
                  : 'border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                {/* Comanda Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  isOpen ? 'bg-amber-50/70 border-amber-200/60' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                      {comanda.code}
                    </span>
                    <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-600" />
                      {comanda.location || 'Balcão'}
                    </span>
                  </div>

                  {isOpen ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Em Aberto
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Fechada ({comanda.paymentMethod})
                    </span>
                  )}
                </div>

                {/* Customer Details */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                      <User className="h-4 w-4 text-amber-500" />
                      {comanda.customerName}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {comanda.customerPhone}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {comanda.openedAt}
                      </span>
                    </div>
                  </div>

                  {/* Consumed Items Preview */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Consumo ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})</span>
                      <span className="text-amber-600 font-black">{formatCurrency(comanda.finalAmount)}</span>
                    </div>

                    {comanda.items.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-1">
                        Nenhum item lançado até o momento.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin pr-1 text-xs">
                        {comanda.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                            <span className="truncate pr-2">• {item.quantity}x {item.productName}</span>
                            <span className="font-semibold text-slate-800">{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                        {comanda.items.length > 3 && (
                          <p className="text-[10px] text-amber-600 font-bold text-right pt-0.5">
                            + {comanda.items.length - 3} outros itens...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Action Buttons */}
              <div className="p-4 pt-0 space-y-2 border-t border-slate-100/60 mt-2">
                {isOpen ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setSelectedComandaToAddItems(comanda);
                        setSelectedAddCart([]);
                      }}
                      className="col-span-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                      title="Adicionar Bebidas / Alimentos"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      Adicionar
                    </button>

                    <button
                      onClick={() => setSelectedComandaForReceipt(comanda)}
                      className="col-span-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Ver Extrato de Itens"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Extrato
                    </button>

                    <button
                      onClick={() => {
                        setSelectedComandaToClose(comanda);
                        setCheckoutDiscount(comanda.discount || 0);
                      }}
                      className="col-span-1 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                      title="Fechar Conta e Cobrar"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      Fechar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedComandaForReceipt(comanda)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Ver Extrato Fechado
                    </button>

                    <button
                      onClick={() => handleShareWhatsAppReceipt(comanda)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition cursor-pointer"
                      title="Enviar via WhatsApp"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredComandas.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-4">
            <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <Receipt className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Nenhuma comanda encontrada</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Não encontramos nenhuma comanda com o termo pesquisado.' 
                  : 'Nenhuma comanda aberta ou registrada no momento.'}
              </p>
            </div>
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setIsNewComandaModalOpen(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-2xl transition shadow-xs cursor-pointer"
              >
                + Abrir Primeira Comanda
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CRIAR NOVA COMANDA */}
      {isNewComandaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Abrir Nova Comanda
                  </h3>
                  <p className="text-xs text-slate-400">Cadastre os dados do cliente para iniciar a estadia</p>
                </div>
              </div>

              <button
                onClick={() => setIsNewComandaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComandaSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-amber-500" />
                  Nome Completo do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: João Silva"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-amber-500" />
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  placeholder="ex: (71) 99888-7777"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  Mesa ou Quadra na Arena
                </label>
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Balcão">Balcão</option>
                  <option value="Mesa 01">Mesa 01</option>
                  <option value="Mesa 02">Mesa 02</option>
                  <option value="Mesa 03">Mesa 03</option>
                  <option value="Mesa 04 (Lounge)">Mesa 04 (Lounge)</option>
                  <option value="Mesa 05">Mesa 05</option>
                  <option value="Quadra 1 (Beach Tennis)">Quadra 1 (Beach Tennis)</option>
                  <option value="Quadra 2 (Futevôlei)">Quadra 2 (Futevôlei)</option>
                  <option value="Quadra 3 (Vôlei de Praia)">Quadra 3 (Vôlei de Praia)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1 block">
                  Observações Iniciais (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: Cliente no torneio das 14h..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewComandaModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer"
                >
                  Abrir Comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LANÇAR CONSUMO / ITENS NA COMANDA */}
      {selectedComandaToAddItems && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Comanda {selectedComandaToAddItems.code}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Lançar Consumo para {selectedComandaToAddItems.customerName}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedComandaToAddItems.location} • Telefone: {selectedComandaToAddItems.customerPhone}
                </p>
              </div>

              <button
                onClick={() => setSelectedComandaToAddItems(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Catalog & Search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto pr-1">
              {/* Product Catalog Grid (8 cols) */}
              <div className="md:col-span-7 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Pesquisar bebida ou comida..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Categories filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAddCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                        addCategory === cat
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {products
                    .filter(p => p.active)
                    .filter(p => addCategory === 'Todas' || p.category === addCategory)
                    .filter(p => p.name.toLowerCase().includes(addSearch.toLowerCase()))
                    .map((product) => {
                      const selectedInCart = selectedAddCart.find(i => i.product.id === product.id);
                      const cartQty = selectedInCart ? selectedInCart.quantity : 0;
                      const isOutOfStock = product.stock <= 0;

                      return (
                        <div
                          key={product.id}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                            cartQty > 0
                              ? 'bg-amber-50/80 border-amber-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-slate-900">{formatCurrency(product.price)}</span>
                              <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                                Est: {product.stock}
                              </span>
                            </div>
                          </div>

                          {isOutOfStock ? (
                            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">
                              Esgotado
                            </span>
                          ) : cartQty > 0 ? (
                            <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-xl p-0.5">
                              <button
                                onClick={() => updateAddCartQty(product, -1)}
                                className="h-6 w-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="px-1 text-xs font-extrabold text-amber-900">{cartQty}</span>
                              <button
                                onClick={() => updateAddCartQty(product, 1)}
                                className="h-6 w-6 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => updateAddCartQty(product, 1)}
                              className="p-1.5 bg-slate-900 hover:bg-amber-500 text-white rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Cart Tray Items Selected (4 cols) */}
              <div className="md:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>Itens a Lançar</span>
                    <span className="text-amber-600">({selectedAddCart.length})</span>
                  </h4>

                  <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                    {selectedAddCart.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-10">
                        Selecione os produtos ao lado para incluir na comanda.
                      </p>
                    ) : (
                      selectedAddCart.map((item) => (
                        <div
                          key={item.product.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-slate-800 line-clamp-1">{item.product.name}</p>
                            <p className="text-[11px] text-slate-500">{item.quantity}x {formatCurrency(item.product.price)}</p>
                          </div>
                          <span className="font-extrabold text-slate-900">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                    <span>Subtotal Adicional:</span>
                    <span className="text-amber-600">
                      {formatCurrency(selectedAddCart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0))}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmAddItems}
                    disabled={selectedAddCart.length === 0}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition shadow-md ${
                      selectedAddCart.length > 0
                        ? 'bg-amber-500 hover:bg-amber-600 cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    Lançar na Comanda
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EXTRATO COMPLETO / CONFERÊNCIA DE ITENS */}
      {selectedComandaForReceipt && (() => {
        const activeComanda = comandas.find(c => c.id === selectedComandaForReceipt.id) || selectedComandaForReceipt;
        const isComandaOpen = activeComanda.status === 'Aberta';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      Extrato Comanda {activeComanda.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isComandaOpen 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {activeComanda.status}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    Conferência de Consumo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComandaForReceipt(null);
                    setItemToDeleteId(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer metadata box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Cliente:</span>
                  <span className="font-bold text-slate-900">{activeComanda.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Telefone:</span>
                  <span className="font-bold text-slate-900">{activeComanda.customerPhone || 'Não informado'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Local:</span>
                  <span className="font-bold text-slate-900">{activeComanda.location || 'Balcão'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Abertura:</span>
                  <span className="font-bold text-slate-900">{activeComanda.openedAt}</span>
                </div>
              </div>

              {/* Itemized consumption list */}
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">
                    Itens Consumidos ({activeComanda.items.length}):
                  </p>
                  {isComandaOpen && activeComanda.items.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      Clique na lixeira para excluir
                    </span>
                  )}
                </div>

                {activeComanda.items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Nenhum item lançado ainda.
                  </p>
                ) : (
                  activeComanda.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between text-xs ${
                        itemToDeleteId === item.id 
                          ? 'bg-rose-50 border-rose-300' 
                          : 'bg-slate-50/80 border-slate-200/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.quantity}x {formatCurrency(item.unitPrice)} • Lançado às {item.addedAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(item.totalPrice)}
                        </span>

                        {isComandaOpen && (
                          <>
                            {itemToDeleteId === item.id ? (
                              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-rose-200 shadow-xs">
                                <span className="text-[10px] font-bold text-rose-700 px-1">Excluir?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRemoveItemFromComanda(activeComanda.id, item.id);
                                    setSelectedComandaForReceipt(prev => prev ? {
                                      ...prev,
                                      items: prev.items.filter(i => i.id !== item.id),
                                      totalAmount: prev.totalAmount - item.totalPrice,
                                      finalAmount: Math.max(0, prev.totalAmount - item.totalPrice - (prev.discount || 0))
                                    } : null);
                                    setItemToDeleteId(null);
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black cursor-pointer transition shadow-xs"
                                  title="Confirmar exclusão do item"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setItemToDeleteId(null)}
                                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold cursor-pointer transition"
                                  title="Cancelar"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setItemToDeleteId(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Excluir item da comanda"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Box */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total da Conta:</span>
                <span className="text-amber-600 text-base">{formatCurrency(activeComanda.finalAmount)}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleShareWhatsAppReceipt(activeComanda)}
                  className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Enviar WhatsApp
                </button>

                {isComandaOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeComanda;
                      setSelectedComandaForReceipt(null);
                      setItemToDeleteId(null);
                      setSelectedComandaToClose(target);
                    }}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-amber-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    Fechar Conta
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 4: FECHAMENTO DE CONTA E PAGAMENTO */}
      {selectedComandaToClose && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Fechamento de Conta
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Comanda {selectedComandaToClose.code} - {selectedComandaToClose.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComandaToClose(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFinishCloseComanda} className="space-y-4">
              {/* Items summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200/60 pb-1.5">
                  <span>Subtotal Consumido:</span>
                  <span>{formatCurrency(selectedComandaToClose.totalAmount)}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-600 font-semibold">Desconto (R$):</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={checkoutDiscount || ''}
                    onChange={(e) => setCheckoutDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0,00"
                    className="w-24 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs"
                  />
                </div>

                {/* Total Final */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-black text-slate-900 text-sm">
                  <span>Total Final a Cobrar:</span>
                  <span className="text-amber-600 text-base">
                    {formatCurrency(Math.max(0, selectedComandaToClose.totalAmount - checkoutDiscount))}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Forma de Pagamento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Pix', label: 'Pix', icon: QrCode, color: 'text-emerald-600' },
                    { id: 'Cartão de Crédito', label: 'Crédito', icon: CreditCard, color: 'text-blue-600' },
                    { id: 'Cartão de Débito', label: 'Débito', icon: CreditCard, color: 'text-indigo-600' },
                    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-amber-600' },
                  ].map((pm) => {
                    const IconComp = pm.icon;
                    const isSelected = checkoutPaymentMethod === pm.id;

                    return (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setCheckoutPaymentMethod(pm.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className={`h-4 w-4 ${pm.color}`} />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash given calculator */}
              {checkoutPaymentMethod === 'Dinheiro' && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900">Valor Entregue pelo Cliente:</span>
                    <input
                      type="number"
                      step="5"
                      placeholder="0,00"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-amber-300 rounded-lg text-right font-black"
                    />
                  </div>
                  {Number(cashGiven) > 0 && (
                    <div className="flex justify-between items-center font-black text-amber-900 pt-1 border-t border-amber-200">
                      <span>Troco a Devolver:</span>
                      <span className="text-emerald-600 text-sm">
                        {formatCurrency(Math.max(0, Number(cashGiven) - (selectedComandaToClose.totalAmount - checkoutDiscount)))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Pagamento e Encerrar Comanda
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
