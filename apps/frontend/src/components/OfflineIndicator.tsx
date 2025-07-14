import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Alert, AlertDescription } from './ui/alert';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Alert className="border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Você está offline. Algumas funcionalidades podem não estar disponíveis.
        </AlertDescription>
      </Alert>
    </div>
  );
}; 