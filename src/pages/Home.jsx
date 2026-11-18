import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Truck,
  Factory,
  Clock,
  MapPin,
  Search,
  ShoppingCart,
  Calculator,
  PhoneCall,
  Award,
  CheckCircle2,
  ArrowRight,
  Layers,
  MessageCircle,
} from 'lucide-react';
import {
  subscribeProducts,
  PRODUCT_CATEGORIES,
  getOfficialWhatsAppUrl,
} from '../services/firebase';
import ProductCard from '../components/ProductCard';
import { useQuoteCart } from '../contexts/QuoteCartContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalc, setShowCalc] = useState(false);

  // Calculadora rápida de obra (Muro / Calçada)
  const [calcComp, setCalcComp] = useState(10);
  const [calcAlt, setCalcAlt] = useState(2);

  const { totalItemsCount, totalValue, setIsDrawerOpen } = useQuoteCart();

  useEffect(() => {
    const unsub = subscribeProducts((items) => {
      setProducts(items);
    });
    return () => unsub && unsub();
  }, []);

  const activeProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.ativo === false) return false;
      const matchesCategory =
        selectedCategory === 'Todos' || p.categoria === selectedCategory;
      const matchesSearch =
        !searchTerm.trim() ||
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.especificacoes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const categoryCounts = useMemo(() => {
    const counts = { Todos: products.filter((p) => p.ativo !== false).length };
    PRODUCT_CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = products.filter(
        (p) => p.ativo !== false && p.categoria === cat
      ).length;
    });
    return counts;
  }, [products]);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const areaCalculada = Math.max(0, Number(calcComp) * Number(calcAlt));
  const blocosEstimados = Math.ceil(areaCalculada * 12.5 * 1.05); // +5% perda
  const paversEstimados = Math.ceil(areaCalculada * 50 * 1.05);
  const mouraoEstimado = Math.ceil(Number(calcComp) / 2.5) + 1;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 overflow-x-hidden">
      {/* HERO SECTION - 100% Responsivo Mobile & Desktop */}
      <section
        id="inicio"
        className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 overflow-hidden border-b border-slate-200"
      >
        {/* Textura arquitetônica suave com overlay branco translúcido */}
        <div
          className="absolute inset-0 opacity-[0.06] bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-white/75 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wide">
                <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 shrink-0" />
                <span>ConcreForte • Quedas do Iguaçu - PR e Região</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight leading-[1.15]">
                Artefatos de Cimento de{' '}
                <span className="text-orange-600">Alta Resistência</span> Direto da
                Fábrica para Sua Obra.
              </h1>

              <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Blocos estruturais, pavers intertravados, manilhas, mourões rurais e
                lajes sob medida com qualidade garantida.{' '}
                <strong className="text-slate-800">
                  Atendemos Quedas do Iguaçu e toda a região
                </strong>{' '}
                com entrega ágil, caminhão munck e atendimento próximo.
              </p>

              {/* CTA Buttons - Empilhados 100% no Mobile, Lado a Lado no Desktop */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-1">
                <a
                  href="#catalogo"
                  className="w-full sm:w-auto justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-3.5 rounded-xl text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all"
                >
                  <span>Ver Catálogo com Preços</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </a>

                <a
                  href={getOfficialWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3.5 rounded-xl text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Chamar no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-full sm:w-auto justify-center bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold px-5 py-3.5 rounded-xl text-sm sm:text-base flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                  <span>
                    Montar Orçamento
                    {totalItemsCount > 0 ? ` (${totalItemsCount})` : ''}
                  </span>
                </button>
              </div>

              {/* Trust Highlights - Adaptado para Telas Pequenas e Grandes */}
              <div className="pt-4 grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-200 max-w-xl">
                <div>
                  <span className="text-base sm:text-2xl lg:text-3xl font-extrabold text-slate-800 block leading-tight">
                    35–50 <span className="text-orange-600 text-xs sm:text-lg">MPa</span>
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-600 block mt-0.5">
                    Pavers Alta Carga
                  </span>
                </div>
                <div>
                  <span className="text-base sm:text-2xl lg:text-3xl font-extrabold text-slate-800 block leading-tight">
                    Entrega <span className="text-orange-600 text-xs sm:text-lg">PR</span>
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-600 block mt-0.5">
                    Caminhão Munck
                  </span>
                </div>
                <div>
                  <span className="text-base sm:text-2xl lg:text-3xl font-extrabold text-slate-800 block leading-tight">
                    Na Hora
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-600 block mt-0.5">
                    Preços no Site
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Feature Card / Orçamento Rápido */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 sm:pb-4 gap-3">
                  <div>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange-600">
                      ConcreForte — Artefatos de Cimento
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">
                      Orçamento Rápido em 3 Passos
                    </h2>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-800 block">
                        Escolha os Artefatos com Preço Visível
                      </strong>
                      <span className="text-xs text-slate-600">
                        Consulte valores unitários, por m² ou milheiro diretamente
                        no catálogo abaixo.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-800 block">
                        Informe o Local em Quedas do Iguaçu ou Região
                      </strong>
                      <span className="text-xs text-slate-600">
                        Calculamos a entrega ideal em caminhão munck paletizado ou
                        basculante para sua obra urbana ou rural.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-800 block">
                        Atendimento Direto pelo Site ou WhatsApp
                      </strong>
                      <span className="text-xs text-slate-600">
                        Gere seu protocolo no site ou fale direto com nossa equipe no
                        (46) 99911-5137.
                      </span>
                    </div>
                  </li>
                </ul>

                <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Venda Direta de Fábrica
                    </span>
                    <span className="text-slate-600 block mt-0.5">
                      Condições especiais para obras, pedreiros e produtores rurais.
                    </span>
                  </div>
                  <a
                    href="#catalogo"
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg text-center shrink-0 transition-colors"
                  >
                    Cotar Agora
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <section
        id="catalogo"
        className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full bg-white"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600 block">
              ConcreForte • Tabela Direto da Fábrica
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 mt-1">
              Catálogo de Artefatos & Preços
            </h2>
            <p className="text-xs sm:text-base text-slate-600 mt-1">
              Selecione a categoria, ajuste a quantidade e adicione ao seu
              orçamento.
            </p>
          </div>

          {/* Botão Calculadora de Rendimento */}
          <button
            type="button"
            onClick={() => setShowCalc((prev) => !prev)}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              {showCalc
                ? 'Ocultar Calculadora de Rendimento'
                : 'Calculadora de Muro / Paver (m²)'}
            </span>
          </button>
        </div>

        {/* Calculadora Rápida de Rendimento */}
        {showCalc && (
          <div className="mb-6 sm:mb-8 bg-slate-50 text-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-orange-600">
                  <Calculator className="w-5 h-5 shrink-0" />
                  Simulador Rápido de Quantidade para Obra
                </h3>
                <p className="text-xs text-slate-600">
                  Informe o comprimento e a largura/altura em metros para estimar o
                  consumo (já considerando +5% de margem de recorte).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 uppercase font-bold mb-1">
                      Comprimento (m)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={calcComp}
                      onChange={(e) => setCalcComp(e.target.value)}
                      className="w-full sm:w-28 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 uppercase font-bold mb-1">
                      Altura/Largura (m)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={calcAlt}
                      onChange={(e) => setCalcAlt(e.target.value)}
                      className="w-full sm:w-28 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="px-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Área Total
                    </span>
                    <span className="text-sm font-extrabold text-orange-600">
                      {areaCalculada.toFixed(1)} m²
                    </span>
                  </div>
                  <div className="px-2 border-l border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Blocos 39cm
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">
                      ~{blocosEstimados} un
                    </span>
                  </div>
                  <div className="px-2 border-t sm:border-t-0 sm:border-l border-slate-200 col-span-2 sm:col-span-1 pt-2 sm:pt-0">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Paver / Cerca
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      ~{paversEstimados} pçs | {mouraoEstimado} mourões
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros de Categoria + Busca */}
        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs mb-6 sm:mb-8 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Categorias Scrollable no Mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 -mx-1 px-1">
              {PRODUCT_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{category}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-white text-orange-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {categoryCounts[category] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full md:w-64 lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar bloco 14, paver, manilha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Grid de Produtos */}
        {activeProducts.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Nenhum artefato encontrado para este filtro
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Tente limpar a busca ou selecionar a categoria &quot;Todos&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchTerm('');
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
            >
              Mostrar Todos os Produtos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {activeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO DE DIFERENCIAIS */}
      <section
        id="diferenciais"
        className="py-12 sm:py-16 bg-[#F4F6F8] text-slate-800 border-y border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
              ConcreForte — Qualidade & Confiança
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800">
              Por que Escolher a ConcreForte em Quedas do Iguaçu e Região?
            </h2>
            <p className="text-slate-600 text-xs sm:text-base">
              Produção própria com rigoroso controle de resistência e logística ágil
              para entregar na sua obra no prazo combinado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm hover:border-orange-300 transition-colors">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
                <Factory className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Fabricação Própria
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prensa vibro-hidráulica com dosagem precisa de agregados e cimento
                de alta resistência inicial, garantindo peças padronizadas no esquadro.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm hover:border-orange-300 transition-colors">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Entrega na Região c/ Munck
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Atendemos Quedas do Iguaçu e toda a região com caminhão munck e
                basculante para descarregar paletes de blocos, pavers e tubos na obra.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm hover:border-orange-300 transition-colors">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Resistência Garantida (MPa)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Artefatos produzidos seguindo as normas ABNT NBR 6136 (Blocos) e NBR
                9781 (Pavers de 35 MPa e 50 MPa para tráfego leve ou pesado).
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm hover:border-orange-300 transition-colors">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Preço Direto de Fábrica
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Compre direto de quem fabrica, sem intermediários. Negociação rápida
                para obras residenciais, comerciais, barracões e área rural.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LOCALIZAÇÃO E HORÁRIOS DE ATENDIMENTO */}
      <section
        id="localizacao"
        className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full bg-white"
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-6 p-5 sm:p-10 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
                ConcreForte — Atendimento Próximo
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                Localização e Cobertura Regional
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nossa fábrica está localizada em{' '}
                <strong className="text-slate-800">Quedas do Iguaçu - PR</strong>.
                Retire materiais diretamente no pátio ou agende a entrega para sua
                obra em Quedas do Iguaçu e toda a região.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Localização
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Quedas do Iguaçu - PR | Atendemos Quedas do Iguaçu e toda a
                      região (Urbano e Rural)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Horários de Atendimento e Carregamento
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Segunda a Sexta: 07h30 às 18h00
                      <br />
                      Sábados: 07h30 às 12h00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      WhatsApp e Vendas Diretas
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600">
                      WhatsApp Oficial: <strong>(46) 99911-5137</strong>
                      <br />
                      Atendimento rápido para orçamentos e dúvidas técnicas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-full sm:w-auto justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-xs cursor-pointer"
              >
                Montar Orçamento no Site
              </button>
              <a
                href={getOfficialWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp (46) 99911-5137</span>
              </a>
            </div>
          </div>

          {/* Cobertura Regional */}
          <div className="lg:col-span-6 bg-[#F4F6F8] text-slate-800 p-5 sm:p-10 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                Entregas Rápidas na Região
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                Quedas do Iguaçu e Municípios Vizinhos
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Realizamos entregas rápidas para obras residenciais, comerciais,
                loteamentos e propriedades rurais em:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                {[
                  'Quedas do Iguaçu - PR',
                  'Espigão Alto do Iguaçu - PR',
                  'Rio Bonito do Iguaçu - PR',
                  'Três Barras do Paraná - PR',
                ].map((city) => (
                  <div
                    key={city}
                    className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                    <span className="truncate">{city}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 sm:mt-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-orange-600 font-bold uppercase block">
                  Entrega Urbana e Rural
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Levamos mourões para cercas, manilhas para açudes/estradas e
                  blocos/pavers direto na sua propriedade.
                </p>
              </div>
              <Truck className="w-9 h-9 sm:w-10 sm:h-10 text-orange-600 shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 text-slate-600 py-10 pb-24 sm:pb-10 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
          <div>
            <span className="font-extrabold text-slate-800 text-sm block">
              ConcreForte — Artefatos de Cimento • CNPJ: 15.027.148/0001-97
            </span>
            <p className="mt-1 text-slate-600">
              Quedas do Iguaçu - PR | Atendemos Quedas do Iguaçu e toda a região •
              WhatsApp: (46) 99911-5137
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#inicio" className="hover:text-orange-600 font-medium">
              Topo
            </a>
            <a href="#catalogo" className="hover:text-orange-600 font-medium">
              Catálogo
            </a>
            <a
              href={getOfficialWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp (46) 99911-5137
            </a>
            <a href="/admin" className="text-orange-600 hover:text-orange-700 font-bold">
              Painel Admin
            </a>
          </div>
        </div>
      </footer>

      {/* BARRA FLUTUANTE MOBILE DO ORÇAMENTO (Alinhada ao lado do ícone de Chat sem sobrepor!) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-20 sm:hidden z-30">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between font-bold text-xs border border-orange-500"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="truncate">Orçamento ({totalItemsCount})</span>
            </div>
            <span className="bg-white text-orange-700 px-2 py-1 rounded-lg text-xs font-extrabold shrink-0 ml-2">
              {formatCurrency(totalValue)} →
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
