import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { Activity } from '../types';

// --- GPS UTILS ---
const haversineDistance = (coords1: { latitude: number; longitude: number }, coords2: { latitude: number; longitude: number }) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.latitude)) *
    Math.cos(toRad(coords2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Schedule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', duration: '30 min', type: 'external', icon: 'exercise' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [shareOnSocial, setShareOnSocial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GPS State
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [lastCoords, setLastCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState<number | null>(null);

  const loadActivities = () => {
    api.getActivities(filter).then(setActivities).catch(console.error);
  };

  React.useEffect(() => {
    loadActivities();
  }, [filter]);

  // Clean up GPS on unmount
  React.useEffect(() => {
    return () => {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [gpsWatchId, timerIntervalId]);

  const toggleGpsTracking = () => {
    if (isTracking) {
      // STOP TRACKING
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      if (timerIntervalId) clearInterval(timerIntervalId);
      setGpsWatchId(null);
      setTimerIntervalId(null);
      setIsTracking(false);
    } else {
      // START TRACKING
      if (!navigator.geolocation) {
        setGpsError('GPS não suportado neste navegador.');
        return;
      }

      setGpsError(null);
      setLastCoords(null);
      // Don't reset distance if restarting, allows pause/resume. But for now simpler is Start/Stop.
      // Let's assume Start = Reset and Start Fresh or Resume? User interface will have "Finish" button.
      // If distance is 0, we can assume fresh start.

      setIsTracking(true);

      // Start Timer
      const tId = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setTimerIntervalId(Number(tId));

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          if (accuracy > 50) return; // Ignore low accuracy

          setLastCoords(prev => {
            if (prev) {
              const dist = haversineDistance(prev, { latitude, longitude });
              if (dist > 0.005) { // Only count if moved > 5 meters to reduce jitter
                setDistance(d => d + dist);
                return { latitude, longitude };
              }
              return prev;
            }
            return { latitude, longitude };
          });
        },
        (err) => {
          console.error(err);
          setGpsError('Erro no GPS: ' + err.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      setGpsWatchId(id);
    }
  };

  const finishGpsActivity = async () => {
    // STOP EVERYTHING
    if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    if (timerIntervalId) clearInterval(timerIntervalId);
    setIsTracking(false);
    setGpsWatchId(null);
    setTimerIntervalId(null);

    // SAVE
    try {
      if (distance < 0.05) {
        window.showToast('Distância muito curta para registrar.', 'info');
        setShowGpsModal(false);
        setDistance(0);
        setElapsedTime(0);
        return;
      }

      await api.addActivity({
        title: `Caminhada/Pedal (${distance.toFixed(2)} km)`,
        description: `Atividade registrada via GPS. Tempo: ${formatTime(elapsedTime)}`,
        duration: `${Math.ceil(elapsedTime / 60)} min`,
        time_label: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'external',
        icon: 'directions_walk', // or directions_bike
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=400&fit=crop',
        completed: true // Auto-complete
      });

      window.showToast(`Treino salvo! ${distance.toFixed(2)}km percorridos.`, 'success');
      setShowGpsModal(false);
      setDistance(0);
      setElapsedTime(0);
      setLastCoords(null);
      loadActivities();
    } catch (err: any) {
      window.showToast('Erro ao salvar treino GPS', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

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
    setIsSubmitting(true);

    try {
      const now = new Date();
      const timeLabel = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      let imageUrl = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop';

      if (selectedImage) {
        try {
          window.showToast('Enviando foto...', 'info');
          imageUrl = await api.uploadActivityImage(selectedImage);
        } catch (uploadErr) {
          console.error('Upload failed', uploadErr);
          window.showToast('Erro ao enviar foto, usando padrão.', 'error');
        }
      }

      await api.addActivity({
        title: newActivity.title,
        description: newActivity.description,
        duration: newActivity.duration,
        time_label: timeLabel,
        type: newActivity.type as any,
        icon: newActivity.icon,
        image: imageUrl,
        completed: true // Auto-complete if manual entry? Usually yes for "I just did this"
      });

      // Auto Post to Social
      if (shareOnSocial) {
        try {
          const postText = `Acabei de registrar um treino: ${newActivity.title}! 💪🚛`;
          await api.addSocialPost(postText, selectedImage ? imageUrl : undefined);
          window.showToast('Compartilhado na comunidade!', 'success');
        } catch (socialErr) {
          console.error('Social post failed', socialErr);
        }
      }

      setShowAddModal(false);
      setNewActivity({ title: '', description: '', duration: '30 min', type: 'external', icon: 'exercise' });
      setSelectedImage(null);
      loadActivities();
      window.showToast('Treino registrado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Error adding activity:', err);
      window.showToast(err.message || 'Erro ao adicionar atividade', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedImage(file);
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
          <div className="bg-[var(--background)] w-full max-w-md rounded-3xl relative z-10 border border-[var(--card-border)] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

            {/* Modal Header - Sticky */}
            <div className="flex justify-between items-center p-6 border-b border-[var(--card-border)] bg-[var(--background)] rounded-t-3xl sticky top-0 z-20 shrink-0">
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Novo Treino</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="size-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-white/5 transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {/* GPS Entry Button inside Add Modal */}
              <div className="mb-6">
                <button
                  onClick={() => { setShowAddModal(false); setShowGpsModal(true); setDistance(0); setElapsedTime(0); setIsTracking(false); }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-2xl flex items-center gap-4 transition-all shadow-lg active:scale-95"
                >
                  <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">location_on</span>
                  </div>
                  <div className="text-left">
                    <p className="font-black uppercase tracking-tight text-sm">Rastreador GPS</p>
                    <p className="text-xs opacity-90">Registrar Caminhada ou Pedal via Satélite</p>
                  </div>
                  <span className="material-symbols-outlined ml-auto">arrow_forward_ios</span>
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-[var(--card-border)] flex-1"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Ou manual</span>
                <div className="h-px bg-[var(--card-border)] flex-1"></div>
              </div>

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

                {/* Photo Upload Section */}
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Foto do Treino (Opcional)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="size-10 rounded-lg bg-black/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[var(--text-muted)]">photo_camera</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {selectedImage ? selectedImage.name : 'Toque para adicionar foto'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
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

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="shareSocial"
                    checked={shareOnSocial}
                    onChange={e => setShareOnSocial(e.target.checked)}
                    className="size-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="shareSocial" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer select-none">
                    Compartilhar na Comunidade (+10 pts)
                  </label>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-black font-bold py-4 rounded-xl active:scale-95 transition-transform text-sm uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar e Registrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full bg-transparent border border-[var(--card-border)] text-[var(--text-primary)] font-bold py-3 rounded-xl active:scale-95 transition-transform text-xs uppercase tracking-widest hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* GPS MODAL */}
      {showGpsModal && (
        <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center p-4 bg-black">
          {/* Map/Satellite decorative background */}
          <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/static/0,0,1,0,0/100x100?access_token=none')] bg-cover opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>

          <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-between h-full py-10">
            <div className="w-full text-center">
              <h3 className="text-white font-black text-2xl uppercase tracking-widest mb-1">Rastreador GPS</h3>
              <div className="flex items-center justify-center gap-2 text-green-500 animate-pulse">
                <span className="material-symbols-outlined text-sm">satellite_alt</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Sinal Ativo</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">Distância Total</span>
              <div className="text-8xl font-black text-white tabular-nums tracking-tighter">
                {distance.toFixed(2)}
              </div>
              <span className="text-primary font-bold text-xl uppercase tracking-widest">Quilômetros</span>
            </div>

            <div className="flex gap-8 w-full px-8">
              <div className="flex-1 bg-white/10 rounded-2xl p-4 flex flex-col items-center backdrop-blur-sm border border-white/10">
                <span className="material-symbols-outlined text-white mb-1">timer</span>
                <span className="text-2xl font-black text-white tabular-nums">{formatTime(elapsedTime)}</span>
                <span className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest">Tempo</span>
              </div>
              <div className="flex-1 bg-white/10 rounded-2xl p-4 flex flex-col items-center backdrop-blur-sm border border-white/10">
                <span className="material-symbols-outlined text-white mb-1">speed</span>
                <span className="text-2xl font-black text-white tabular-nums">
                  {elapsedTime > 0 ? ((distance / (elapsedTime / 3600))).toFixed(1) : '0.0'}
                </span>
                <span className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest">Km/h Médio</span>
              </div>
            </div>

            {gpsError && (
              <div className="bg-red-500/20 text-red-500 p-2 rounded-lg text-xs font-bold w-full text-center border border-red-500/30">
                {gpsError}
              </div>
            )}

            <div className="w-full flex flex-col gap-3">
              {!isTracking ? (
                <button
                  onClick={toggleGpsTracking}
                  className="w-full bg-primary text-black font-black py-6 rounded-3xl text-xl uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-3xl">play_circle</span>
                  {distance > 0 ? 'Retomar' : 'Iniciar'}
                </button>
              ) : (
                <button
                  onClick={toggleGpsTracking}
                  className="w-full bg-red-600 text-white font-black py-6 rounded-3xl text-xl uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-transform flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-3xl">stop_circle</span>
                  Pausar
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowGpsModal(false)}
                  className="flex-1 bg-white/10 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={finishGpsActivity}
                  disabled={distance < 0.05}
                  className="flex-1 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg"
                >
                  Finalizar Treino
                </button>
              </div>
            </div>
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
