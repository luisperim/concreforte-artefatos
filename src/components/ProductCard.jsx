import React, { useState } from 'react';
import {
  Plus,
  Check,
  Package,
  Ruler,
  Layers,
  ShoppingCart,
} from 'lucide-react';
import { useQuoteCart } from '../contexts/QuoteCartContext';

export default function ProductCard({ product }) {
  const { addItem, items, setIsDrawerOpen } = useQuoteCart();
  const [qty, setQty] = useState(
    product.unidade === 'm²' ? 20 : product.categoria === 'Blocos e Tijolos' ? 100 : 10
  );
  const [justAdded, setJustAdded] = useState(false);

  const itemInCart = items.find((i) => i.id === product.id);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const handleAdd = () => {
    addItem(product, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const quickPresets =
    product.categoria === 'Blocos e Tijolos'
      ? [50, 100, 500, 1000]
      : product.unidade === 'm²'
      ? [10, 30, 50, 100]
      : [5, 10, 25, 50];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Product Image & Light Badges */}
      <div className="relative h-52 bg-slate-100 overflow-hidden border-b border-slate-100">
        <img
          src={product.imagem}
          alt={product.nome}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges - Claros e Limpos */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            {product.categoria}
          </span>
          {product.destaque && (
            <span className="bg-orange-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
              Mais Vendido
            </span>
          )}
        </div>

        {/* Badge Item no Orçamento */}
        {itemInCart && (
          <div className="absolute bottom-3 right-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              No orçamento: {itemInCart.quantidade} {product.unidade}
            </button>
          </div>
        )}
      </div>

      {/* Product Body - Claro e Iluminado */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Faixa de Preço Clara e Visível */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">
                Preço Direto de Fábrica
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {formatCurrency(product.preco)}
                </span>
                <span className="text-xs font-bold text-orange-600">
                  /{product.unidade}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[120px]">
                {product.estoque || 'Pronta Entrega'}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-snug">
            {product.nome}
          </h3>

          {/* Technical Spec Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-600 space-y-1">
            <div className="flex items-start gap-1.5 font-semibold text-slate-800">
              <Ruler className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
              <span>{product.especificacoes}</span>
            </div>
            {product.descricaoTecnica && (
              <p className="text-slate-600 leading-relaxed pl-5">
                {product.descricaoTecnica}
              </p>
            )}
          </div>
        </div>

        {/* Quantity Selector + Quick Presets + Add to Quote CTA */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Qtd ({product.unidade}):
            </span>
            <div className="flex items-center gap-1">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQty(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    qty === preset
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50 w-28 shrink-0">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, Number(q) - 1))}
                className="px-2.5 py-2 text-slate-700 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                aria-label="Diminuir quantidade"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-full text-center text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
                aria-label="Quantidade"
              />
              <button
                type="button"
                onClick={() => setQty((q) => Number(q) + 1)}
                className="px-2.5 py-2 text-slate-700 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                justAdded
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Adicionado! ({formatCurrency(qty * product.preco)})</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Adicionar ao Orçamento</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
