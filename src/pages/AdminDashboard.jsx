import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Package,
  FileSpreadsheet,
  MessageSquare,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Phone,
  ExternalLink,
  Search,
  Radio,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeProducts,
  saveProduct,
  deleteProductById,
  uploadProductImage,
  subscribeQuotes,
  updateQuoteStatus,
  subscribeAllChats,
  sendChatMessage,
  markChatAsRead,
  subscribeSupportStatus,
  toggleSupportOnlineStatus,
  PRODUCT_CATEGORIES,
  QUOTE_FUNNEL_STATUSES,
} from '../services/firebase';

let sharedAdminAudioCtx = null;

// Som de notificação nítido (duas notas) para novas mensagens de clientes no /admin
function playAdminNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAdminAudioCtx) {
      sharedAdminAudioCtx = new AudioCtx();
    }
    if (sharedAdminAudioCtx.state === 'suspended') {
      sharedAdminAudioCtx.resume();
    }
    const now = sharedAdminAudioCtx.currentTime;

    // 1ª Nota (Mi 5 - 659.25 Hz)
    const osc1 = sharedAdminAudioCtx.createOscillator();
    const gain1 = sharedAdminAudioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(sharedAdminAudioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // 2ª Nota (Si 5 - 987.77 Hz)
    const osc2 = sharedAdminAudioCtx.createOscillator();
    const gain2 = sharedAdminAudioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.14);
    gain2.gain.setValueAtTime(0.16, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(sharedAdminAudioCtx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.42);
  } catch {
    // Ignora caso o navegador ainda aguarde o primeiro clique na tela
  }
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orcamentos'); // 'orcamentos' | 'produtos' | 'chat'

  // Dados em tempo real
  const [products, setProducts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [chats, setChats] = useState([]);
  const [supportStatus, setSupportStatus] = useState({
    atendenteOnline: true,
    nomeAtendente: 'Atendimento ConcreForte',
  });

  // Estado Aba Produtos: Modal/Formulário de Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productForm, setProductForm] = useState({
    id: null,
    nome: '',
    categoria: 'Blocos e Tijolos',
    especificacoes: '',
    descricaoTecnica: '',
    unidade: 'un',
    preco: '',
    estoque: 'Pronta Entrega',
    imagem: '',
    ativo: true,
    destaque: false,
  });

  // Estado Aba Orçamentos: Filtro de Funil, Busca, Copiar Telefone e Expansão de Itens
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const [expandedQuoteIds, setExpandedQuoteIds] = useState({});

  // Estado Aba Chat: Conversa Selecionada, Mensagem e Som de Notificação
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const chatEndRef = useRef(null);
  const soundEnabledRef = useRef(true);
  const knownClientMsgIdsRef = useRef(new Set());
  const chatsInitializedRef = useRef(false);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const unsubProd = subscribeProducts(setProducts);
    const unsubQuotes = subscribeQuotes((data) => {
      // Ordena por criadoEm decrescente (mais recentes no topo)
      const sorted = [...data].sort((a, b) => {
        const timeA = a.criadoEm?.seconds
          ? a.criadoEm.seconds * 1000
          : new Date(a.criadoEmIso || a.criadoEm || 0).getTime();
        const timeB = b.criadoEm?.seconds
          ? b.criadoEm.seconds * 1000
          : new Date(b.criadoEmIso || b.criadoEm || 0).getTime();
        return timeB - timeA;
      });
      setQuotes(sorted);
    });
    const unsubChats = subscribeAllChats((data) => {
      let hasNewClientMessage = false;

      data.forEach((chat) => {
        (chat.mensagens || []).forEach((msg) => {
          if (msg.remetente === 'cliente' && msg.id) {
            if (!knownClientMsgIdsRef.current.has(msg.id)) {
              knownClientMsgIdsRef.current.add(msg.id);
              if (chatsInitializedRef.current) {
                hasNewClientMessage = true;
              }
            }
          }
        });
      });

      if (!chatsInitializedRef.current) {
        chatsInitializedRef.current = true;
      } else if (hasNewClientMessage && soundEnabledRef.current) {
        playAdminNotificationSound();
      }

      setChats(data);
      setSelectedChatId((prevId) => prevId || (data.length > 0 ? data[0].id : null));
    });
    const unsubSupport = subscribeSupportStatus(setSupportStatus);

    return () => {
      unsubProd && unsubProd();
      unsubQuotes && unsubQuotes();
      unsubChats && unsubChats();
      unsubSupport && unsubSupport();
    };
  }, []);

  const activeChat = chats.find((c) => c.id === selectedChatId) || chats[0] || null;

  useEffect(() => {
    if (activeTab === 'chat' && activeChat?.id && activeChat?.naoLidasAdmin > 0) {
      markChatAsRead(activeChat.id, 'admin');
    }
  }, [activeTab, activeChat?.id, activeChat?.naoLidasAdmin]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.mensagens?.length, activeTab, selectedChatId]);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const formatDateTime = (rawDate) => {
    if (!rawDate) return '-';
    try {
      const dateObj = rawDate?.seconds
        ? new Date(rawDate.seconds * 1000)
        : new Date(rawDate);
      return dateObj.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  // Helpers compatíveis com novo e antigo schema de orçamento
  const getQuoteClientName = (q) => q.clienteNome || q.cliente?.nome || 'Cliente';
  const getQuoteClientPhone = (q) =>
    q.clienteTelefone || q.cliente?.telefone || '';
  const getQuoteCleanPhone = (q) =>
    (q.clienteTelefoneDigitos || getQuoteClientPhone(q)).replace(/\D/g, '');
  const normalizeStatus = (st) => {
    if (st === 'Pendente') return 'Novo';
    if (st === 'Aprovado') return 'Venda Fechada';
    if (st === 'Cancelado') return 'Perdido / Cancelado';
    return st || 'Novo';
  };

  // Contadores de KPIs e Badges
  const newQuotesCount = quotes.filter(
    (q) => normalizeStatus(q.status) === 'Novo'
  ).length;
  const negotiatingQuotesCount = quotes.filter(
    (q) => normalizeStatus(q.status) === 'Em Negociação'
  ).length;
  const closedSalesTotal = quotes
    .filter((q) => normalizeStatus(q.status) === 'Venda Fechada')
    .reduce((sum, q) => sum + Number(q.valorTotal || 0), 0);

  const unreadChatsCount = chats.reduce(
    (sum, c) => sum + (Number(c.naoLidasAdmin) || 0),
    0
  );

  // Handlers Aba Orçamentos
  const handleCopyPhone = (quote) => {
    const phone = getQuoteClientPhone(quote);
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(quote.id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const handleCallOnWhatsApp = async (quote) => {
    const cleanPhone = getQuoteCleanPhone(quote);
    const clientName = getQuoteClientName(quote);
    const totalFormatted = Number(quote.valorTotal || 0).toLocaleString(
      'pt-BR',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );

    const msg = `Olá ${clientName}, tudo bem? Aqui é da ConcreForte! Recebemos o seu orçamento pelo site no valor de R$ ${totalFormatted} e vamos te atender por aqui.`;
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Se o status ainda estiver como "Novo", muda automaticamente para "Em Negociação"
    if (normalizeStatus(quote.status) === 'Novo') {
      await updateQuoteStatus(quote.id, 'Em Negociação');
    }
  };

  const toggleQuoteItemsExpand = (quoteId) => {
    setExpandedQuoteIds((prev) => ({
      ...prev,
      [quoteId]: !prev[quoteId],
    }));
  };

  // Handlers Aba Produtos
  const openNewProductModal = () => {
    setProductForm({
      id: null,
      nome: '',
      categoria: 'Blocos e Tijolos',
      especificacoes: '',
      descricaoTecnica: '',
      unidade: 'un',
      preco: '',
      estoque: 'Pronta Entrega em Quedas do Iguaçu',
      imagem:
        'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
      ativo: true,
      destaque: false,
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setProductForm({
      id: prod.id,
      nome: prod.nome || '',
      categoria: prod.categoria || 'Blocos e Tijolos',
      especificacoes: prod.especificacoes || '',
      descricaoTecnica: prod.descricaoTecnica || '',
      unidade: prod.unidade || 'un',
      preco: prod.preco ?? '',
      estoque: prod.estoque || 'Pronta Entrega',
      imagem: prod.imagem || '',
      ativo: prod.ativo !== false,
      destaque: Boolean(prod.destaque),
    });
    setIsProductModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadProductImage(file);
      setProductForm((prev) => ({ ...prev, imagem: url }));
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Falha ao carregar imagem.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    await saveProduct({
      ...productForm,
      preco: Number(productForm.preco) || 0,
    });
    setIsProductModalOpen(false);
  };

  const handleToggleProductActive = async (prod) => {
    await saveProduct({
      ...prod,
      ativo: prod.ativo === false ? true : false,
    });
  };

  const handleDeleteProduct = async (prodId) => {
    if (window.confirm('Deseja realmente excluir este artefato do catálogo?')) {
      await deleteProductById(prodId);
    }
  };

  // Handlers Aba Chat ao Vivo
  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!adminReply.trim() || !activeChat) return;
    const text = adminReply;
    setAdminReply('');
    await sendChatMessage(activeChat.id, {
      remetente: 'admin',
      autor: user?.displayName || 'Atendimento ConcreForte',
      texto: text,
    });
  };

  const filteredQuotes = quotes.filter((q) => {
    const st = normalizeStatus(q.status);
    const matchesStatus = statusFilter === 'Todos' || st === statusFilter;
    const name = getQuoteClientName(q).toLowerCase();
    const phone = getQuoteClientPhone(q).toLowerCase();
    const matchesSearch =
      !quoteSearch.trim() ||
      name.includes(quoteSearch.toLowerCase()) ||
      phone.includes(quoteSearch.toLowerCase()) ||
      (q.protocolo || '').toLowerCase().includes(quoteSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredProducts = products.filter(
    (p) =>
      !productSearch.trim() ||
      p.nome.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoria.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getStatusBadgeStyle = (rawStatus) => {
    const status = normalizeStatus(rawStatus);
    switch (status) {
      case 'Novo':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Em Negociação':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Venda Fechada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Perdido / Cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div
      className={`bg-[#F4F6F8] text-slate-800 flex flex-col ${
        activeTab === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Admin Header - Tema Claro */}
      <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-30 shadow-2xs shrink-0">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/logo-horizontal.png"
              alt="ConcreForte"
              className="h-7 sm:h-9 w-auto object-contain shrink-0"
            />
            <span className="hidden md:inline-block bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md">
              Painel Admin
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Botão Som de Notificação (Ativado / Silenciado) */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playAdminNotificationSound();
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title={
                soundEnabled
                  ? 'Som de notificação ativado (clique para silenciar)'
                  : 'Som silenciado (clique para ativar)'
              }
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="hidden md:inline">
                {soundEnabled ? 'Som Ativo' : 'Sem Som'}
              </span>
            </button>

            {/* Toggle Atendente Online / Offline */}
            <button
              type="button"
              onClick={() =>
                toggleSupportOnlineStatus(!supportStatus.atendenteOnline)
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                supportStatus.atendenteOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Alterar status visível no Chat do Cliente"
            >
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                Chat:{' '}
                {supportStatus.atendenteOnline
                  ? 'Atendente Online'
                  : 'Modo Offline'}
              </span>
            </button>

            <Link
              to="/"
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="hidden sm:inline">Ver Loja</span>
            </Link>

            <button
              onClick={logout}
              className="text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('orcamentos')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'orcamentos'
                  ? 'border-orange-600 text-orange-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Orçamentos</span>
              {newQuotesCount > 0 && (
                <span className="bg-orange-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {newQuotesCount} Novo(s)
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('produtos')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'produtos'
                  ? 'border-orange-600 text-orange-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Catálogo de Produtos ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'border-orange-600 text-orange-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Central de Chat ao Vivo</span>
              {unreadChatsCount > 0 && (
                <span className="bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                  {unreadChatsCount} nova(s)
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-8 lg:px-12 ${
          activeTab === 'chat'
            ? 'py-3 flex flex-col min-h-0 overflow-hidden'
            : 'py-6'
        }`}
      >
        {/* ===================================================================
            ABA 1: ORÇAMENTOS (FUNIL COMERCIAL CONCREFORTE)
           =================================================================== */}
        {activeTab === 'orcamentos' && (
          <div className="space-y-6">
            {/* Resumo Simples no Topo da Aba (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Orçamentos Novos
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 mt-1 block">
                    {newQuotesCount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aguardando 1º contato
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Em Negociação
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1 block">
                    {negotiatingQuotesCount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Atendimento iniciado
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Total Vendas Fechadas
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
                    {formatCurrency(closedSalesTotal)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Orçamentos convertidos
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filtros Rápidos de Funil + Busca */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                {['Todos', ...QUOTE_FUNNEL_STATUSES].map((st) => {
                  const count =
                    st === 'Todos'
                      ? quotes.length
                      : quotes.filter((q) => normalizeStatus(q.status) === st)
                          .length;
                  const isSelected = statusFilter === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{st}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-white text-orange-700'
                            : 'bg-white text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou telefone..."
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Lista de Cards de Orçamentos com Ação Imediata */}
            {filteredQuotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
                Nenhum orçamento encontrado para este filtro.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuotes.map((quote) => {
                  const clientName = getQuoteClientName(quote);
                  const clientPhone = getQuoteClientPhone(quote);
                  const currentStatus = normalizeStatus(quote.status);
                  const isExpanded = expandedQuoteIds[quote.id] ?? true;
                  const items = quote.itens || [];

                  return (
                    <div
                      key={quote.id}
                      className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                        currentStatus === 'Novo'
                          ? 'border-orange-300 ring-1 ring-orange-500/15'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Cabeçalho do Card de Orçamento */}
                      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                                currentStatus
                              )}`}
                            >
                              {currentStatus}
                            </span>
                            {quote.protocolo && (
                              <span className="text-xs font-mono font-bold text-slate-400">
                                #{quote.protocolo}
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              • Recebido em {formatDateTime(quote.criadoEm || quote.criadoEmIso)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-0.5">
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                              {clientName}
                            </h3>

                            {/* Telefone + Botão Copiar Telefone */}
                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                              <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span className="text-xs sm:text-sm font-bold text-slate-800">
                                {clientPhone}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(quote)}
                                className="ml-1 text-xs font-semibold text-slate-600 hover:text-orange-600 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                                title="Copiar telefone do cliente"
                              >
                                {copiedPhoneId === quote.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Valor Total + Botão Chamar no WhatsApp + Seletor de Status */}
                        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          <div className="text-left lg:text-right mr-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                              Valor Total Estimado
                            </span>
                            <span className="text-lg sm:text-xl font-extrabold text-orange-600">
                              {formatCurrency(quote.valorTotal)}
                            </span>
                          </div>

                          {/* Botão de Contato Direto ("Chamar no WhatsApp") */}
                          <button
                            type="button"
                            onClick={() => handleCallOnWhatsApp(quote)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span>Chamar no WhatsApp</span>
                          </button>

                          {/* Seletor Rápido de Status (Dropdown) */}
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              updateQuoteStatus(quote.id, e.target.value)
                            }
                            aria-label="Status do Orçamento"
                            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:border-orange-600 focus:outline-none cursor-pointer"
                          >
                            {QUOTE_FUNNEL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Corpo do Card: Lista Resumida/Expansível dos Itens + Botões Rápidos de Funil */}
                      <div className="bg-slate-50/70 px-4 sm:px-5 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleQuoteItemsExpand(quote.id)}
                            className="text-xs font-bold text-slate-700 hover:text-orange-600 flex items-center gap-1.5 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-orange-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-orange-600" />
                            )}
                            <span>
                              {isExpanded ? 'Ocultar' : 'Ver'} Itens do Orçamento (
                              {items.length}{' '}
                              {items.length === 1 ? 'produto' : 'produtos'})
                            </span>
                          </button>

                          {/* Botões Rápidos de Ação no Funil */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {currentStatus !== 'Em Negociação' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuoteStatus(quote.id, 'Em Negociação')
                                }
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Clock className="w-3 h-3" />
                                Em Negociação
                              </button>
                            )}
                            {currentStatus !== 'Venda Fechada' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuoteStatus(quote.id, 'Venda Fechada')
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Venda Fechada
                              </button>
                            )}
                            {currentStatus !== 'Perdido / Cancelado' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuoteStatus(
                                    quote.id,
                                    'Perdido / Cancelado'
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" />
                                Perdido / Cancelado
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px]">
                                    <th className="py-2 px-3">Produto</th>
                                    <th className="py-2 px-3 text-center">Qtd</th>
                                    <th className="py-2 px-3 text-right">
                                      Valor Unit.
                                    </th>
                                    <th className="py-2 px-3 text-right">
                                      Subtotal
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {items.map((item, idx) => {
                                    const unitPrice =
                                      item.precoUnitario ?? item.preco ?? 0;
                                    const subtotal =
                                      item.subtotal ??
                                      unitPrice * (item.quantidade || 1);
                                    return (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                                          {item.nome}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                                          {item.quantidade} {item.unidade}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-slate-600 whitespace-nowrap">
                                          {formatCurrency(unitPrice)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                          {formatCurrency(subtotal)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ABA 2: GESTÃO DE PRODUTOS (CRUD) - Tema Claro
           =================================================================== */}
        {activeTab === 'produtos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar artefato por nome ou categoria..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={openNewProductModal}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Artefato</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Produto</th>
                      <th className="py-3.5 px-4">Categoria</th>
                      <th className="py-3.5 px-4">Preço / Unid.</th>
                      <th className="py-3.5 px-4">Disponibilidade</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredProducts.map((prod) => (
                      <tr
                        key={prod.id}
                        className={`hover:bg-slate-50 ${
                          prod.ativo === false ? 'opacity-55 bg-slate-50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.imagem}
                              alt={prod.nome}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-800">
                                {prod.nome}
                              </div>
                              <div className="text-xs text-slate-500 line-clamp-1 max-w-md">
                                {prod.especificacoes}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 font-semibold text-xs px-2.5 py-1 rounded-md border border-slate-200">
                            {prod.categoria}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800 whitespace-nowrap">
                          {formatCurrency(prod.preco)}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            /{prod.unidade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {prod.estoque}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(prod)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                              prod.ativo !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {prod.ativo !== false ? (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Ativo
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> Oculto
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(prod)}
                              className="p-2 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-orange-50 cursor-pointer"
                              title="Editar produto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Excluir produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 3: CENTRAL DE ATENDIMENTO (CHAT AO VIVO) - Sem Scroll na Página
           =================================================================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Coluna Esquerda: Lista de Conversas Ativas */}
            <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50 h-full overflow-hidden">
              <div className="px-4 py-3 bg-white text-slate-800 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Conversas de Clientes
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sincronizado em tempo real (ConcreForte)
                  </p>
                </div>
                <span className="bg-orange-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {chats.length}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Nenhuma conversa iniciada ainda.
                  </div>
                ) : (
                  chats.map((chat) => {
                    const isSelected = activeChat?.id === chat.id;
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50/90 border-l-4 border-orange-600'
                            : 'hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-800 text-sm truncate">
                              {chat.clienteNome}
                            </h4>
                            {chat.naoLidasAdmin > 0 && (
                              <span className="bg-orange-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                                {chat.naoLidasAdmin} nova
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {chat.clienteTelefone}
                          </p>
                          <p className="text-xs text-slate-600 truncate mt-1">
                            {chat.ultimaMensagem}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coluna Direita: Janela de Mensagens */}
            <div className="md:col-span-8 flex flex-col bg-[#F4F6F8] h-full overflow-hidden">
              {activeChat ? (
                <>
                  {/* Header da Conversa */}
                  <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                        {activeChat.clienteNome}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-orange-600" />
                        <span>{activeChat.clienteTelefone}</span>
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/55${(
                        activeChat.clienteTelefone || ''
                      ).replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir no WhatsApp
                    </a>
                  </div>

                  {/* Histórico de Mensagens (Rola apenas aqui dentro) */}
                  <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-2.5">
                    {(activeChat.mensagens || []).map((msg) => {
                      const isAdmin = msg.remetente === 'admin';
                      const isSystem = msg.remetente === 'sistema';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="text-center my-1.5">
                            <span className="bg-white border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                              {msg.texto}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isAdmin ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-2xs ${
                              isAdmin
                                ? 'bg-orange-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            <span
                              className={`block text-[10px] font-bold mb-0.5 ${
                                isAdmin ? 'text-orange-100' : 'text-orange-600'
                              }`}
                            >
                              {msg.autor ||
                                (isAdmin
                                  ? 'Atendimento ConcreForte'
                                  : activeChat.clienteNome)}
                            </span>
                            <p className="leading-relaxed whitespace-pre-wrap">
                              {msg.texto}
                            </p>
                            <span
                              className={`block text-[10px] mt-1 text-right ${
                                isAdmin ? 'text-orange-100' : 'text-slate-400'
                              }`}
                            >
                              {formatDateTime(msg.horario)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Respostas Rápidas + Campo de Envio (Fixo na base sem cortar) */}
                  <div className="bg-white border-t border-slate-200 px-4 py-3 space-y-2 shrink-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        'Temos a pronta entrega em Quedas do Iguaçu!',
                        'Qual o bairro ou localidade para calcularmos a entrega?',
                        'Posso gerar seu orçamento formal com condição especial?',
                      ].map((quick) => (
                        <button
                          key={quick}
                          type="button"
                          onClick={() => setAdminReply(quick)}
                          className="text-[11px] bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          {quick}
                        </button>
                      ))}
                    </div>

                    <form
                      onSubmit={handleSendAdminMessage}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder={`Responder para ${activeChat.clienteNome}...`}
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-orange-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!adminReply.trim()}
                        className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold text-sm px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                  Selecione uma conversa à esquerda para atender o cliente.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO - Tema Claro */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-50 text-slate-800 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                {productForm.id
                  ? 'Editar Artefato de Cimento'
                  : 'Novo Artefato de Cimento'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-sm font-bold cursor-pointer"
              >
                Fechar ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bloco de Concreto Estrutural 14x19x39cm"
                    value={productForm.nome}
                    onChange={(e) =>
                      setProductForm({ ...productForm, nome: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={productForm.categoria}
                    onChange={(e) =>
                      setProductForm({ ...productForm, categoria: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white"
                  >
                    {PRODUCT_CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="4.35"
                      value={productForm.preco}
                      onChange={(e) =>
                        setProductForm({ ...productForm, preco: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Unidade *
                    </label>
                    <select
                      value={productForm.unidade}
                      onChange={(e) =>
                        setProductForm({ ...productForm, unidade: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white"
                    >
                      <option value="un">un (Unidade)</option>
                      <option value="m²">m² (Metro Quadrado)</option>
                      <option value="milheiro">milheiro</option>
                      <option value="m">m (Metro Linear)</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Especificações Técnicas (MPa, Rendimento/m², Normas) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Resistência 4.5 MPa | Rendimento: 12,5 blocos/m²"
                    value={productForm.especificacoes}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        especificacoes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Descrição de Aplicação na Obra
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Ideal para alvenaria estrutural, muros de contenção e barracões..."
                    value={productForm.descricaoTecnica}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        descricaoTecnica: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Estoque / Disponibilidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pronta Entrega em Quedas do Iguaçu"
                    value={productForm.estoque}
                    onChange={(e) =>
                      setProductForm({ ...productForm, estoque: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Foto do Produto (URL ou Upload Firebase Storage)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={productForm.imagem}
                      onChange={(e) =>
                        setProductForm({ ...productForm, imagem: e.target.value })
                      }
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5 text-orange-600" />
                      <span>{uploadingImg ? 'Enviando...' : 'Upload Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.ativo}
                      onChange={(e) =>
                        setProductForm({ ...productForm, ativo: e.target.checked })
                      }
                      className="rounded text-orange-600"
                    />
                    Produto Visível na Vitrine
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.destaque}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          destaque: e.target.checked,
                        })
                      }
                      className="rounded text-orange-600"
                    />
                    Selo &quot;Mais Vendido&quot;
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
