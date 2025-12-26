
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

const Ranking: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        try {
            const [lb, rw] = await Promise.all([
                api.getLeaderboard(),
                api.getRecentWorkouts()
            ]);
            setLeaderboard(lb || []);
            setRecentWorkouts(rw || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            window.showToast('Enviando prova do treino...', 'info');
            await api.uploadWorkoutVideo(file);
            window.showToast('Treino validado! +200 pontos no Ranking!', 'success');
            loadData();
        } catch (err: any) {
            console.error('Upload error details:', err);
            const msg = err.message || 'Erro ao enviar vídeo';
            window.showToast(msg, 'error');
        } finally {
            setUploading(false);
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col p-4 animate-in fade-in duration-500 pb-32">
            <header className="mb-6">
                <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-1 uppercase">Elite do <span className="text-primary">Trecho</span></h1>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Os motoristas mais brutos da estrada.</p>
            </header>

            {/* Quick Record CTA */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 mb-8 relative overflow-hidden group shadow-lg shadow-primary/20">
                <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-8xl text-black">videocam</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-black font-black text-xl mb-2">Ganhe +200 Pontos!</h3>
                    <p className="text-black/70 text-sm font-bold mb-4">Grave um vídeo rápido fazendo exercícios na cabine ou no posto e suba no ranking!</p>
                    <button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-black text-primary font-black px-6 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-xl"
                    >
                        <span className="material-symbols-outlined">{uploading ? 'sync' : 'videocam'}</span>
                        {uploading ? 'Enviando...' : 'Gravar Vídeo'}
                    </button>
                    <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoFile}
                        accept="video/*"
                        capture="environment"
                        className="hidden"
                    />
                </div>
            </div>

            {/* Leaderboard */}
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">emoji_events</span>
                Top 10 Nacional
            </h2>

            <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden mb-8 shadow-xl">
                {loading ? (
                    <div className="p-8 text-center text-[var(--text-muted)] font-bold italic">Carregando estrelas da estrada...</div>
                ) : (
                    leaderboard.map((user, index) => (
                        <div key={index} className={`flex items-center gap-4 p-4 border-b border-[var(--card-border)] last:border-0 ${index < 3 ? 'bg-primary/5' : ''} transition-colors hover:bg-primary/10`}>
                            <div className="w-8 flex justify-center text-lg font-black italic text-[var(--text-muted)]">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </div>
                            <div
                                className="size-10 rounded-full bg-cover bg-center border border-primary/20 shrink-0 shadow-sm"
                                style={{ backgroundImage: `url('${user.avatar_url || "https://picsum.photos/100/100?random=" + index}')` }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-[var(--text-primary)] text-sm truncate uppercase tracking-tight">{user.nickname || 'Parceiro Anônimo'}</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none">{user.points} Pontos</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-[var(--text-muted)]">{user.current_weight}kg</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Recent Workouts Feed */}
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">movie</span>
                Atividades Recentes
            </h2>

            <div className="flex flex-col gap-4">
                {recentWorkouts.map((workout, i) => (
                    <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-lg hover:border-primary/30 transition-all">
                        <div className="relative aspect-video bg-black flex items-center justify-center">
                            <video
                                src={workout.video_url}
                                className="w-full h-full object-contain"
                                controls
                                poster="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop"
                            />
                            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-primary shadow-xl border border-primary/20">
                                VERIFICADO +200 PTS
                            </div>
                        </div>
                        <div className="p-4 flex items-center gap-3">
                            <div
                                className="size-10 rounded-full bg-cover bg-center border border-primary/20 shadow-sm"
                                style={{ backgroundImage: `url('${workout.user_stats?.avatar_url || "https://picsum.photos/100/100?random=" + i}')` }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{workout.user_stats?.nickname || 'Parceiro'}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-bold">{new Date(workout.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {recentWorkouts.length === 0 && (
                    <div className="text-center py-10 opacity-30">
                        <span className="material-symbols-outlined text-4xl mb-2">videocam_off</span>
                        <p className="text-sm font-bold">Ainda não temos vídeos hoje. Seja o primeiro!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ranking;
