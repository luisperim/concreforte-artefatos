import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  User,
  Phone,
  Volume2,
  VolumeX,
  Headphones,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import {
  subscribeSupportStatus,
  subscribeSingleChat,
  startOrResumeClientChat,
  sendChatMessage,
  markChatAsRead,
  getOfficialWhatsAppUrl,
} from '../services/firebase';

const CLIENT_SESSION_KEY = 'cf_client_chat_session_v5';

// Som sutil sintetizado via Web Audio API
function playSubtleNotificationBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignora bloqueio de autoplay do navegador
  }
}

export default function ChatWidget() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [supportStatus, setSupportStatus] = useState({
    atendenteOnline: true,
    nomeAtendente: 'Atendimento ConcreForte',
  });

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(CLIENT_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [nomeInput, setNomeInput] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [chatData, setChatData] = useState(null);
  const [starting, setStarting] = useState(false);

  const messagesEndRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    const unsub = subscribeSupportStatus((status) => {
      if (status) setSupportStatus(status);
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!session?.chatId) {
      setChatData(null);
      return;
    }

    const unsub = subscribeSingleChat(session.chatId, (data) => {
      if (!data) return;
      const msgs = data.mensagens || [];
      if (prevMsgCountRef.current > 0 && msgs.length > prevMsgCountRef.current) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.remetente === 'admin' && soundEnabled) {
          playSubtleNotificationBeep();
        }
      }
      prevMsgCountRef.current = msgs.length;
      setChatData(data);
    });

    return () => unsub && unsub();
  }, [session?.chatId, soundEnabled]);

  useEffect(() => {
    if (isOpen && session?.chatId && chatData?.naoLidasCliente > 0) {
      markChatAsRead(session.chatId, 'cliente');
    }
  }, [isOpen, session?.chatId, chatData?.naoLidasCliente]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatData?.mensagens?.length, isOpen]);

  if (isAdminRoute) return null;

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!nomeInput.trim() || !telefoneInput.trim()) return;

    setStarting(true);
    try {
      const chatId = await startOrResumeClientChat({
        nome: nomeInput.trim(),
        telefone: telefoneInput.trim(),
      });
      const newSession = {
        chatId,
        nome: nomeInput.trim(),
        telefone: telefoneInput.trim(),
      };
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
    } catch (err) {
      console.error('Erro ao iniciar chat:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !session?.chatId) return;

    const text = messageInput;
    setMessageInput('');
    await sendChatMessage(session.chatId, {
      remetente: 'cliente',
      autor: session.nome,
      texto: text,
      clienteNomeFallback: session.nome,
      clienteTelefoneFallback: session.telefone,
    });
  };

  const handleQuickPrompt = async (promptText) => {
    if (!session?.chatId) return;
    await sendChatMessage(session.chatId, {
      remetente: 'cliente',
      autor: session.nome,
      texto: promptText,
      clienteNomeFallback: session.nome,
      clienteTelefoneFallback: session.telefone,
    });
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const unreadCount = chatData?.naoLidasCliente || 0;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
      {/* Janela de Chat Aberta - Responsiva para Mobile e Desktop */}
      {isOpen ? (
        <div className="fixed inset-x-3 bottom-3 sm:static sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[560px]">
          {/* Header do Chat Claro */}
          <div className="bg-slate-50 text-slate-800 p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold shadow-xs">
                  <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white ${
                    supportStatus.atendenteOnline
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">
                  Atendimento ConcreForte
                </h3>
                <p className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                      supportStatus.atendenteOnline
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="truncate">
                    {supportStatus.atendenteOnline
                      ? 'Online • Quedas do Iguaçu e Região'
                      : 'Plantão Comercial • Resposta rápida'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title={soundEnabled ? 'Som ativado' : 'Som silenciado'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Minimizar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corpo: Identificação Inicial ou Conversa */}
          {!session ? (
            <form onSubmit={handleStartChat} className="p-4 sm:p-5 space-y-3.5 bg-white overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1">
                  Fale direto com a ConcreForte em Quedas do Iguaçu - PR!
                </p>
                Tire dúvidas sobre blocos, pavers, manilhas ou entrega na região.
                Informe seu nome e telefone para iniciar o chat ao vivo:
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Seu Nome *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Marcos Oliveira"
                    value={nomeInput}
                    onChange={(e) => setNomeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
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
                    placeholder="Ex: (46) 99911-5137"
                    value={telefoneInput}
                    onChange={(e) => setTelefoneInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={starting}
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                {starting ? 'Conectando...' : 'Iniciar Chat no Site'}
              </button>

              <div className="pt-2 border-t border-slate-100 text-center">
                <a
                  href={getOfficialWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ou chame no WhatsApp: (46) 99911-5137</span>
                </a>
              </div>
            </form>
          ) : (
            <>
              {/* Barra de sessão do cliente */}
              <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span className="truncate pr-2">
                  Conectado como <strong>{session.nome}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(CLIENT_SESSION_KEY);
                    setSession(null);
                    setChatData(null);
                  }}
                  className="text-orange-600 hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Trocar dados
                </button>
              </div>

              {/* Lista de Mensagens */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-[#F4F6F8] min-h-[220px] max-h-[320px]">
                {(chatData?.mensagens || []).map((msg) => {
                  const isClient = msg.remetente === 'cliente';
                  const isSystem = msg.remetente === 'sistema';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="bg-white border border-slate-200 text-slate-600 text-[11px] px-2.5 py-1 rounded-full">
                          {msg.texto}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isClient ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-2xs ${
                          isClient
                            ? 'bg-orange-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {!isClient && (
                          <span className="block text-[10px] font-bold text-orange-600 mb-0.5">
                            {msg.autor || 'Atendimento ConcreForte'}
                          </span>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {msg.texto}
                        </p>
                        <span
                          className={`block text-[10px] mt-1 text-right ${
                            isClient ? 'text-orange-100' : 'text-slate-400'
                          }`}
                        >
                          {formatTime(msg.horario)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Sugestões Rápidas */}
                {(chatData?.mensagens || []).length <= 1 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-orange-500" />
                      Perguntas frequentes rápidas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Entregam em Quedas do Iguaçu e região?',
                        'Tem Paver 6cm a pronta entrega?',
                        'Qual o prazo para Laje sob medida?',
                      ].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => handleQuickPrompt(q)}
                          className="text-[11px] bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input de Envio */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-orange-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        /* Botão Flutuante Minimizado: Compacto no Celular (não tampa os botões!) e Completo no PC */
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Fale com um Atendente"
          className="group flex items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 p-2 sm:pl-3.5 sm:pr-5 sm:py-3 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="relative">
            <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-orange-600 group-hover:bg-orange-700 flex items-center justify-center shadow-xs transition-colors">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                supportStatus.atendenteOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-red-600 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-[11px] font-bold text-orange-600 leading-none">
              {supportStatus.atendenteOnline
                ? 'ConcreForte Online'
                : 'Atendimento Rápido'}
            </span>
            <span className="block text-sm font-extrabold text-slate-800 tracking-tight mt-0.5">
              Fale com um Atendente
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
