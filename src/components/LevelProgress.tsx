
import React from 'react';

export const getLevel = (points: number) => {
    if (points >= 8000) return { level: 6, name: 'Lenda da Estrada', min: 8000, max: 99999, icon: '👑' };
    if (points >= 5000) return { level: 5, name: 'Rei do Asfalto', min: 5000, max: 8000, icon: '🦁' };
    if (points >= 3000) return { level: 4, name: 'Veterano', min: 3000, max: 5000, icon: '🦅' };
    if (points >= 1500) return { level: 3, name: 'Rodagem Alta', min: 1500, max: 3000, icon: '🚛' };
    if (points >= 500) return { level: 2, name: 'Estradeiro', min: 500, max: 1500, icon: '🛣️' };
    return { level: 1, name: 'Iniciante', min: 0, max: 500, icon: '🥚' };
};

export const LevelProgress: React.FC<{ points: number }> = ({ points }) => {
    const current = getLevel(points);
    const nextLevelMin = current.max;
    const progress = Math.min(100, Math.max(0, ((points - current.min) / (current.max - current.min)) * 100));

    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl grayscale group-hover:grayscale-0 transition-all">{current.icon}</span>
            </div>

            <div className="flex justify-between items-end mb-2 relative z-10">
                <div>
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-[#adcb90] mb-1">Nível Atual {current.level}</h4>
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        {current.name} <span className="text-xl">{current.icon}</span>
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Próximo Nível</p>
                    <p className="text-white font-black text-xs">{points} / {current.max} XP</p>
                </div>
            </div>

            <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/10 relative z-10">
                <div
                    className="h-full bg-gradient-to-r from-[#adcb90] to-primary transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 w-full animate-pulsex bg-white/20"></div>
                </div>
            </div>

            {points >= 8000 && (
                <p className="text-[10px] text-[#adcb90] font-bold mt-2 text-center animate-pulse">NÍVEL MÁXIMO ALCANÇADO!</p>
            )}
        </div>
    );
};
