import React, { useState, useMemo } from 'react';
import { BarComanda, BarComandaItem, BarProduct, BarSale, PaymentMethod, BarCategoryItem } from '../../types';
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

export interface GroupedBarItem {
  id: string;
  itemIds: string[];
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: string;
  times: string[];
}

export function groupComandaItems(items: BarComandaItem[]): GroupedBarItem[] {
  const map = new Map<string, GroupedBarItem>();

  for (const item of (items || [])) {
    const key = item.productId
      ? `${item.productId}_${item.unitPrice}`
      : `${item.productName.trim().toLowerCase()}_${item.unitPrice}`;

    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      existing.totalPrice += item.totalPrice;
      if (!existing.itemIds.includes(item.id)) existing.itemIds.push(item.id);
      if (item.addedAt && !existing.times.includes(item.addedAt)) {
        existing.times.push(item.addedAt);
      }
    } else {
      map.set(key, {
        id: item.id,
        itemIds: [item.id],
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        addedAt: item.addedAt || '',
        times: item.addedAt ? [item.addedAt] : []
      });
    }
  }

  return Array.from(map.values());
}

interface BarComandasManagerProps {
  comandas: BarComanda[];
  products: BarProduct[];
  categories?: BarCategoryItem[];
  onOpenComanda: (newComanda: BarComanda) => void;
  onAddItemToComanda: (comandaId: string, itemsToAdd: BarComandaItem[], fallbackComanda?: BarComanda) => void;
  onRemoveItemFromComanda: (comandaId: string, itemId: string, quantityToRemove?: number) => void;
  onCloseComanda: (comandaId: string, paymentMethod: PaymentMethod | string, discount: number, finalAmount: number, notes?: string) => void;
  onCancelComanda: (comandaId: string) => void;
  onSwitchToDirectSale?: () => void;
}

