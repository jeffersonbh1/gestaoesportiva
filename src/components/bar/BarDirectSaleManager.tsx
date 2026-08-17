import React, { useState, useRef, useEffect } from 'react';
import { BarProduct, BarSale, BarSaleItem, PaymentMethod } from '../../types';
import { formatCurrency, getBrasiliaTodayDate } from '../../utils';
import { 
  Zap, 
  Search, 
  ShoppingCart, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Receipt, 
  Clock, 
  User as UserIcon, 
  Printer, 
  Share2, 
  AlertCircle,
  Tag,
  ArrowRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface BarDirectSaleManagerProps {
  products: BarProduct[];
  sales: BarSale[];
  onDirectSale: (sale: BarSale) => void;
  onCancelSale?: (saleId: string) => void;
}

export default function BarDirectSaleManager({
  products,
  sales,
  onDirectSale,
  onCancelSale
}: BarDirectSaleManagerProps) {
  // Active products only
  const activeProducts = products.filter(p => p.active !== false);

  // Cart / Multi-product list for direct sale
  const [cartItems, setCartItems] = useState<BarSaleItem[]>([]);

  // Current Item Form Inputs State
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<BarProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // General Sale Metadata
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('Pix');
  const [customerName, setCustomerName] = useState<string>('Cliente Balcão');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Dropdown Autocomplete State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [lastRegisteredSale, setLastRegisteredSale] = useState<BarSale | null>(null);

  // Success Toast Banner State
  const [successBanner, setSuccessBanner] = useState<{ message: string; saleCode: string; total: number; itemCount: number } | null>(null);

  // Element Refs for Perfect Tab & Enter Navigation
  const productInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const unitPriceInputRef = useRef<HTMLInputElement>(null);
  const addItemButtonRef = useRef<HTMLButtonElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const paymentMethodSelectRef = useRef<HTMLSelectElement>(null);
  const finishButtonRef = useRef<HTMLButtonElement>(null);
  const confirmModalButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus on Product Search Input on Mount
  useEffect(() => {
    productInputRef.current?.focus();
  }, []);

  // Filter products by code or name
  const filteredProducts = activeProducts.filter((prod, index) => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return true;

    const prodIndexCode = String(index + 1);
    const prodPaddedCode = String(index + 1).padStart(2, '0');
    const prodIdClean = prod.id.replace(/\D/g, '');

    const matchesCode = prod.id.toLowerCase().includes(q) ||
                        prodIndexCode === q ||
                        prodPaddedCode === q ||
                        (prodIdClean && prodIdClean === q);

    const matchesName = prod.name.toLowerCase().includes(q);
    const matchesCategory = prod.category.toLowerCase().includes(q);

    return matchesCode || matchesName || matchesCategory;
  });

  // Calculate Cart Subtotals
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const currentPendingSubtotal = selectedProduct ? (quantity || 0) * (unitPrice || 0) : 0;
  const overallSubtotal = cartSubtotal + currentPendingSubtotal;
  const finalTotal = Math.max(0, overallSubtotal - (discount || 0));

  const changeValue = paymentMethod === 'Dinheiro' && cashGiven && Number(cashGiven) > finalTotal
    ? Number(cashGiven) - finalTotal
    : 0;

  // Handle selecting a product from search
  const handleSelectProduct = (prod: BarProduct) => {
    setSelectedProduct(prod);
    setProductQuery(prod.name);
    setUnitPrice(prod.price);
    setIsDropdownOpen(false);

    // Automatically focus the Quantity field with text selected
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    }, 50);
  };

  // Add current product to cart
  const handleAddToCart = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();

    if (!selectedProduct) {
      if (cartItems.length > 0) {
        // If no product is currently typed but cart has items, jump to discount or payment
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }
      alert('Por favor, selecione um produto para adicionar ao carrinho.');
      productInputRef.current?.focus();
      return;
    }

    if (quantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      quantityInputRef.current?.focus();
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const itemTotal = quantity * unitPrice;

    setCartItems(prev => {
      // Check if product already exists in cart with same unit price
      const existingIndex = prev.findIndex(item => item.productId === selectedProduct.id && item.unitPrice === unitPrice);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: newQty * existing.unitPrice
        };
        return updated;
      } else {
        const newItem: BarSaleItem = {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: itemTotal,
          addedAt: timeStr
        };
        return [...prev, newItem];
      }
    });

    // Reset current item inputs
    setSelectedProduct(null);
    setProductQuery('');
    setQuantity(1);
    setUnitPrice(0);

    // Focus directly back on product input for rapid scanning / typing of next product
    setTimeout(() => {
      productInputRef.current?.focus();
    }, 50);
  };

  // Quick 1-click add from catalog
  const handleQuickAddFromCatalog = (prod: BarProduct) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === prod.id && item.unitPrice === prod.price);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + 1;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: newQty * existing.unitPrice
        };
        return updated;
      } else {
        const newItem: BarSaleItem = {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unitPrice: prod.price,
          totalPrice: prod.price,
          addedAt: timeStr
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item quantity in cart
  const handleUpdateCartItemQty = (index: number, delta: number) => {
    setCartItems(prev => {
      const updated = [...prev];
      const target = updated[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = {
        ...target,
        quantity: newQty,
        totalPrice: newQty * target.unitPrice
      };
      return updated;
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Keyboard navigation on product search input
  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex(prev => (prev + 1) % Math.max(1, filteredProducts.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex(prev => (prev - 1 + filteredProducts.length) % Math.max(1, filteredProducts.length));
    } else if (e.key === 'Enter') {
      // If user typed exact code or there are filtered items
      if (filteredProducts.length > 0 && !selectedProduct) {
        e.preventDefault();
        const target = filteredProducts[highlightedIndex] || filteredProducts[0];
        if (target) {
          handleSelectProduct(target);
          return;
        }
      }

      if (selectedProduct) {
        e.preventDefault();
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      } else if (cartItems.length > 0) {
        // If product field is empty and we have items in cart, Enter jumps straight to finish
        e.preventDefault();
        handleOpenConfirmModal();
      }
    } else if (e.key === 'Tab') {
      if (filteredProducts.length > 0 && !selectedProduct && productQuery.trim().length > 0) {
        const target = filteredProducts[highlightedIndex] || filteredProducts[0];
        if (target) {
          handleSelectProduct(target);
        }
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Open Confirmation Modal
  const handleOpenConfirmModal = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();

    // If there is an active item in inputs, combine it
    let itemsToProcess = [...cartItems];
    if (selectedProduct && quantity > 0) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const itemTotal = quantity * unitPrice;
      const existingIdx = itemsToProcess.findIndex(it => it.productId === selectedProduct.id && it.unitPrice === unitPrice);
      if (existingIdx >= 0) {
        itemsToProcess[existingIdx] = {
          ...itemsToProcess[existingIdx],
          quantity: itemsToProcess[existingIdx].quantity + quantity,
          totalPrice: (itemsToProcess[existingIdx].quantity + quantity) * unitPrice
        };
      } else {
        itemsToProcess.push({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: itemTotal,
          addedAt: timeStr
        });
      }
    }

    if (itemsToProcess.length === 0) {
      alert('Por favor, adicione pelo menos um produto ao carrinho antes de finalizar a venda.');
      productInputRef.current?.focus();
      return;
    }

    // Update cart items if pending item was merged
    if (selectedProduct && quantity > 0) {
      setCartItems(itemsToProcess);
      setSelectedProduct(null);
      setProductQuery('');
      setQuantity(1);
      setUnitPrice(0);
    }

    setIsConfirmModalOpen(true);

    // Focus confirm button in modal automatically
    setTimeout(() => {
      confirmModalButtonRef.current?.focus();
    }, 80);
  };

  // Confirm and Register Multi-Product Sale (called with Enter inside modal)
  const handleRegisterSale = () => {
    if (cartItems.length === 0) return;

    const todayDate = getBrasiliaTodayDate();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const fullDateStr = `${todayDate} ${timeStr}`;
    const saleCode = `VD-${Date.now().toString().slice(-4)}`;

    const currentSubtotal = cartItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const saleFinalAmount = Math.max(0, currentSubtotal - (discount || 0));

    const newSale: BarSale = {
      id: `sale-direct-${Date.now()}`,
      code: saleCode,
      customerName: customerName.trim() || 'Cliente Balcão',
      customerPhone: '',
      location: 'Balcão / Venda Direta',
      items: cartItems,
      totalAmount: currentSubtotal,
      discount: discount || 0,
      finalAmount: saleFinalAmount,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: 'Pago',
      status: 'Concluída',
      createdAt: fullDateStr,
      date: todayDate,
      notes: saleNotes.trim() || undefined,
      origemVenda: 'balcão'
    };

    // Execute sale registration in parent
    onDirectSale(newSale);

    // Set last sale for receipt / quick actions
    setLastRegisteredSale(newSale);

    // Show toast banner
    setSuccessBanner({
      message: `Venda #${newSale.code} registrada com sucesso!`,
      saleCode: newSale.code,
      total: newSale.finalAmount,
      itemCount: cartItems.length
    });

    // Auto-hide toast after 4s
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4000);

    // Close Modal and Reset Form & Cart
    setIsConfirmModalOpen(false);
    setCartItems([]);
    setSelectedProduct(null);
    setProductQuery('');
    setQuantity(1);
    setUnitPrice(0);
    setDiscount(0);
    setCashGiven('');
    setSaleNotes('');
    setCustomerName('Cliente Balcão');
    setPaymentMethod('Pix');

    // Return focus directly to the product search input for lightning-fast next sale
    setTimeout(() => {
      productInputRef.current?.focus();
    }, 100);
  };

  // WhatsApp receipt sender
  const handleShareWhatsAppReceipt = (sale: BarSale) => {
    let msg = `*ARENA FAHEL - COMPROVANTE DE VENDA*\n`;
    msg += `--------------------------------\n`;
    msg += `*Venda:* #${sale.code}\n`;
    msg += `*Data:* ${sale.createdAt}\n`;
    msg += `*Cliente:* ${sale.customerName || 'Balcão'}\n`;
    msg += `--------------------------------\n`;
    msg += `*ITENS VENDIDOS (${sale.items.length}):*\n`;
    sale.items.forEach(it => {
      msg += `• ${it.quantity}x ${it.productName} (${formatCurrency(it.unitPrice)}) = ${formatCurrency(it.totalPrice)}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `*Subtotal:* ${formatCurrency(sale.totalAmount)}\n`;
    if (sale.discount > 0) {
      msg += `*Desconto:* -${formatCurrency(sale.discount)}\n`;
    }
    msg += `*TOTAL PAGO:* ${formatCurrency(sale.finalAmount)}\n`;
    msg += `*Forma de Pagamento:* ${sale.paymentMethod}\n`;
    msg += `--------------------------------\n`;
    msg += `Obrigado pela preferência! Volte sempre!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Recent direct sales
  const recentDirectSales = sales.filter(s => !s.comandaId).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-white stroke-[3]" />
            </div>
            <div>
              <p className="font-extrabold text-sm">{successBanner.message}</p>
              <p className="text-xs text-emerald-100">
                Código <strong>#{successBanner.saleCode}</strong> • {successBanner.itemCount} produto(s) • Total: <strong>{formatCurrency(successBanner.total)}</strong>
              </p>
            </div>
          </div>
          {lastRegisteredSale && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShareWhatsAppReceipt(lastRegisteredSale)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main POS Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Center Column: Fast Product Entry & Checkout Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-xs">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Venda Rápida / Balcão</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Adicione múltiplos produtos com <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-700">Tab</kbd> e finalize com <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-700">Enter</kbd>.
                  </p>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Multi-Produtos
              </span>
            </div>

            {/* PRODUCT INPUT SECTION */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                  1. Lançar Produto
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {cartItems.length > 0 ? `${cartItems.length} item(ns) no carrinho` : 'Carrinho vazio'}
                </span>
              </div>

              {/* Field 1: Product Code or Name with Autocomplete */}
              <div className="space-y-1.5 relative">
                <div className="relative">
                  <input
                    ref={productInputRef}
                    type="text"
                    value={productQuery}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      setIsDropdownOpen(true);
                      setHighlightedIndex(0);
                      if (selectedProduct && e.target.value !== selectedProduct.name) {
                        setSelectedProduct(null);
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleProductKeyDown}
                    placeholder="Digite o código (ex: 1, 01) ou nome do produto..."
                    className={`w-full px-4 py-3 pl-11 rounded-xl border text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                      selectedProduct 
                        ? 'bg-amber-50 border-amber-400 text-slate-900' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  
                  {selectedProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setProductQuery('');
                        setUnitPrice(0);
                        productInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                      title="Limpar produto selecionado"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List */}
                {isDropdownOpen && !selectedProduct && productQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto scrollbar-thin p-1">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 italic">
                        Nenhum produto encontrado com "{productQuery}"
                      </div>
                    ) : (
                      filteredProducts.map((prod, idx) => {
                        const isHighlighted = idx === highlightedIndex;
                        const prodNumber = String(activeProducts.findIndex(p => p.id === prod.id) + 1).padStart(2, '0');

                        return (
                          <div
                            key={prod.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectProduct(prod);
                            }}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                              isHighlighted 
                                ? 'bg-amber-500 text-white font-bold' 
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-black ${
                                isHighlighted ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                                #{prodNumber}
                              </span>
                              <div className="truncate">
                                <p className="truncate font-bold">{prod.name}</p>
                                <p className={`text-[10px] ${isHighlighted ? 'text-amber-100' : 'text-slate-400'}`}>
                                  {prod.category} • Estoque: {prod.stock} {prod.unit}
                                </p>
                              </div>
                            </div>

                            <span className={`font-black whitespace-nowrap pl-2 ${
                              isHighlighted ? 'text-white' : 'text-amber-600'
                            }`}>
                              {formatCurrency(prod.price)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Row: Quantidade, Valor Unitário, Botão Adicionar Item */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                
                {/* Field 2: Quantidade (3 cols) */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 block">
                    Quantidade:
                  </label>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (selectedProduct) {
                          handleAddToCart();
                        } else {
                          unitPriceInputRef.current?.focus();
                          unitPriceInputRef.current?.select();
                        }
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Field 3: Valor Unitário (4 cols) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 block">
                    Valor Unit. (R$):
                  </label>
                  <input
                    ref={unitPriceInputRef}
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice || ''}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (selectedProduct) {
                          handleAddToCart();
                        } else {
                          addItemButtonRef.current?.focus();
                        }
                      }
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Botão Adicionar Item ao Carrinho (5 cols) */}
                <div className="sm:col-span-5">
                  <button
                    ref={addItemButtonRef}
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedProduct || quantity <= 0}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 focus:ring-2 focus:ring-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Adicionar item ao carrinho e digitar o próximo produto"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Adicionar Produto (Enter)
                  </button>
                </div>
              </div>

              {/* Selected Product Pill Feedback */}
              {selectedProduct && (
                <div className="text-[11px] text-amber-900 font-bold bg-amber-100/70 px-3 py-1.5 rounded-lg flex items-center justify-between">
                  <span>Selecionado: <strong>{selectedProduct.name}</strong> ({selectedProduct.category})</span>
                  <span>Subtotal deste item: <strong>{formatCurrency(quantity * unitPrice)}</strong></span>
                </div>
              )}
            </div>

            {/* CHECKOUT & TOTAL SECTION */}
            <form onSubmit={handleOpenConfirmModal} className="space-y-4 pt-1">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                2. Pagamento & Fechamento da Venda
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Field 4: Desconto Geral (R$) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 flex items-center justify-between">
                    <span>Desconto Geral (R$):</span>
                    {discount > 0 && (
                      <span className="text-[10px] font-bold text-rose-600">
                        -{formatCurrency(discount)}
                      </span>
                    )}
                  </label>
                  <input
                    ref={discountInputRef}
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        paymentMethodSelectRef.current?.focus();
                      }
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-rose-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Field 5: Forma de Pagamento */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 block">
                    Forma de Pagamento:
                  </label>
                  <select
                    ref={paymentMethodSelectRef}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        finishButtonRef.current?.focus();
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    <option value="Pix">📱 PIX</option>
                    <option value="Dinheiro">💵 Dinheiro</option>
                    <option value="Cartão de Débito">💳 Cartão de Débito</option>
                    <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                  </select>
                </div>

                {/* Cliente / Identificação rápida */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 block">
                    Cliente (Opcional):
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Dinheiro / Troco extra input */}
              {paymentMethod === 'Dinheiro' && (
                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-slate-700">Valor Recebido em Dinheiro:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder="Ex: 50.00"
                      className="w-28 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {changeValue > 0 && (
                      <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                        Troco: {formatCurrency(changeValue)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button: Confirmar Venda */}
              <div className="pt-2">
                <button
                  ref={finishButtonRef}
                  type="submit"
                  disabled={cartItems.length === 0 && !selectedProduct}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-200"
                >
                  <Check className="h-5 w-5 stroke-[3]" />
                  Finalizar Venda • {formatCurrency(finalTotal)} (Pressione Enter)
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Multi-Product Cart List & Quick Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Big Live Calculation & Multi-Item Cart Summary Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4" /> Itens da Venda ({cartItems.length + (selectedProduct ? 1 : 0)})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {getBrasiliaTodayDate()}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {cartItems.length === 0 && !selectedProduct ? (
                <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-800/40 rounded-2xl border border-dashed border-slate-800">
                  Nenhum produto adicionado à venda ainda.
                </div>
              ) : (
                <>
                  {cartItems.map((item, idx) => (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs transition hover:border-slate-600"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-white truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.quantity}x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 bg-slate-700/80 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartItemQty(idx, -1)}
                            className="h-5 w-5 bg-slate-600 hover:bg-slate-500 rounded text-white flex items-center justify-center font-bold"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="px-1.5 font-bold font-mono text-[11px]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartItemQty(idx, 1)}
                            className="h-5 w-5 bg-amber-500 hover:bg-amber-400 rounded text-white flex items-center justify-center font-bold"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        <span className="font-black text-emerald-400 font-mono text-xs min-w-[60px] text-right">
                          {formatCurrency(item.totalPrice)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                          title="Remover item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Temporary display of pending product in inputs */}
                  {selectedProduct && (
                    <div className="p-2.5 bg-amber-950/40 border border-amber-700/60 rounded-xl flex items-center justify-between text-xs animate-pulse">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-amber-200 truncate">+ {selectedProduct.name} (Digitando...)</p>
                        <p className="text-[10px] text-amber-400">
                          {quantity}x {formatCurrency(unitPrice)}
                        </p>
                      </div>
                      <span className="font-black text-amber-300 font-mono text-xs">
                        {formatCurrency(quantity * unitPrice)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs pt-3 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <strong className="text-slate-200 font-mono">{formatCurrency(overallSubtotal)}</strong>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>Desconto Aplicado:</span>
                  <strong className="font-mono">-{formatCurrency(discount)}</strong>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Pagamento:</span>
                <span className="font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                  {paymentMethod}
                </span>
              </div>
            </div>

            {/* Big Total */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total a Pagar</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(finalTotal)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Teclas Rápidas:</span>
                <span className="text-[11px] text-amber-300 font-mono font-bold">
                  [Tab] Navega • [Enter] Confirma
                </span>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Fast Catalog (Atalhos de Produtos Mais Vendidos) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                Produtos Rápidos (+1 Clique)
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                {activeProducts.length} itens no cardápio
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto scrollbar-thin pr-1">
              {activeProducts.slice(0, 8).map((prod, index) => {
                const prodCode = String(index + 1).padStart(2, '0');

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleQuickAddFromCatalog(prod)}
                    className="p-2.5 rounded-xl border bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border-slate-200 text-slate-800 text-left transition cursor-pointer flex flex-col justify-between gap-1 group"
                    title={`Clique para adicionar 1x ${prod.name} diretamente ao carrinho`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-black bg-slate-200 group-hover:bg-amber-200 text-slate-700 group-hover:text-amber-900">
                        #{prodCode}
                      </span>
                      <span className="text-[11px] font-black text-amber-700">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold truncate leading-tight mt-0.5">
                      + {prod.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DA VENDA COM MÚLTIPLOS PRODUTOS (ACESSADO E CONFIRMADO COM ENTER) */}
      {isConfirmModalOpen && cartItems.length > 0 && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsConfirmModalOpen(false);
              finishButtonRef.current?.focus();
            }
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                  <Check className="h-5 w-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Confirmar Venda Sem Comanda</h3>
                  <p className="text-xs text-slate-500">Pressione Enter para concluir o registro</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  finishButtonRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sale details box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              
              {/* Product items list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin border-b border-slate-200/80 pb-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Itens da Venda ({cartItems.length}):
                </p>
                {cartItems.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex justify-between items-center text-slate-800">
                    <span className="font-bold truncate max-w-[240px]">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Subtotal dos Produtos:</span>
                <span className="font-bold text-slate-900">{formatCurrency(cartSubtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5 text-rose-600">
                  <span className="font-medium">Desconto Aplicado:</span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Forma de Pagamento:</span>
                <span className="font-bold text-slate-900">{paymentMethod}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Cliente:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>

              {paymentMethod === 'Dinheiro' && cashGiven && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Troco:</span>
                  <span>{formatCurrency(changeValue)}</span>
                </div>
              )}

              <div className="pt-1.5 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total a Cobrar:</span>
                <span className="text-emerald-600 text-lg font-mono">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Modal Actions with Primary Button Auto-Focused */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  finishButtonRef.current?.focus();
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar (Esc)
              </button>

              <button
                ref={confirmModalButtonRef}
                type="button"
                onClick={handleRegisterSale}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRegisterSale();
                  }
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 focus:ring-4 focus:ring-emerald-300"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                Registrar Venda (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Direct Sales Table */}
      {recentDirectSales.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Últimas Vendas Diretas Realizadas Hoje
            </h3>
            <span className="text-xs text-slate-400">
              {recentDirectSales.length} vendas registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Horário</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Itens</th>
                  <th className="pb-3">Pagamento</th>
                  <th className="pb-3 text-right">Valor Final</th>
                  <th className="pb-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentDirectSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 font-mono font-bold text-slate-900">
                      #{sale.code}
                    </td>
                    <td className="py-3 text-slate-500">
                      {sale.createdAt.split(' ')[1] || sale.createdAt}
                    </td>
                    <td className="py-3 font-bold text-slate-800">
                      {sale.customerName || 'Balcão'}
                    </td>
                    <td className="py-3">
                      <span className="truncate max-w-[220px] block" title={sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}>
                        {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-emerald-600">
                      {formatCurrency(sale.finalAmount)}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareWhatsAppReceipt(sale)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Enviar Comprovante WhatsApp"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Imprimir Comprovante"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
