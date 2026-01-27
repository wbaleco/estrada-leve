# 🚛 Estrada Leve

**Aplicativo de Desafio de Emagrecimento para Caminhoneiros**

Um sistema gamificado completo para ajudar motoristas de caminhão a perderem peso de forma saudável, com acompanhamento de dieta, treinos, ranking e rede social integrada.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Deploy](#deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Scripts Úteis](#scripts-úteis)
- [Administração](#administração)

---

## 🎯 Sobre o Projeto

O **Estrada Leve** é uma plataforma web desenvolvida para criar desafios de emagrecimento entre caminhoneiros, transformando a jornada de perda de peso em uma experiência social, competitiva e motivadora.

### Principais Diferenciais:
- 🏆 **Sistema de Pontos e Ranking** - Gamificação completa
- 📊 **Cálculo Científico de TMB** - Fórmula Mifflin-St Jeor personalizada
- 🍽️ **Diário Alimentar Inteligente** - Estimativa automática de calorias
- 💪 **Treinos Validados por Vídeo** - Registro de exercícios com prova
- 📈 **Gráficos de Evolução** - Acompanhamento visual do progresso
- 👥 **Rede Social Integrada** - Mural de conquistas e apoio mútuo

---

## ✨ Funcionalidades

### 🏠 Dashboard
- Visão geral do desafio (dias restantes, pontos, peso perdido)
- Acesso rápido a todas as funcionalidades
- Alertas e notificações importantes

### 🍴 Diário Alimentar
- Registro de refeições com foto
- Seletor de densidade (Leve, Média, Pesada, Rodízio)
- Cálculo automático de meta calórica baseado em TMB
- Lista de compras compartilhada
- Histórico completo de refeições

### 🎯 Metas e Evolução
- Registro de peso e medidas
- Gráfico de evolução temporal
- Mural social com posts automáticos
- Sistema de curtidas e comentários

### 💪 Treinos
- Catálogo de exercícios (Cardio, Força, Flexibilidade)
- Gravação de vídeo para validação
- Pontuação por treino completado
- Galeria de treinos da comunidade

### 🏆 Ranking
- Classificação por pontos
- Estatísticas individuais
- Medalhas e conquistas
- Filtros e busca

### 👤 Perfil
- Edição de dados pessoais (idade, gênero, altura)
- Atualização de peso e meta
- Troca de senha com visualizador
- Galeria de medalhas

### 🛠️ Painel Admin (Apenas Administradores)
- Gerenciamento de usuários
- Criação de recursos (artigos/vídeos)
- Moderação de conteúdo
- Estatísticas gerais

---

## 🛠️ Tecnologias

### Frontend
- **React** + **TypeScript** - Framework principal
- **Vite** - Build tool
- **Recharts** - Gráficos de evolução
- **Tailwind CSS** - Estilização (via variáveis CSS customizadas)

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL (Banco de dados)
  - Authentication (Autenticação)
  - Storage (Armazenamento de imagens/vídeos)
  - Realtime (Atualizações em tempo real)

### Deploy
- **Vercel** - Hospedagem e CI/CD

---

## 🚀 Instalação

### Pré-requisitos
- Node.js (v18 ou superior)
- Conta no Supabase
- Conta na Vercel (para deploy)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/estrada-leve.git
   cd estrada-leve
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

4. **Execute o projeto localmente:**
   ```bash
   npm run dev
   ```

   Acesse: `http://localhost:3000`

---

## ⚙️ Configuração

### Configuração do Supabase

1. **Crie um projeto no Supabase:**
   - Acesse: https://supabase.com/dashboard
   - Clique em "New Project"

2. **Execute os scripts SQL:**
   
   No **SQL Editor** do Supabase, execute na ordem:
   
   a) **Schema inicial** (cria todas as tabelas):
   ```sql
   -- Cole o conteúdo do arquivo: reset_and_fix_everything.sql
   ```
   
   b) **Adicionar campos de idade e gênero**:
   ```sql
   ALTER TABLE user_stats 
   ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 40,
   ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
   
   NOTIFY pgrst, 'reload schema';
   ```

3. **Configure o Storage:**
   
   Crie os seguintes buckets em **Storage**:
   - `avatars` (público)
   - `meal-images` (público)
   - `workout-videos` (público)

4. **Desabilite confirmação de email** (opcional, para testes):
   
   Em **Authentication > Providers > Email**:
   - Desmarque "Confirm email"

---

## 🌐 Deploy

### Deploy na Vercel

1. **Faça commit das alterações:**
   ```bash
   git add .
   git commit -m "Preparação para deploy"
   git push
   ```

2. **A Vercel detecta automaticamente** e faz o deploy.

3. **Configure as variáveis de ambiente na Vercel:**
   - Vá em: Settings > Environment Variables
   - Adicione:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Acesse seu app:**
   - URL: `https://seu-projeto.vercel.app`

---

## 📁 Estrutura do Projeto

```
estrada-leve/
├── src/
│   ├── views/           # Telas principais
│   │   ├── Dashboard.tsx
│   │   ├── Diet.tsx
│   │   ├── Goals.tsx
│   │   ├── Schedule.tsx
│   │   ├── Ranking.tsx
│   │   ├── Profile.tsx
│   │   ├── Admin.tsx
│   │   ├── Login.tsx
│   │   └── Onboarding.tsx
│   ├── lib/
│   │   ├── api.ts       # Funções de integração com Supabase
│   │   └── supabase.ts  # Cliente Supabase
│   ├── types.ts         # Tipos TypeScript
│   ├── App.tsx          # Componente raiz
│   └── index.css        # Estilos globais
├── public/
│   └── logo.png         # Logo do app
├── vercel.json          # Configuração Vercel
├── package.json
└── README.md
```

---

## 📜 Scripts Úteis

### Scripts SQL (Execute no Supabase)

#### 1. **Resetar Dados (Manter Admin)**
```sql
-- Arquivo: soft_reset_keep_admin.sql
-- Limpa dados de uso mas mantém usuários e admin
```

#### 2. **Promover Usuário a Admin**
```sql
UPDATE user_stats
SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'seu_email@exemplo.com');
```

#### 3. **Verificar Segurança**
```sql
-- Arquivo: security_hardening.sql
-- Valida políticas RLS e permissões
```

---

## 👨‍💼 Administração

### Como se tornar Admin

1. Crie sua conta normalmente pelo app
2. Vá no **SQL Editor** do Supabase
3. Execute:
   ```sql
   UPDATE user_stats
   SET is_admin = true
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL');
   ```

### Funcionalidades Admin

- ✅ Acesso ao **Painel do Chefe**
- ✅ Gerenciar todos os usuários
- ✅ Criar artigos e vídeos educativos
- ✅ Moderar posts e comentários
- ✅ Visualizar estatísticas gerais

---

## 🤝 Contribuindo

Este é um projeto privado, mas sugestões são bem-vindas!

---

## 📄 Licença

Projeto proprietário - Todos os direitos reservados.

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o administrador do desafio.

---

**Desenvolvido com 💚 para os guerreiros da estrada!** 🚛💨
