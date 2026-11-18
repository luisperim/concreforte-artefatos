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

// Dados iniciais (Seed) de Artefatos de Cimento - ConcreForte (Quedas do Iguaçu - PR)
export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    nome: 'Bloco de Concreto Estrutural 14x19x39cm',
    categoria: 'Blocos e Tijolos',
    especificacoes: 'Resistência 4.5 MPa | Rendimento: 12,5 blocos/m² | NBR 6136',
    descricaoTecnica: 'Bloco vazado estrutural de alta resistência, ideal para muros de arrimo, galpões industriais e alvenaria estrutural.',
    unidade: 'un',
    preco: 4.35,
    estoque: 'Pronta Entrega em Quedas do Iguaçu',
    ativo: true,
    destaque: true,
    imagem: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-2',
    nome: 'Bloco de Vedação 09x19x39cm (Meio Bloco 10)',
    categoria: 'Blocos e Tijolos',
    especificacoes: 'Resistência 3.0 MPa | Rendimento: 12,5 blocos/m² | Parede 20mm',
    descricaoTecnica: 'Excelente acabamento superficial para muros residenciais, divisórias e fechamento de barracões com economia de argamassa.',
    unidade: 'un',
    preco: 3.40,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:05:00.000Z',
  },
  {
    id: 'prod-3',
    nome: 'Canaleta de Concreto 14x19x39cm (Viga/Cinta)',
    categoria: 'Blocos e Tijolos',
    especificacoes: 'Formato U | Rendimento: 2,5 peças/metro linear | Concreto Vibro-prensado',
    descricaoTecnica: 'Canaleta estrutural para execução de cintas de amarração, vergas, contravergas e vigas baldrame sem uso de caixaria de madeira.',
    unidade: 'un',
    preco: 5.20,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:10:00.000Z',
  },
  {
    id: 'prod-4',
    nome: 'Paver Holandês Intertravado 10x20x6cm (35 MPa)',
    categoria: 'Paver e Pisos',
    especificacoes: 'Resistência 35 MPa | Espessura 6cm | Consumo: 50 peças/m²',
    descricaoTecnica: 'Piso intertravado vibro-prensado para calçadas padrão prefeitura, estacionamentos, pátios comerciais e entradas de veículos.',
    unidade: 'm²',
    preco: 48.90,
    estoque: 'Pronta Entrega (Natural / Cinza)',
    ativo: true,
    destaque: true,
    imagem: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:15:00.000Z',
  },
  {
    id: 'prod-5',
    nome: 'Paver Tráfego Pesado 10x20x8cm (50 MPa)',
    categoria: 'Paver e Pisos',
    especificacoes: 'Resistência 50 MPa | Espessura 8cm | Consumo: 50 peças/m²',
    descricaoTecnica: 'Desenvolvido especialmente para cooperativas agrícolas, postos de combustível, pátios de manobra de carretas e armazéns de grãos.',
    unidade: 'm²',
    preco: 62.50,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: true,
    imagem: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:20:00.000Z',
  },
  {
    id: 'prod-6',
    nome: 'Piso Grama Concreto Armado 40x60x8cm',
    categoria: 'Paver e Pisos',
    especificacoes: 'Armado com ferro 4.2mm | Rendimento: 4,16 placas/m² | Drenante',
    descricaoTecnica: 'Placa drenante ecológica que mantém a permeabilidade do solo garantindo resistência para passagem e estacionamento de automóveis.',
    unidade: 'un',
    preco: 19.80,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:25:00.000Z',
  },
  {
    id: 'prod-7',
    nome: 'Tubo de Concreto Armado PA-1 Ø 60cm x 1,00m (Manilha)',
    categoria: 'Manilhas e Tubos',
    especificacoes: 'Diâmetro 600mm | Encaixe Ponta e Bolsa | Armação Simples PA-1',
    descricaoTecnica: 'Manilha de concreto armado para galerias de águas pluviais, bueiros de estradas rurais, travessias de córregos e drenagem urbana.',
    unidade: 'un',
    preco: 185.00,
    estoque: 'Pronta Entrega (Descarga c/ Munck)',
    ativo: true,
    destaque: true,
    imagem: 'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:30:00.000Z',
  },
  {
    id: 'prod-8',
    nome: 'Tubo de Concreto Armado PA-2 Ø 100cm x 1,00m',
    categoria: 'Manilhas e Tubos',
    especificacoes: 'Diâmetro 1000mm (1 metro) | Peso aprox. 780kg | Alta Carga PA-2',
    descricaoTecnica: 'Tubo de grande vazão para pontes rurais, represas, vazão de açudes e infraestrutura pesada de loteamentos.',
    unidade: 'un',
    preco: 460.00,
    estoque: 'Sob Encomenda / Estoque Regional',
    ativo: true,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:35:00.000Z',
  },
  {
    id: 'prod-9',
    nome: 'Mourão de Concreto Ponta Curva 10x10cm x 2,80m',
    categoria: 'Mourões e Estacas',
    especificacoes: 'Ponta inclinada 45° para 3 fios de arame farpado | Furos para tela',
    descricaoTecnica: 'Palanque reforçado com 4 barras de aço CA-50, ideal para cercamento de chácaras, indústrias, terrenos e propriedades rurais.',
    unidade: 'un',
    preco: 68.00,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: true,
    imagem: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:40:00.000Z',
  },
  {
    id: 'prod-10',
    nome: 'Mourão Reto Rural 11x11cm x 2,20m (Cerca Paraguaia)',
    categoria: 'Mourões e Estacas',
    especificacoes: 'Seção trapezoidal/quadrada | 6 furos passantes | Alta durabilidade',
    descricaoTecnica: 'Estaca de concreto armado imune a cupins, queimadas e umidade para divisas de pastagens, sítios e fazendas na região.',
    unidade: 'un',
    preco: 49.50,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:45:00.000Z',
  },
  {
    id: 'prod-11',
    nome: 'Laje Treliçada H8 com EPS (Isopor) - Sob Medida',
    categoria: 'Lajes e Pré-moldados',
    especificacoes: 'Vigota Treliçada TR8644 + Lajota EPS | Vãos até 4,20m',
    descricaoTecnica: 'Conjunto completo de vigotas treliçadas de concreto e enchimento em EPS de alta densidade. Reduz peso na estrutura e economiza escoramento.',
    unidade: 'm²',
    preco: 54.00,
    estoque: 'Fabricação sob medida (3 dias úteis)',
    ativo: true,
    destaque: true,
    imagem: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:50:00.000Z',
  },
  {
    id: 'prod-12',
    nome: 'Meio-Fio (Guia de Concreto) Padrão Loteamento 80x25x12cm',
    categoria: 'Acabamentos',
    especificacoes: 'Resistência 25 MPa | Rendimento: 1,25 peças/metro linear',
    descricaoTecnica: 'Guia pré-moldada para contenção lateral de pavimentação em paver, arruamentos, jardins e estacionamentos.',
    unidade: 'un',
    preco: 21.00,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T10:55:00.000Z',
  },
  {
    id: 'prod-13',
    nome: 'Pingadeira de Concreto para Muro 19x80cm',
    categoria: 'Acabamentos',
    especificacoes: 'Com friso pingadeira duplo | Acabamento liso aparente',
    descricaoTecnica: 'Protege a pintura e o reboco do muro contra manchas de chuva e infiltrações, conferindo acabamento limpo e moderno.',
    unidade: 'un',
    preco: 16.50,
    estoque: 'Pronta Entrega',
    ativo: true,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    criadoEm: '2026-11-01T11:00:00.000Z',
  },
];

