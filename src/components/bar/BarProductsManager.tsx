import React, { useState, useMemo } from 'react';
import { BarProduct, BarCategory, BarCategoryItem, StockMovement } from '../../types';
import { formatCurrency, getBrasiliaTodayDate } from '../../utils';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Boxes, 
  X, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  Image as ImageIcon,
  Tag,
  FolderPlus,
  Layers,
  Sparkles
} from 'lucide-react';

interface BarProductsManagerProps {
  products: BarProduct[];
  categories?: BarCategoryItem[];
  onSaveProduct: (product: BarProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onAdjustStock: (movement: StockMovement) => void;
  onSwitchToPurchases?: () => void;
  onSaveCategory?: (category: BarCategoryItem) => void;
  onDeleteCategory?: (categoryId: string, categoryName?: string) => void;
}

export default function BarProductsManager({
  products,
  categories = [],
  onSaveProduct,
  onDeleteProduct,
  onAdjustStock,
  onSwitchToPurchases,
  onSaveCategory,
  onDeleteCategory
}: BarProductsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [filterStockStatus, setFilterStockStatus] = useState<'Todos' | 'Baixo' | 'Esgotado'>('Todos');

  // Modal State for New/Edit Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BarProduct | null>(null);

  // Modal State for Product Deletion Confirmation
  const [productToDelete, setProductToDelete] = useState<BarProduct | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Bebidas');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState<string>('un');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Inline Quick Category Addition in Product Modal
  const [isAddingInlineCategory, setIsAddingInlineCategory] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');

  // Modal State for Category Management
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Modal State for Quick Stock Adjustment
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<BarProduct | null>(null);
  const [adjustType, setAdjustType] = useState<'Entrada' | 'Ajuste / Perda'>('Entrada');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Helper to check if category is active
  const isCategoryActive = (c: BarCategoryItem | any): boolean => {
    if (!c) return false;
    if (c.ind_cadastro_ativo !== undefined && c.ind_cadastro_ativo !== null) {
      if (typeof c.ind_cadastro_ativo === 'boolean') {
        return c.ind_cadastro_ativo === true;
      }
      const valStr = String(c.ind_cadastro_ativo).trim().toLowerCase();
      return valStr === 'true' || valStr === '1' || valStr === 't';
    }
    if (c.status_ativo !== undefined && c.status_ativo !== null) {
      if (typeof c.status_ativo === 'boolean') {
        return c.status_ativo === true;
      }
      const valStr = String(c.status_ativo).trim().toLowerCase();
      return valStr === 'true' || valStr === '1' || valStr === 't';
    }
    return true;
  };

  // Active categories from state where ind_cadastro_ativo === true
  const activeCategories = useMemo(() => {
    return (categories || []).filter(c => isCategoryActive(c));
  }, [categories]);

  // Dynamic Category List computed from active categories state (or fallback if completely uninitialized)
  const categoriesList = useMemo(() => {
    const activeFromCategories = activeCategories
      .map(c => c.name.trim())
      .filter(Boolean);

    if (activeFromCategories.length > 0) {
      return Array.from(new Set(activeFromCategories));
    }

    // Default fallback if categories state is completely empty
    return [
      'Bebidas',
      'Salgados',
      'Petiscos',
      'Espetinhos',
      'Sanduíches',
      'Picolés',
      'Açaí',
      'Doces',
      'Outros'
    ];
  }, [activeCategories]);

  // Metrics
  const totalProductsCount = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  
  const totalStockSaleValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  const totalStockCostValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const expectedProfit = totalStockSaleValue - totalStockCostValue;

  // Filtering
  const filteredProducts = products.filter(p => {
    const prodCategory = (p.category || '').toLowerCase().trim();
    const selCat = selectedCategory.toLowerCase().trim();

    let matchesCategory = selectedCategory === 'Todas';
    if (!matchesCategory) {
      if (prodCategory === selCat) {
        matchesCategory = true;
      } else if (selCat === 'salgados' && (prodCategory === 'salgado' || prodCategory === 'salgados')) {
        matchesCategory = true;
      } else if (selCat === 'picolés' && (prodCategory === 'picolé' || prodCategory === 'picole' || prodCategory === 'picolés' || prodCategory === 'picoles')) {
        matchesCategory = true;
      } else if (selCat === 'açaí' && (prodCategory === 'açaí' || prodCategory === 'acai' || prodCategory === 'açaí' || prodCategory === 'acaí')) {
        matchesCategory = true;
      } else if (selCat === 'doces' && (prodCategory === 'doce' || prodCategory === 'doces')) {
        matchesCategory = true;
      }
    }

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prodCategory.includes(searchTerm.toLowerCase());
    
    let matchesStock = true;
    if (filterStockStatus === 'Baixo') matchesStock = p.stock <= p.minStock && p.stock > 0;
    if (filterStockStatus === 'Esgotado') matchesStock = p.stock <= 0;

    return matchesCategory && matchesSearch && matchesStock;
  });

  const openNewProductModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory(categoriesList[0] || 'Bebidas');
    setPrice(0);
    setCostPrice(0);
    setStock(10);
    setMinStock(5);
    setUnit('un');
    setDescription('');
    setImageUrl('');
    setIsAddingInlineCategory(false);
    setInlineCategoryName('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: BarProduct) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category || 'Bebidas');
    setPrice(prod.price);
    setCostPrice(prod.costPrice);
    setStock(prod.stock);
    setMinStock(prod.minStock);
    setUnit(prod.unit);
    setDescription(prod.description || '');
    setImageUrl(prod.imageUrl || '');
    setIsAddingInlineCategory(false);
    setInlineCategoryName('');
    setIsProductModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Preencha o nome do produto.');
      return;
    }

    const newProd: BarProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'Outros',
      price: Math.max(0, Number(price)),
      costPrice: Math.max(0, Number(costPrice)),
      stock: Math.max(0, Number(stock)),
      minStock: Math.max(1, Number(minStock)),
      unit: unit || 'un',
      description: description.trim() || undefined,
      active: true,
      status_ativo: 1,
      imageUrl: imageUrl.trim() || undefined
    };

