import { useEffect, useCallback } from 'react';
import { authStorage, ensureValidToken } from '@/lib/auth';

export const useAuthPersistence = () => {
  // Verificar autenticação ao carregar a página
  const checkAuthOnLoad = useCallback(async () => {
    console.log('🔄 Verificando autenticação ao carregar...');
    
    try {
      // Verificar se há dados salvos
      if (authStorage.hasValidAuth()) {
        console.log('✅ Dados de autenticação encontrados');
        
        // Verificar se o token está válido
        const isValid = await ensureValidToken();
        if (isValid) {
          console.log('✅ Autenticação válida restaurada');
          return true;
        } else {
          console.log('❌ Token inválido, limpando dados');
          authStorage.clearAuth();
          return false;
        }
      } else {
        console.log('❌ Nenhum dado de autenticação encontrado');
        return false;
      }
    } catch (error) {
      console.error('🚨 Erro ao verificar autenticação:', error);
      return false;
    }
  }, []);

  // Salvar estado de autenticação antes de fechar a página
  const saveAuthBeforeUnload = useCallback(() => {
    console.log('💾 Salvando estado antes de fechar...');
    // O localStorage já é persistente, mas podemos adicionar logs
    if (authStorage.hasValidAuth()) {
      console.log('✅ Estado de autenticação preservado');
    }
  }, []);

  // Verificar autenticação quando a página volta ao foco
  const checkAuthOnFocus = useCallback(async () => {
    console.log('👁️ Página voltou ao foco, verificando autenticação...');
    await checkAuthOnLoad();
  }, [checkAuthOnLoad]);

  // Verificar autenticação quando a visibilidade muda
  const checkAuthOnVisibilityChange = useCallback(async () => {
    if (!document.hidden) {
      console.log('👁️ Página visível novamente, verificando autenticação...');
      await checkAuthOnLoad();
    }
  }, [checkAuthOnLoad]);

  useEffect(() => {
    // Verificar autenticação ao carregar
    checkAuthOnLoad();

    // Event listeners para persistência
    window.addEventListener('beforeunload', saveAuthBeforeUnload);
    window.addEventListener('focus', checkAuthOnFocus);
    document.addEventListener('visibilitychange', checkAuthOnVisibilityChange);

    // Verificar periodicamente (a cada 15 minutos)
    const interval = setInterval(async () => {
      if (authStorage.hasValidAuth()) {
        console.log('⏰ Verificação periódica de autenticação...');
        await ensureValidToken();
      }
    }, 15 * 60 * 1000); // 15 minutos

    return () => {
      window.removeEventListener('beforeunload', saveAuthBeforeUnload);
      window.removeEventListener('focus', checkAuthOnFocus);
      document.removeEventListener('visibilitychange', checkAuthOnVisibilityChange);
      clearInterval(interval);
    };
  }, [checkAuthOnLoad, saveAuthBeforeUnload, checkAuthOnFocus, checkAuthOnVisibilityChange]);

  return {
    checkAuthOnLoad,
    checkAuthOnFocus,
    checkAuthOnVisibilityChange
  };
}; 