import { Card, CardContent } from '@/components/ui/card';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-80 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <img 
              src="/logo-red.png" 
              alt="FBA Logo" 
              className="w-16 h-16 mx-auto animate-pulse"
            />
          </div>
          
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-sm text-gray-600 font-medium">
              Verificando autenticação...
            </p>
            <p className="text-xs text-gray-500">
              FBA 2k Fantasy League
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingScreen; 