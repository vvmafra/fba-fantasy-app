import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ConnectionTest = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [authStatus, setAuthStatus] = useState<any>(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    checkConnection();
    checkAuthStatus();
  }, [user]);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      setStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setStatus('offline');
    }
  };

  const checkAuthStatus = () => {
    const authInfo = {
      hasValidAuth: authStorage.hasValidAuth(),
      isTokenExpired: authStorage.isTokenExpired(),
      token: authStorage.getToken() ? 'Presente' : 'Ausente',
      refreshToken: authStorage.getRefreshToken() ? 'Presente' : 'Ausente',
      user: authStorage.getUser(),
      userId: authStorage.getUserId(),
      localStorageAvailable: (() => {
        try {
          const test = '__test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch {
          return false;
        }
      })()
    };
    setAuthStatus(authInfo);
  };

  const clearAuth = () => {
    authStorage.clearAuth();
    checkAuthStatus();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm">Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs">Conexão:</span>
            <Badge variant={status === 'online' ? 'default' : 'destructive'}>
              {status === 'checking' ? 'Verificando...' : status === 'online' ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs">Auth Context:</span>
            <Badge variant={user ? 'default' : 'secondary'}>
              {isLoading ? 'Carregando...' : user ? 'Logado' : 'Deslogado'}
            </Badge>
          </div>

          {authStatus && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs">Auth Válida:</span>
                <Badge variant={authStatus.hasValidAuth ? 'default' : 'destructive'}>
                  {authStatus.hasValidAuth ? 'Sim' : 'Não'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Token Expirado:</span>
                <Badge variant={authStatus.isTokenExpired ? 'destructive' : 'default'}>
                  {authStatus.isTokenExpired ? 'Sim' : 'Não'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs">localStorage:</span>
                <Badge variant={authStatus.localStorageAvailable ? 'default' : 'destructive'}>
                  {authStatus.localStorageAvailable ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>

              {authStatus.user && (
                <div className="text-xs text-muted-foreground">
                  <div>Usuário: {authStatus.user.email}</div>
                  <div>Time ID: {authStatus.user.teamId || 'Nenhum'}</div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={checkConnection} variant="outline">
              Testar Conexão
            </Button>
            <Button size="sm" onClick={checkAuthStatus} variant="outline">
              Verificar Auth
            </Button>
            <Button size="sm" onClick={clearAuth} variant="destructive">
              Limpar Auth
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionTest; 