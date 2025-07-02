# FBA Backend API

Backend da aplicação FBA (Fantasy Basketball App) construído com Node.js, Express e TypeScript.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Linguagem tipada
- **Supabase** - Banco de dados e autenticação
- **Zod** - Validação de dados
- **Helmet** - Segurança
- **Morgan** - Logging

## 📁 Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── services/        # Lógica de negócio
├── routes/          # Definição de rotas
├── middlewares/     # Middlewares customizados
├── types/           # Tipos TypeScript
├── validations/     # Schemas de validação Zod
├── utils/           # Utilitários e helpers
└── server.ts        # Arquivo principal
```

## 🛠️ Instalação

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações do Supabase.

3. **Executar em desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Build para produção:**
   ```bash
   npm run build
   npm start
   ```

## 📡 Endpoints da API

### Players

- `GET /api/v1/players` - Listar todos os players (com paginação)
- `GET /api/v1/players/:id` - Buscar player por ID
- `POST /api/v1/players` - Criar novo player
- `PUT /api/v1/players/:id` - Atualizar player
- `DELETE /api/v1/players/:id` - Deletar player
- `GET /api/v1/players/position/:position` - Buscar por posição
- `GET /api/v1/players/team/:team` - Buscar por time

### Health Check

- `GET /api/v1/health` - Verificar status da API

## 🔧 Scripts Disponíveis

- `npm run dev` - Executar em modo desenvolvimento com hot reload
- `npm run build` - Compilar TypeScript para JavaScript
- `npm start` - Executar versão compilada
- `npm run lint` - Executar linter
- `npm run type-check` - Verificar tipos TypeScript

## 🗄️ Banco de Dados

O projeto utiliza Supabase como banco de dados. Certifique-se de:

1. Ter uma conta no Supabase
2. Configurar as variáveis de ambiente no arquivo `.env`
3. Criar a tabela `players` com a estrutura adequada

### Estrutura da Tabela Players

```sql
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(2) NOT NULL CHECK (position IN ('PG', 'SG', 'SF', 'PF', 'C')),
  team VARCHAR(100),
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 50),
  salary DECIMAL(10,2),
  stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Deploy

O projeto está configurado para deploy na Vercel. Para fazer o deploy:

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente na Vercel
3. O build será executado automaticamente

## 📝 Licença

MIT 