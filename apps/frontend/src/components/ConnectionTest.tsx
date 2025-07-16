import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { config } from '@/lib/config';

export const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  const testConnection = async () => {
    setStatus('loading');
    setMessage('Testando conexão...');
    
    try {
      console.log('🔗 Testando conexão com:', config.apiUrl);
      
      const response = await apiRequest.get('/health');
      
      setStatus('success');
      setMessage('✅ Conexão estabelecida com sucesso!');
      setDetails(response);
      
      console.log('✅ Resposta do servidor:', response);
    } catch (error: any) {
      setStatus('error');
      setMessage('❌ Erro ao conectar com o servidor');
      setDetails({
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: config.apiUrl
      });
      
      console.error('❌ Erro de conexão:', error);
    }
  };

  useEffect(() => {
    // Testar conexão automaticamente ao montar o componente
    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🔗 Teste de Conexão</h3>
      
      <div className="space-y-2">
        <div>
          <strong>URL da API:</strong> {config.apiUrl}
        </div>
        
        <div>
          <strong>Status:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            status === 'success' ? 'bg-green-100 text-green-800' :
            status === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status === 'idle' && 'Aguardando...'}
            {status === 'loading' && 'Testando...'}
            {status === 'success' && 'Conectado'}
            {status === 'error' && 'Erro'}
          </span>
        </div>
        
        <div>
          <strong>Mensagem:</strong> {message}
        </div>
        
        {details && (
          <div>
            <strong>Detalhes:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
        
        <button
          onClick={testConnection}
          disabled={status === 'loading'}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {status === 'loading' ? 'Testando...' : 'Testar Novamente'}
        </button>
      </div>
    </div>
  );
}; 