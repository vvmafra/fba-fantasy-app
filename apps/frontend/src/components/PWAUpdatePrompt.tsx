import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Declaração de tipo para navigator.standalone (iOS)
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const PWAUpdatePrompt = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Mostrar prompt se for iOS e estiver em modo standalone
    if (iOS && window.navigator.standalone) {
      setShowPrompt(true);
    }
  }, []);

  const forceUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Limpar todos os caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('fba-cache-')) {
            return caches.delete(cacheName);
          }
        })
      );

      // Forçar atualização do service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            return registration.update();
          })
        );
      }

      // Recarregar a página
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Erro ao atualizar PWA:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const removeFromHomeScreen = () => {
    // Instruções para remover e reinstalar
    alert(
      'Para atualizar o ícone:\n\n' +
      '1. Pressione e segure o ícone do FBA\n' +
      '2. Selecione "Remover App"\n' +
      '3. Abra o Safari e vá para o site\n' +
      '4. Toque no botão de compartilhar (quadrado com seta)\n' +
      '5. Selecione "Adicionar à Tela Inicial"\n' +
      '6. O novo ícone vermelho será instalado!'
    );
  };

  if (!isIOS || !showPrompt) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="destructive">iOS</Badge>
            Atualizar Ícone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            O ícone do PWA pode estar desatualizado. Use uma das opções abaixo:
          </p>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={forceUpdate} 
              disabled={isUpdating}
              variant="outline"
            >
              {isUpdating ? 'Atualizando...' : 'Forçar Atualização'}
            </Button>
            
            <Button 
              size="sm" 
              onClick={removeFromHomeScreen}
              variant="secondary"
            >
              Remover e Reinstalar
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Dica: Se o ícone continuar preto, remova o app da tela inicial e adicione novamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAUpdatePrompt; 