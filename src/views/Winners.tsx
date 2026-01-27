import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { WinnerRanking, MeasurementHistory } from '../types';
import { getLevel } from '../components/LevelProgress';

const Winners: React.FC = () => {
    const [rankings, setRankings] = useState<WinnerRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRules, setShowRules] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const rankData = await api.getWinnerRankings();
            setRankings(rankData);
        } catch (err) {
            console.error('Error loading winner data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const topThree = rankings.slice(0, 3);
    const restOfRankings = rankings.slice(3);

    return (
        <div className="flex flex-col p-4 animate-in fade-in duration-500 pb-32">
            <header className="mb-6">
                <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-1 uppercase">
                    Ranking Geral <span className="text-primary">da Rodovia</span>
                </h1>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                    Acompanhe a evolução da frota. Quem perde ganha!
                </p>
            </header>

            {/* Criteria Explanation - Compact */}
            {/* Criteria Explanation - Compact */}
            <button
                onClick={() => setShowRules(true)}
                className="w-full flex items-center justify-between gap-2 mb-6 text-xs text-[var(--text-secondary)] bg-[var(--card)] p-3 rounded-xl border border-[var(--card-border)] hover:border-primary/50 transition-colors"
            >
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="material-symbols-outlined text-sm text-primary">scale</span>
                        <p><strong className="text-primary">Peso</strong> (%)</p>
                    </div>
                    <div className="w-px h-3 bg-[var(--card-border)] shrink-0"></div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="material-symbols-outlined text-sm text-primary">straighten</span>
                        <p><strong className="text-primary">Medidas</strong> (%)</p>
                    </div>
                    <div className="w-px h-3 bg-[var(--card-border)] shrink-0"></div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="material-symbols-outlined text-sm text-primary">stars</span>
                        <p><strong className="text-primary">XP</strong> (pts)</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-primary shrink-0 pl-2 border-l border-[var(--card-border)]">
                    <span className="material-symbols-outlined text-sm">help</span>
                </div>
            </button>

            {/* Rules Modal */}
            {showRules && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--card)] w-full max-w-sm max-h-[85vh] flex flex-col rounded-[24px] border border-[var(--card-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--background)] shrink-0">
                            <h3 className="font-black text-lg text-[var(--text-primary)] uppercase tracking-tight">Regras do Ranking</h3>
                            <button
                                onClick={() => setShowRules(false)}
                                className="size-8 rounded-full bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                O ranking soma sua evolução no peso, nas medidas e seu esforço (XP). Tudo conta para definir o campeão!
                            </p>

                            <div className="space-y-3 bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)]">
                                <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">A Nova Fórmula</h4>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs text-primary">scale</span>
                                        <span className="text-[var(--text-secondary)]">Perda de Peso (%)</span>
                                    </div>
                                    <span className="font-bold text-white">1.0 ponto</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs text-primary">straighten</span>
                                        <span className="text-[var(--text-secondary)]">Perda de Barriga (%)</span>
                                    </div>
                                    <span className="font-bold text-white">1.0 ponto</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs text-primary">stars</span>
                                        <span className="text-[var(--text-secondary)]">XP (Esforço)</span>
                                    </div>
                                    <span className="font-bold text-white">/ 400</span>
                                </div>

                                <div className="h-px bg-[var(--card-border)] my-1 border-dashed"></div>
                                <div className="flex items-center justify-between font-black">
                                    <span className="text-[var(--text-primary)]">SCORE TOTAL</span>
                                    <span className="text-primary">= SOMA TUDO</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <section className="space-y-2">
                                    <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">fitness_center</span>
                                        No Trecho (Treinos)
                                    </h4>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Validar Treino com Vídeo</span>
                                            <span className="text-xs font-black text-primary">+200 pts</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Completar Atividade</span>
                                            <span className="text-xs font-black text-primary">+50 pts</span>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-2">
                                    <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">restaurant</span>
                                        Na Parada (Saúde)
                                    </h4>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Registrar Refeição</span>
                                            <span className="text-xs font-black text-primary">+20 pts</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Atualizar Peso</span>
                                            <span className="text-xs font-black text-primary">+20 pts</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Meta Diária Batida (Bônus)</span>
                                            <span className="text-xs font-black text-primary">+20 pts</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Registrar Água/Sono/Mov</span>
                                            <span className="text-xs font-black text-primary">+5 pts</span>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-2">
                                    <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">group</span>
                                        Social e Conteúdo
                                    </h4>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Publicar Conteúdo (Academia)</span>
                                            <span className="text-xs font-black text-primary">+100 pts</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                            <span className="text-xs text-[var(--text-secondary)]">Postar no Feed</span>
                                            <span className="text-xs font-black text-primary">+10 pts</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 mt-4">
                                <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-2">Como vira Ranking Score?</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">Cada 1% Peso Perdido</span>
                                        <span className="font-bold text-white">1.0 ponto</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">Cada 1% Medida Perdida</span>
                                        <span className="font-bold text-white">1.0 ponto</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">Cada 400 XP acumulados</span>
                                        <span className="font-bold text-white">1.0 ponto</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="p-4 border-t border-[var(--card-border)] bg-[var(--background)] shrink-0">
                            <button
                                onClick={() => setShowRules(false)}
                                className="w-full bg-primary text-black font-black py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-wide"
                            >
                                Entendi, partiu treinar! 💪
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Podium */}
            {!loading && topThree.length > 0 && (
                <div className="flex items-end justify-center gap-2 mb-8 px-2 pt-10">
                    {/* 2nd Place */}
                    {topThree.length >= 2 && (
                        <div className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[100px] animate-in slide-in-from-bottom duration-700 delay-100">
                            <div className="relative group">
                                <div className="size-16 rounded-full border-4 border-[#C0C0C0] p-1 bg-[var(--card)] shadow-lg shadow-black/20">
                                    <div
                                        className="w-full h-full rounded-full bg-cover bg-center"
                                        style={{ backgroundImage: `url('${topThree[1].avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + topThree[1].nickname}')` }}
                                    />
                                </div>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">2º</div>
                            </div>
                            <div className="text-center w-full px-1">
                                <p className="text-[10px] font-black text-[var(--text-primary)] uppercase truncate leading-tight mb-1">{topThree[1].nickname}</p>
                                <div className="bg-[#C0C0C0]/20 px-2 py-1 rounded-md mb-1">
                                    <p className="text-[10px] font-black text-[var(--text-primary)]">{topThree[1].combinedScore.toFixed(1)} <span className="text-[8px] font-bold opacity-70">SCORE</span></p>
                                </div>
                                <div className="flex justify-center gap-1 text-[8px] text-[var(--text-muted)]">
                                    <span>-{topThree[1].weightLossPercentage.toFixed(1)}% peso</span>
                                </div>
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
                                    style={{ backgroundImage: `url('${topThree[0].avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + topThree[0].nickname}')` }}
                                />
                            </div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl animate-bounce">👑</div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-black text-[11px] font-black px-3 py-1 rounded-full shadow-lg z-20">1º</div>
                        </div>
                        <div className="text-center mt-2 w-full px-1">
                            <p className="text-xs font-black text-[var(--text-primary)] uppercase truncate leading-tight mb-1">{topThree[0].nickname}</p>
                            <div className="bg-primary/20 px-3 py-1.5 rounded-lg mb-1 inline-block">
                                <p className="text-sm font-black text-primary">{topThree[0].combinedScore.toFixed(1)} <span className="text-[9px] font-bold text-[var(--text-primary)] opacity-70">SCORE</span></p>
                            </div>
                            <div className="flex justify-center gap-2 text-[9px] font-bold text-[var(--text-secondary)]">
                                <span className={topThree[0].weightLossPercentage > 0 ? "text-primary" : ""}>-{topThree[0].weightLossPercentage.toFixed(1)}% peso</span>
                                {topThree[0].waistReductionPercentage! > 0 && <span className="text-primary">-{topThree[0].waistReductionPercentage!.toFixed(1)}% med</span>}
                            </div>
                        </div>
                        <div className="w-full h-24 bg-gradient-to-b from-primary/30 to-transparent rounded-t-2xl border-t-2 border-primary/40 shadow-inner"></div>
                    </div>

                    {/* 3rd Place */}
                    {topThree.length >= 3 && (
                        <div className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[100px] animate-in slide-in-from-bottom duration-700 delay-200">
                            <div className="relative group">
                                <div className="size-14 rounded-full border-4 border-[#CD7F32] p-1 bg-[var(--card)] shadow-lg shadow-black/20">
                                    <div
                                        className="w-full h-full rounded-full bg-cover bg-center"
                                        style={{ backgroundImage: `url('${topThree[2].avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + topThree[2].nickname}')` }}
                                    />
                                </div>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">3º</div>
                            </div>
                            <div className="text-center w-full px-1">
                                <p className="text-[10px] font-black text-[var(--text-primary)] uppercase truncate leading-tight mb-1">{topThree[2].nickname}</p>
                                <div className="bg-[#CD7F32]/20 px-2 py-1 rounded-md mb-1">
                                    <p className="text-[10px] font-black text-[var(--text-primary)]">{topThree[2].combinedScore.toFixed(1)} <span className="text-[8px] font-bold opacity-70">SCORE</span></p>
                                </div>
                                <div className="flex justify-center gap-1 text-[8px] text-[var(--text-muted)]">
                                    <span>-{topThree[2].weightLossPercentage.toFixed(1)}% peso</span>
                                </div>
                            </div>
                            <div className="w-full h-12 bg-gradient-to-b from-[#CD7F32]/20 to-transparent rounded-t-lg border-t-2 border-[#CD7F32]/30 shadow-inner"></div>
                        </div>
                    )}
                </div>
            )}

            {/* Rest of Rankings */}
            <div className="bg-[var(--card)] rounded-[24px] border border-[var(--card-border)] overflow-hidden mb-8 shadow-xl">
                {loading ? (
                    <div className="p-8 text-center text-[var(--text-muted)] font-bold italic">Carregando rankings...</div>
                ) : (
                    rankings.map((user, index) => (
                        <div key={user.userId} className="flex items-center gap-3 p-4 border-b border-[var(--card-border)] last:border-0 hover:bg-white/5 transition-colors">
                            {/* Rank Info */}
                            <div className="flex flex-col items-center justify-center w-8 shrink-0">
                                <span className={`text-sm font-black ${index < 3 ? 'text-primary' : 'text-[var(--text-muted)]'}`}>#{index + 1}</span>
                            </div>

                            {/* User Info */}
                            <div
                                className="size-12 rounded-full bg-cover bg-center border-2 border-primary/10 shrink-0"
                                style={{ backgroundImage: `url('${user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.nickname}')` }}
                            />

                            {/* Stats Grid */}
                            <div className="flex-1 min-w-0 grid grid-cols-3 gap-x-2 gap-y-1">
                                <div className="col-span-3 flex justify-between items-center mb-0.5">
                                    <div className="flex items-center gap-1">
                                        <p className="font-black text-[var(--text-primary)] text-sm truncate uppercase tracking-tight">{user.nickname}</p>
                                        <span className="text-sm" title={getLevel(user.points || 0).name}>{getLevel(user.points || 0).icon}</span>
                                    </div>
                                </div>

                                {/* Weight Stats */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <span className="material-symbols-outlined text-[10px] text-[var(--text-muted)]">monitor_weight</span>
                                        <span className="text-[8px] font-bold text-[var(--text-secondary)]">PESO</span>
                                    </div>
                                    <span className={`text-[10px] font-black ${user.weightLossPercentage > 0 ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                                        {user.weightLossPercentage.toFixed(1)}%
                                    </span>
                                </div>

                                {/* Waist Stats */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <span className="material-symbols-outlined text-[10px] text-[var(--text-muted)]">straighten</span>
                                        <span className="text-[8px] font-bold text-[var(--text-secondary)]">MEDIDA</span>
                                    </div>
                                    <span className={`text-[10px] font-black ${user.waistReductionPercentage > 0 ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                                        {(user.waistReductionPercentage || 0).toFixed(1)}%
                                    </span>
                                </div>

                                {/* XP Stats */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <span className="material-symbols-outlined text-[10px] text-[var(--text-muted)]">stars</span>
                                        <span className="text-[8px] font-bold text-[var(--text-secondary)]">XP</span>
                                    </div>
                                    <span className="text-[10px] font-black text-[var(--text-primary)]">
                                        {user.points || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Score Display */}
                            <div className="flex flex-col items-end justify-center shrink-0 pl-2 border-l border-[var(--card-border)]">
                                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">SCORE</span>
                                <div className="bg-primary text-black px-2 py-1 rounded-lg shadow-sm">
                                    <span className="text-sm font-black leading-none">{user.combinedScore.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};

export default Winners;
