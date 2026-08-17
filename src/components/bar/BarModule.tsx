import React, { useState, useEffect } from 'react';
import { BarComanda, BarComandaItem, BarProduct, BarSale, PaymentMethod, StockMovement, User } from '../../types';
import { INITIAL_BAR_PRODUCTS, getInitialBarSales, getInitialComandas, getInitialStockMovements } from '../../data/mockBarData';
import { 
  isSupabaseConfigured,
  dbGetBarProducts,
  dbSaveBarProduct,
  dbDeleteBarProduct,
  dbGetBarComandas,
  dbSaveBarComanda,
  dbGetBarSales,
  dbSaveBarSale,
  dbGetStockMovements,
  dbSaveStockMovement
} from '../../lib/supabase';
import BarComandasManager from './BarComandasManager';
import BarDirectSaleManager from './BarDirectSaleManager';
import BarProductsManager from './BarProductsManager';
import BarSalesReports from './BarSalesReports';
import BarStockMovements from './BarStockMovements';
import { 
  Receipt,
  Zap,
  Package, 
  BarChart3, 
  History, 
  Volleyball, 
  ArrowLeftRight
} from 'lucide-react';

interface BarModuleProps {
  currentUser: User | null;
  onSwitchToQuadras: () => void;
  onSwitchModuleHub: () => void;
}

