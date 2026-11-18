# ConcreForte — Artefatos de Cimento (Quedas do Iguaçu - PR e Região)

Aplicação web Full-Stack responsiva e moderna desenvolvida para a **ConcreForte — Artefatos de Cimento**, localizada em **Quedas do Iguaçu - PR**, atendendo toda a região com venda direta de fábrica, agilidade no orçamento, entrega com caminhão munck e atendimento em tempo real.

## Stack Tecnológica
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + Lucide React
- **Backend / BaaS:** Firebase (Firestore Database, Firebase Auth, Firebase Storage e Firebase Hosting) + Motor Híbrido Reativo (sincronização instantânea entre abas via `BroadcastChannel` e `localStorage` mesmo antes de configurar o `.env`)
- **Rotas:** React Router DOM (`/`, `/admin`, `/admin/login`)

---

## Como Executar Localmente

```bash
cd c:\Programacao\artefatos-cimento
npm install
npm run dev
```

### Acesso Rápido ao Painel Administrativo (`/admin`)
No modo de demonstração (sem `.env` configurado):
- **URL:** `http://localhost:5173/admin`
- **E-mail:** `admin@concreforte.com.br`
- **Senha:** `admin123`

### Dados de Contato Configurados
- **Empresa:** ConcreForte — Artefatos de Cimento
- **CNPJ:** 15.027.148/0001-97
- **Localização:** Quedas do Iguaçu - PR | Atendemos Quedas do Iguaçu e toda a região
- **WhatsApp Oficial:** (46) 99911-5137 (`https://wa.me/5546999115137`)
