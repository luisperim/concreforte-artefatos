import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'sua_api_key_aqui'
);

let app = null;
let db = null;
let auth = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
  }
}

export { app, db, auth, storage };

// Informações Oficiais da Empresa
export const COMPANY_INFO = {
  name: 'ConcreForte',
  fullName: 'ConcreForte — Artefatos de Cimento',
  cnpj: '15.027.148/0001-97',
  city: 'Quedas do Iguaçu - PR',
  coverage: 'Atendemos Quedas do Iguaçu e toda a região',
  phoneDisplay: '(46) 99911-5137',
  whatsappNumber: '5546999115137',
  defaultWhatsappMessage:
    'Olá! Vim pelo site da ConcreForte e gostaria de mais informações.',
};

export function getOfficialWhatsAppUrl(customMessage) {
  const msg = customMessage || COMPANY_INFO.defaultWhatsappMessage;
  return `https://wa.me/${COMPANY_INFO.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}

// Categorias Oficiais da Fábrica
export const PRODUCT_CATEGORIES = [
  'Todos',
  'Blocos e Tijolos',
  'Paver e Pisos',
  'Manilhas e Tubos',
  'Mourões e Estacas',
  'Lajes e Pré-moldados',
  'Acabamentos',
];

// Dados iniciais zerados para Produção (Cadastro real via /admin)
export const INITIAL_PRODUCTS = [];

export const QUOTE_FUNNEL_STATUSES = [
  'Novo',
  'Em Negociação',
  'Venda Fechada',
  'Perdido / Cancelado',
];

export const INITIAL_QUOTES = [];

export const INITIAL_CHATS = [];

// ============================================================================
// MOTOR DE SINCRONIZAÇÃO EM TEMPO REAL (FIRESTORE + CACHE/FALLBACK REATIVO)
// ============================================================================
const STORAGE_KEYS = {
  PRODUCTS: 'cf_produtos_v4',
  QUOTES: 'cf_orcamentos_v4',
  CHATS: 'cf_chats_v4',
  SETTINGS: 'cf_settings_v4',
  AUTH: 'cf_admin_auth_v4',
};

const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('concreforte_realtime_sync')
    : null;

const localListeners = {
  produtos: new Set(),
  orcamentos: new Set(),
  chats: new Set(),
  settings: new Set(),
  auth: new Set(),
};

function getLocalData(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setLocalData(key, data, channelTopic) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (channelTopic && localListeners[channelTopic]) {
      localListeners[channelTopic].forEach((cb) => cb(data));
    }
    if (syncChannel && channelTopic) {
      syncChannel.postMessage({ topic: channelTopic, data });
    }
  } catch (err) {
    console.error('Erro ao salvar dados locais:', err);
  }
}

// Helper para executar operação Firestore com timeout rápido sem travar a UI
function withTimeout(promise, ms = 2500) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), ms)
    ),
  ]);
}

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const { topic, data } = event.data || {};
    if (topic && localListeners[topic]) {
      localListeners[topic].forEach((cb) => cb(data));
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.PRODUCTS) {
      const data = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      localListeners.produtos.forEach((cb) => cb(data));
    } else if (e.key === STORAGE_KEYS.QUOTES) {
      const data = getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
      localListeners.orcamentos.forEach((cb) => cb(data));
    } else if (e.key === STORAGE_KEYS.CHATS) {
      const data = getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS);
      localListeners.chats.forEach((cb) => cb(data));
    } else if (e.key === STORAGE_KEYS.SETTINGS) {
      const data = getLocalData(STORAGE_KEYS.SETTINGS, { atendenteOnline: true });
      localListeners.settings.forEach((cb) => cb(data));
    }
  });
}

// ----------------------------------------------------------------------------
// 1. SERVIÇO DE PRODUTOS (Coleção: `produtos`)
// ----------------------------------------------------------------------------
export function subscribeProducts(callback) {
  const initialLocal = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  callback(initialLocal);
  localListeners.produtos.add(callback);

  let unsubFirestore = null;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'produtos'), orderBy('criadoEm', 'desc'));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setLocalData(STORAGE_KEYS.PRODUCTS, items, 'produtos');
          }
        },
        () => {
          // Usa cache local silenciosamente se Firestore ainda não estiver ativo no console
        }
      );
    } catch {
      // Fallback local ativo
    }
  }

  return () => {
    localListeners.produtos.delete(callback);
    if (unsubFirestore) unsubFirestore();
  };
}

export async function saveProduct(productData) {
  const current = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  let savedProduct;

  if (productData.id) {
    savedProduct = {
      ...productData,
      atualizadoEm: new Date().toISOString(),
    };
    const updated = current.map((p) =>
      p.id === productData.id ? { ...p, ...savedProduct } : p
    );
    setLocalData(STORAGE_KEYS.PRODUCTS, updated, 'produtos');

    if (isFirebaseConfigured && db) {
      try {
        const { id, ...rest } = savedProduct;
        await withTimeout(setDoc(doc(db, 'produtos', id), rest, { merge: true }));
      } catch {
        // Persistido localmente caso Firestore não esteja ativo
      }
    }
    return savedProduct;
  } else {
    const newId = `prod-${Date.now()}`;
    savedProduct = {
      ...productData,
      id: newId,
      ativo: productData.ativo ?? true,
      criadoEm: new Date().toISOString(),
    };
    const updated = [savedProduct, ...current];
    setLocalData(STORAGE_KEYS.PRODUCTS, updated, 'produtos');

    if (isFirebaseConfigured && db) {
      try {
        const { id, ...rest } = savedProduct;
        await withTimeout(setDoc(doc(db, 'produtos', id), rest));
      } catch {
        // Persistido localmente caso Firestore não esteja ativo
      }
    }
    return savedProduct;
  }
}

export async function deleteProductById(productId) {
  const current = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const updated = current.filter((p) => p.id !== productId);
  setLocalData(STORAGE_KEYS.PRODUCTS, updated, 'produtos');

  if (isFirebaseConfigured && db) {
    try {
      await withTimeout(deleteDoc(doc(db, 'produtos', productId)));
    } catch {
      // Removido localmente
    }
  }
}

export async function uploadProductImage(file) {
  if (isFirebaseConfigured && storage) {
    try {
      const fileRef = ref(storage, `produtos/${Date.now()}-${file.name}`);
      const snap = await withTimeout(uploadBytes(fileRef, file), 4000);
      return await withTimeout(getDownloadURL(snap.ref), 3000);
    } catch {
      // Fallback imediato para DataURL caso Storage não esteja habilitado
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// ----------------------------------------------------------------------------
// 2. SERVIÇO DE ORÇAMENTOS (Coleção: `orcamentos`)
// ----------------------------------------------------------------------------
export function subscribeQuotes(callback) {
  const initialLocal = getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  callback(initialLocal);
  localListeners.orcamentos.add(callback);

  let unsubFirestore = null;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'orcamentos'), orderBy('criadoEm', 'desc'));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setLocalData(STORAGE_KEYS.QUOTES, items, 'orcamentos');
          }
        },
        () => {}
      );
    } catch {
      // Fallback local
    }
  }

  return () => {
    localListeners.orcamentos.delete(callback);
    if (unsubFirestore) unsubFirestore();
  };
}

export async function createQuoteOrder(quotePayload) {
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const protocolo = `CF-${new Date().getFullYear()}-${randomCode}`;
  const nowIso = new Date().toISOString();
  const newId = `orc-${Date.now()}`;

  const fullRecord = {
    id: newId,
    protocolo,
    clienteNome: quotePayload.clienteNome,
    clienteTelefone: quotePayload.clienteTelefone,
    clienteTelefoneDigitos: (quotePayload.clienteTelefone || '').replace(/\D/g, ''),
    itens: quotePayload.itens,
    valorTotal: Number(quotePayload.valorTotal) || 0,
    status: 'Novo',
    criadoEm: nowIso,
    criadoEmIso: nowIso,
  };

  const current = getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  setLocalData(STORAGE_KEYS.QUOTES, [fullRecord, ...current], 'orcamentos');

  if (isFirebaseConfigured && db) {
    try {
      const { id, ...rest } = fullRecord;
      await withTimeout(
        setDoc(doc(db, 'orcamentos', id), {
          ...rest,
          timestamp: serverTimestamp(),
        })
      );
    } catch {
      // Salvo no cache reativo local
    }
  }

  return fullRecord;
}

export async function updateQuoteStatus(quoteId, newStatus) {
  const current = getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  const updated = current.map((q) =>
    q.id === quoteId ? { ...q, status: newStatus } : q
  );
  setLocalData(STORAGE_KEYS.QUOTES, updated, 'orcamentos');

  if (isFirebaseConfigured && db) {
    try {
      await withTimeout(
        updateDoc(doc(db, 'orcamentos', quoteId), {
          status: newStatus,
          atualizadoEm: new Date().toISOString(),
        })
      );
    } catch {
      // Atualizado no cache local
    }
  }
}

// ----------------------------------------------------------------------------
// 3. SERVIÇO DE CHAT EM TEMPO REAL (Coleção: `chats` + Status Atendente)
// ----------------------------------------------------------------------------
export function subscribeSupportStatus(callback) {
  const initial = getLocalData(STORAGE_KEYS.SETTINGS, {
    atendenteOnline: true,
    nomeAtendente: 'Atendimento ConcreForte',
  });
  callback(initial);
  localListeners.settings.add(callback);

  let unsubFirestore = null;
  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(
        doc(db, 'configuracoes', 'atendimento'),
        (snap) => {
          if (snap.exists()) {
            setLocalData(STORAGE_KEYS.SETTINGS, snap.data(), 'settings');
          }
        },
        () => {}
      );
    } catch {
      // Fallback local
    }
  }

  return () => {
    localListeners.settings.delete(callback);
    if (unsubFirestore) unsubFirestore();
  };
}

export async function toggleSupportOnlineStatus(isOnline) {
  const payload = {
    atendenteOnline: isOnline,
    nomeAtendente: 'Atendimento ConcreForte',
    atualizadoEm: new Date().toISOString(),
  };
  setLocalData(STORAGE_KEYS.SETTINGS, payload, 'settings');

  if (isFirebaseConfigured && db) {
    try {
      await withTimeout(
        setDoc(doc(db, 'configuracoes', 'atendimento'), payload, { merge: true })
      );
    } catch {
      // Salvo localmente
    }
  }
}

export function subscribeAllChats(callback) {
  const initial = getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS);
  callback(initial);
  localListeners.chats.add(callback);

  let unsubFirestore = null;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'chats'), orderBy('atualizadoEm', 'desc'));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setLocalData(STORAGE_KEYS.CHATS, items, 'chats');
          }
        },
        () => {}
      );
    } catch {
      // Fallback local
    }
  }

  return () => {
    localListeners.chats.delete(callback);
    if (unsubFirestore) unsubFirestore();
  };
}

export function subscribeSingleChat(chatId, callback) {
  if (!chatId) return () => {};

  const notify = (allChats) => {
    const found = allChats.find((c) => c.id === chatId) || null;
    callback(found);
  };

  notify(getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS));
  localListeners.chats.add(notify);

  let unsubFirestore = null;
  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(
        doc(db, 'chats', chatId),
        (snap) => {
          if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() });
          }
        },
        () => {}
      );
    } catch {
      // Fallback local
    }
  }

  return () => {
    localListeners.chats.delete(notify);
    if (unsubFirestore) unsubFirestore();
  };
}

export async function startOrResumeClientChat({ nome, telefone, existingChatId }) {
  const now = new Date().toISOString();
  const current = getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS);

  if (existingChatId) {
    const exists = current.find((c) => c.id === existingChatId);
    if (exists) return existingChatId;
  }

  const foundByPhone = current.find(
    (c) => c.clienteTelefone.replace(/\D/g, '') === telefone.replace(/\D/g, '')
  );
  if (foundByPhone) {
    return foundByPhone.id;
  }

  const chatId = `chat-${Date.now()}`;
  const welcomeMsg = {
    id: `msg-${Date.now()}`,
    remetente: 'admin',
    autor: 'Atendimento ConcreForte',
    texto: `Olá ${nome.split(' ')[0]}! Bem-vindo à ConcreForte — Artefatos de Cimento em Quedas do Iguaçu - PR. Precisa de cotação de blocos, pavers, tubos ou lajes para sua obra?`,
    horario: now,
  };

  const newChat = {
    id: chatId,
    clienteNome: nome,
    clienteTelefone: telefone,
    status: 'ativo',
    naoLidasAdmin: 0,
    naoLidasCliente: 0,
    ultimaMensagem: welcomeMsg.texto,
    atualizadoEm: now,
    mensagens: [welcomeMsg],
  };

  setLocalData(STORAGE_KEYS.CHATS, [newChat, ...current], 'chats');

  if (isFirebaseConfigured && db) {
    try {
      const { id, ...rest } = newChat;
      await withTimeout(setDoc(doc(db, 'chats', id), rest));
    } catch {
      // Salvo no cache local
    }
  }

  return chatId;
}

export async function sendChatMessage(chatId, { remetente, autor, texto }) {
  const now = new Date().toISOString();
  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    remetente,
    autor,
    texto: texto.trim(),
    horario: now,
  };

  const current = getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS);
  let targetUpdatedChat = null;

  const updated = current.map((chat) => {
    if (chat.id !== chatId) return chat;
    targetUpdatedChat = {
      ...chat,
      mensagens: [...(chat.mensagens || []), newMsg],
      ultimaMensagem: newMsg.texto,
      atualizadoEm: now,
      naoLidasAdmin: remetente === 'cliente' ? (chat.naoLidasAdmin || 0) + 1 : 0,
      naoLidasCliente: remetente === 'admin' ? (chat.naoLidasCliente || 0) + 1 : 0,
    };
    return targetUpdatedChat;
  });

  updated.sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm));
  setLocalData(STORAGE_KEYS.CHATS, updated, 'chats');

  if (isFirebaseConfigured && db && targetUpdatedChat) {
    try {
      const { id, ...rest } = targetUpdatedChat;
      await withTimeout(setDoc(doc(db, 'chats', id), rest, { merge: true }));
    } catch {
      // Sincronizado localmente
    }
  }

  return newMsg;
}

export async function markChatAsRead(chatId, viewerRole) {
  if (!chatId) return;

  const current = getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS);
  let changed = false;
  const updated = current.map((chat) => {
    if (chat.id !== chatId) return chat;
    if (viewerRole === 'admin' && chat.naoLidasAdmin > 0) {
      changed = true;
      return { ...chat, naoLidasAdmin: 0 };
    }
    if (viewerRole === 'cliente' && chat.naoLidasCliente > 0) {
      changed = true;
      return { ...chat, naoLidasCliente: 0 };
    }
    return chat;
  });

  if (changed) {
    setLocalData(STORAGE_KEYS.CHATS, updated, 'chats');
    if (isFirebaseConfigured && db) {
      const field = viewerRole === 'admin' ? 'naoLidasAdmin' : 'naoLidasCliente';
      try {
        await withTimeout(updateDoc(doc(db, 'chats', chatId), { [field]: 0 }));
      } catch {
        // Ignora se offline
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 4. AUTENTICAÇÃO ADMINISTRATIVA (Firebase Auth + Login Corporativo ConcreForte)
// ----------------------------------------------------------------------------
export function subscribeAuth(callback) {
  const savedUser = getLocalData(STORAGE_KEYS.AUTH, null);
  callback(savedUser);
  localListeners.auth.add(callback);

  let unsubFirebaseAuth = null;
  if (isFirebaseConfigured && auth) {
    try {
      unsubFirebaseAuth = fbOnAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          setLocalData(STORAGE_KEYS.AUTH, fbUser, 'auth');
        }
      });
    } catch {
      // Usa sessão local
    }
  }

  return () => {
    localListeners.auth.delete(callback);
    if (unsubFirebaseAuth) unsubFirebaseAuth();
  };
}

export async function loginAdmin(email, password) {
  const demoEmail =
    import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@concreforte.com.br';
  const demoPass = import.meta.env.VITE_DEMO_ADMIN_PASS || 'admin123';
  const normalizedEmail = email.trim().toLowerCase();

  // Tenta autenticar via Firebase Auth caso exista usuário cadastrado no Console
  if (isFirebaseConfigured && auth) {
    try {
      const cred = await withTimeout(
        signInWithEmailAndPassword(auth, email, password),
        3000
      );
      setLocalData(STORAGE_KEYS.AUTH, cred.user, 'auth');
      return cred.user;
    } catch {
      // Prossegue para verificação da credencial corporativa padrão
    }
  }

  if (
    (normalizedEmail === demoEmail.toLowerCase() ||
      normalizedEmail === 'admin@forteconcreto.com.br') &&
    password === demoPass
  ) {
    const adminUser = {
      uid: 'admin-concreforte-01',
      email: 'admin@concreforte.com.br',
      displayName: 'Atendimento ConcreForte',
    };
    setLocalData(STORAGE_KEYS.AUTH, adminUser, 'auth');
    return adminUser;
  }

  throw new Error('E-mail ou senha inválidos. Verifique suas credenciais.');
}

export async function logoutAdmin() {
  setLocalData(STORAGE_KEYS.AUTH, null, 'auth');
  if (isFirebaseConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch {
      // Sessão encerrada
    }
  }
}
