
import React, { useState } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [goal, setGoal] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    const calculateBMI = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height) / 100;
        if (!w || !h) return 0;
        return (w / (h * h)).toFixed(1);
    };

    const calculateIdealWeight = () => {
        const h = parseFloat(height) / 100;
        if (!h) return 0;
        // Using BMI 22 as a middle ground for ideal weight
        return (22 * (h * h)).toFixed(1);
    };

    const handleNext = async () => {
        console.log('Botao clicado! Step:', step);
        if (step < 6) {
            setStep(step + 1);
        } else {
            console.log('Iniciando finishOnboarding...');
            await finishOnboarding();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0]);
            // Preview
            const objectUrl = URL.createObjectURL(event.target.files[0]);
            setAvatarUrl(objectUrl);
        }
    };

    const uploadAvatar = async (userId: string) => {
        if (!file) return avatarUrl;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error: any) {
            console.error('Error uploading avatar: ', error);
            // Don't alert here if we can handle it in the main flow
            throw new Error(error.message || 'Falha no upload da imagem');
        } finally {
            setUploading(false);
        }
    };

    const finishOnboarding = async () => {
        setLoading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('No user');

            let finalAvatarUrl = avatarUrl;
            if (file) {
                console.log('Iniciando upload de avatar...');
                try {
                    finalAvatarUrl = await uploadAvatar(user.id);
                } catch (e) {
                    console.warn('Erro ao subir avatar, continuando sem ele:', e);
                }
            }

            // 1. ATOMIC ONBOARDING (Backend RPC) - Must come first!
            console.log('Chamando backend via RPC...');
            try {
                await api.completeOnboarding({
                    nickname,
                    weight: parseFloat(weight),
                    goal: parseFloat(goal),
                    height: parseFloat(height),
                    bmi: parseFloat(calculateBMI() as string),
                    idealWeight: parseFloat(calculateIdealWeight() as string),
                    avatarUrl: finalAvatarUrl
                });
                console.log('Backend respondeu com sucesso!');
            } catch (rpcErr: any) {
                console.error('Falha na RPC:', rpcErr);
                throw new Error(`Erro no banco: ${rpcErr.message || JSON.stringify(rpcErr)}`);
            }

            // 2. Update Auth Metadata (Triggers App re-check, so data must be ready)
            try {
                await supabase.auth.updateUser({
                    data: { full_name: nickname, avatar_url: finalAvatarUrl }
                });
            } catch (e) {
                console.warn('Metadata update minor error', e);
            }

            console.log('Onboarding concluído com sucesso!');
            window.showToast('Perfil criado! Bem-vindo(a)!', 'success');
            onComplete();

        } catch (error: any) {
            console.error('Final Onboarding Error:', error);
            const msg = error.message || JSON.stringify(error);
            alert(`Erro no Onboarding: ${msg}`);
            window.showToast(`Erro: ${msg}`, 'error');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex flex-col bg-[var(--background)] p-6 relative overflow-hidden transition-colors duration-500">
            {/* Background Decor */}
            {/* Background Decor - v2 */}
            <div className="absolute top-0 right-0 p-20 bg-green-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(s => (
                        <div key={s} className={`h-2.5 w-6 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                    ))}
                </div>
                <button onClick={onComplete} className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Pular</button>
            </div>

            <div className="flex-1 flex flex-col justify-center relative z-10 animate-in slide-in-from-right duration-500" key={step}>

                {step === 1 && (
                    <>
                        <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary font-bold">badge</span>
                        </div>
                        <h1 className="text-3xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-tight">Qual seu nome de guerra?</h1>
                        <p className="text-[var(--text-secondary)] mb-8 font-medium">Como você quer ser chamado pelos parceiros de estrada.</p>
                        <input
                            autoFocus
                            type="text"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            className="bg-transparent border-b-2 border-primary/50 text-3xl font-black w-full py-3 focus:border-primary outline-none placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                            placeholder="Ex: Trovão Azul"
                        />
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary font-bold">monitor_weight</span>
                        </div>
                        <h1 className="text-3xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-tight">Peso da Carga Atual</h1>
                        <p className="text-[var(--text-secondary)] mb-8 font-medium">Qual seu peso hoje? Vamos começar a aliviar essa carga.</p>
                        <div className="flex items-end gap-2">
                            <input
                                autoFocus
                                type="number"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                className="bg-transparent border-b-2 border-primary/50 text-5xl font-black w-32 py-3 focus:border-primary outline-none placeholder:text-[var(--text-muted)] text-center text-[var(--text-primary)]"
                                placeholder="000"
                            />
                            <span className="text-xl font-black mb-6 text-[var(--text-muted)]">kg</span>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary font-bold">straighten</span>
                        </div>
                        <h1 className="text-3xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-tight">Sua Estatura</h1>
                        <p className="text-[var(--text-secondary)] mb-8 font-medium">Qual sua altura em centímetros?</p>
                        <div className="flex items-end gap-2">
                            <input
                                autoFocus
                                type="number"
                                value={height}
                                onChange={e => setHeight(e.target.value)}
                                className="bg-transparent border-b-2 border-primary/50 text-5xl font-black w-32 py-3 focus:border-primary outline-none placeholder:text-[var(--text-muted)] text-center text-[var(--text-primary)]"
                                placeholder="175"
                            />
                            <span className="text-xl font-black mb-6 text-[var(--text-muted)]">cm</span>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <>
                        <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary font-bold">flag</span>
                        </div>
                        <h1 className="text-3xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-tight">Meta da Entrega</h1>
                        <p className="text-[var(--text-secondary)] mb-8 font-medium">Onde você quer chegar? Defina seu objetivo.</p>
                        <div className="flex items-end gap-2">
                            <input
                                autoFocus
                                type="number"
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                className="bg-transparent border-b-2 border-primary/50 text-5xl font-black w-32 py-3 focus:border-primary outline-none placeholder:text-[var(--text-muted)] text-center text-[var(--text-primary)]"
                                placeholder="000"
                            />
                            <span className="text-xl font-black mb-6 text-[var(--text-muted)]">kg</span>
                        </div>
                    </>
                )}

                {step === 5 && (
                    <>
                        <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary font-bold">analytics</span>
                        </div>
                        <h1 className="text-3xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-tight">Relatório de Pesagem</h1>
                        <p className="text-[var(--text-secondary)] mb-8 font-medium">Veja como está sua carga agora.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--card)] border border-[var(--card-border)] p-4 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Seu IMC</p>
                                <p className="text-3xl font-black text-primary">{calculateBMI()}</p>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">
                                    {parseFloat(calculateBMI() as string) > 25 ? '⚠️ Acima do ideal' : '✅ Peso saudável'}
                                </p>
                            </div>
                            <div className="bg-[var(--card)] border border-[var(--card-border)] p-4 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Peso Ideal</p>
                                <p className="text-3xl font-black text-[var(--text-primary)]">{calculateIdealWeight()} <span className="text-sm">kg</span></p>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">Sugerido para sua altura</p>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                            <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed">
                                <span className="text-primary font-black uppercase">Dica do Coach:</span> Sua meta de <span className="text-[var(--text-primary)]">{goal}kg</span> {parseFloat(goal) <= parseFloat(calculateIdealWeight() as string) ? 'está excelente!' : 'é um ótimo começo para sua saúde.'}
                            </p>
                        </div>
                    </>
                )}

                {step === 6 && (
                    <>
                        <div className="size-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary overflow-hidden relative shadow-lg shadow-primary/20">
                            {avatarUrl ? (
                                <img src={avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-primary font-bold">face</span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-tight">Sua Foto de Perfil</h1>
                        <p className="text-[var(--text-secondary)] mb-8 font-medium">Tire uma foto ou escolha da galeria.</p>

                        <label className="w-full flex items-center justify-center gap-3 bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary transition-all shadow-sm group">
                            <span className="material-symbols-outlined text-primary text-2xl font-bold group-hover:scale-110 transition-transform">add_a_photo</span>
                            <span className="font-black text-lg text-[var(--text-primary)] uppercase tracking-tight">Escolher Foto</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        <div className="flex items-center gap-4 my-6 w-full">
                            <div className="h-px bg-[var(--card-border)] flex-1"></div>
                            <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest leading-none">ou escolha um avatar</span>
                            <div className="h-px bg-[var(--card-border)] flex-1"></div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto py-2 w-full justify-center">
                            {['https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'].map(url => (
                                <img
                                    key={url}
                                    src={url}
                                    className={`size-12 rounded-full border-2 cursor-pointer ${avatarUrl === url ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => { setFile(null); setAvatarUrl(url); }}
                                />
                            ))}
                        </div>
                    </>
                )}

            </div>

            <button
                disabled={loading || (step === 1 && !nickname) || (step === 2 && !weight) || (step === 3 && !height) || (step === 4 && !goal)}
                onClick={handleNext}
                className="w-full bg-primary text-black font-black py-4 rounded-2xl text-lg shadow-xl shadow-primary/30 disabled:opacity-50 active:scale-95 transition-all mt-8 uppercase tracking-widest border-2 border-primary"
            >
                {loading ? 'Processando...' : (step === 6 ? 'Iniciar Jornada' : 'Próximo Passo')}
            </button>
        </div>
    );
};

export default Onboarding;
