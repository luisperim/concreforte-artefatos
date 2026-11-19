import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HardHat,
  ShoppingCart,
  Phone,
  MapPin,
  ShieldCheck,
  Menu,
  X,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { useQuoteCart } from '../contexts/QuoteCartContext';
import { getOfficialWhatsAppUrl } from '../services/firebase';

export default function Navbar() {
  const { totalItemsCount, totalValue, setIsDrawerOpen } = useQuoteCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) return null;

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Bar Regional - Compacta no Mobile e Completa no Desktop */}
      <div className="bg-slate-50 text-slate-600 text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-8 lg:px-12 border-b border-slate-200">
        <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1 font-semibold text-slate-700 truncate">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className=" sm:hidden truncate">Quedas do Iguaçu - PR e Região</span>
              <span className="hidden sm:inline">
                Quedas do Iguaçu - PR | Atendemos Quedas do Iguaçu e toda a região
              </span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-slate-500 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Qualidade ABNT NBR 6136 / 9781
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={getOfficialWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors whitespace-nowrap"
            >
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span>(46) 99911-5137</span>
            </a>
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1 text-slate-500 hover:text-orange-600 transition-colors border-l border-slate-300 pl-3 font-medium whitespace-nowrap"
            >
              <Lock className="w-3 h-3" />
              <span>Área Restrita</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation - Perfeitamente Alinhada no Mobile e Desktop */}
      <div className="bg-white text-slate-800">
        <div className="max-w-[1680px] mx-auto px-3 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          {/* Brand Logo Oficial (Horizontal Transparente) */}
          <a href="#inicio" className="flex items-center group min-w-0 shrink-0">
            <img
              src="/logo-horizontal.png"
              alt="ConcreForte — Artefatos de Cimento"
              className="h-8 sm:h-12 md:h-13 w-auto object-contain transition-transform group-hover:scale-[1.01]"
            />
          </a>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-sm md:text-[15px] font-semibold text-slate-700">
            <a
              href="#inicio"
              className="hover:text-orange-600 transition-colors py-1 whitespace-nowrap"
            >
              Início
            </a>
            <a
              href="#catalogo"
              className="hover:text-orange-600 transition-colors py-1 whitespace-nowrap"
            >
              Catálogo com Preços
            </a>
            <a
              href="#diferenciais"
              className="hover:text-orange-600 transition-colors py-1 whitespace-nowrap"
            >
              Diferenciais
            </a>
            <a
              href="#localizacao"
              className="hover:text-orange-600 transition-colors py-1 whitespace-nowrap"
            >
              Localização e Horários
            </a>
          </nav>

          {/* Actions: WhatsApp Button + Quote Cart Button + Mobile Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <a
              href={getOfficialWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all whitespace-nowrap"
              title="Falar no WhatsApp da ConcreForte"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative flex items-center gap-2 sm:gap-3 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer whitespace-nowrap"
              aria-label="Abrir Montador de Orçamento"
            >
              <div className="relative shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-orange-700 text-[10px] sm:text-xs font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-xs border border-orange-200">
                    {totalItemsCount}
                  </span>
                )}
              </div>

              {/* Mobile Label: Linha única super limpa */}
              <span className="sm:hidden font-extrabold text-xs">
                {totalItemsCount > 0 ? formatCurrency(totalValue) : 'Orçamento'}
              </span>

              {/* Desktop Label: Duas linhas elegantes */}
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-[10px] font-medium text-orange-100">
                  Seu Orçamento
                </span>
                <span className="block text-sm font-extrabold">
                  {totalItemsCount > 0 ? formatCurrency(totalValue) : 'Montar Agora'}
                </span>
              </div>
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 shrink-0"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-50 border-t border-slate-200 px-4 pt-3 pb-5 space-y-2 shadow-inner">
            <a
              href="#inicio"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-slate-800 hover:bg-white font-semibold text-sm"
            >
              Início
            </a>
            <a
              href="#catalogo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-slate-800 hover:bg-white font-semibold text-sm"
            >
              Catálogo de Produtos e Preços
            </a>
            <a
              href="#diferenciais"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-slate-800 hover:bg-white font-semibold text-sm"
            >
              Frota & Diferenciais
            </a>
            <a
              href="#localizacao"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-slate-800 hover:bg-white font-semibold text-sm"
            >
              Localização e Horários
            </a>
            <a
              href={getOfficialWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-600 text-white font-bold text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp: (46) 99911-5137
            </a>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-orange-600 hover:bg-white font-semibold text-sm"
            >
              <Lock className="w-4 h-4" />
              Área Restrita (/admin)
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
