import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, Download, Bell } from 'lucide-react';
import { toast } from './ui/use-toast';

export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, isInstalled, isOnline, installPWA, requestNotificationPermission } = usePWA();
  const [showPrompt, setShowPrompt] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  // Não mostrar se já está instalado ou não pode instalar
  if (isInstalled || !canInstall || !showPrompt) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      // Erro ao instalar
      toast({
        title: "Erro",
        description: "Não foi possível instalar o aplicativo.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleNotificationPermission = async () => {
    await requestNotificationPermission();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="shadow-lg border-2 border-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Instalar FBA App
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Instale o app para uma experiência melhor no seu dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling || !isOnline}
              className="w-full"
            >
              {isInstalling ? 'Instalando...' : 'Instalar App'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleNotificationPermission}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Ativar Notificações
            </Button>
          </div>
          
          {!isOnline && (
            <p className="text-sm text-orange-600 text-center">
              Conecte-se à internet para instalar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 