import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingCart,
  Send,
  CheckCircle2,
  User,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useQuoteCart } from '../contexts/QuoteCartContext';
import { createQuoteOrder, COMPANY_INFO } from '../services/firebase';

// Máscara automática para telefone / WhatsApp: (00) 00000-0000
function formatPhoneMask(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export default function QuoteDrawer() {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeItem,
    clearCart,
    totalValue,
  } = useQuoteCart();

  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  if (!isDrawerOpen) return null;

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const handlePhoneChange = (e) => {
    setPhoneError('');
    setClienteTelefone(formatPhoneMask(e.target.value));
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    const cleanDigits = clienteTelefone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setPhoneError('Informe um telefone ou WhatsApp válido com DDD.');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        clienteNome: clienteNome.trim(),
        clienteTelefone: clienteTelefone.trim(),
        itens: items.map((i) => {
          const precoUnitario = Number(i.preco) || 0;
          const quantidade = Number(i.quantidade) || 1;
          return {
            id: i.id,
            nome: i.nome,
            unidade: i.unidade,
            quantidade,
            precoUnitario,
            subtotal: Number((precoUnitario * quantidade).toFixed(2)),
          };
        }),
        valorTotal: Number(totalValue.toFixed(2)),
      };

      const savedOrder = await createQuoteOrder(orderPayload);
      setCreatedOrder(savedOrder);
      clearCart();
    } catch (err) {
      console.error('Erro ao enviar orçamento:', err);
      alert('Ocorreu um erro ao registrar o orçamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsAppLink = () => {
    if (!createdOrder) {
      return `https://wa.me/${COMPANY_INFO.whatsappNumber}?text=${encodeURIComponent(
        COMPANY_INFO.defaultWhatsappMessage
      )}`;
    }
    const itemsList = createdOrder.itens
      .map(
        (i) =>
          `• ${i.quantidade} ${i.unidade} - ${i.nome} (${formatCurrency(
            i.subtotal ?? i.precoUnitario * i.quantidade
          )})`
      )
      .join('\n');

    const text =
      `Olá! Vim pelo site da ConcreForte e solicitei um orçamento:\n\n` +
      `*Cliente:* ${createdOrder.clienteNome}\n` +
      `*Telefone:* ${createdOrder.clienteTelefone}\n\n` +
      `*Itens do Orçamento:*\n${itemsList}\n\n` +
      `*Total Estimado:* ${formatCurrency(createdOrder.valorTotal)}`;

    return `https://wa.me/${COMPANY_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const resetAndClose = () => {
    setCreatedOrder(null);
    setPhoneError('');
    setIsDrawerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop suave */}
      <div
        onClick={resetAndClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-xl border-l border-slate-200 flex flex-col">
          {/* Drawer Header - Tema Claro */}
          <div className="bg-slate-50 text-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center shadow-xs shrink-0">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight truncate">
                  {createdOrder
                    ? 'Orçamento Recebido!'
                    : 'Seu Orçamento Rápido'}
                </h2>
                <p className="text-xs text-slate-600 truncate">
                  {createdOrder
                    ? 'ConcreForte — Artefatos de Cimento'
                    : 'Confira os itens e informe apenas Nome e WhatsApp'}
                </p>
              </div>
            </div>
            <button
              onClick={resetAndClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
            {createdOrder ? (
              /* TELA DE CONFIRMAÇÃO AMIGÁVEL */
              <div className="space-y-6 py-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    Orçamento Recebido com Sucesso!
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Obrigado, <strong className="text-slate-800">{createdOrder.clienteNome}</strong>!
                    Sua solicitação já foi enviada para a equipe da{' '}
                    <strong className="text-slate-800">ConcreForte</strong>. Um
                    atendente entrará em contato em breve pelo telefone{' '}
                    <strong className="text-slate-800">
                      {createdOrder.clienteTelefone}
                    </strong>
                    .
                  </p>
                </div>

                {/* Resumo dos Itens Solicitados */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800">
                      Resumo dos Itens
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      Status: {createdOrder.status}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {createdOrder.itens.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 last:border-0"
                      >
                        <div className="pr-2">
                          <span className="font-bold text-slate-800">
                            {item.quantidade} {item.unidade}
                          </span>{' '}
                          <span className="text-slate-600">x {item.nome}</span>
                        </div>
                        <span className="font-bold text-slate-800 shrink-0">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-800">
                    <span>Valor Total Estimado:</span>
                    <span className="text-orange-600">
                      {formatCurrency(createdOrder.valorTotal)}
                    </span>
                  </div>
                </div>

                {/* Botão opcional para adiantar contato no WhatsApp */}
                <div className="space-y-2.5">
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Adiantar Atendimento no WhatsApp (46) 99911-5137</span>
                  </a>

                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors cursor-pointer"
                  >
                    Voltar para o Catálogo
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="text-lg font-bold text-slate-800">
                    Seu orçamento está vazio
                  </h3>
                  <p className="text-sm text-slate-600">
                    Adicione blocos, pavers, manilhas, palanques ou lajes do catálogo
                    para solicitar seu orçamento na hora.
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-xs cursor-pointer"
                >
                  Ver Catálogo de Produtos
                </button>
              </div>
            ) : (
              /* LISTA DE ITENS DO ORÇAMENTO */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-200">
                  <span className="font-medium">
                    {items.length} item(ns) no orçamento
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar lista
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex gap-3 items-start"
                    >
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">
                            {item.nome}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5">
                          Unitário: {formatCurrency(item.preco)} / {item.unidade}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantidade - 1)
                              }
                              className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) =>
                                updateQuantity(item.id, e.target.value)
                              }
                              className="w-14 sm:w-16 text-center text-xs font-bold text-slate-800 py-1 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantidade + 1)
                              }
                              className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">
                              Subtotal
                            </span>
                            <span className="text-sm font-extrabold text-slate-800">
                              {formatCurrency(item.preco * item.quantidade)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer: Fechamento Simplificado com APENAS 2 Campos Obrigatórios */}
          {items.length > 0 && !createdOrder && (
            <form
              onSubmit={handleSubmitQuote}
              className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6 space-y-3.5"
            >
              <div className="flex items-center justify-between text-base sm:text-lg font-extrabold text-slate-800 pb-2 border-b border-slate-200">
                <span>Valor Total Estimado:</span>
                <span className="text-orange-600">
                  {formatCurrency(totalValue)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nome *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="(00) 00000-0000"
                      value={clienteTelefone}
                      onChange={handlePhoneChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  {phoneError && (
                    <span className="text-xs text-red-600 font-medium block mt-1">
                      {phoneError}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting ? 'Enviando Orçamento...' : 'Solicitar Orçamento'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
