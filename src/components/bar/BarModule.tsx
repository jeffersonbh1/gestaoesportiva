import React, { useState, useEffect } from 'react';
import { BarComanda, BarComandaItem, BarProduct, BarCategoryItem, BarSale, BarPurchase, PaymentMethod, StockMovement, User } from '../../types';
import { INITIAL_BAR_PRODUCTS, INITIAL_BAR_CATEGORIES, getInitialBarSales, getInitialComandas, getInitialStockMovements } from '../../data/mockBarData';
import { 
  isSupabaseConfigured,
  dbGetBarProducts,
  dbSaveBarProduct,
  dbDeleteBarProduct,
  dbGetBarCategories,
  dbSaveBarCategory,
  dbDeleteBarCategory,
  dbGetBarComandas,
  dbSaveBarComanda,
  dbGetBarSales,
  dbSaveBarSale,
  dbGetStockMovements,
  dbSaveStockMovement,
  dbGetBarPurchases,
  dbSaveBarPurchase,
  dbDeleteBarPurchase
} from '../../lib/supabase';
import BarComandasManager from './BarComandasManager';
import BarDirectSaleManager from './BarDirectSaleManager';
import BarProductsManager from './BarProductsManager';
import BarPurchasesManager from './BarPurchasesManager';
import BarSalesReports from './BarSalesReports';
import BarStockMovements from './BarStockMovements';
import { 
  Receipt,
  Zap,
  Package, 
  BarChart3, 
  History, 
  Volleyball, 
  ArrowLeftRight,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Sparkles,
  Layers
} from 'lucide-react';

interface BarModuleProps {
  currentUser: User | null;
  onSwitchToQuadras: () => void;
  onSwitchModuleHub: () => void;
  onSwitchToJogador?: () => void;
  onLogout?: () => void;
}

