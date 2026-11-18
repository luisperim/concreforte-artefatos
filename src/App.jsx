import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QuoteCartProvider } from './contexts/QuoteCartContext';
import Navbar from './components/Navbar';
import QuoteDrawer from './components/QuoteDrawer';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedAdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] text-slate-800 flex items-center justify-center text-sm font-bold">
        Carregando Painel Administrativo ConcreForte...
      </div>
    );
  }

  return user ? <AdminDashboard /> : <AdminLogin />;
}

export default function App() {
  return (
    <AuthProvider>
      <QuoteCartProvider>
        <BrowserRouter>
          <Navbar />
          <QuoteDrawer />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<ProtectedAdminRoute />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatWidget />
        </BrowserRouter>
      </QuoteCartProvider>
    </AuthProvider>
  );
}
