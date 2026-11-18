import React, { createContext, useContext, useState, useEffect } from 'react';

const QuoteCartContext = createContext(null);

const CART_STORAGE_KEY = 'fc_quote_cart_v1';

export function QuoteCartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastAddedToast, setLastAddedToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Erro ao salvar carrinho:', e);
    }
  }, [items]);

  const addItem = (product, quantity = 1) => {
    const qtyToAdd = Number(quantity) > 0 ? Number(quantity) : 1;
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantidade: updated[existingIndex].quantidade + qtyToAdd,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: product.id,
          nome: product.nome,
          categoria: product.categoria,
          preco: Number(product.preco),
          unidade: product.unidade,
          imagem: product.imagem,
          especificacoes: product.especificacoes,
          quantidade: qtyToAdd,
        },
      ];
    });

    setLastAddedToast({
      id: Date.now(),
      nome: product.nome,
      quantidade: qtyToAdd,
      unidade: product.unidade,
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const parsed = Number(newQuantity);
    if (parsed <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantidade: parsed } : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalValue = items.reduce(
    (sum, item) => sum + Number(item.preco) * Number(item.quantidade),
    0
  );

  const totalItemsCount = items.length;

  return (
    <QuoteCartContext.Provider
      value={{
        items,
        isDrawerOpen,
        setIsDrawerOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalValue,
        totalItemsCount,
        lastAddedToast,
        setLastAddedToast,
      }}
    >
      {children}
    </QuoteCartContext.Provider>
  );
}

export function useQuoteCart() {
  const ctx = useContext(QuoteCartContext);
  if (!ctx) {
    throw new Error('useQuoteCart deve ser usado dentro de um QuoteCartProvider');
  }
  return ctx;
}
