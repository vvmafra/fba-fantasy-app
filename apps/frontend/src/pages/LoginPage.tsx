import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { Trophy } from 'lucide-react';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-nba-blue to-nba-orange flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
                <img src="/logo.png" alt="FBA 2k Fantasy League" className="w-[110px] h-[110px]" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              FBA 2k Fantasy League
            </CardTitle>
            <CardDescription className="text-gray-600">
              Faça login para gerenciar seu time de basquete
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <GoogleLoginButton />
            </div>
            
            {/* <div className="text-center">
              <p className="text-sm text-gray-500">
                Ao fazer login, você concorda com nossos{' '}
                <a href="#" className="text-nba-blue hover:underline">
                  Termos de Serviço
                </a>{' '}
                e{' '}
                <a href="#" className="text-nba-blue hover:underline">
                  Política de Privacidade
                </a>
              </p>
            </div> */}
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-white text-sm opacity-90">
            Aplicativo para gerenciamento de times da FBA 2k Fantasy League
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 