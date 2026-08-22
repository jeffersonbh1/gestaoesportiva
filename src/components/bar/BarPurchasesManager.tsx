import React, { useState, useMemo } from 'react';
import { BarProduct, BarPurchase, BarPurchaseItem } from '../../types';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Package, 
  FileText, 
  Trash2, 
  Eye, 
  Truck, 
  Info, 
  X,
  ArrowRight,
  Sparkles,
  Receipt,
  CheckCircle
} from 'lucide-react';

interface BarPurchasesManagerProps {
  products: BarProduct[];
  purchases: BarPurchase[];
  onSavePurchase: (purchase: BarPurchase) => void;
  onDeletePurchase?: (purchaseId: string) => void;
}

export default function BarPurchasesManager({
  products,
  purchases,
  onSavePurchase,
  onDeletePurchase
}: BarPurchasesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterDateMonth, setFilterDateMonth] = useState('all');
  
  // Modals
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<BarPurchase | null>(null);

  // Form State
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [notes, setNotes] = useState('');

  // Items to buy in the form
  const [cartItems, setCartItems] = useState<Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    costPrice: number;
    currentStock: number;
    currentCostPrice: number;
  }>>([]);

  // Active product being added
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemCostPrice, setItemCostPrice] = useState<number>(0);

  // Auto-generate code
  const nextPurchaseCode = useMemo(() => {
    const count = purchases.length + 1;
    return `COMP-${String(count).padStart(3, '0')}`;
  }, [purchases]);

  // When selected product changes in the form, pre-populate cost and unit
  const handleProductSelectChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setItemCostPrice(prod.lastPurchasePrice || prod.costPrice || 0);
      setItemQuantity(10);
    }
  };

  // Add Item to Purchase Cart
  const handleAddItemToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Selecione um produto.');
      return;
    }
    if (itemQuantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }
    if (itemCostPrice < 0) {
      alert('O preço de custo não pode ser negativo.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in cart
    const existingIndex = cartItems.findIndex(i => i.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].costPrice = itemCostPrice;
      setCartItems(updated);
    } else {
      setCartItems(prev => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: itemQuantity,
          unit: prod.unit || 'un',
          costPrice: itemCostPrice,
          currentStock: prod.stock,
          currentCostPrice: prod.costPrice
        }
      ]);
    }

    // Reset selector
    setSelectedProductId('');
    setItemQuantity(1);
    setItemCostPrice(0);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
  }, [cartItems]);

  // Open New Purchase Modal
  const openNewPurchaseModal = () => {
    setSupplier('');
    setInvoiceNumber('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Pix');
    setNotes('');
    setCartItems([]);
    setSelectedProductId(products.length > 0 ? products[0].id : '');
    if (products.length > 0) {
      setItemCostPrice(products[0].lastPurchasePrice || products[0].costPrice || 0);
      setItemQuantity(10);
    }
    setIsNewPurchaseModalOpen(true);
  };

  // Submit Purchase
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Adicione pelo menos um item à compra.');
      return;
    }

    const newPurchase: BarPurchase = {
      id: `comp-${Date.now()}`,
      code: nextPurchaseCode,
      supplier: supplier.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      purchaseDate: purchaseDate,
      totalAmount: totalCartAmount,
      paymentMethod: paymentMethod,
      status: 'Concluída',
      notes: notes.trim() || undefined,
      user: 'Administrador',
      createdAt: new Date().toISOString(),
      items: cartItems.map(item => {
        const currentStock = Math.max(0, item.currentStock);
        const currentCost = Math.max(0, item.currentCostPrice);
        const purchaseQty = item.quantity;
        const unitCostPaid = item.costPrice;

        let newAvg = unitCostPaid;
        if (currentStock > 0 && currentCost > 0) {
          newAvg = ((currentStock * currentCost) + (purchaseQty * unitCostPaid)) / (currentStock + purchaseQty);
        }
        newAvg = Math.round(newAvg * 100) / 100;

        return {
          productId: item.productId,
          productName: item.productName,
          quantity: purchaseQty,
          unit: item.unit,
          costPrice: unitCostPaid,
          totalCost: purchaseQty * unitCostPaid,
          previousCost: currentCost,
          newAverageCost: newAvg
        };
      })
    };

    onSavePurchase(newPurchase);
    setIsNewPurchaseModalOpen(false);
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchSearch = 
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSupplier = filterSupplier === 'all' || p.supplier === filterSupplier;

      const matchDate = filterDateMonth === 'all' || (p.purchaseDate && p.purchaseDate.startsWith(filterDateMonth));

      return matchSearch && matchSupplier && matchDate;
    });
  }, [purchases, searchTerm, filterSupplier, filterDateMonth]);

  // Extract unique suppliers
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach(p => {
      if (p.supplier) set.add(p.supplier);
    });
    return Array.from(set);
  }, [purchases]);

  // Extract unique months (YYYY-MM)
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach(p => {
      if (p.purchaseDate) {
        set.add(p.purchaseDate.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [purchases]);

  // Overall metrics
  const totalSpentPurchases = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalUnitsPurchased = purchases.reduce((acc, p) => acc + p.items.reduce((s, i) => s + i.quantity, 0), 0);
  const totalPurchasesCount = purchases.length;

  return (
    <div className="space-y-6">
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Entradas & Compras de Mercadorias</h2>
              <p className="text-xs text-slate-500 font-medium">
                Controle de lotes, notas fiscais e cálculo automático do <strong>Custo Médio Ponderado (CMP)</strong>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openNewPurchaseModal}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Registrar Nova Compra
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Investido em Compras</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              R$ {totalSpentPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Reposição e novos lotes
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Notas / Compras</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalPurchasesCount}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Registros no banco de dados
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unidades Adquiridas</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalUnitsPurchased} un
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Itens somados ao estoque
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, fornecedor, nota ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {uniqueSuppliers.length > 0 && (
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Todos os Fornecedores</option>
              {uniqueSuppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {uniqueMonths.length > 0 && (
            <select
              value={filterDateMonth}
              onChange={(e) => setFilterDateMonth(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Todos os Meses</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            Histórico de Compras Registradas ({filteredPurchases.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código / Data</th>
                <th className="py-3 px-4">Fornecedor / NF</th>
                <th className="py-3 px-4">Itens Comprados</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPurchases.map(p => {
                const totalItemsQty = p.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900 font-mono text-xs">{p.code}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {p.purchaseDate ? p.purchaseDate.split('-').reverse().join('/') : '-'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          {p.supplier || 'Fornecedor Diversos'}
                        </span>
                        {p.invoiceNumber && (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            NF/Doc: {p.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900">
                          {p.items.length} produto{p.items.length !== 1 ? 's' : ''} ({totalItemsQty} un)
                        </span>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                          {p.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-black text-slate-900 text-sm">
                        R$ {p.totalAmount.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                        {p.paymentMethod || 'Pix'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedPurchaseDetails(p)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Ver Detalhes do Custo Médio"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {onDeletePurchase && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir a compra ${p.code}?`)) {
                                onDeletePurchase(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Excluir Compra"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Nenhuma compra registrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Nova Compra */}
      {isNewPurchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Registrar Entrada de Compra</h3>
                  <p className="text-xs text-slate-500 font-medium font-mono">{nextPurchaseCode}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Basic Purchase Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fornecedor / Distribuidora</label>
                <input
                  type="text"
                  placeholder="Ex: Ambev, Atacadão, Frigorífico..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nº Nota Fiscal / Cupom / Recibo</label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 124590"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Data da Compra</label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Pix">Pix</option>
                  <option value="Boleto Bancário">Boleto Bancário</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="A Prazo / Faturado">A Prazo / Faturado</option>
                </select>
              </div>
            </div>

            {/* Product Addition Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-4 w-4 text-amber-500" />
                Adicionar Produtos à Compra
              </h4>

              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Selecionar Produto</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="">-- Escolha um produto do cardápio --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Estoque atual: {p.stock} {p.unit} | Custo atual: R$ {p.costPrice.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Quantidade Comprada</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Preço Unitário Pago (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemCostPrice}
                      onChange={(e) => setItemCostPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItemToCart}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Incluir no Pedido
                    </button>
                  </div>
                </div>

                {/* Real-time CMP simulation preview */}
                {selectedProductId && (
                  (() => {
                    const selProd = products.find(p => p.id === selectedProductId);
                    if (!selProd) return null;
                    const curStock = Math.max(0, selProd.stock);
                    const curCost = Math.max(0, selProd.costPrice);
                    const buyQty = Math.max(1, itemQuantity);
                    const buyCost = Math.max(0, itemCostPrice);
                    let simAvg = buyCost;
                    if (curStock > 0 && curCost > 0) {
                      simAvg = ((curStock * curCost) + (buyQty * buyCost)) / (curStock + buyQty);
                    }
                    simAvg = Math.round(simAvg * 100) / 100;

                    return (
                      <div className="bg-white p-3 rounded-xl border border-amber-200 text-[11px] text-slate-700 space-y-1">
                        <div className="flex items-center gap-1 text-amber-800 font-extrabold">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                          Simulação do Custo Médio Ponderado:
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-slate-600 font-medium">
                          <span>Estoque Atual: <strong>{curStock} {selProd.unit} a R$ {curCost.toFixed(2)}</strong></span>
                          <span>+</span>
                          <span>Compra: <strong>{buyQty} {selProd.unit} a R$ {buyCost.toFixed(2)}</strong></span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Novo Custo Médio: R$ {simAvg.toFixed(2)} / {selProd.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Items List in Cart */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Itens Adicionados ({cartItems.length})
              </h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Produto</th>
                      <th className="py-2.5 px-3">Qtd</th>
                      <th className="py-2.5 px-3">Custo Unit.</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Novo Custo Médio</th>
                      <th className="py-2.5 px-3 text-center">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cartItems.map((item, idx) => {
                      const curStock = Math.max(0, item.currentStock);
                      const curCost = Math.max(0, item.currentCostPrice);
                      let newAvg = item.costPrice;
                      if (curStock > 0 && curCost > 0) {
                        newAvg = ((curStock * curCost) + (item.quantity * item.costPrice)) / (curStock + item.quantity);
                      }
                      newAvg = Math.round(newAvg * 100) / 100;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.productName}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">R$ {item.costPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900">R$ {(item.quantity * item.costPrice).toFixed(2)}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              R$ {newAvg.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {cartItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                          Nenhum produto adicionado ainda. Use o seletor acima para adicionar itens.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Footer & Submit */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total da Compra</p>
                <h3 className="text-2xl font-black text-slate-900">
                  R$ {totalCartAmount.toFixed(2)}
                </h3>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSubmitPurchase}
                  disabled={cartItems.length === 0}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Salvar Compra & Atualizar Custo Médio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes da Compra */}
      {selectedPurchaseDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Detalhes da Compra</h3>
                  <p className="text-xs text-slate-500 font-mono font-bold">{selectedPurchaseDetails.code}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPurchaseDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Data</span>
                <span className="font-extrabold text-slate-800">
                  {selectedPurchaseDetails.purchaseDate.split('-').reverse().join('/')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Fornecedor</span>
                <span className="font-extrabold text-slate-800">
                  {selectedPurchaseDetails.supplier || 'Diversos'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Nota Fiscal</span>
                <span className="font-extrabold text-slate-800 font-mono">
                  {selectedPurchaseDetails.invoiceNumber || 'Não informada'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Forma Pagto</span>
                <span className="font-extrabold text-slate-800">
                  {selectedPurchaseDetails.paymentMethod || 'Pix'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Itens e Recálculo de Custo Médio</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Qtd</th>
                      <th className="py-2.5 px-3">Custo Pago</th>
                      <th className="py-2.5 px-3">Custo Anterior</th>
                      <th className="py-2.5 px-3">Novo Custo Médio (CMP)</th>
                      <th className="py-2.5 px-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchaseDetails.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.productName}</td>
                        <td className="py-2.5 px-3 font-black text-slate-800">{item.quantity} {item.unit}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">R$ {item.costPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          R$ {item.previousCost ? item.previousCost.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            R$ {item.newAverageCost ? item.newAverageCost.toFixed(2) : item.costPrice.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900">
                          R$ {(item.quantity * item.costPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Total da Nota / Compra</p>
                <h3 className="text-xl font-black text-slate-900">
                  R$ {selectedPurchaseDetails.totalAmount.toFixed(2)}
                </h3>
              </div>

              <button
                onClick={() => setSelectedPurchaseDetails(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