export default function BarComandasManager({
  comandas,
  products,
  categories = [],
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

  // Success Feedback Toast
  const [successToast, setSuccessToast] = useState<{
    comandaCode: string;
    customerName: string;
    totalUnits: number;
    totalAmount: number;
    targetComandaId: string;
  } | null>(null);

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

  const computedCategories = useMemo(() => {
    const activeFromCategories = (categories || [])
      .filter(c => {
        if (c.ind_cadastro_ativo !== undefined && c.ind_cadastro_ativo !== null) {
          if (typeof c.ind_cadastro_ativo === 'boolean') return c.ind_cadastro_ativo === true;
          const v = String(c.ind_cadastro_ativo).trim().toLowerCase();
          return v === 'true' || v === '1' || v === 't';
        }
        if (c.status_ativo !== undefined && c.status_ativo !== null) {
          if (typeof c.status_ativo === 'boolean') return c.status_ativo === true;
          const v = String(c.status_ativo).trim().toLowerCase();
          return v === 'true' || v === '1' || v === 't';
        }
        return true;
      })
      .map(c => c.name.trim())
      .filter(Boolean);

    if (activeFromCategories.length > 0) {
      return ['Todas', ...Array.from(new Set(activeFromCategories))];
    }

    const fromProducts = products.map(p => (p.category || '').trim()).filter(Boolean);
    const unique = Array.from(new Set(fromProducts));
    return ['Todas', ...(unique.length > 0 ? unique : ['Bebidas', 'Salgados', 'Petiscos', 'Outros'])];
  }, [categories, products]);

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

    const targetComanda = selectedComandaToAddItems;
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

    // Registra e consolida no extrato da comanda
    onAddItemToComanda(targetComanda.id, itemsToAdd, targetComanda);

    const totalAdded = itemsToAdd.reduce((acc, i) => acc + i.totalPrice, 0);
    const totalUnits = itemsToAdd.reduce((acc, i) => acc + i.quantity, 0);

    // Dispara banner de sucesso e feedback imediato
    setSuccessToast({
      comandaCode: targetComanda.code,
      customerName: targetComanda.customerName,
      totalUnits,
      totalAmount: totalAdded,
      targetComandaId: targetComanda.id
    });

    // Auto-hide após 5 segundos
    setTimeout(() => {
      setSuccessToast(null);
    }, 5000);

    // Reset and close
    setSelectedAddCart([]);
    setSelectedComandaToAddItems(null);
  };

  // Copy WhatsApp Receipt text (agrupado por produto)
  const handleShareWhatsAppReceipt = (comanda: BarComanda) => {
    let text = `🏖️ *ARENA FAHEL BEACH - EXTRATO DE CONSUMO*\n`;
    text += `*Comanda:* ${comanda.code} | *Local:* ${comanda.location || 'Balcão'}\n`;
    text += `*Cliente:* ${comanda.customerName}\n`;
    if (comanda.customerPhone) {
      text += `*Telefone:* ${comanda.customerPhone}\n`;
    }
    text += `*Abertura:* ${comanda.openedAt}\n`;
    text += `*Status:* ${comanda.status}\n\n`;
    text += `📋 *EXTRATO AGRUPADO POR PRODUTO:*\n`;

    const grouped = groupComandaItems(comanda.items);
    if (grouped.length === 0) {
      text += `_Nenhum item consumido._\n`;
    } else {
      grouped.forEach(item => {
        text += `• ${item.quantity}x ${item.productName} (${formatCurrency(item.unitPrice)}) = ${formatCurrency(item.totalPrice)}\n`;
      });
      const totalUnits = grouped.reduce((acc, i) => acc + i.quantity, 0);
      text += `\n*Total de Itens:* ${totalUnits} unidades (${grouped.length} produtos distintos)\n`;
    }

    if (comanda.discount > 0) {
      text += `*Desconto:* -${formatCurrency(comanda.discount)}\n`;
    }

    text += `\n💰 *TOTAL A PAGAR: ${formatCurrency(comanda.finalAmount)}*\n`;
    text += `\nObrigado pela preferência! 🏖️🎾`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = (comanda.customerPhone || '').replace(/\D/g, '');
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

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
      {/* Toast Notification Banner para Lançamento e Consolidação no Extrato */}
      {successToast && (
        <div className="bg-emerald-600 text-white p-4 sm:p-5 rounded-3xl shadow-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-white stroke-[3]" />
            </div>
            <div>
              <p className="font-black text-sm">
                Consumo lançado e consolidado com sucesso na comanda {successToast.comandaCode}!
              </p>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Cliente: <strong>{successToast.customerName}</strong> • <strong>{successToast.totalUnits}</strong> {successToast.totalUnits === 1 ? 'item adicionado' : 'itens adicionados'} • Total lançado: <strong>{formatCurrency(successToast.totalAmount)}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                const target = comandas.find(c => c.id === successToast.targetComandaId);
                if (target) {
                  setSelectedComandaForReceipt(target);
                }
              }}
              className="px-4 py-2 bg-white text-emerald-950 rounded-xl text-xs font-black hover:bg-emerald-50 transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-700" />
              Ver Extrato Consolidado
            </button>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              title="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
          const groupedCardItems = groupComandaItems(comanda.items);
          const distinctProductsCount = groupedCardItems.length;
          const totalUnitsCount = groupedCardItems.reduce((acc, i) => acc + i.quantity, 0);

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

                  {/* Consumed Items Preview (Agrupado por Produto) */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Receipt className="h-3.5 w-3.5 text-amber-600" />
                        Consumo ({distinctProductsCount} {distinctProductsCount === 1 ? 'produto' : 'produtos'} • {totalUnitsCount} un)
                      </span>
                      <span className="text-amber-600 font-black">{formatCurrency(comanda.finalAmount)}</span>
                    </div>

                    {groupedCardItems.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-1">
                        Nenhum item lançado até o momento.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto scrollbar-thin pr-1 text-xs">
                        {groupedCardItems.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-700 text-[11px] bg-white px-2.5 py-1 rounded-xl border border-slate-100 shadow-2xs">
                            <span className="truncate pr-2 font-medium">
                              <strong className="text-amber-700 font-black mr-1">{item.quantity}x</strong> {item.productName}
                            </span>
                            <span className="font-black text-slate-900 shrink-0">{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                        {groupedCardItems.length > 3 && (
                          <p className="text-[10px] text-amber-600 font-bold text-right pt-0.5">
                            + {groupedCardItems.length - 3} outros produtos agrupados...
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
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
                type="button"
                onClick={() => setIsNewComandaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition"
                title="Fechar janela"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComandaSubmit} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 overscroll-contain">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90dvh] sm:max-h-[88vh] flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 pb-3">
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
                type="button"
                onClick={() => setSelectedComandaToAddItems(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition"
                title="Fechar janela"
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
                  {computedCategories.map((cat) => (
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
                    .filter(p => {
                      if (addCategory === 'Todas') return true;
                      const prodCat = (p.category || '').toLowerCase().trim();
                      const selCat = addCategory.toLowerCase().trim();
                      if (prodCat === selCat) return true;
                      if (selCat === 'salgados' && (prodCat === 'salgado' || prodCat === 'salgados')) return true;
                      if (selCat === 'picolés' && (prodCat === 'picolé' || prodCat === 'picole' || prodCat === 'picolés' || prodCat === 'picoles')) return true;
                      if (selCat === 'açaí' && (prodCat === 'açaí' || prodCat === 'acai' || prodCat === 'açaí' || prodCat === 'acaí')) return true;
                      if (selCat === 'doces' && (prodCat === 'doce' || prodCat === 'doces')) return true;
                      return false;
                    })
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

              {/* Cart Tray Items Selected (5 cols - Coluna de Lançamento) */}
              <div className="md:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-amber-600" />
                      Coluna de Produtos a Lançar
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-black text-[11px] px-2 py-0.5 rounded-full">
                      {selectedAddCart.length} {selectedAddCart.length === 1 ? 'item' : 'itens'}
                    </span>
                  </h4>

                  <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                    {selectedAddCart.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-10">
                        Selecione os produtos ao lado para incluir nesta coluna da comanda.
                      </p>
                    ) : (
                      selectedAddCart.map((item) => {
                        const existingInTab = selectedComandaToAddItems?.items.find(ci => 
                          (ci.productId && ci.productId === item.product.id) ||
                          (ci.productName.trim().toLowerCase() === item.product.name.trim().toLowerCase())
                        );
                        const alreadyInTabQty = existingInTab ? existingInTab.quantity : 0;

                        return (
                          <div
                            key={item.product.id}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-bold text-slate-800 line-clamp-1">{item.product.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {item.quantity}x {formatCurrency(item.product.price)}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="font-extrabold text-slate-900">
                                  {formatCurrency(item.product.price * item.quantity)}
                                </span>
                              </div>
                              {alreadyInTabQty > 0 && (
                                <p className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md inline-block mt-1 border border-amber-200/60">
                                  Já no extrato: {alreadyInTabQty} un • Novo total: {alreadyInTabQty + item.quantity} un
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateAddCartQty(item.product, -1)}
                                  className="w-5 h-5 rounded bg-white text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                                  title="Diminuir"
                                >
                                  -
                                </button>
                                <span className="px-1 text-xs font-black text-amber-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateAddCartQty(item.product, 1)}
                                  className="w-5 h-5 rounded bg-amber-500 text-white font-bold text-xs flex items-center justify-center hover:bg-amber-600 cursor-pointer"
                                  title="Aumentar"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateAddCartQty(item.product, -item.quantity)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Remover da coluna de lançamento"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                    <span>Subtotal a Adicionar:</span>
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
                    Lançar e Consolidar no Extrato
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              {/* Pinned Sticky Header */}
              <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
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
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition"
                  title="Fechar extrato"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 overscroll-contain pr-2 sm:pr-4">
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

                {/* Itemized consumption list agrupado por produto */}
                {(() => {
                  const groupedItems = groupComandaItems(activeComanda.items);
                  const totalUnits = groupedItems.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Receipt className="h-4 w-4 text-amber-600" />
                            Extrato Agrupado ({groupedItems.length} {groupedItems.length === 1 ? 'produto' : 'produtos'} • {totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'})
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Itens consolidados por produto com conferência de consumo.
                          </p>
                        </div>
                        {isComandaOpen && groupedItems.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            Ajuste as quantidades (+ / -)
                          </span>
                        )}
                      </div>

                      {groupedItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Nenhum item lançado ainda.
                        </p>
                      ) : (
                        groupedItems.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border transition flex items-center justify-between text-xs ${
                              itemToDeleteId === item.id 
                                ? 'bg-rose-50 border-rose-300' 
                                : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-100 text-amber-900 font-black text-[11px] px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                                  {item.quantity}x
                                </span>
                                <p className="font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-slate-600">{formatCurrency(item.unitPrice)} un</span>
                                {item.times && item.times.length > 0 && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-400">
                                      {item.times.length > 1 
                                        ? `Lançado às: ${item.times.join(', ')}` 
                                        : `Lançado às ${item.times[0]}`}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-black text-slate-900 text-xs sm:text-sm">
                                {formatCurrency(item.totalPrice)}
                              </span>

                              {isComandaOpen && (
                                <>
                                  {itemToDeleteId === item.id ? (
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-rose-200 shadow-xs">
                                      <span className="text-[10px] font-bold text-rose-700 px-1">Excluir tudo?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          item.itemIds.forEach(id => {
                                            onRemoveItemFromComanda(activeComanda.id, id);
                                          });
                                          setSelectedComandaForReceipt(prev => prev ? {
                                            ...prev,
                                            items: prev.items.filter(i => !item.itemIds.includes(i.id)),
                                            totalAmount: prev.totalAmount - item.totalPrice,
                                            finalAmount: Math.max(0, prev.totalAmount - item.totalPrice - (prev.discount || 0))
                                          } : null);
                                          setItemToDeleteId(null);
                                        }}
                                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black cursor-pointer transition shadow-xs"
                                        title="Confirmar exclusão de todas as unidades deste produto"
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
                                    <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                                      {/* Decrement 1 unit */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onRemoveItemFromComanda(activeComanda.id, item.id, 1);
                                        }}
                                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-extrabold text-xs flex items-center justify-center transition cursor-pointer"
                                        title="Diminuir 1 unidade (estorno de 1 unidade para o estoque)"
                                      >
                                        -
                                      </button>

                                      {/* Quick Increment 1 unit */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const now = new Date();
                                          const hours = String(now.getHours()).padStart(2, '0');
                                          const minutes = String(now.getMinutes()).padStart(2, '0');
                                          const timeStr = `${hours}:${minutes}`;

                                          const itemToAdd: BarComandaItem = {
                                            id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                            productId: item.productId,
                                            productName: item.productName,
                                            quantity: 1,
                                            unitPrice: item.unitPrice,
                                            totalPrice: item.unitPrice,
                                            addedAt: timeStr
                                          };
                                          onAddItemToComanda(activeComanda.id, [itemToAdd]);
                                        }}
                                        className="w-6 h-6 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center transition cursor-pointer"
                                        title="Adicionar mais 1 unidade deste produto"
                                      >
                                        +
                                      </button>

                                      {/* Full Trash delete */}
                                      <button
                                        type="button"
                                        onClick={() => setItemToDeleteId(item.id)}
                                        className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer ml-0.5"
                                        title="Excluir todas as unidades deste produto"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Pinned Sticky Footer */}
              <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/95 p-4 sm:p-5 space-y-3 z-10">
                {/* Total Box */}
                <div className="flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total da Conta:</span>
                  <span className="text-amber-600 text-base sm:text-lg">{formatCurrency(activeComanda.finalAmount)}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleShareWhatsAppReceipt(activeComanda)}
                    className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-300/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
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
                      className="flex-1 py-3 bg-slate-900 hover:bg-amber-500 active:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      Fechar Conta
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 4: FECHAMENTO DE CONTA E PAGAMENTO */}
      {selectedComandaToClose && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Fechamento de Conta
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Comanda {selectedComandaToClose.code} - {selectedComandaToClose.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComandaToClose(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition"
                title="Fechar janela"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFinishCloseComanda} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 overscroll-contain">
              {/* Items summary (agrupado por produto) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin pb-2 border-b border-slate-200/60">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Itens Consumidos (Agrupados):</p>
                  {groupComandaItems(selectedComandaToClose.items).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700 text-xs">
                      <span className="truncate pr-2 font-medium">
                        <strong className="text-amber-700 font-black mr-1">{item.quantity}x</strong> {item.productName}
                      </span>
                      <span className="font-extrabold text-slate-900 shrink-0">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-slate-700 pt-1">
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