export default function BarModule({
  currentUser,
  onSwitchToQuadras,
  onSwitchModuleHub
}: BarModuleProps) {
  const [activeBarTab, setActiveBarTab] = useState<'comandas' | 'directSale' | 'products' | 'reports' | 'movements'>('comandas');

  // State in memory - Database as single source of truth
  const [comandas, setComandas] = useState<BarComanda[]>(() => isSupabaseConfigured ? [] : getInitialComandas());
  const [products, setProducts] = useState<BarProduct[]>(INITIAL_BAR_PRODUCTS);
  const [sales, setSales] = useState<BarSale[]>(() => isSupabaseConfigured ? [] : getInitialBarSales());
  const [movements, setMovements] = useState<StockMovement[]>(() => isSupabaseConfigured ? [] : getInitialStockMovements());

  // Clear any existing localStorage cache to adhere to "no local storage" policy
  useEffect(() => {
    try {
      localStorage.removeItem('arena_bar_comandas');
      localStorage.removeItem('arena_bar_products');
      localStorage.removeItem('arena_bar_sales');
      localStorage.removeItem('arena_bar_stock_movements');
    } catch (e) {
      // Ignore if localStorage is restricted
    }
  }, []);

  // Load from Supabase Database on mount if configured
  useEffect(() => {
    async function loadBarDataFromDb() {
      if (!isSupabaseConfigured) return;
      try {
        const [dbProds, dbCmds, dbSls, dbMovs] = await Promise.all([
          dbGetBarProducts(),
          dbGetBarComandas(),
          dbGetBarSales(),
          dbGetStockMovements()
        ]);
        if (dbProds && dbProds.length > 0) setProducts(dbProds);
        setComandas(dbCmds || []);
        setSales(dbSls || []);
        setMovements(dbMovs || []);
      } catch (err) {
        console.error('Erro ao carregar dados do bar do Supabase:', err);
      }
    }
    loadBarDataFromDb();
  }, []);

  // Handle Open New Comanda
  const handleOpenComanda = (newComanda: BarComanda) => {
    setComandas(prev => [newComanda, ...prev]);
    if (isSupabaseConfigured) {
      dbSaveBarComanda(newComanda).catch(err => console.error('Erro ao salvar comanda no banco:', err));
    }
  };

  // Handle Add Items to Existing Comanda
  const handleAddItemToComanda = (comandaId: string, itemsToAdd: BarComandaItem[]) => {
    const targetComanda = comandas.find(c => c.id === comandaId);
    if (!targetComanda) return;

    // Calculate updated Comanda object directly
    const updatedItems = [...targetComanda.items, ...itemsToAdd];
    const newTotal = updatedItems.reduce((acc, i) => acc + i.totalPrice, 0);
    const newFinal = Math.max(0, newTotal - (targetComanda.discount || 0));

    const updatedComandaToSave: BarComanda = {
      ...targetComanda,
      items: updatedItems,
      totalAmount: newTotal,
      finalAmount: newFinal
    };

    // 1. Update Comanda State
    setComandas(prev => prev.map(c => c.id === comandaId ? updatedComandaToSave : c));

    // 2. Deduct Product Stock
    const updatedProductsToSave: BarProduct[] = [];
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const addedItems = itemsToAdd.filter(i => i.productId === prod.id);
        if (addedItems.length > 0) {
          const totalQtyAdded = addedItems.reduce((acc, i) => acc + i.quantity, 0);
          const res = { ...prod, stock: Math.max(0, prod.stock - totalQtyAdded) };
          updatedProductsToSave.push(res);
          return res;
        }
        return prod;
      });
    });

    // 3. Log Stock Movement
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = targetComanda.date;

    const newMovements: StockMovement[] = itemsToAdd.map((item, idx) => ({
      id: `mov-cmd-${comandaId}-${Date.now()}-${idx}`,
      productId: item.productId,
      productName: item.productName,
      type: 'Saída (Venda)',
      quantity: -item.quantity,
      reason: `Consumo Comanda ${targetComanda.code} (${targetComanda.customerName})`,
      createdAt: `${dateStr} ${timeStr}`,
      user: currentUser ? currentUser.name : 'Operador do Bar'
    }));

    setMovements(prev => [...newMovements, ...prev]);

    // Save directly to database
    if (isSupabaseConfigured) {
      dbSaveBarComanda(updatedComandaToSave).catch(err => console.error('Erro ao salvar comanda no banco:', err));
      updatedProductsToSave.forEach(p => dbSaveBarProduct(p).catch(err => console.error(err)));
      newMovements.forEach(m => dbSaveStockMovement(m).catch(err => console.error(err)));
    }
  };

  // Handle Remove Item from Open Comanda
  const handleRemoveItemFromComanda = (comandaId: string, itemId: string) => {
    const targetComanda = comandas.find(c => c.id === comandaId);
    if (!targetComanda) return;

    const itemToRemove = targetComanda.items.find(i => i.id === itemId);
    if (!itemToRemove) return;

    const updatedItems = targetComanda.items.filter(i => i.id !== itemId);
    const newTotal = updatedItems.reduce((acc, i) => acc + i.totalPrice, 0);
    const newFinal = Math.max(0, newTotal - (targetComanda.discount || 0));

    const updatedComandaToSave: BarComanda = {
      ...targetComanda,
      items: updatedItems,
      totalAmount: newTotal,
      finalAmount: newFinal
    };

    // 1. Update Comanda
    setComandas(prev => prev.map(c => c.id === comandaId ? updatedComandaToSave : c));

    // 2. Restore Stock
    let updatedProductToSave: BarProduct | null = null;
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        if (prod.id === itemToRemove.productId) {
          const res = { ...prod, stock: prod.stock + itemToRemove.quantity };
          updatedProductToSave = res;
          return res;
        }
        return prod;
      });
    });

    // 3. Log Movement
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const restoreMov: StockMovement = {
      id: `mov-estorno-${itemId}-${Date.now()}`,
      productId: itemToRemove.productId,
      productName: itemToRemove.productName,
      type: 'Entrada',
      quantity: itemToRemove.quantity,
      reason: `Estorno Item Comanda ${targetComanda.code} (${targetComanda.customerName})`,
      createdAt: `${targetComanda.date} ${timeStr}`,
      user: currentUser ? currentUser.name : 'Operador do Bar'
    };

    setMovements(prev => [restoreMov, ...prev]);

    // Save to database
    if (isSupabaseConfigured) {
      dbSaveBarComanda(updatedComandaToSave).catch(err => console.error(err));
      if (updatedProductToSave) dbSaveBarProduct(updatedProductToSave).catch(err => console.error(err));
      dbSaveStockMovement(restoreMov).catch(err => console.error(err));
    }
  };

  // Handle Close & Finalize Comanda
  const handleCloseComanda = (
    comandaId: string, 
    paymentMethod: PaymentMethod | string, 
    discount: number, 
    finalAmount: number,
    notes?: string
  ) => {
    const targetComanda = comandas.find(c => c.id === comandaId);
    if (!targetComanda) return;

    const now = new Date();
    const closedAtTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const closedAtFull = `${targetComanda.date} ${closedAtTime}`;

    const updatedComandaToSave: BarComanda = {
      ...targetComanda,
      status: 'Fechada' as const,
      closedAt: closedAtTime,
      paymentMethod,
      discount,
      finalAmount,
      notes: notes || targetComanda.notes,
      origemVenda: 'comanda'
    };

    // 1. Mark Comanda as Closed
    setComandas(prev => prev.map(c => c.id === comandaId ? updatedComandaToSave : c));

    // 2. Register as a BarSale record for Reports
    const newSaleRecord: BarSale = {
      id: `sale-cmd-${comandaId}`,
      code: `V-${targetComanda.code.replace('#', '')}`,
      comandaId: comandaId,
      customerName: targetComanda.customerName,
      customerPhone: targetComanda.customerPhone,
      location: targetComanda.location || 'Balcão',
      items: targetComanda.items.map(ci => ({
        productId: ci.productId,
        productName: ci.productName,
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        totalPrice: ci.totalPrice
      })),
      totalAmount: targetComanda.totalAmount,
      discount: discount,
      finalAmount: finalAmount,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: 'Pago',
      status: 'Concluída',
      createdAt: closedAtFull,
      date: targetComanda.date,
      notes: notes || targetComanda.notes,
      origemVenda: 'comanda'
    };

    setSales(prev => [newSaleRecord, ...prev]);

    // Save to database
    if (isSupabaseConfigured) {
      dbSaveBarComanda(updatedComandaToSave).catch(err => console.error(err));
      dbSaveBarSale(newSaleRecord).catch(err => console.error(err));
    }
  };

  // Handle Direct Rapid Sale (Without Comanda)
  const handleDirectSale = (newSale: BarSale) => {
    // 1. Add to sales state
    setSales(prev => [newSale, ...prev]);

    // 2. Deduct product stock for all items
    const updatedProductsToSave: BarProduct[] = [];
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const totalDeducted = newSale.items
          .filter(i => i.productId === prod.id)
          .reduce((sum, i) => sum + i.quantity, 0);

        if (totalDeducted > 0) {
          const res = { ...prod, stock: Math.max(0, prod.stock - totalDeducted) };
          updatedProductsToSave.push(res);
          return res;
        }
        return prod;
      });
    });

    // 3. Log stock movement
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMovements: StockMovement[] = newSale.items.map((item, idx) => ({
      id: `mov-direct-${newSale.id}-${idx}-${Date.now()}`,
      productId: item.productId,
      productName: item.productName,
      type: 'Saída (Venda)',
      quantity: -item.quantity,
      reason: `Venda Direta #${newSale.code} (${newSale.customerName || 'Balcão'})`,
      createdAt: `${newSale.date} ${timeStr}`,
      user: currentUser ? currentUser.name : 'Operador do Bar'
    }));

    setMovements(prev => [...newMovements, ...prev]);

    // Save to Supabase if configured
    if (isSupabaseConfigured) {
      dbSaveBarSale(newSale).catch(err => console.error('Erro ao salvar venda direta no banco:', err));
      updatedProductsToSave.forEach(p => dbSaveBarProduct(p).catch(err => console.error(err)));
      newMovements.forEach(m => dbSaveStockMovement(m).catch(err => console.error(err)));
    }
  };

  // Handle Cancel Comanda
  const handleCancelComanda = (comandaId: string) => {
    const target = comandas.find(c => c.id === comandaId);
    if (!target) return;

    // Restore stock for all items
    const updatedProductsToSave: BarProduct[] = [];
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const item = target.items.find(i => i.productId === prod.id);
        if (item) {
          const res = { ...prod, stock: prod.stock + item.quantity };
          updatedProductsToSave.push(res);
          return res;
        }
        return prod;
      });
    });

    const updatedComandaToSave: BarComanda = {
      ...target,
      status: 'Cancelada' as const
    };

    setComandas(prev => prev.map(c => c.id === comandaId ? updatedComandaToSave : c));

    if (isSupabaseConfigured) {
      dbSaveBarComanda(updatedComandaToSave).catch(err => console.error(err));
      updatedProductsToSave.forEach(p => dbSaveBarProduct(p).catch(err => console.error(err)));
    }
  };

  // Handle Product Save (Add/Edit)
  const handleSaveProduct = (updatedProduct: BarProduct) => {
    setProducts(prev => {
      const exists = prev.some(p => p.id === updatedProduct.id);
      if (exists) {
        return prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      }
      return [updatedProduct, ...prev];
    });

    if (isSupabaseConfigured) {
      dbSaveBarProduct(updatedProduct).catch(err => console.error('Erro ao salvar produto no banco:', err));
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));

    if (isSupabaseConfigured) {
      dbDeleteBarProduct(productId).catch(err => console.error('Erro ao excluir produto do banco:', err));
    }
  };

  // Handle Stock Adjustment
  const handleAdjustStock = (newMovement: StockMovement) => {
    setMovements(prev => [newMovement, ...prev]);

    if (isSupabaseConfigured) {
      dbSaveStockMovement(newMovement).catch(err => console.error(err));
      const targetProduct = products.find(p => p.id === newMovement.productId);
      if (targetProduct) {
        const newStock = targetProduct.stock + newMovement.quantity;
        const updatedProd = { ...targetProduct, stock: Math.max(0, newStock) };
        setProducts(prev => prev.map(p => p.id === targetProduct.id ? updatedProd : p));
        dbSaveBarProduct(updatedProd).catch(err => console.error(err));
      }
    }
  };

  // Handle Cancel Sale
  const handleCancelSale = (saleId: string) => {
    const saleToCancel = sales.find(s => s.id === saleId);
    if (!saleToCancel || saleToCancel.status === 'Cancelada') return;

    let updatedSaleToSave: BarSale | null = null;
    // 1. Mark Sale as Cancelled
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const res = { ...s, status: 'Cancelada' as const };
        updatedSaleToSave = res;
        return res;
      }
      return s;
    }));

    // 2. Restore Stock
    const updatedProductsToSave: BarProduct[] = [];
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const item = saleToCancel.items.find(i => i.productId === prod.id);
        if (item) {
          const res = { ...prod, stock: prod.stock + item.quantity };
          updatedProductsToSave.push(res);
          return res;
        }
        return prod;
      });
    });

    // 3. Log Stock Movement
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const todayStr = saleToCancel.date;

    const cancelMovements: StockMovement[] = saleToCancel.items.map((item, idx) => ({
      id: `mov-cancel-${saleId}-${idx}`,
      productId: item.productId,
      productName: item.productName,
      type: 'Cancelamento Venda',
      quantity: item.quantity,
      reason: `Cancelamento da Venda #${saleToCancel.code}`,
      createdAt: `${todayStr} ${hours}:${minutes}`,
      user: currentUser ? currentUser.name : 'Operador do Bar'
    }));

    setMovements(prev => [...cancelMovements, ...prev]);

    if (isSupabaseConfigured) {
      if (updatedSaleToSave) dbSaveBarSale(updatedSaleToSave).catch(err => console.error(err));
      updatedProductsToSave.forEach(p => dbSaveBarProduct(p).catch(err => console.error(err)));
      cancelMovements.forEach(m => dbSaveStockMovement(m).catch(err => console.error(err)));
    }
  };

  const openComandasCount = comandas.filter(c => c.status === 'Aberta').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Modern Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100/80 text-amber-900 border border-amber-200/60 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide">
                Bar & Snack Bar Arena Fahel
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Comandas
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Abertura de comandas por cliente, consumo contínuo e fechamento de conta.
            </p>
          </div>

          {/* Module Switch Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToQuadras}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              title="Alternar para Módulo de Quadras"
            >
              <Volleyball className="h-4 w-4 text-blue-600" />
              Agendamento de Quadras
            </button>

            <button
              onClick={onSwitchModuleHub}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer border border-slate-200"
              title="Trocar Módulo / Tela Inicial"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bar Sub-Tabs Navigation */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          {[
            { id: 'comandas', label: `Comandas (${openComandasCount} abertas)`, icon: Receipt },
            { id: 'directSale', label: 'Venda Rápida (Sem Comanda)', icon: Zap },
            { id: 'products', label: 'Cadastro', icon: Package },
            { id: 'reports', label: 'Relatórios de Vendas', icon: BarChart3 },
            { id: 'movements', label: 'Histórico de Estoque', icon: History }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeBarTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveBarTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm font-black'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <IconComp className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bar Content Views */}
      <div className="transition-all">
        {activeBarTab === 'comandas' && (
          <BarComandasManager
            comandas={comandas}
            products={products}
            onOpenComanda={handleOpenComanda}
            onAddItemToComanda={handleAddItemToComanda}
            onRemoveItemFromComanda={handleRemoveItemFromComanda}
            onCloseComanda={handleCloseComanda}
            onCancelComanda={handleCancelComanda}
            onSwitchToDirectSale={() => setActiveBarTab('directSale')}
          />
        )}

        {activeBarTab === 'directSale' && (
          <BarDirectSaleManager
            products={products}
            sales={sales}
            onDirectSale={handleDirectSale}
            onCancelSale={handleCancelSale}
          />
        )}

        {activeBarTab === 'products' && (
          <BarProductsManager
            products={products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {activeBarTab === 'reports' && (
          <BarSalesReports
            sales={sales}
            products={products}
            onCancelSale={handleCancelSale}
          />
        )}

        {activeBarTab === 'movements' && (
          <BarStockMovements
            movements={movements}
          />
        )}
      </div>
    </div>
  );
}


