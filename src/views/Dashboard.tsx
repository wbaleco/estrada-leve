
import React, { useState, useEffect } from 'react';
import { View, UserStats } from '../types';
import { api } from '../lib/api';

interface DashboardProps {
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [notification, setNotification] = useState<any | null>(null);

  const loadData = () => {
    api.getUserStats().then(setStats).catch(console.error);
    api.getDailyGoals().then(setGoals).catch(console.error);
    api.getNotifications().then(list => {
      if (list && list.length > 0) setNotification(list[0]);
    }).catch(console.error);
    api.checkAndAwardMedals().catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddGoal = async (id: string, type: string) => {
    try {
      // Custom increments per type
      const increment = type === 'hydration' ? 0.5 : type === 'movement' ? 5 : 1;
      await api.updateDailyGoal(id, increment);
      loadData();
      window.showToast('Progresso registrado! 🚀', 'success');
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao atualizar objetivo', 'error');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => onNavigate(View.PROFILE)}>
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary"
              style={{ backgroundImage: `url('${stats?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}')` }}
            />
            <div className="absolute bottom-0 right-0 size-3 bg-primary rounded-full border-2 border-background-dark"></div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-normal text-gray-500 dark:text-gray-400 leading-none">Olá, {stats?.nickname || 'Parceiro'}</h2>
            <span className="text-base font-bold leading-tight">Estrada Leve</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats?.isAdmin && (
            <button
              onClick={() => onNavigate(View.ADMIN)}
              className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all"
              title="Painel Admin"
            >
              <span className="material-symbols-outlined font-bold">admin_panel_settings</span>
            </button>
          )}
          <button
            onClick={() => window.toggleTheme()}
            className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Alterar Tema"
          >
            <span className="material-symbols-outlined text-[#adcb90]">dark_mode</span>
          </button>
          <button className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => onNavigate(View.PROFILE)}>
            <span className="material-symbols-outlined text-[#adcb90]">settings</span>
          </button>
          <button
            onClick={() => api.signOut()}
            className="flex items-center justify-center size-10 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
            title="Sair"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>

      {/* Welcome Title */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-3xl font-black text-[var(--text-primary)] leading-tight mb-2 tracking-tight">Bem-vindo, Parceiro!</h1>
        <p className="text-[var(--text-secondary)] text-base font-medium leading-relaxed">
          Transforme cada parada em um passo para sua saúde. Vamos juntos nessa jornada!
        </p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="px-4 mb-2 animate-in slide-in-from-top duration-700">
          <div className={`p-4 rounded-2xl border-2 flex items-start gap-4 shadow-lg ${notification.type === 'urgent' ? 'bg-red-500/10 border-red-500/30' :
              notification.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                'bg-primary/10 border-primary/30'
            }`}>
            <span className={`material-symbols-outlined mt-0.5 ${notification.type === 'urgent' ? 'text-red-500' :
                notification.type === 'success' ? 'text-green-500' :
                  'text-primary'
              }`}>
              {notification.icon || 'campaign'}
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">{notification.title}</h4>
              <p className="text-xs font-bold text-[var(--text-secondary)] mt-1 leading-relaxed">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-3 p-4">
        <StatCard icon="calendar_month" label="Dia" value={stats?.day.toString() || "-"} total={`/ ${stats?.totalDays || "-"}`} />
        <StatCard icon="monitor_weight" label="Perdidos" value={stats?.weightLost.toString() || "-"} unit="kg" />
        <StatCard icon="stars" label="Pontos" value={stats?.points.toString() || "-"} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-8">
        <button
          onClick={() => onNavigate(View.SCHEDULE)}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-primary text-background-dark rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl">add_circle</span>
          <span>Registrar Treino</span>
        </button>
        <button
          onClick={() => onNavigate(View.DIET)}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-card-dark text-gray-900 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl text-primary">restaurant</span>
          <span>Diário Alimentar</span>
        </button>
      </div>

      {/* Daily Goals */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <h3 className="text-lg font-black text-[var(--text-primary)] leading-tight uppercase tracking-wider text-xs">Objetivos de Hoje</h3>
        <button className="text-primary text-xs font-black hover:underline uppercase tracking-widest">Ver todos</button>
      </div>
      <div className="px-4 flex flex-col gap-3">
        {goals.map(goal => (
          <GoalRow
            key={goal.id}
            icon={goal.icon}
            label={goal.label}
            current={`${goal.current}${goal.unit}`}
            target={`${goal.target}${goal.unit}`}
            progress={(goal.current / goal.target) * 100}
            color={goal.color}
            completed={goal.completed}
            onAdd={() => handleAddGoal(goal.id, goal.type)}
          />
        ))}
        {goals.length === 0 && (
          <p className="text-center text-[var(--text-muted)] text-sm py-4 italic">
            Rodou o script daily_goals.sql?
          </p>
        )}
      </div>

      {/* Tip of the Day - REMOVED */}
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; total?: string; unit?: string }> = ({ icon, label, value, total, unit }) => (
  <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-[var(--card)] shadow-sm border border-[var(--card-border)]">
    <div className="flex items-center gap-2 mb-1">
      <span className="material-symbols-outlined text-primary text-[18px] font-bold">{icon}</span>
      <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-2xl font-black text-[var(--text-primary)] leading-tight">
      {value} {total && <span className="text-xs font-bold text-[var(--text-muted)]">{total}</span>} {unit && <span className="text-xs font-bold text-[var(--text-muted)]">{unit}</span>}
    </p>
  </div>
);

const GoalRow: React.FC<{ icon: string; label: string; current: string; target: string; progress: number; color: string; completed?: boolean; onAdd: () => void }> = ({ icon, label, current, target, progress, color, completed, onAdd }) => (
  <div className={`flex items-center gap-4 p-4 rounded-2xl bg-[var(--card)] border transition-all duration-300 ${completed ? 'border-primary shadow-lg shadow-primary/10' : 'border-[var(--card-border)] shadow-sm'}`}>
    <div className={`size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10`}>
      <span className={`material-symbols-outlined text-primary font-bold`}>{icon}</span>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <p className={`text-sm font-black tracking-tight ${completed ? 'text-primary' : 'text-[var(--text-primary)]'}`}>{label}</p>
        <span className={`text-[10px] font-black tracking-tighter ${completed ? 'text-primary' : 'text-[var(--text-muted)]'}`}>{current} / {target}</span>
      </div>
      <div className="h-4 w-full bg-black/30 dark:bg-white/5 rounded-full overflow-hidden shadow-inner mb-2 border border-white/5">
        <div
          className={`h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(140,244,37,0.7)] relative ${completed ? 'brightness-110' : ''}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* Shine effect for a premium "filled" look */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-white/30 to-white/10 opacity-50"></div>
          {/* Animating highlight for progress */}
          <div className="absolute inset-0 w-full animate-pulse bg-white/10"></div>
        </div>
      </div>
    </div>
    <button
      onClick={onAdd}
      disabled={completed}
      className={`size-8 rounded-full flex items-center justify-center transition-all transform active:scale-90 ${completed ? 'bg-primary text-background-dark shadow-lg' : 'bg-primary/20 hover:bg-primary text-primary hover:text-background-dark border border-primary/20'}`}
    >
      <span className="material-symbols-outlined text-xl">{completed ? 'check_circle' : 'add'}</span>
    </button>
  </div>
);

export default Dashboard;
