
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

const Admin: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const [activeNotifs, setActiveNotifs] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [uData, nData] = await Promise.all([
                api.getAllUsers(),
                api.getNotifications()
            ]);
            setUsers(uData);
            setActiveNotifs(nData);
        } catch (err) {
            console.error(err);
            window.showToast('Erro ao carregar usuários', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            await api.deleteProfile(userToDelete.userId);
            window.showToast('Perfil excluído com sucesso!', 'success');
            setUserToDelete(null);
            loadData();
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
            loadData();
        } catch (err) {
            console.error(err);
            window.showToast('Erro ao atualizar usuário', 'error');
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 pb-20">
            <header className="p-4 border-b border-[var(--card-border)] bg-[var(--background)]/95 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Gerenciar Usuários</h2>
                <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase">Painel Admin ({users.length})</span>
            </header>

            {/* Search Bar */}
            <div className="p-4 bg-[var(--background)]">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Pesquisar motorista por nome..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] font-bold outline-none focus:border-primary transition-all shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-10 text-center text-[var(--text-muted)] font-bold italic">Carregando lista de parceiros...</div>
            ) : (
                <div className="p-4 flex flex-col gap-4">
                    {users.filter(u => u.nickname?.toLowerCase().includes(search.toLowerCase())).map(u => (
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
                                    onClick={() => setUserToDelete(u)}
                                    className="flex-1 bg-red-500/10 text-red-500 font-black text-xs py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setUserToDelete(null)}></div>
                    <div className="bg-[var(--card)] w-full max-w-sm rounded-[32px] p-6 relative z-10 border border-red-500/20 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                            <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
                        </div>

                        <h3 className="text-xl font-black text-center mb-2 text-[var(--text-primary)] uppercase tracking-tight">Confirmar Exclusão</h3>
                        <p className="text-sm text-[var(--text-muted)] text-center mb-6 font-medium">
                            Tem certeza que deseja apagar o perfil de <span className="text-red-500 font-black">{userToDelete.nickname}</span>?
                            <br /><br />
                            <span className="text-[10px] uppercase font-black opacity-50">Isso limpará todos os pontos, treinos e histórico.</span>
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                            >
                                Sim, Apagar Perfil
                            </button>
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="w-full bg-[var(--background)] text-[var(--text-muted)] font-black py-4 rounded-2xl border border-[var(--card-border)] active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
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
            {/* Broadcast Section */}
            <div className="p-4 mt-8 border-t border-[var(--card-border)]">
                <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">campaign</span>
                    Buzina da Estrada (Aviso Geral)
                </h3>
                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-4">Envie um alerta ou aviso para todos os motoristas logados.</p>
                    <div className="space-y-4">
                        <input
                            id="notif-title"
                            type="text"
                            placeholder="Título do Aviso (ex: Nova Meta!)"
                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-primary transition-all font-bold text-sm"
                        />
                        <textarea
                            id="notif-message"
                            placeholder="Sua mensagem para a frota..."
                            rows={3}
                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-primary transition-all font-bold text-sm resize-none"
                        ></textarea>
                        <div className="grid grid-cols-2 gap-2">
                            <select id="notif-type" className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold text-xs uppercase outline-none">
                                <option value="info">INFORMAÇÃO</option>
                                <option value="success">CONQUISTA</option>
                                <option value="urgent">URGENTE</option>
                            </select>
                            <button
                                onClick={async () => {
                                    const title = (document.getElementById('notif-title') as HTMLInputElement).value;
                                    const message = (document.getElementById('notif-message') as HTMLTextAreaElement).value;
                                    const type = (document.getElementById('notif-type') as HTMLSelectElement).value;

                                    if (!title || !message) return window.showToast('Preencha título e mensagem', 'error');

                                    try {
                                        await api.sendNotification(title, message, type);
                                        window.showToast('Buzina tocada! Aviso enviado.', 'success');
                                        (document.getElementById('notif-title') as HTMLInputElement).value = '';
                                        (document.getElementById('notif-message') as HTMLTextAreaElement).value = '';
                                        loadData();
                                    } catch (e) { window.showToast('Erro ao enviar aviso', 'error'); }
                                }}
                                className="bg-primary text-black font-black py-3 rounded-xl hover:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                                Enviar Aviso
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Notifications List */}
                {activeNotifs.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-1">Avisos Ativos no App</p>
                        {activeNotifs.map(notif => (
                            <div key={notif.id} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined ${notif.type === 'urgent' ? 'text-red-500' :
                                        notif.type === 'success' ? 'text-green-500' :
                                            'text-primary'
                                        }`}>{notif.icon || 'notifications'}</span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-[var(--text-primary)] leading-tight">{notif.title}</h4>
                                        <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{notif.message}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            await api.deleteNotification(notif.id);
                                            window.showToast('Aviso removido!', 'success');
                                            loadData();
                                        } catch (e) { window.showToast('Erro ao remover', 'error'); }
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
