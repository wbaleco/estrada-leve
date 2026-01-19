
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);

    // Form States
    const [identifier, setIdentifier] = useState(''); // Email or Username for Login
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isResetMode) {
                const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
                    redirectTo: window.location.origin,
                });
                if (error) throw error;
                window.showToast('Link enviado! Verifique seu email.', 'success');
                setIsResetMode(false);
            }
            else if (isSignUp) {
                // SIGN UP FLOW (Standard Email)
                const { data, error } = await supabase.auth.signUp({
                    email: signupEmail,
                    password: signupPassword,
                    options: {
                        // We don't verify email immediately, but we can store metadata if needed
                    }
                });

                if (error) throw error;

                if (data.user && data.session === null) {
                    // Check if confirmation is required
                    // Note: User says they disabled confirmation, so this might not happen if configured right
                    window.showToast('Conta criada! Verifique seu email se necessário.', 'info');
                    setIsSignUp(false); // Switch to login
                } else {
                    window.showToast('Bem-vindo à boleia!', 'success');
                    onLoginSuccess();
                }
            }
            else {
                // LOGIN FLOW (Email OR Username)
                let emailToUse = identifier.trim();

                // If input doesn't look like an email, try to resolve username
                if (!emailToUse.includes('@')) {
                    const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_email_by_nickname', {
                        input_nickname: identifier.trim()
                    });

                    if (rpcError) {
                        console.error('RPC Error:', rpcError);
                    }

                    if (resolvedEmail) {
                        emailToUse = resolvedEmail;
                    } else {
                        // Optimistic fall-through or error? 
                        // If we didn't find the email, it might fail, but let's let Supabase try or error out gracefully.
                        // Actually, if we pass a username to signInWithPassword it fails.
                        // We'll throw a specific error here if we couldn't resolve
                        throw new Error('Usuário não encontrado. Tente usar seu email.');
                    }
                }

                const { error } = await supabase.auth.signInWithPassword({
                    email: emailToUse,
                    password: loginPassword,
                });

                if (error) throw error;
                onLoginSuccess();
            }
        } catch (err: any) {
            console.error('Auth Error:', err);
            let msg = err.message;
            if (msg.includes('Invalid login')) msg = 'Credenciais inválidas.';
            if (msg.includes('Email signups are disabled')) msg = 'O cadastro por email está desativado no Supabase. Habilite em Auth -> Providers.';
            if (msg.includes('security purposes')) msg = 'Muitas tentativas. Aguarde um pouco.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)] animate-in fade-in">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-64 aspect-video flex items-center justify-center mx-auto">
                        <img src="/logo.png" alt="Estrada Leve" className="w-full h-full object-contain" />
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                    <h2 className="text-xl font-black mb-6 text-center text-[var(--text-primary)] uppercase tracking-wider">
                        {isResetMode ? 'Recuperar Acesso' : (isSignUp ? 'Nova Conta' : 'Acessar')}
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="flex flex-col gap-4">

                        {/* INPUTS FOR SIGN UP */}
                        {isSignUp && (
                            <>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Email</label>
                                    <input
                                        type="email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-primary outline-none transition-all font-bold shadow-inner"
                                        placeholder="email@exemplo.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Senha</label>
                                    <input
                                        type="password"
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-primary outline-none transition-all font-bold shadow-inner"
                                        placeholder="******"
                                        required
                                    />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1 ml-1">* O nome de usuário será criado no próximo passo.</p>
                                </div>
                            </>
                        )}

                        {/* INPUTS FOR LOGIN */}
                        {!isSignUp && !isResetMode && (
                            <>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Email ou Nome de Usuário</label>
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-primary outline-none transition-all font-bold shadow-inner"
                                        placeholder="user ou email@..."
                                        required
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center ml-1 mb-1.5">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Senha</label>
                                        <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-black text-primary uppercase hover:underline">Esqueci</button>
                                    </div>
                                    <input
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-primary outline-none transition-all font-bold shadow-inner"
                                        placeholder="******"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* INPUTS FOR RESET */}
                        {isResetMode && (
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-1 mb-1.5 block tracking-widest">Seu Email</label>
                                <input
                                    type="email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-primary outline-none transition-all font-bold shadow-inner"
                                    placeholder="email@exemplo.com"
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Processando...' : (isResetMode ? 'Enviar Link' : (isSignUp ? 'Criar Conta' : 'Entrar'))}
                        </button>
                    </form>

                    <div className="mt-6 text-center flex flex-col gap-3">
                        {isResetMode ? (
                            <button onClick={() => setIsResetMode(false)} className="text-xs text-[var(--text-secondary)] hover:text-primary font-black uppercase tracking-widest">Voltar</button>
                        ) : (
                            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-primary hover:underline font-black uppercase tracking-widest">
                                {isSignUp ? 'Já tem conta? Entrar' : 'Novo por aqui? Criar Conta'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
