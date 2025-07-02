# Configuração de Autenticação Google

## 1. Configurar Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure:
   - Application type: Web application
   - Name: FBA Manager
   - Authorized JavaScript origins: `http://localhost:5173` (para desenvolvimento)
   - Authorized redirect URIs: `http://localhost:5173`

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend com:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend Configuration
VITE_BACKEND_URL=http://localhost:4000
```

## 3. Próximos Passos

1. **Backend**: Criar rota `/auth/google-login` para validar o token
2. **Frontend**: Implementar lógica de logout
3. **Frontend**: Adicionar proteção de rotas (autenticação obrigatória)

## 4. Testando

1. Execute o frontend: `npm run dev`
2. Acesse `http://localhost:5173`
3. Clique no botão "Sign in with Google"
4. Verifique no console se o token está sendo enviado para o backend 