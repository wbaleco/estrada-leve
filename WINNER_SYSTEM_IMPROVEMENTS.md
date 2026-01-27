# Melhorias do Sistema de Vencedores - Estrada Leve

## 📊 Resumo das Melhorias Implementadas

Este documento descreve as melhorias implementadas no sistema de determinação de vencedores do aplicativo Estrada Leve.

## 🎯 Objetivos

1. **Sistema de Vencedor com Dois Fatores:**
   - Peso e percentual de peso perdido (60% do score)
   - Medidas reduzidas - cintura/barriga (40% do score)

2. **Histórico Completo de Pesagens:**
   - Rastreamento de todas as medidas anteriores
   - Visualização do progresso ao longo do tempo

## 🗄️ Mudanças no Banco de Dados

### Novas Colunas em `user_stats`
- `start_waist_cm` - Medida inicial da cintura
- `waist_lost` - Total de centímetros perdidos na cintura

### Nova Tabela: `measurement_history`
```sql
CREATE TABLE measurement_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    weight NUMERIC NOT NULL,
    waist_cm NUMERIC,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Nova View: `winner_rankings`
View que calcula automaticamente:
- `weight_loss_percentage` - Percentual de peso perdido
- `waist_reduction_percentage` - Percentual de redução da cintura
- `combined_score` - Score combinado (60% peso + 40% cintura)

### Nova Função RPC: `update_user_measurements`
Função que:
1. Atualiza peso e cintura do usuário
2. Calcula automaticamente as perdas
3. Insere no histórico
4. Premia pontos por progresso

## 💻 Mudanças no Frontend

### Novos Tipos TypeScript
```typescript
interface MeasurementHistory {
  id: string;
  userId: string;
  weight: number;
  waistCm?: number;
  date: string;
  notes?: string;
  createdAt: string;
}

interface WinnerRanking {
  userId: string;
  nickname: string;
  currentWeight: number;
  startWeight: number;
  weightLost: number;
  waistCm?: number;
  startWaistCm?: number;
  waistLost?: number;
  weightLossPercentage: number;
  waistReductionPercentage: number;
  combinedScore: number;
}
```

### Novas Funções de API
- `getMeasurementHistory()` - Busca histórico de medidas do usuário
- `addMeasurement(weight, waistCm?, notes?)` - Adiciona nova medida
- `getWinnerRankings()` - Busca ranking de vencedores

### Nova View: `Winners.tsx`
Componente que exibe:
- Pódio dos top 3 vencedores
- Ranking completo com scores combinados
- Explicação dos critérios de pontuação
- Histórico de medidas do usuário

### Atualizações em `Goals.tsx`
- Agora usa `addMeasurement()` ao invés de `updateWeight()`
- Melhor feedback sobre pontos ganhos

## 📱 Como Usar

### Para Usuários

1. **Registrar Medidas:**
   - Vá para a aba "Metas"
   - Clique em "Registrar Peso"
   - Insira peso e medida da barriga (opcional)
   - Ganhe pontos por registrar!

2. **Ver Ranking:**
   - Acesse a nova aba "Ranking" (ícone de troféu)
   - Veja o pódio dos top 3
   - Confira sua posição no ranking
   - Expanda "Meu Histórico de Medidas" para ver seu progresso

3. **Entender o Score:**
   - **60%** vem do percentual de peso perdido
   - **40%** vem do percentual de redução da barriga
   - Quanto maior o score combinado, melhor a posição!

### Para Administradores

1. **Aplicar Migração SQL:**
   ```bash
   # Execute o arquivo SQL no Supabase
   winner_system_improvements.sql
   ```

2. **Verificar Dados:**
   - Confira se a view `winner_rankings` está funcionando
   - Teste a função `update_user_measurements`

## 🔧 Arquivos Modificados

### SQL
- `winner_system_improvements.sql` - Migração principal

### TypeScript
- `src/types.ts` - Novos tipos e interfaces
- `src/lib/api.ts` - Novas funções de API
- `src/views/Winners.tsx` - Nova view de ranking
- `src/views/Goals.tsx` - Atualização para usar novo sistema
- `src/App.tsx` - Adição da nova view ao menu

## 🎨 Design

A nova view Winners segue o design system do app:
- Cores vibrantes com gradientes
- Animações suaves
- Pódio visual para os top 3
- Cards informativos
- Responsivo e otimizado para mobile

## 📈 Benefícios

1. **Mais Justo:** Considera múltiplos fatores de saúde
2. **Motivador:** Histórico visual do progresso
3. **Transparente:** Critérios claros de pontuação
4. **Completo:** Rastreamento detalhado de medidas

## 🚀 Próximos Passos Sugeridos

- [ ] Adicionar gráficos de evolução no histórico
- [ ] Notificações quando subir no ranking
- [ ] Metas personalizadas de redução de medidas
- [ ] Comparação com média da comunidade
- [ ] Exportar histórico em PDF

## 📝 Notas Técnicas

- A migração é retrocompatível
- Dados existentes em `goals_weight_history` são migrados automaticamente
- RLS (Row Level Security) está habilitado em todas as novas tabelas
- Índices criados para performance otimizada
