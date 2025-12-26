
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isResetMode) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (error) throw error;
                window.showToast('Link de recuperação enviado para seu email!', 'success');
                setIsResetMode(false);
            } else if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                if (data.user && data.session === null) {
                    window.showToast('Quase lá! Verifique seu email para confirmar o cadastro.', 'success');
                    setError('Por favor, confirme seu email no link enviado para fazer login.');
                } else {
                    window.showToast('Cadastro realizado com sucesso!', 'success');
                    onLoginSuccess();
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    if (error.message.includes('Email not confirmed')) {
                        throw new Error('Verifique seu email para confirmar seu cadastro antes de entrar.');
                    }
                    throw error;
                }
                onLoginSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)] animate-in fade-in">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-4xl text-primary font-bold">local_shipping</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2 text-[var(--text-primary)] uppercase tracking-tight">Estrada Leve</h1>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">Sua boleia, sua saúde.</p>
                </div>

                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                    <h2 className="text-xl font-black mb-6 text-center text-[var(--text-primary)] uppercase tracking-wider">
                        {isResetMode ? 'Recuperar Senha' : (isSignUp ? 'Criar Nova Conta' : 'Acessar Conta')}
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="flex flex-col gap-4">
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-primary outline-none transition-all font-medium shadow-inner placeholder:text-[var(--text-muted)]"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                        {!isResetMode && (
                            <div>
                                <div className="flex justify-between items-center ml-1 mb-1.5">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Senha</label>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => setIsResetMode(true)}
                                            className="text-[10px] font-black text-primary uppercase hover:underline"
                                        >
                                            Esqueci a senha
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-primary outline-none transition-all font-medium shadow-inner placeholder:text-[var(--text-muted)]"
                                    placeholder="******"
                                    required={!isResetMode}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Processando...' : (isResetMode ? 'Enviar Link' : (isSignUp ? 'Cadastrar' : 'Entrar'))}
                        </button>
                    </form>

                    <div className="mt-6 text-center flex flex-col gap-3">
                        {isResetMode ? (
                            <button
                                onClick={() => setIsResetMode(false)}
                                className="text-xs text-[var(--text-secondary)] hover:text-primary font-black uppercase tracking-widest"
                            >
                                Voltar para o Login
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-xs text-primary hover:underline font-black uppercase tracking-widest"
                            >
                                {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
