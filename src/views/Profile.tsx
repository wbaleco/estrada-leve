
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { UserStats, View } from '../types';

interface ProfileProps {
    onNavigate?: (view: View) => void;
}

const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [medals, setMedals] = useState<any[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form states
    const [form, setForm] = useState({
        nickname: '',
        currentWeight: '',
        goalWeight: '',
        height: '',
        age: '',
        gender: 'male'
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [data, mData] = await Promise.all([
                api.getUserStats(),
                api.getUserMedals()
            ]);

            if (data) {
                setStats(data);
                setForm({
                    nickname: data.nickname || '',
                    currentWeight: data.currentWeight.toString(),
                    goalWeight: data.goalWeight.toString(),
                    height: (data.height || '').toString(),
                    age: (data.age || '40').toString(),
                    gender: data.gender || 'male'
                });
            }
            setMedals(mData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Not authenticated');

            await api.updateProfile(user.id, {
                nickname: form.nickname,
                current_weight: parseFloat(form.currentWeight),
                goal_weight: parseFloat(form.goalWeight),
                height: parseFloat(form.height),
                age: parseInt(form.age),
                gender: form.gender
            });

            window.showToast('Perfil atualizado com sucesso!', 'success');
            setEditing(false);
            loadData();
        } catch (err: any) {
            window.showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return window.showToast('As senhas não coincidem', 'error');
        }
        if (newPassword.length < 6) {
            return window.showToast('A senha deve ter pelo menos 6 caracteres', 'error');
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            window.showToast('Senha alterada com sucesso!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            window.showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setSaving(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Not authenticated');

            await api.deleteProfile(user.id);
            await api.deleteAuthAccount();
            await api.signOut();
            window.location.reload();
        } catch (err: any) {
            window.showToast(err.message, 'error');
            setShowDeleteConfirm(false);
        } finally {
            setSaving(false);
        }
    };

    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setUploadingAvatar(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // Update profile and auth metadata
            await Promise.all([
                api.updateProfile(user.id, { avatar_url: publicUrl }),
                supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
            ]);

            window.showToast('Foto atualizada!', 'success');
            loadData();
        } catch (err: any) {
            console.error(err);
            window.showToast('Erro ao subir foto: ' + err.message, 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-[var(--text-muted)] font-bold italic animate-pulse">Consultando ficha técnica...</div>;

    return (
        <div className="flex flex-col animate-in slide-in-from-bottom duration-500 pb-24">
            <div className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4 group">
                        <div className={`size-24 rounded-full border-4 border-primary shadow-2xl overflow-hidden bg-white/5 ${uploadingAvatar ? 'animate-pulse' : ''}`}>
                            <img src={stats?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover" />
                        </div>
                        <label className="absolute bottom-0 right-0 size-8 bg-primary rounded-full flex items-center justify-center border-2 border-[var(--background)] shadow-lg hover:scale-110 transition-transform cursor-pointer">
                            <span className="material-symbols-outlined text-black text-sm font-bold">{uploadingAvatar ? 'sync' : 'edit'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                        </label>
                    </div>
                    <h1 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">{stats?.nickname || 'Motorista'}</h1>
                    <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Parceiro Estrada Leve</p>
                </div>

                {/* Medals Collection */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Suas Conquistas</h3>
                        <span className="text-[10px] font-bold text-primary">{medals.filter(m => m.earned).length}/{medals.length}</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                        {medals.map(medal => (
                            <div
                                key={medal.id}
                                className={`flex flex-col items-center gap-2 shrink-0 w-20 transition-all ${medal.earned ? 'opacity-100 scale-105' : 'opacity-30 grayscale'}`}
                            >
                                <div className={`size-14 rounded-full flex items-center justify-center shadow-lg border-2 ${medal.earned ? 'bg-primary/20 border-primary text-primary shadow-primary/20' : 'bg-gray-500/10 border-gray-500/20 text-gray-500'}`}>
                                    <span className="material-symbols-outlined text-3xl font-bold">{medal.icon}</span>
                                </div>
                                <span className="text-[9px] font-black text-center uppercase leading-tight tracking-tighter truncate w-full">{medal.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Account Settings */}
                <div className="space-y-4">
                    <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => setEditing(!editing)}
                            className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-primary">
                                <span className="material-symbols-outlined font-bold">person_outline</span>
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Informações Pessoais</span>
                            </div>
                            <span className="material-symbols-outlined text-[var(--text-muted)]">{editing ? 'expand_less' : 'expand_more'}</span>
                        </button>

                        {editing && (
                            <form onSubmit={handleUpdateProfile} className="p-4 pt-0 space-y-4 animate-in fade-in duration-300">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Nome de Guerra</label>
                                    <input
                                        type="text"
                                        value={form.nickname}
                                        onChange={e => setForm({ ...form, nickname: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Peso Atual (kg)</label>
                                        <input
                                            type="number"
                                            value={form.currentWeight}
                                            onChange={e => setForm({ ...form, currentWeight: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Meta (kg)</label>
                                        <input
                                            type="number"
                                            value={form.goalWeight}
                                            onChange={e => setForm({ ...form, goalWeight: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Altura (cm)</label>
                                    <input
                                        type="number"
                                        value={form.height}
                                        onChange={e => setForm({ ...form, height: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Idade</label>
                                        <input
                                            type="number"
                                            value={form.age}
                                            onChange={e => setForm({ ...form, age: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1.5 block tracking-widest">Gênero</label>
                                        <select
                                            value={form.gender}
                                            onChange={e => setForm({ ...form, gender: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold outline-none focus:border-primary transition-all appearance-none"
                                        >
                                            <option value="male">Masculino</option>
                                            <option value="female">Feminino</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-primary text-black font-black py-3 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
                                >
                                    {saving ? 'Gravando...' : 'Salvar Alterações'}
                                </button>
                            </form>
                        )}
                    </section>

                    <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-[var(--card-border)]">
                            <div className="flex items-center gap-3 text-primary mb-4">
                                <span className="material-symbols-outlined font-bold">lock_reset</span>
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Alterar Senha</span>
                            </div>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Nova Senha"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-primary transition-all font-bold placeholder:text-[var(--text-muted)] text-sm pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {showNewPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirmar Nova Senha"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-primary transition-all font-bold placeholder:text-[var(--text-muted)] text-sm pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {showConfirmPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving || !newPassword}
                                    className="w-full bg-[var(--background)] dark:bg-white/5 border border-primary/30 text-primary font-black py-3 rounded-xl hover:bg-primary/10 active:scale-95 transition-all uppercase tracking-widest text-xs"
                                >
                                    Trocar Senha
                                </button>
                            </form>
                        </div>
                    </section>


                    {stats?.isAdmin && (
                        <section className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => onNavigate?.(View.ADMIN)}
                                className="w-full p-4 flex items-center justify-between hover:bg-primary/10 transition-colors"
                            >
                                <div className="flex items-center gap-3 text-primary">
                                    <span className="material-symbols-outlined font-bold">admin_panel_settings</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Painel do Chefe</span>
                                </div>
                                <span className="material-symbols-outlined text-primary">chevron_right</span>
                            </button>
                        </section>
                    )}

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full p-4 flex items-center gap-3 text-red-500 bg-red-500/5 border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-colors group mt-8"
                    >
                        <span className="material-symbols-outlined font-bold group-hover:shake">delete_forever</span>
                        <span className="text-xs font-black uppercase tracking-widest">Excluir minha conta e dados</span>
                    </button>

                    <button
                        onClick={() => api.signOut()}
                        className="w-full p-4 flex items-center gap-3 text-[var(--text-muted)] bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-2xl hover:bg-red-500/5 hover:text-red-500 transition-colors mt-2"
                    >
                        <span className="material-symbols-outlined font-bold">logout</span>
                        <span className="text-xs font-black uppercase tracking-widest">Sair do App</span>
                    </button>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !saving && setShowDeleteConfirm(false)} />
                    <div className="bg-[var(--card)] border border-[var(--card-border)] w-full max-w-sm rounded-[32px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="size-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/20">
                                <span className="material-symbols-outlined text-4xl font-black">warning</span>
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">Atenção, Parceiro!</h3>
                            <p className="text-[var(--text-muted)] text-sm font-bold leading-relaxed mb-8">
                                Esta ação é irreversível. Você perderá todo seu progresso, pontos e histórico no Estrada Leve. Deseja mesmo descer do caminhão?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={saving}
                                    className="w-full bg-red-500 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest shadow-lg shadow-red-500/20"
                                >
                                    {saving ? 'Excluindo tudo...' : 'Sim, excluir permanentemente'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={saving}
                                    className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-primary)] font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                                >
                                    Não, quero continuar na estrada
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