export const QUOTE_FUNNEL_STATUSES = [
  'Novo',
  'Em Negociação',
  'Venda Fechada',
  'Perdido / Cancelado',
];

export const INITIAL_QUOTES = [
  {
    id: 'orc-1042',
    protocolo: 'CF-2026-8419',
    clienteNome: 'Valdir Aparecido Souza (Mestre de Obras)',
    clienteTelefone: '(46) 99918-4430',
    clienteTelefoneDigitos: '46999184430',
    itens: [
      {
        id: 'prod-4',
        nome: 'Paver Holandês Intertravado 10x20x6cm (35 MPa)',
        unidade: 'm²',
        quantidade: 85,
        precoUnitario: 48.90,
        subtotal: 4156.50,
      },
      {
        id: 'prod-12',
        nome: 'Meio-Fio (Guia de Concreto) Padrão Loteamento 80x25x12cm',
        unidade: 'un',
        quantidade: 40,
        precoUnitario: 21.00,
        subtotal: 840.00,
      },
    ],
    valorTotal: 4996.50,
    status: 'Novo',
    criadoEm: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'orc-1041',
    protocolo: 'CF-2026-7902',
    clienteNome: 'Agropecuária Iguaçu',
    clienteTelefone: '(46) 99945-1180',
    clienteTelefoneDigitos: '46999451180',
    itens: [
      {
        id: 'prod-7',
        nome: 'Tubo de Concreto Armado PA-1 Ø 60cm x 1,00m (Manilha)',
        unidade: 'un',
        quantidade: 16,
        precoUnitario: 185.00,
        subtotal: 2960.00,
      },
      {
        id: 'prod-10',
        nome: 'Mourão Reto Rural 11x11cm x 2,20m (Cerca Paraguaia)',
        unidade: 'un',
        quantidade: 60,
        precoUnitario: 49.50,
        subtotal: 2970.00,
      },
    ],
    valorTotal: 5930.00,
    status: 'Em Negociação',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'orc-1040',
    protocolo: 'CF-2026-7115',
    clienteNome: 'Eng. Marcos Peralta - Construtora Aliança',
    clienteTelefone: '(46) 99901-8821',
    clienteTelefoneDigitos: '46999018821',
    itens: [
      {
        id: 'prod-1',
        nome: 'Bloco de Concreto Estrutural 14x19x39cm',
        unidade: 'un',
        quantidade: 2400,
        precoUnitario: 4.35,
        subtotal: 10440.00,
      },
      {
        id: 'prod-3',
        nome: 'Canaleta de Concreto 14x19x39cm (Viga/Cinta)',
        unidade: 'un',
        quantidade: 320,
        precoUnitario: 5.20,
        subtotal: 1664.00,
      },
    ],
    valorTotal: 12104.00,
    status: 'Venda Fechada',
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const INITIAL_CHATS = [
  {
    id: 'chat-demo-1',
    clienteNome: 'João Batista (Empreiteiro)',
    clienteTelefone: '(46) 99932-1049',
    status: 'ativo',
    naoLidasAdmin: 1,
    naoLidasCliente: 0,
    ultimaMensagem: 'Conseguem entregar 1.500 blocos de 14 amanhã cedo aqui em Quedas do Iguaçu?',
    atualizadoEm: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    mensagens: [
      {
        id: 'msg-1',
        remetente: 'sistema',
        texto: 'Atendimento iniciado com ConcreForte — Artefatos de Cimento.',
        horario: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'msg-2',
        remetente: 'cliente',
        autor: 'João Batista (Empreiteiro)',
        texto: 'Bom dia! Vocês têm bloco estrutural 14x19x39 a pronta entrega?',
        horario: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      },
      {
        id: 'msg-3',
        remetente: 'admin',
        autor: 'Atendimento ConcreForte',
        texto: 'Bom dia, Sr. João! Temos sim, lote curado com laudo de 4.5 MPa a pronta entrega em nosso pátio em Quedas do Iguaçu.',
        horario: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
      },
      {
        id: 'msg-4',
        remetente: 'cliente',
        autor: 'João Batista (Empreiteiro)',
        texto: 'Conseguem entregar 1.500 blocos de 14 amanhã cedo aqui em Quedas do Iguaçu?',
        horario: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      },
    ],
  },
  {
    id: 'chat-demo-2',
    clienteNome: 'Cláudia Mendes',
    clienteTelefone: '(46) 99108-7752',
    status: 'ativo',
    naoLidasAdmin: 0,
    naoLidasCliente: 0,
    ultimaMensagem: 'Perfeito! Vou adicionar os 65m² de paver no carrinho de orçamento então. Obrigada!',
    atualizadoEm: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    mensagens: [
      {
        id: 'msg-201',
        remetente: 'cliente',
        autor: 'Cláudia Mendes',
        texto: 'Olá, para garagem de caminhonete qual espessura de paver vocês recomendam?',
        horario: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
      },
      {
        id: 'msg-202',
        remetente: 'admin',
        autor: 'Atendimento ConcreForte',
        texto: 'Olá Cláudia! Para garagem residencial e caminhonetes, o Paver Holandês 6cm (35 MPa) atende com folga! Se houver entrada de caminhões pesados, indicamos o de 8cm.',
        horario: new Date(Date.now() - 1000 * 60 * 98).toISOString(),
      },
      {
        id: 'msg-203',
        remetente: 'cliente',
        autor: 'Cláudia Mendes',
        texto: 'Perfeito! Vou adicionar os 65m² de paver no carrinho de orçamento então. Obrigada!',
        horario: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
    ],
  },
];

// ============================================================================
// MOTOR DE SINCRONIZAÇÃO EM TEMPO REAL (FIRESTORE + FALLBACK LOCAL REATIVO)
// ============================================================================
const STORAGE_KEYS = {
  PRODUCTS: 'cf_produtos_v2',
  QUOTES: 'cf_orcamentos_v3',
  CHATS: 'cf_chats_v2',
  SETTINGS: 'cf_settings_v2',
  AUTH: 'cf_admin_auth_v2',
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