export default function BarModule({
  currentUser,
  onSwitchToQuadras,
  onSwitchModuleHub,
  onSwitchToJogador,
  onLogout
}: BarModuleProps) {
  const [activeBarTab, setActiveBarTab] = useState<'comandas' | 'directSale' | 'products' | 'purchases' | 'reports' | 'movements'>('comandas');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State in memory - Database as single source of truth
  const [comandas, setComandas] = useState<BarComanda[]>(() => isSupabaseConfigured ? [] : getInitialComandas());
  const [products, setProducts] = useState<BarProduct[]>(INITIAL_BAR_PRODUCTS);
  const [categories, setCategories] = useState<BarCategoryItem[]>(INITIAL_BAR_CATEGORIES);
  const [sales, setSales] = useState<BarSale[]>(() => isSupabaseConfigured ? [] : getInitialBarSales());
  const [purchases, setPurchases] = useState<BarPurchase[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>(() => isSupabaseConfigured ? [] : getInitialStockMovements());

  // Clear any existing localStorage cache to adhere to "no local storage" policy
  useEffect(() => {
    try {
      localStorage.removeItem('arena_bar_comandas');
      localStorage.removeItem('arena_bar_products');
      localStorage.removeItem('arena_bar_sales');
      localStorage.removeItem('arena_bar_stock_movements');
      localStorage.removeItem('arena_bar_purchases');
      localStorage.removeItem('arena_bar_categories');
    } catch (e) {
      // Ignore if localStorage is restricted
    }
  }, []);

  // Load from Supabase Database on mount if configured
  useEffect(() => {
    async function loadBarDataFromDb() {
      if (!isSupabaseConfigured) return;
      try {
        const [dbProds, dbCats, dbCmds, dbSls, dbMovs, dbPchs] = await Promise.all([
          dbGetBarProducts(),
          dbGetBarCategories(),
          dbGetBarComandas(),
          dbGetBarSales(),
          dbGetStockMovements(),
          dbGetBarPurchases()
        ]);
        if (dbProds && dbProds.length > 0) setProducts(dbProds);
        if (dbCats && dbCats.length > 0) setCategories(dbCats);
        setComandas(dbCmds || []);
        setSales(dbSls || []);
        setMovements(dbMovs || []);
        setPurchases(dbPchs || []);
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

  // Handle Add Items to Existing Comanda (agrupando por produto no extrato)
  const handleAddItemToComanda = (comandaId: string, itemsToAdd: BarComandaItem[]) => {
    const targetComanda = comandas.find(c => c.id === comandaId);
    if (!targetComanda) return;

    // Agrupa e consolida os itens por produto na comanda
    const updatedItems = [...targetComanda.items];

    for (const newItem of itemsToAdd) {
      const existingIndex = updatedItems.findIndex(i =>
        (i.productId && newItem.productId && i.productId === newItem.productId) ||
        (i.productName.trim().toLowerCase() === newItem.productName.trim().toLowerCase() && i.unitPrice === newItem.unitPrice)
      );

      if (existingIndex >= 0) {
        const existing = updatedItems[existingIndex];
        const combinedQty = existing.quantity + newItem.quantity;
        const combinedTotal = combinedQty * existing.unitPrice;
        updatedItems[existingIndex] = {
          ...existing,
          quantity: combinedQty,
          totalPrice: combinedTotal,
          addedAt: existing.addedAt ? `${existing.addedAt}` : newItem.addedAt
        };
      } else {
        updatedItems.push(newItem);
      }
    }

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

  // Handle Remove Item from Open Comanda (suporta estorno de 1 unidade ou exclusão total)
  const handleRemoveItemFromComanda = (comandaId: string, itemId: string, quantityToRemove?: number) => {
    const targetComanda = comandas.find(c => c.id === comandaId);
    if (!targetComanda) return;

    const itemToRemove = targetComanda.items.find(i => i.id === itemId);
    if (!itemToRemove) return;

    const qtyToDeduct = (quantityToRemove && quantityToRemove > 0 && quantityToRemove < itemToRemove.quantity)
      ? quantityToRemove
      : itemToRemove.quantity;

    let updatedItems: BarComandaItem[];
    if (qtyToDeduct < itemToRemove.quantity) {
      const remainingQty = itemToRemove.quantity - qtyToDeduct;
      updatedItems = targetComanda.items.map(i => {
        if (i.id === itemId) {
          return {
            ...i,
            quantity: remainingQty,
            totalPrice: remainingQty * i.unitPrice
          };
        }
        return i;
      });
    } else {
      updatedItems = targetComanda.items.filter(i => i.id !== itemId);
    }

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
          const res = { ...prod, stock: prod.stock + qtyToDeduct };
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
      quantity: qtyToDeduct,
      reason: `Estorno ${qtyToDeduct}x ${itemToRemove.productName} Comanda ${targetComanda.code} (${targetComanda.customerName})`,
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

  // Handle Save / Update Category
  const handleSaveCategory = async (categoryToSave: BarCategoryItem) => {
    const formattedCat: BarCategoryItem = {
      ...categoryToSave,
      status_ativo: 1
    };

    setCategories(prev => {
      const exists = prev.some(c => c.id === formattedCat.id || c.name.trim().toLowerCase() === formattedCat.name.trim().toLowerCase());
      if (exists) {
        return prev.map(c => 
          (c.id === formattedCat.id || c.name.trim().toLowerCase() === formattedCat.name.trim().toLowerCase()) 
            ? { ...c, ...formattedCat, status_ativo: 1 } 
            : c
        );
      }
      return [...prev, formattedCat];
    });

    if (isSupabaseConfigured) {
      try {
        const saved = await dbSaveBarCategory(formattedCat);
        if (saved) {
          setCategories(prev => prev.map(c => 
            (c.id === formattedCat.id || c.name.trim().toLowerCase() === formattedCat.name.trim().toLowerCase()) 
              ? saved 
              : c
          ));
        }
      } catch (err) {
        console.error('Erro ao salvar categoria no banco:', err);
      }
    }
  };

  // Handle Delete / Inactivate Category
  const handleDeleteCategory = async (categoryId: string, categoryName?: string) => {
    const targetCat = categories.find(c => c.id === categoryId || (categoryName && c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()));
    const targetName = targetCat ? targetCat.name.trim() : (categoryName ? categoryName.trim() : '');

    // 1. Remove/Inactivate from categories state
    setCategories(prev => prev.filter(c => 
      c.id !== categoryId && (!targetName || c.name.trim().toLowerCase() !== targetName.toLowerCase())
    ));

    // 2. If products were assigned to this deleted category, reassign them to 'Outros'
    if (targetName) {
      setProducts(prev => {
        const prodsToUpdate: BarProduct[] = [];
        const nextList = prev.map(p => {
          if (p.category && p.category.trim().toLowerCase() === targetName.toLowerCase()) {
            const updated = { ...p, category: 'Outros' };
            prodsToUpdate.push(updated);
            return updated;
          }
          return p;
        });

        if (isSupabaseConfigured && prodsToUpdate.length > 0) {
          prodsToUpdate.forEach(p => {
            dbSaveBarProduct(p).catch(err => console.error('Erro ao reclassificar produto após exclusão de categoria:', err));
          });
        }

        return nextList;
      });
    }

    // 3. Persist category deletion to Supabase
    if (isSupabaseConfigured) {
      try {
        await dbDeleteBarCategory(categoryId, targetName);
      } catch (err) {
        console.error('Erro ao excluir categoria do banco:', err);
      }
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

  // Handle Save Purchase (Entrada de Mercadoria com Custo Médio Ponderado)
  const handleSavePurchase = async (purchase: BarPurchase) => {
    setPurchases(prev => [purchase, ...prev]);

    // Recalcular estoque e custo médio ponderado em memória
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const item = purchase.items.find(i => i.productId === prod.id);
        if (item) {
          const currentStock = Math.max(0, prod.stock);
          const currentCost = Math.max(0, prod.costPrice);
          const buyQty = item.quantity;
          const buyCost = item.costPrice;

          let newAvg = buyCost;
          if (currentStock > 0 && currentCost > 0) {
            newAvg = ((currentStock * currentCost) + (buyQty * buyCost)) / (currentStock + buyQty);
          }
          newAvg = Math.round(newAvg * 100) / 100;

          return {
            ...prod,
            stock: currentStock + buyQty,
            costPrice: newAvg,
            lastPurchasePrice: buyCost,
            totalPurchasedQty: (prod.totalPurchasedQty || 0) + buyQty
          };
        }
        return prod;
      });
    });

    // Registrar movimentações em memória
    const newMovements: StockMovement[] = purchase.items.map((item, idx) => ({
      id: `mov-comp-${purchase.id}-${item.productId}-${idx}`,
      productId: item.productId,
      productName: item.productName,
      type: 'Entrada (Compra)',
      quantity: item.quantity,
      unitCost: item.costPrice,
      totalCost: item.totalCost,
      purchaseId: purchase.id,
      reason: `Compra ${purchase.code} - Fornecedor: ${purchase.supplier || 'Geral'}`,
      createdAt: `${purchase.purchaseDate} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      user: currentUser ? currentUser.name : 'Administrador'
    }));
    setMovements(prev => [...newMovements, ...prev]);

    // Persistir no banco de dados Supabase
    if (isSupabaseConfigured) {
      try {
        const result = await dbSaveBarPurchase(purchase);
        if (result && result.updatedProducts && result.updatedProducts.length > 0) {
          setProducts(prev => {
            const map = new Map(result.updatedProducts.map(p => [p.id, p]));
            return prev.map(p => map.get(p.id) || p);
          });
        }
        // Recarregar histórico de estoque atualizado
        const freshMovements = await dbGetStockMovements();
        if (freshMovements && freshMovements.length > 0) {
          setMovements(freshMovements);
        }
      } catch (err) {
        console.error('Erro ao salvar compra no Supabase:', err);
      }
    }
  };

  // Handle Delete Purchase
  const handleDeletePurchase = async (purchaseId: string) => {
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    if (isSupabaseConfigured) {
      await dbDeleteBarPurchase(purchaseId);
    }
  };

  const openComandasCount = comandas.filter(c => c.status === 'Aberta').length;
  const openComandasTotal = comandas
    .filter(c => c.status === 'Aberta')
    .reduce((acc, c) => acc + (c.finalAmount || c.totalAmount || 0), 0);

  const navItems = [
    { 
      id: 'comandas' as const, 
      label: 'Comandas & Mesas', 
      icon: Receipt,
      badge: openComandasCount > 0 ? `${openComandasCount} abertas` : '0',
      badgeColor: openComandasCount > 0 ? 'bg-amber-100 text-amber-800 font-black' : 'bg-slate-100 text-slate-500',
      description: 'Gestão de comandas, consumo e fechamento'
    },
    { 
      id: 'directSale' as const, 
      label: 'Venda Rápida (PDV)', 
      icon: Zap,
      badge: 'Balcão',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
      description: 'Venda direta sem abertura de comanda'
    },
    { 
      id: 'products' as const, 
      label: 'Produtos & Cardápio', 
      icon: Package,
      badge: `${products.length}`,
      badgeColor: 'bg-slate-100 text-slate-700 font-semibold',
      description: 'Cadastro de itens, preços e categorias'
    },
    { 
      id: 'purchases' as const, 
      label: 'Compras & Entradas', 
      icon: ShoppingCart,
      badge: `${purchases.length}`,
      badgeColor: 'bg-slate-100 text-slate-700 font-semibold',
      description: 'Entrada de mercadorias e reposição de estoque'
    },
    { 
      id: 'reports' as const, 
      label: 'Relatórios de Vendas', 
      icon: BarChart3,
      badge: `${sales.length}`,
      badgeColor: 'bg-blue-100 text-blue-800 font-semibold',
      description: 'Fechamento de caixa, formas de pagamento e métricas'
    },
    { 
      id: 'movements' as const, 
      label: 'Histórico de Estoque', 
      icon: History,
      badge: `${movements.length}`,
      badgeColor: 'bg-slate-100 text-slate-700 font-semibold',
      description: 'Auditoria de entradas, saídas e ajustes manuais'
    }
  ];

  const currentTabMeta = navItems.find(t => t.id === activeBarTab) || navItems[0];

  return (
    <div id="bar-module-root" className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white text-slate-800 shrink-0 md:sticky md:top-0 md:h-screen flex flex-col justify-between border-r border-slate-200 z-30 overflow-y-auto">
        <div>
          {/* Brand/Logo Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-800 leading-tight">
                  Arena Fahel Beach
                </h1>
                <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">
                  Bar & Vendas PDV
                </p>
              </div>
            </div>
            
            {/* Mobile menu switch */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-slate-50 rounded-lg md:hidden text-slate-400 cursor-pointer"
              title={mobileMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Module Switch Quick Banners */}
          <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-1.5">
            <button
              onClick={onSwitchToQuadras}
              className="w-full flex items-center justify-between px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-2xs cursor-pointer"
              title="Ir para o Módulo de Quadras & Agenda"
            >
              <div className="flex items-center gap-2">
                <Volleyball className="h-4 w-4" />
                <span>Quadras & Agenda</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-80" />
            </button>

            {onSwitchToJogador && (
              <button
                onClick={onSwitchToJogador}
                className="w-full flex items-center justify-between px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-2xs cursor-pointer"
                title="Ir para o Módulo do Jogador & Sorteios"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Módulo do Jogador</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-80" />
              </button>
            )}

            <button
              onClick={onSwitchModuleHub}
              className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-800 py-1 transition flex items-center justify-center gap-1 cursor-pointer"
              title="Voltar à Central de Módulos"
            >
              <ArrowLeftRight className="h-3 w-3" />
              Central de Módulos
            </button>
          </div>

          {/* Contextual Bar Fast Indicators */}
          <div className={`p-4 border-b border-slate-100 md:block ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5 text-amber-600" />
                  Comandas Abertas:
                </span>
                <span className="font-black text-amber-950 font-mono bg-amber-200/60 px-1.5 py-0.5 rounded-md text-[10px]">
                  {openComandasCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/50">
                <span className="text-amber-800/80 font-medium text-[10px]">Total em Consumo:</span>
                <span className="font-extrabold text-amber-950 font-mono text-xs">
                  {openComandasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className={`p-4 space-y-1 md:block ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <div className="px-2 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Navegação do Bar
            </div>

            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeBarTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-bar-${item.id}`}
                  onClick={() => { 
                    setActiveBarTab(item.id); 
                    setMobileMenuOpen(false); 
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive 
                      ? 'bg-amber-50 text-amber-800 font-extrabold shadow-2xs border border-amber-200/80' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Section */}
        <div className={`p-4 border-t border-slate-100 bg-slate-50/50 md:block ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'B'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser ? currentUser.name : 'Operador do Bar'}
                </p>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded inline-block">
                  {currentUser ? currentUser.role : 'Bar & Caixa'}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                title="Sair da Conta"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto w-full space-y-6">
        
        {/* Dynamic Context Header */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100/80 text-amber-900 border border-amber-200/60 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                Bar & Vendas PDV
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-500">
                {currentTabMeta.label}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <currentTabMeta.icon className="h-5 w-5 text-amber-600" />
              {currentTabMeta.label}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {currentTabMeta.description}
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            {activeBarTab !== 'comandas' && (
              <button
                onClick={() => setActiveBarTab('comandas')}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Ir para Comandas"
              >
                <Receipt className="h-4 w-4 text-amber-600" />
                <span>Comandas ({openComandasCount})</span>
              </button>
            )}

            {activeBarTab !== 'directSale' && (
              <button
                onClick={() => setActiveBarTab('directSale')}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Ir para Venda Rápida PDV"
              >
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>Venda Rápida</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab View Container */}
        <div className="transition-all">
          {activeBarTab === 'comandas' && (
            <BarComandasManager
              comandas={comandas}
              products={products}
              categories={categories}
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
              categories={categories}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
              onSwitchToPurchases={() => setActiveBarTab('purchases')}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeBarTab === 'purchases' && (
            <BarPurchasesManager
              products={products}
              purchases={purchases}
              onSavePurchase={handleSavePurchase}
              onDeletePurchase={handleDeletePurchase}
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
      </main>
    </div>
  );
}


