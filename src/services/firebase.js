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
// MOTOR DE SINCRONIZAÇÃO EM TEMPO REAL (FIRESTORE + FALLBACK LOCAL REATIVO)
// ============================================================================
const STORAGE_KEYS = {
  PRODUCTS: 'cf_produtos_v4',
  QUOTES: 'cf_orcamentos_v4',
  CHATS: 'cf_chats_v4',
  SETTINGS: 'cf_settings_v4',
  AUTH: 'cf_admin_auth_v4',
};

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
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
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'produtos'), orderBy('criadoEm', 'desc'));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of INITIAL_PRODUCTS) {
            const { id, ...rest } = item;
            await setDoc(doc(db, 'produtos', id), rest);
          }
          callback(INITIAL_PRODUCTS);
        } else {
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(items);
        }
      },
      (err) => {
        console.warn('Fallback local para produtos ativado:', err.message);
        callback(getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
      }
    );
  }

  const initial = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  callback(initial);
  localListeners.produtos.add(callback);
  return () => localListeners.produtos.delete(callback);
}

export async function saveProduct(productData) {
  if (isFirebaseConfigured && db) {
    if (productData.id) {
      const { id, ...rest } = productData;
      await updateDoc(doc(db, 'produtos', id), {
        ...rest,
        atualizadoEm: new Date().toISOString(),
      });
      return productData;
    } else {
      const payload = {
        ...productData,
        ativo: productData.ativo ?? true,
        criadoEm: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'produtos'), payload);
      return { id: docRef.id, ...payload };
    }
  }

  const current = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  if (productData.id) {
    const updated = current.map((p) =>
      p.id === productData.id ? { ...p, ...productData } : p
    );
    setLocalData(STORAGE_KEYS.PRODUCTS, updated, 'produtos');
    return productData;
  } else {
    const newProd = {
      ...productData,
      id: `prod-${Date.now()}`,
      ativo: productData.ativo ?? true,
      criadoEm: new Date().toISOString(),
    };
    const updated = [newProd, ...current];
    setLocalData(STORAGE_KEYS.PRODUCTS, updated, 'produtos');
    return newProd;
  }
}

export async function deleteProductById(productId) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'produtos', productId));
    return;
  }
  const current = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const updated = current.filter((p) => p.id !== productId);
  setLocalData(STORAGE_KEYS.PRODUCTS, updated, 'produtos');
}

export async function uploadProductImage(file) {
  if (isFirebaseConfigured && storage) {
    const fileRef = ref(storage, `produtos/${Date.now()}-${file.name}`);
    const snap = await uploadBytes(fileRef, file);
    return await getDownloadURL(snap.ref);
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
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'orcamentos'), orderBy('criadoEm', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(items);
      },
      (err) => {
        console.warn('Fallback local para orçamentos ativado:', err.message);
        callback(getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES));
      }
    );
  }

  const initial = getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  callback(initial);
  localListeners.orcamentos.add(callback);
  return () => localListeners.orcamentos.delete(callback);
}

export async function createQuoteOrder(quotePayload) {
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const protocolo = `CF-${new Date().getFullYear()}-${randomCode}`;
  const nowIso = new Date().toISOString();

  const fullRecord = {
    protocolo,
    clienteNome: quotePayload.clienteNome,
    clienteTelefone: quotePayload.clienteTelefone,
    clienteTelefoneDigitos: (quotePayload.clienteTelefone || '').replace(/\D/g, ''),
    itens: quotePayload.itens,
    valorTotal: Number(quotePayload.valorTotal) || 0,
    status: 'Novo',
    criadoEm: nowIso,
  };

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, 'orcamentos'), {
      ...fullRecord,
      criadoEm: serverTimestamp(),
      criadoEmIso: nowIso,
    });
    return { id: docRef.id, ...fullRecord };
  }

  const current = getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  const saved = { id: `orc-${Date.now()}`, ...fullRecord };
  setLocalData(STORAGE_KEYS.QUOTES, [saved, ...current], 'orcamentos');
  return saved;
}

export async function updateQuoteStatus(quoteId, newStatus) {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'orcamentos', quoteId), {
      status: newStatus,
      atualizadoEm: new Date().toISOString(),
    });
    return;
  }

  const current = getLocalData(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  const updated = current.map((q) =>
    q.id === quoteId ? { ...q, status: newStatus } : q
  );
  setLocalData(STORAGE_KEYS.QUOTES, updated, 'orcamentos');
}

// ----------------------------------------------------------------------------
// 3. SERVIÇO DE CHAT EM TEMPO REAL (Coleção: `chats` + Status Atendente)
// ----------------------------------------------------------------------------
export function subscribeSupportStatus(callback) {
  if (isFirebaseConfigured && db) {
    return onSnapshot(
      doc(db, 'configuracoes', 'atendimento'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data());
        } else {
          callback({ atendenteOnline: true, nomeAtendente: 'Atendimento ConcreForte' });
        }
      },
      () =>
        callback(
          getLocalData(STORAGE_KEYS.SETTINGS, {
            atendenteOnline: true,
            nomeAtendente: 'Atendimento ConcreForte',
          })
        )
    );
  }

  const initial = getLocalData(STORAGE_KEYS.SETTINGS, {
    atendenteOnline: true,
    nomeAtendente: 'Atendimento ConcreForte',
  });
  callback(initial);
  localListeners.settings.add(callback);
  return () => localListeners.settings.delete(callback);
}

