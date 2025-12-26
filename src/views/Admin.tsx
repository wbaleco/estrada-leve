
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

const Admin: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<any | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await api.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
            window.showToast('Erro ao carregar usuários', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir o perfil deste usuário? Isso não apagará a conta de login, mas limpará todos os dados do app.')) return;

        try {
            await api.deleteProfile(userId);
            window.showToast('Perfil excluído com sucesso!', 'success');
            loadUsers();
        } catch (err) {
            console.error(err);
            window.showToast('Erro ao excluir perfil', 'error');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await api.updateProfile(editingUser.userId, {
                nickname: editingUser.nickname,
                current_weight: parseFloat(editingUser.currentWeight),
                goal_weight: parseFloat(editingUser.goalWeight),
                is_admin: editingUser.isAdmin
            });
            window.showToast('Usuário atualizado!', 'success');
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            console.error(err);
            window.showToast('Erro ao atualizar usuário', 'error');
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 pb-20">
            <header className="p-4 border-b border-[var(--card-border)] bg-[var(--background)]/95 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Gerenciar Usuários</h2>
                <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase">Painel Admin</span>
            </header>

            {loading ? (
                <div className="p-10 text-center text-[var(--text-muted)] font-bold italic">Carregando lista de parceiros...</div>
            ) : (
                <div className="p-4 flex flex-col gap-4">
                    {users.map(u => (
                        <div key={u.userId} className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="material-symbols-outlined text-primary">person</span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[var(--text-primary)] uppercase tracking-tight leading-tight">{u.nickname || 'Sem Nome'}</h3>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{u.points} pontos acumulados</p>
                                    </div>
                                </div>
                                {u.isAdmin && <span className="material-symbols-outlined text-primary text-sm">verified</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-[var(--background)] p-2 rounded-lg border border-[var(--card-border)]">
                                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase">Peso Atual</p>
                                    <p className="font-bold text-sm">{u.currentWeight}kg</p>
                                </div>
                                <div className="bg-[var(--background)] p-2 rounded-lg border border-[var(--card-border)]">
                                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase">Meta</p>
                                    <p className="font-bold text-sm">{u.goalWeight}kg</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingUser(u)}
                                    className="flex-1 bg-primary/10 text-primary font-black text-xs py-2 rounded-xl hover:bg-primary hover:text-black transition-all uppercase tracking-widest"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(u.userId)}
                                    className="flex-1 bg-red-500/10 text-red-500 font-black text-xs py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingUser(null)}></div>
                    <div className="bg-[var(--card)] w-full max-w-sm rounded-3xl p-6 relative z-10 border border-[var(--card-border)] shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black mb-6 text-[var(--text-primary)] uppercase tracking-tight">Editar Motorista</h3>

                        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Nome de Guerra</label>
                                <input
                                    type="text"
                                    value={editingUser.nickname}
                                    onChange={e => setEditingUser({ ...editingUser, nickname: e.target.value })}
                                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-primary transition-all font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Peso Atual</label>
                                    <input
                                        type="number"
                                        value={editingUser.currentWeight}
                                        onChange={e => setEditingUser({ ...editingUser, currentWeight: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-primary transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Meta</label>
                                    <input
                                        type="number"
                                        value={editingUser.goalWeight}
                                        onChange={e => setEditingUser({ ...editingUser, goalWeight: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-primary transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] mt-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={editingUser.isAdmin}
                                    onChange={e => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                                    className="size-5 accent-primary"
                                />
                                <label htmlFor="isAdmin" className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Privilégios de Admin</label>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 text-[var(--text-muted)] font-black text-xs uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 bg-primary text-black font-black py-3 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
