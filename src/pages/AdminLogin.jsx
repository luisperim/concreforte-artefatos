import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HardHat,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '../services/firebase';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@concreforte.com.br');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(
        err.message ||
          'Não foi possível autenticar. Verifique seu e-mail e senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col justify-center items-center px-4 py-12 text-slate-800">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Vitrine da ConcreForte
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-6 text-slate-800 flex items-center gap-3.5 border-b border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-xs">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-orange-600 font-bold block">
                Painel Administrativo
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
                ConcreForte — PR
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!isFirebaseConfigured && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    Modo Demonstração Ativo (Sem .env Firebase)
                  </strong>
                  Credenciais preenchidas automaticamente:{' '}
                  <code className="font-mono bg-amber-100 px-1 rounded">
                    admin@concreforte.com.br
                  </code>{' '}
                  / <code className="font-mono bg-amber-100 px-1 rounded">admin123</code>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@concreforte.com.br"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:border-orange-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Autenticando...' : 'Entrar no Painel Admin'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
