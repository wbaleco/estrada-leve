

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

const Ranking: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
    const [socialPosts, setSocialPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [videoCaption, setVideoCaption] = useState('');
    const [posting, setPosting] = useState(false);
    const [activePostComments, setActivePostComments] = useState<any | null>(null);
    const [commentText, setCommentText] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [au, rw, sp] = await Promise.all([
                api.getAllUsers().catch(e => { console.error('AllUsers error:', e); return []; }),
                api.getRecentWorkouts().catch(e => { console.error('Workouts error:', e); return []; }),
                api.getSocialPosts().catch(e => { console.error('Posts error:', e); return []; })
            ]);

            // Derive leaderboard from all users to ensure consistency
            const sortedUsers = [...au].sort((a, b) => (b.points || 0) - (a.points || 0));
            const lb = sortedUsers.slice(0, 10).map(u => ({
                nickname: u.nickname,
                avatar_url: u.avatarUrl,
                points: u.points,
                current_weight: u.currentWeight
            }));

            setLeaderboard(lb);
            setAllUsers(au || []);
            setRecentWorkouts(rw || []);
            setSocialPosts(sp || []);
        } catch (err) {
            console.error('General load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Auto-refresh every 30 seconds for real-time points
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            window.showToast('Enviando prova do treino...', 'info');
            await api.uploadWorkoutVideo(file, videoCaption);
            window.showToast('Treino validado! +200 pontos no Ranking!', 'success');
            setVideoCaption('');
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

    const handleWorkoutLike = async (workoutId: string) => {
        try {
            const liked = await api.toggleWorkoutLike(workoutId);
            setRecentWorkouts(prev => prev.map(w =>
                w.id === workoutId
                    ? { ...w, is_liked: liked, likes_count: (w.likes_count || 0) + (liked ? 1 : -1) }
                    : w
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostText.trim()) return;

        setPosting(true);
        try {
            await api.addSocialPost(newPostText);
            setNewPostText('');
            window.showToast('Postado com sucesso!', 'success');
            loadData();
        } catch (err) {
            console.error(err);
            window.showToast('Erro ao postar mensagem', 'error');
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            const liked = await api.toggleLike(postId);
            // Optimistic update
            setSocialPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, is_liked: liked, likes_count: (p.likes_count || 0) + (liked ? 1 : -1) }
                    : p
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activePostComments || !commentText.trim()) return;

        setSendingComment(true);
        try {
            const isWorkout = activePostComments.commentType === 'workout';
            if (isWorkout) {
                await api.addWorkoutComment(activePostComments.id, commentText);
            } else {
                await api.addComment(activePostComments.id, commentText);
            }

            setCommentText('');
            window.showToast('Comentário enviado!', 'success');

            // Reload comments based on type
            const comments = isWorkout
                ? await api.getWorkoutComments(activePostComments.id)
                : await api.getComments(activePostComments.id);

            setActivePostComments({ ...activePostComments, comments });
            loadData();
        } catch (err) {
            console.error(err);
            window.showToast('Erro ao comentar', 'error');
        } finally {
            setSendingComment(false);
        }
    };

    const openComments = async (post: any, type: 'social' | 'workout' = 'social') => {
        try {
            const comments = type === 'workout'
                ? await api.getWorkoutComments(post.id)
                : await api.getComments(post.id);
            setActivePostComments({ ...post, comments, commentType: type });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col p-4 animate-in fade-in duration-500 pb-32">
            <header className="mb-6">
                <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-1 uppercase">Comunidade <span className="text-primary">Estrada Leve</span></h1>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Conectados pela mesma estrada.</p>
            </header>

            {/* Quick Record CTA */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 mb-8 relative overflow-hidden group shadow-lg shadow-primary/20">
                <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-8xl text-black">videocam</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-black font-black text-xl mb-2">Ganhe +200 Pontos!</h3>
                    <p className="text-black/70 text-sm font-bold mb-4">Grave um vídeo rápido fazendo exercícios na cabine ou no posto!</p>

                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="Adicione uma legenda opcional..."
                            value={videoCaption}
                            onChange={e => setVideoCaption(e.target.value)}
                            className="bg-black/10 border border-black/20 rounded-xl px-4 py-2 text-black font-bold placeholder:text-black/40 outline-none focus:bg-black/20 transition-all text-xs"
                        />
                        <button
                            onClick={() => videoInputRef.current?.click()}
                            disabled={uploading}
                            className="bg-black text-primary font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                        >
                            <span className="material-symbols-outlined">{uploading ? 'sync' : 'videocam'}</span>
                            {uploading ? 'Enviando...' : 'Gravar e Subir Treino'}
                        </button>
                    </div>
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

            {/* Create Post */}
            <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--card-border)] mb-8 shadow-sm">
                <form onSubmit={handlePostSubmit} className="flex gap-3">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">edit</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        <input
                            type="text"
                            value={newPostText}
                            onChange={e => setNewPostText(e.target.value)}
                            placeholder="O que rolou na estrada hoje?"
                            className="bg-transparent text-[var(--text-primary)] font-medium outline-none placeholder:text-[var(--text-muted)] w-full py-2"
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={posting || !newPostText.trim()}
                                className="bg-primary text-black font-black text-xs px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                                {posting ? 'Postando...' : 'Publicar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Feed Tabs? No, just list them mixed or separate. Let's put Leaderboard at bottom or dedicated tab. 
                For now, vertical layout: Feed -> Recent Videos -> Leaderboard */}

            <div className="flex flex-col gap-6">

                {/* Social Feed */}
                <div>
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                        <span className="material-symbols-outlined text-primary">forum</span>
                        Resenha da Estrada
                    </h2>
                    <div className="flex flex-col gap-4">
                        {socialPosts.length === 0 && !loading && <p className="text-center text-[var(--text-muted)] italic">Nenhuma resenha ainda. Seja o primeiro!</p>}
                        {socialPosts.map(post => (
                            <div key={post.id} className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="size-10 rounded-full bg-cover bg-center border border-primary/20"
                                        style={{ backgroundImage: `url('${post.user_avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.name}')` }}
                                    />
                                    <div>
                                        <p className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight">{post.name}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold">{post.time_ago || "Hoje"}</p>
                                    </div>
                                </div>
                                <p className="text-[var(--text-primary)] text-sm font-medium mb-3 leading-relaxed">
                                    {post.text}
                                </p>
                                {/* Media attachment if any (video links often handled in text or structure) - strictly text for now unless workout */}

                                <div className="flex items-center gap-4 border-t border-[var(--card-border)] pt-3">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center gap-1 text-xs font-bold transition-colors ${post.is_liked ? 'text-red-500' : 'text-[var(--text-muted)] hover:text-red-500'}`}
                                    >
                                        <span className={`material-symbols-outlined text-lg ${post.is_liked ? 'material-symbols-filled' : ''}`}>favorite</span>
                                        {post.likes_count > 0 && post.likes_count}
                                    </button>
                                    <button
                                        onClick={() => openComments(post)}
                                        className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
                                        {post.comments_count > 0 ? `${post.comments_count} Comentários` : 'Comentar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Workouts */}
                <div>
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                        <span className="material-symbols-outlined text-primary">movie</span>
                        Treinos Recentes
                    </h2>
                    <div className="flex flex-col gap-4">
                        {recentWorkouts.map((workout, i) => (
                            <div key={workout.id || i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-lg hover:border-primary/30 transition-all">
                                <div className="p-4 flex items-center gap-3">
                                    <div
                                        className="size-8 rounded-full bg-cover bg-center border border-primary/20 shadow-sm"
                                        style={{ backgroundImage: `url('${workout.user_stats?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (workout.user_stats?.nickname || i)}')` }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{workout.user_stats?.nickname || 'Parceiro'}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold">{new Date(workout.created_at).toLocaleDateString()} • {new Date(workout.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div className="bg-primary/10 px-2 py-1 rounded text-[8px] font-black text-primary uppercase">VERIFICADO</div>
                                </div>

                                {workout.caption && (
                                    <p className="px-4 pb-3 text-xs font-medium text-[var(--text-secondary)] italic">
                                        "{workout.caption}"
                                    </p>
                                )}

                                <div className="relative aspect-video bg-black flex items-center justify-center">
                                    <video
                                        src={workout.video_url}
                                        className="w-full h-full object-contain"
                                        controls
                                        playsInline
                                    />
                                </div>

                                <div className="p-3 border-t border-[var(--card-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleWorkoutLike(workout.id)}
                                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${workout.is_liked ? 'text-red-500' : 'text-[var(--text-muted)] hover:text-red-500'}`}
                                        >
                                            <span className={`material-symbols-outlined text-lg ${workout.is_liked ? 'material-symbols-filled' : ''}`}>favorite</span>
                                            {workout.likes_count > 0 ? workout.likes_count : 'Curtir'}
                                        </button>
                                        <button
                                            onClick={() => openComments(workout, 'workout')}
                                            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
                                            {workout.comments_count > 0 ? `${workout.comments_count} Comentários` : 'Comentar'}
                                        </button>
                                    </div>
                                    <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">stars</span>
                                        +200 PTS
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard Podium */}
                <div>
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[var(--text-primary)]">
                        <span className="material-symbols-outlined text-primary">emoji_events</span>
                        Mestres da Rodovia
                    </h2>

                    {!loading && leaderboard.length > 0 && (
                        <div className="flex items-end justify-center gap-2 mb-8 px-2 pt-10">
                            {/* 2nd Place */}
                            {leaderboard.length >= 2 && (
                                <div className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[100px] animate-in slide-in-from-bottom duration-700 delay-100">
                                    <div className="relative group">
                                        <div className="size-16 rounded-full border-4 border-[#C0C0C0] p-1 bg-[var(--card)] shadow-lg shadow-black/20">
                                            <div
                                                className="w-full h-full rounded-full bg-cover bg-center"
                                                style={{ backgroundImage: `url('${leaderboard[1].avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + leaderboard[1].nickname}')` }}
                                            />
                                        </div>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">2º</div>
                                    </div>
                                    <div className="text-center w-full px-1">
                                        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase truncate leading-tight">{leaderboard[1].nickname}</p>
                                        <p className="text-[8px] font-bold text-primary uppercase">{leaderboard[1].points} pts</p>
                                    </div>
                                    <div className="w-full h-16 bg-gradient-to-b from-[#C0C0C0]/20 to-transparent rounded-t-xl border-t-2 border-[#C0C0C0]/30 shadow-inner"></div>
                                </div>
                            )}

                            {/* 1st Place */}
                            <div className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[120px] -mt-10 animate-in zoom-in duration-1000">
                                <div className="relative group scale-110">
                                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="size-20 rounded-full border-4 border-primary p-1 bg-[var(--card)] shadow-2xl shadow-primary/30 relative z-10">
                                        <div
                                            className="w-full h-full rounded-full bg-cover bg-center"
                                            style={{ backgroundImage: `url('${leaderboard[0].avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + leaderboard[0].nickname}')` }}
                                        />
                                    </div>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl animate-bounce">👑</div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-black text-[11px] font-black px-3 py-1 rounded-full shadow-lg z-20">1º</div>
                                </div>
                                <div className="text-center mt-2 w-full px-1">
                                    <p className="text-xs font-black text-[var(--text-primary)] uppercase truncate leading-tight">{leaderboard[0].nickname}</p>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">{leaderboard[0].points} pts</p>
                                </div>
                                <div className="w-full h-24 bg-gradient-to-b from-primary/30 to-transparent rounded-t-2xl border-t-2 border-primary/40 shadow-inner"></div>
                            </div>

                            {/* 3rd Place */}
                            {leaderboard.length >= 3 && (
                                <div className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[100px] animate-in slide-in-from-bottom duration-700 delay-200">
                                    <div className="relative group">
                                        <div className="size-14 rounded-full border-4 border-[#CD7F32] p-1 bg-[var(--card)] shadow-lg shadow-black/20">
                                            <div
                                                className="w-full h-full rounded-full bg-cover bg-center"
                                                style={{ backgroundImage: `url('${leaderboard[2].avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + leaderboard[2].nickname}')` }}
                                            />
                                        </div>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">3º</div>
                                    </div>
                                    <div className="text-center w-full px-1">
                                        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase truncate leading-tight">{leaderboard[2].nickname}</p>
                                        <p className="text-[8px] font-bold text-primary uppercase">{leaderboard[2].points} pts</p>
                                    </div>
                                    <div className="w-full h-12 bg-gradient-to-b from-[#CD7F32]/20 to-transparent rounded-t-lg border-t-2 border-[#CD7F32]/30 shadow-inner"></div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-[var(--card)] rounded-[24px] border border-[var(--card-border)] overflow-hidden mb-12 shadow-xl">
                        {loading ? (
                            <div className="p-8 text-center text-[var(--text-muted)] font-bold italic">Carregando estrelas da estrada...</div>
                        ) : (
                            leaderboard.slice(3).map((user, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 border-b border-[var(--card-border)] last:border-0 transition-colors hover:bg-primary/5">
                                    <div className="w-8 flex justify-center text-xs font-black text-[var(--text-muted)]">
                                        #{index + 4}
                                    </div>
                                    <div
                                        className="size-9 rounded-full bg-cover bg-center border border-primary/10 shrink-0"
                                        style={{ backgroundImage: `url('${user.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.nickname}')` }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-[var(--text-primary)] text-sm truncate uppercase tracking-tight">{user.nickname || 'Parceiro'}</p>
                                        <p className="text-[9px] text-primary font-black uppercase tracking-widest">{user.points} Pontos</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] italic">{user.current_weight}kg</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Fleet / All Users */}
                <div id="frota-completa">
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                        Frota Completa
                    </h2>
                    <p className="text-[var(--text-secondary)] text-xs mb-4 font-medium uppercase tracking-widest">Todos os parceiros cadastrados na rodovia</p>

                    <div className="grid grid-cols-1 gap-3">
                        {allUsers.length === 0 && !loading && <p className="text-center text-[var(--text-muted)] italic">Nenhum parceiro encontrado.</p>}
                        {allUsers.map((u, i) => (
                            <div key={i} className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-primary/30 transition-all">
                                <div
                                    className="size-12 rounded-full bg-cover bg-center border-2 border-primary/30"
                                    style={{ backgroundImage: `url('${u.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + u.nickname}')` }}
                                />
                                <div className="flex-1">
                                    <h4 className="font-black text-[var(--text-primary)] uppercase tracking-tight">{u.nickname}</h4>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Peso: {u.currentWeight}kg</span>
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{u.points} pts</span>
                                    </div>
                                </div>
                                <div className="size-8 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">chevron_right</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Comments Modal */}
            {activePostComments && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePostComments(null)}></div>
                    <div className="bg-[var(--card)] w-full max-w-lg max-h-[70vh] rounded-t-[32px] p-5 relative z-10 border-t border-[var(--card-border)] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
                        <div className="w-10 h-1 bg-[var(--text-muted)] opacity-20 rounded-full mx-auto mb-4"></div>

                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">forum</span>
                                Resenha
                            </h3>
                            <button onClick={() => setActivePostComments(null)} className="size-8 flex items-center justify-center rounded-full bg-[var(--background)] border border-[var(--card-border)]">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                            {activePostComments.comments?.length === 0 ? (
                                <p className="text-center text-[var(--text-muted)] font-medium italic py-10 text-xs">Puxa o PTT e seja o primeiro!</p>
                            ) : (
                                activePostComments.comments?.map((c: any) => (
                                    <div key={c.id} className="flex gap-2 items-start max-w-[90%] mb-1">
                                        <div
                                            className="size-7 rounded-full bg-cover bg-center border border-primary/20 shrink-0 mt-1"
                                            style={{ backgroundImage: `url('${c.user_avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + c.user_name}')` }}
                                        />
                                        <div className="bg-[var(--background)] p-3 rounded-2xl rounded-tl-none border border-[var(--card-border)] shadow-sm">
                                            <div className="flex justify-between items-center gap-4 mb-0.5">
                                                <span className="text-[9px] font-black text-primary uppercase tracking-tight">{c.user_name}</span>
                                                <span className="text-[8px] font-bold text-[var(--text-muted)]">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs font-bold text-[var(--text-primary)] leading-snug">{c.text}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleCommentSubmit} className="flex gap-2 items-end pt-3 border-t border-[var(--card-border)]">
                            <div className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-4 py-2.5">
                                <textarea
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Fala aí, parceiro..."
                                    className="w-full bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none resize-none max-h-24"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleCommentSubmit(e);
                                        }
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sendingComment || !commentText.trim()}
                                className="bg-primary text-black size-10 rounded-xl flex items-center justify-center hover:scale-95 active:scale-90 transition-all disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined font-black text-lg">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ranking;

