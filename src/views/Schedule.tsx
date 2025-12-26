
import React, { useState } from 'react';

import { api } from '../lib/api';
import { Activity } from '../types';

const Schedule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', duration: '30 min', type: 'external', icon: 'exercise' });

  const loadActivities = () => {
    api.getActivities(filter).then(setActivities).catch(console.error);
  };

  React.useEffect(() => {
    loadActivities();
  }, [filter]);

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const newState = !completed;
      await api.toggleActivity(id, newState);
      loadActivities();
      if (newState) {
        window.showToast('Treino concluído! +50 pontos', 'success');
      } else {
        window.showToast('Registro removido', 'success');
      }
    } catch (err) {
      console.error(err);
      window.showToast('Erro ao atualizar treino', 'error');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      const timeLabel = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      await api.addActivity({
        title: newActivity.title,
        description: newActivity.description,
        duration: newActivity.duration,
        time_label: timeLabel,
        type: newActivity.type,
        icon: newActivity.icon,
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop', // Default workout image
        completed: false
      });
      setShowAddModal(false);
      setNewActivity({ title: '', description: '', duration: '30 min', type: 'external', icon: 'exercise' });
      loadActivities();
    } catch (err: any) {
      console.error('Error adding activity:', err);
      window.showToast(err.message || 'Erro ao adicionar atividade', 'error');
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <header className="sticky top-0 z-50 flex items-center bg-[var(--background)]/95 backdrop-blur-sm p-4 justify-between border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2">
          <h2 className="text-[var(--text-primary)] text-lg font-black uppercase tracking-tight">Dia 12</h2>
          <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">Desafio Emagrecimento</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 overflow-hidden border border-primary/20">
            <img src="https://picsum.photos/100" alt="Profile" />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-4 py-6">
        <div className="flex justify-between items-end">
          <p className="font-black text-[var(--text-primary)] uppercase text-xs tracking-widest">Meta Semanal</p>
          <p className="text-primary font-black">3/5 DIAS</p>
        </div>
        <div className="h-4 rounded-full bg-gray-200 dark:bg-white/5 overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
          <div className="h-full bg-primary shadow-glow shadow-primary/30" style={{ width: '60%' }}></div>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">Faltam apenas 2 dias para completar a semana.</p>
      </div>

      <div className="w-full overflow-x-auto hide-scrollbar pl-4 pb-2">
        <div className="flex gap-3 pr-4">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} icon="check" label="Todos" />
          <FilterButton active={filter === 'cabin'} onClick={() => setFilter('cabin')} icon="airline_seat_recline_extra" label="Cabine" />
          <FilterButton active={filter === 'external'} onClick={() => setFilter('external')} icon="local_shipping" label="Externo" />
        </div>
      </div>

      <h2 className="text-2xl font-black px-4 pt-6 pb-4 text-[var(--text-primary)] uppercase tracking-tight">Rotina de Hoje</h2>

      <div className="px-4 flex flex-col gap-8 pb-40">
        {activities.map((act) => (
          <TimelineItem
            key={act.id}
            timeLabel={act.time_label || '00:00'}
            duration={act.duration || '0 min'}
            icon={act.icon || 'exercise'}
            color={act.type === 'cabin' ? 'blue' : 'orange'}
            activities={[act]}
            onToggle={() => handleToggle(act.id, act.completed)}
          />
        ))}
        {activities.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <span className="material-symbols-outlined text-5xl mb-2">event_busy</span>
            <p>Nenhuma atividade encontrada.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="shadow-lg shadow-primary/30 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold py-4 px-8 rounded-full w-full max-w-sm transition-all transform active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="text-lg">Registrar Treino</span>
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-[var(--background)] w-full max-w-md rounded-3xl p-6 relative z-10 border border-[var(--card-border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-4 text-[var(--text-primary)] uppercase tracking-tight">Novo Treino</h3>
            <form onSubmit={handleAddActivity} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Título</label>
                <input
                  required
                  type="text"
                  value={newActivity.title}
                  onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary transition-all text-[var(--text-primary)] font-bold text-sm"
                  placeholder="Ex: Polichinelos no Pátio"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Descrição</label>
                <textarea
                  value={newActivity.description}
                  onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary transition-all text-[var(--text-primary)] font-bold text-sm h-20"
                  placeholder="O que você fez?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Duração</label>
                  <input
                    type="text"
                    value={newActivity.duration}
                    onChange={e => setNewActivity({ ...newActivity, duration: e.target.value })}
                    className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary transition-all text-[var(--text-primary)] font-bold text-sm"
                    placeholder="Ex: 30 min"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Tipo</label>
                  <select
                    value={newActivity.type}
                    onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}
                    className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary transition-all text-[var(--text-primary)] font-bold text-sm appearance-none"
                  >
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="external">Externo</option>
                    <option className="bg-[var(--card)] text-[var(--text-primary)]" value="cabin">Cabine</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="bg-primary text-black font-bold py-4 rounded-xl mt-4 active:scale-95 transition-transform">
                Salvar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex h-9 items-center justify-center gap-x-2 rounded-full px-5 transition-all shadow-sm ${active ? 'bg-primary text-black shadow-primary/20 scale-105 z-10' : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-primary/50'}`}
  >
    <span className="material-symbols-outlined text-[18px] font-black">{icon}</span>
    <p className="text-xs font-black uppercase tracking-widest">{label}</p>
  </button>
);

const TimelineItem: React.FC<{ timeLabel: string; duration: string; icon: string; color: string; activities: any[]; locked?: boolean; onToggle?: () => void }> = ({ timeLabel, duration, icon, color, activities, locked, onToggle }) => (
  <div className="grid grid-cols-[48px_1fr] gap-x-0 relative">
    <div className="flex flex-col items-center">
      <div className={`flex items-center justify-center size-10 rounded-full bg-${color}-500/20 text-${color}-500 border border-${color}-500/30`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="w-[2px] bg-gray-200 dark:bg-surface-highlight h-full my-2 rounded-full"></div>
    </div>
    <div className="pb-4 pl-4">
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-lg font-black text-[var(--text-primary)]">{timeLabel}</p>
        <span className="text-[10px] font-black text-[var(--text-muted)] bg-[var(--card)] border border-[var(--card-border)] px-2 py-1 rounded uppercase tracking-widest shadow-sm">{duration}</span>
      </div>
      <div className="flex flex-col gap-3">
        {activities.map((act, i) => (
          <div key={i}
            onClick={() => !locked && onToggle?.()}
            className={`group relative overflow-hidden rounded-2xl bg-[var(--card)] border transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md ${locked ? 'opacity-50' : ''} ${act.completed ? 'border-primary' : 'border-[var(--card-border)]'}`}
          >
            <div className="flex gap-4 items-center p-3">
              <div className="size-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-black border border-[var(--card-border)] shadow-inner">
                <img src={act.image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" alt={act.title} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm uppercase tracking-tight text-[var(--text-primary)] leading-tight">{act.title}</h3>
                <p className="text-[var(--text-muted)] text-[11px] line-clamp-1 font-medium mt-0.5">{act.description}</p>
                {locked ? (
                  <div className="flex items-center gap-1 mt-1 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[14px] font-bold">lock</span> BLOQUEADO
                  </div>
                ) : (
                  <div className={`flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-widest ${act.completed ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                    <span className="material-symbols-outlined text-[14px] font-bold">{act.completed ? 'check_circle' : 'circle'}</span>
                    {act.completed ? 'CONCLUÍDO (+50 pts)' : 'MARCAR COMO FEITO'}
                  </div>
                )}
              </div>
              {!locked && (
                <div className={`flex items-center justify-center size-8 rounded-full transition-colors ${act.completed ? 'bg-primary text-black' : 'border-2 border-gray-600 text-gray-600'}`}>
                  <span className="material-symbols-outlined text-[20px]">{act.completed ? 'check' : 'check'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Schedule;
