import React, { useState } from 'react';
import { BarProduct, BarCategory, StockMovement } from '../../types';
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
  Image as ImageIcon
} from 'lucide-react';

interface BarProductsManagerProps {
  products: BarProduct[];
  onSaveProduct: (product: BarProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onAdjustStock: (movement: StockMovement) => void;
}

export default function BarProductsManager({
  products,
  onSaveProduct,
  onDeleteProduct,
  onAdjustStock
}: BarProductsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [filterStockStatus, setFilterStockStatus] = useState<'Todos' | 'Baixo' | 'Esgotado'>('Todos');

  // Modal State for New/Edit Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BarProduct | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BarCategory>('Bebidas');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState<string>('un');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Modal State for Quick Stock Adjustment
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<BarProduct | null>(null);
  const [adjustType, setAdjustType] = useState<'Entrada' | 'Ajuste / Perda'>('Entrada');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const categories: BarCategory[] = ['Bebidas', 'Petiscos', 'Espetinhos', 'Sanduíches', 'Outros'];

  // Metrics
  const totalProductsCount = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  
  const totalStockSaleValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  const totalStockCostValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const expectedProfit = totalStockSaleValue - totalStockCostValue;

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStock = true;
    if (filterStockStatus === 'Baixo') matchesStock = p.stock <= p.minStock && p.stock > 0;
    if (filterStockStatus === 'Esgotado') matchesStock = p.stock <= 0;

    return matchesCategory && matchesSearch && matchesStock;
  });

  const openNewProductModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Bebidas');
    setPrice(0);
    setCostPrice(0);
    setStock(10);
    setMinStock(5);
    setUnit('un');
    setDescription('');
    setImageUrl('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: BarProduct) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category as BarCategory);
    setPrice(prod.price);
    setCostPrice(prod.costPrice);
    setStock(prod.stock);
    setMinStock(prod.minStock);
    setUnit(prod.unit);
    setDescription(prod.description || '');
    setImageUrl(prod.imageUrl || '');
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
      category: category,
      price: Math.max(0, Number(price)),
      costPrice: Math.max(0, Number(costPrice)),
      stock: Math.max(0, Number(stock)),
      minStock: Math.max(1, Number(minStock)),
      unit: unit || 'un',
      description: description.trim() || undefined,
      active: true,
      imageUrl: imageUrl.trim() || undefined
    };

    onSaveProduct(newProd);
    setIsProductModalOpen(false);
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
    if (!stockAdjustmentProduct || adjustQty <= 0) return;

    const todayStr = getBrasiliaTodayDate();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Create Stock Movement Log
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: stockAdjustmentProduct.id,
      productName: stockAdjustmentProduct.name,
      type: adjustType,
      quantity: adjustType === 'Entrada' ? adjustQty : -adjustQty,
      reason: adjustReason.trim() || (adjustType === 'Entrada' ? 'Reposição de Estoque' : 'Perda / Avaria'),
      createdAt: `${todayStr} ${hours}:${minutes}`,
      user: 'Operador de Bar'
    };

    // Update Product Stock
    const updatedStock = adjustType === 'Entrada' 
      ? stockAdjustmentProduct.stock + adjustQty
      : Math.max(0, stockAdjustmentProduct.stock - adjustQty);

    onSaveProduct({
      ...stockAdjustmentProduct,
      stock: updatedStock
    });

    onAdjustStock(movement);
    setIsStockModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Produtos</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalProductsCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ativos no cardápio</p>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas de Estoque</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-amber-600">{lowStockCount}</h3>
              {outOfStockCount > 0 && (
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                  {outOfStockCount} Esgotados
                </span>
              )}
            </div>
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

      {/* Toolbar: Search, Filters & Add Product */}
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
            <option value="Todas">Todas as Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
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

        <button
          onClick={openNewProductModal}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Cadastrar Novo Produto
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Preço de Venda</th>
                <th className="py-3 px-4">Custo</th>
                <th className="py-3 px-4">Estoque Atual</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          <img 
                            src={prod.imageUrl} 
                            alt={prod.name} 
                            className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0" 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{prod.name}</p>
                          {prod.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">{prod.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatCurrency(prod.price)}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-500">
                      {formatCurrency(prod.costPrice)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold px-2.5 py-1 rounded-lg text-xs ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : isLowStock 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {prod.stock} {prod.unit}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-bold text-amber-600" title={`Mínimo: ${prod.minStock}`}>
                            (Mín: {prod.minStock})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openStockModal(prod)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Entrada / Saída de Estoque"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                          Estoque
                        </button>

                        <button
                          onClick={() => openEditProductModal(prod)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar Produto"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover "${prod.name}" do cardápio?`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
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
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum produto cadastrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BarCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Estoque Inicial / Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                  URL da Imagem (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição do Item
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes ou ingredientes do produto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
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