    onSaveProduct(newProd);
    setIsProductModalOpen(false);
  };

  // Category Handlers
  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const existingMatch = categoriesList.find(c => c.toLowerCase() === trimmed.toLowerCase());
    if (existingMatch) {
      alert(`A categoria "${existingMatch}" já existe!`);
      return;
    }

    const newCatItem: BarCategoryItem = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed,
      description: newCatDesc.trim() || undefined,
      ind_cadastro_ativo: 1,
      status_ativo: 1,
      createdAt: new Date().toISOString()
    };

    if (onSaveCategory) {
      onSaveCategory(newCatItem);
    }
    setNewCatName('');
    setNewCatDesc('');
  };

  const handleSaveInlineCategory = () => {
    const trimmed = inlineCategoryName.trim();
    if (!trimmed) return;

    const existingMatch = categoriesList.find(c => c.toLowerCase() === trimmed.toLowerCase());
    if (existingMatch) {
      setCategory(existingMatch);
      setIsAddingInlineCategory(false);
      setInlineCategoryName('');
      return;
    }

    const newCatItem: BarCategoryItem = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed,
      ind_cadastro_ativo: 1,
      status_ativo: 1,
      createdAt: new Date().toISOString()
    };

    if (onSaveCategory) {
      onSaveCategory(newCatItem);
    }
    setCategory(trimmed);
    setInlineCategoryName('');
    setIsAddingInlineCategory(false);
  };

  const handleDeleteCategoryConfirmed = (catName: string) => {
    const existing = (categories || []).find(c => c.name.toLowerCase() === catName.toLowerCase());
    const catId = existing ? existing.id : `cat-del-${Date.now()}`;
    if (onDeleteCategory) {
      onDeleteCategory(catId, catName);
    }
    setCategoryToDelete(null);
  };

  const openStockModal = (prod: BarProduct) => {
    setStockAdjustmentProduct(prod);
    setAdjustType('Entrada');
    setAdjustQty(10);
    setAdjustReason('Compra com fornecedor / Reposição');
    setIsStockModalOpen(true);
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustmentProduct) return;
    if (adjustQty <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    const qtyNumber = adjustType === 'Entrada' ? adjustQty : -adjustQty;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: stockAdjustmentProduct.id,
      productName: stockAdjustmentProduct.name,
      type: adjustType === 'Entrada' ? 'Entrada' : 'Ajuste / Perda',
      quantity: qtyNumber,
      reason: adjustReason.trim() || (adjustType === 'Entrada' ? 'Reposição Manual' : 'Avaria / Perda'),
      createdAt: `${getBrasiliaTodayDate()} ${timeStr}`,
      user: 'Operador do Bar'
    };

    onAdjustStock(newMovement);
    setIsStockModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Produtos</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalProductsCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{categoriesList.length} categorias disponíveis</p>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estoque Crítico</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
              {lowStockCount + outOfStockCount}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Abaixo do estoque mínimo</p>
          </div>
          <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor do Estoque</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(totalStockSaleValue)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Custo total: {formatCurrency(totalStockCostValue)}</p>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Boxes className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lucro Previsto</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(expectedProfit)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Margem potencial de venda</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Action Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1 md:flex-initial">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar produto por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Todas">Todas as Categorias ({categoriesList.length})</option>
            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Todos">Todos os Níveis de Estoque</option>
            <option value="Baixo">⚠️ Estoque Baixo</option>
            <option value="Esgotado">⛔ Esgotados</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button to Manage Categories */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition border border-slate-200 shadow-2xs cursor-pointer"
            title="Cadastrar e gerenciar categorias de produtos"
          >
            <Tag className="h-4 w-4 text-amber-600" />
            Categorias ({categoriesList.length})
          </button>

          {onSwitchToPurchases && (
            <button
              onClick={onSwitchToPurchases}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Registrar Nota de Compra com Custo Médio"
            >
              <TrendingUp className="h-4 w-4" />
              Lançar Compras
            </button>
          )}

          <button
            onClick={openNewProductModal}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Novo Produto
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Preço Venda</th>
                <th className="py-3 px-3">Preço Custo (CMP)</th>
                <th className="py-3 px-3">Margem (%)</th>
                <th className="py-3 px-3">Estoque</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredProducts.map((prod) => {
                const margin = prod.price > 0 && prod.costPrice > 0 
                  ? (((prod.price - prod.costPrice) / prod.price) * 100).toFixed(0)
                  : '0';

                const isLowStock = prod.stock <= prod.minStock && prod.stock > 0;
                const isOutOfStock = prod.stock <= 0;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          <img 
                            src={prod.imageUrl} 
                            alt={prod.name} 
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-100">
                            {prod.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs leading-snug">{prod.name}</p>
                          {prod.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px]">{prod.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {formatCurrency(prod.price)}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {prod.costPrice > 0 ? formatCurrency(prod.costPrice) : <span className="text-slate-400">-</span>}
                    </td>

                    <td className="py-3 px-3">
                      {prod.price > 0 && prod.costPrice > 0 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          Number(margin) >= 40 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : Number(margin) >= 20 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {margin}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-xs ${
                          isOutOfStock 
                            ? 'text-red-600' 
                            : isLowStock 
                            ? 'text-amber-600' 
                            : 'text-slate-900'
                        }`}>
                          {prod.stock} {prod.unit}
                        </span>

                        {isOutOfStock && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold uppercase">
                            Esgotado
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase">
                            Baixo
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">Mín: {prod.minStock} {prod.unit}</p>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openStockModal(prod)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Ajustar Estoque Rápido"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => openEditProductModal(prod)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar Produto"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setProductToDelete(prod)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Excluir Produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum produto cadastrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Categorias de Produtos</h3>
                  <p className="text-xs text-slate-500">Cadastre e organize as categorias do bar</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateCategory} className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <FolderPlus className="h-4 w-4 text-amber-600" />
                Cadastrar Nova Categoria
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Nome da categoria (ex: Sucos Naturais, Energéticos, Sobremesas...)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Descrição breve ou observação (opcional)"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Salvar Categoria
                </button>
              </div>
            </form>

            {/* Categories List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>Categorias Cadastradas ({categoriesList.length})</span>
                <span className="text-slate-400 font-normal">Produtos vinculados</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-[280px] overflow-y-auto">
                {categoriesList.map((catName) => {
                  const productCount = products.filter(p => (p.category || '').toLowerCase() === catName.toLowerCase()).length;

                  return (
                    <div key={catName} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                        <span className="font-extrabold text-xs text-slate-800">{catName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          productCount > 0 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {productCount} {productCount === 1 ? 'produto' : 'produtos'}
                        </span>

                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(catName)}
                          className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition cursor-pointer shadow-2xs"
                          title="Excluir categoria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Deletion Confirmation */}
            {categoryToDelete && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  Deseja excluir a categoria "{categoryToDelete}"?
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Os produtos associados a ela permanecerão cadastrados, mas a categoria não será mais sugerida no cardápio.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategoryConfirmed(categoryToDelete)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Confirmar Exclusão
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" />
                {editingProduct ? 'Editar Produto' : 'Novo Produto do Bar'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cerveja Heineken 330ml, Espetinho de Carne..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Category & Unit selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Categoria *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingInlineCategory(!isAddingInlineCategory)}
                        className="text-[11px] font-extrabold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        Nova
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                        title="Gerenciar e excluir categorias"
                      >
                        <Tag className="h-3 w-3" />
                        Gerenciar / Excluir
                      </button>
                    </div>
                  </div>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unidade *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="porção">Porção</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="lata">Lata</option>
                    <option value="garrafa">Garrafa</option>
                    <option value="copo">Copo</option>
                    <option value="tigela">Tigela</option>
                  </select>
                </div>
              </div>

              {/* Inline Quick Category Add Form */}
              {isAddingInlineCategory && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-amber-600" />
                      Cadastrar Categoria Rápida
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingInlineCategory(false)}
                      className="text-amber-700 hover:text-amber-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome da categoria..."
                      value={inlineCategoryName}
                      onChange={(e) => setInlineCategoryName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveInlineCategory}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={price === 0 && !editingProduct ? '' : price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={costPrice === 0 && !editingProduct ? '' : costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Estoque Inicial ({unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  URL da Imagem do Produto (Opcional)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto-do-produto.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt="Prévia" 
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0" 
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição / Detalhes (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Porção de 400g com mandioca e vinagrete..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition shadow-sm cursor-pointer"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Product */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Excluir Produto
              </h3>
              <button 
                onClick={() => setProductToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir o produto <strong className="text-slate-900 font-bold">{productToDelete.name}</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 font-medium">
                ⚠️ O sistema inativará o produto do cardápio preservando todo o histórico de vendas.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {isStockModalOpen && stockAdjustmentProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-500" />
                Ajustar Estoque
              </h3>
              <button 
                onClick={() => setIsStockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 font-semibold space-y-1">
              <p className="font-extrabold text-sm">{stockAdjustmentProduct.name}</p>
              <p>Estoque Atual: <strong className="text-amber-950">{stockAdjustmentProduct.stock} {stockAdjustmentProduct.unit}</strong></p>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('Entrada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      adjustType === 'Entrada'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    Entrada (Reposição)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('Ajuste / Perda')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      adjustType === 'Ajuste / Perda'
                        ? 'bg-red-50 border-red-500 text-red-800 ring-1 ring-red-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                    Saída (Avaria / Perda)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Quantidade ({stockAdjustmentProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo / Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de lote, produto quebrado, consumo..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold cursor-pointer transition shadow-sm"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