export async function toggleSupportOnlineStatus(isOnline) {
  const payload = {
    atendenteOnline: isOnline,
    nomeAtendente: 'Atendimento ConcreForte',
    atualizadoEm: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'configuracoes', 'atendimento'), payload, { merge: true });
    return;
  }
  setLocalData(STORAGE_KEYS.SETTINGS, payload, 'settings');
}

export function subscribeAllChats(callback) {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'chats'), orderBy('atualizadoEm', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(items);
      },
      () => callback(getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS))
    );
  }

  const initial = getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS);
  callback(initial);
  localListeners.chats.add(callback);
  return () => localListeners.chats.delete(callback);
}

export function subscribeSingleChat(chatId, callback) {
  if (!chatId) return () => {};

  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    });
  }

  const notify = (allChats) => {
    const found = allChats.find((c) => c.id === chatId) || null;
    callback(found);
  };

  notify(getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS));
  localListeners.chats.add(notify);
  return () => localListeners.chats.delete(notify);
}

export async function startOrResumeClientChat({ nome, telefone, existingChatId }) {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    if (existingChatId) {
      return existingChatId;
    }
    const initialMsg = {
      id: `msg-${Date.now()}`,
      remetente: 'admin',
      autor: 'Atendimento ConcreForte',
      texto: `Olá ${nome.split(' ')[0]}! Bem-vindo à ConcreForte — Artefatos de Cimento (Quedas do Iguaçu e região). Como podemos ajudar na sua obra hoje?`,
      horario: now,
    };
    const payload = {
      clienteNome: nome,
      clienteTelefone: telefone,
      status: 'ativo',
      naoLidasAdmin: 0,
      naoLidasCliente: 0,
      ultimaMensagem: initialMsg.texto,
      atualizadoEm: now,
      mensagens: [initialMsg],
    };
    const docRef = await addDoc(collection(db, 'chats'), payload);
    return docRef.id;
  }

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
  return chatId;
}

export async function sendChatMessage(chatId, { remetente, autor, texto }) {
  const now = new Date().toISOString();
  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    remetente, // 'cliente' | 'admin'
    autor,
    texto: texto.trim(),
    horario: now,
  };

  if (isFirebaseConfigured && db) {
    const allSnap = await getDocs(collection(db, 'chats'));
    const targetDoc = allSnap.docs.find((d) => d.id === chatId);
    if (targetDoc) {
      const data = targetDoc.data();
      const mensagens = [...(data.mensagens || []), newMsg];
      await updateDoc(doc(db, 'chats', chatId), {
        mensagens,
        ultimaMensagem: newMsg.texto,
        atualizadoEm: now,
        naoLidasAdmin: remetente === 'cliente' ? (data.naoLidasAdmin || 0) + 1 : 0,
        naoLidasCliente: remetente === 'admin' ? (data.naoLidasCliente || 0) + 1 : 0,
      });
    }
    return newMsg;
  }

  const current = getLocalData(STORAGE_KEYS.CHATS, INITIAL_CHATS);
  const updated = current.map((chat) => {
    if (chat.id !== chatId) return chat;
    return {
      ...chat,
      mensagens: [...(chat.mensagens || []), newMsg],
      ultimaMensagem: newMsg.texto,
      atualizadoEm: now,
      naoLidasAdmin: remetente === 'cliente' ? (chat.naoLidasAdmin || 0) + 1 : 0,
      naoLidasCliente: remetente === 'admin' ? (chat.naoLidasCliente || 0) + 1 : 0,
    };
  });

  updated.sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm));
  setLocalData(STORAGE_KEYS.CHATS, updated, 'chats');
  return newMsg;
}

export async function markChatAsRead(chatId, viewerRole) {
  if (!chatId) return;

  if (isFirebaseConfigured && db) {
    const field = viewerRole === 'admin' ? 'naoLidasAdmin' : 'naoLidasCliente';
    try {
      await updateDoc(doc(db, 'chats', chatId), { [field]: 0 });
    } catch {
      // ignora se documento ainda não sincronizado
    }
    return;
  }

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
  }
}

// ----------------------------------------------------------------------------
// 4. AUTENTICAÇÃO ADMINISTRATIVA (Firebase Auth + Modo Demo Local)
// ----------------------------------------------------------------------------
export function subscribeAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return fbOnAuthStateChanged(auth, (user) => {
      callback(user);
    });
  }

  const savedUser = getLocalData(STORAGE_KEYS.AUTH, null);
  callback(savedUser);
  localListeners.auth.add(callback);
  return () => localListeners.auth.delete(callback);
}

export async function loginAdmin(email, password) {
  if (isFirebaseConfigured && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  const demoEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@concreforte.com.br';
  const demoPass = import.meta.env.VITE_DEMO_ADMIN_PASS || 'admin123';
  const normalizedEmail = email.trim().toLowerCase();

  if (
    (normalizedEmail === demoEmail.toLowerCase() ||
      normalizedEmail === 'admin@forteconcreto.com.br') &&
    password === demoPass
  ) {
    const mockUser = {
      uid: 'admin-local-01',
      email: 'admin@concreforte.com.br',
      displayName: 'Atendimento ConcreForte',
    };
    setLocalData(STORAGE_KEYS.AUTH, mockUser, 'auth');
    return mockUser;
  }

  throw new Error('Credenciais inválidas. Use admin@concreforte.com.br / admin123 ou configure o Firebase Auth.');
}

export async function logoutAdmin() {
  if (isFirebaseConfigured && auth) {
    await fbSignOut(auth);
    return;
  }
  setLocalData(STORAGE_KEYS.AUTH, null, 'auth');
}
