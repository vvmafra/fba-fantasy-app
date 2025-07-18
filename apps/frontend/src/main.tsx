import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/contexts/AuthContext'

// Script para forçar atualização do PWA no iOS
const forcePWARefresh = () => {
  // Verificar se é iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOS && 'serviceWorker' in navigator) {
    // Limpar caches antigos
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.startsWith('fba-cache-')) {
          caches.delete(cacheName);
        }
      });
    });

    // Forçar atualização do service worker
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.update();
      });
    });
  }
};

// Executar no carregamento
forcePWARefresh();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
