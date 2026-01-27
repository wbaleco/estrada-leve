
import React, { useState, useEffect } from 'react';
import { View } from './types';
import Login from './views/Login';
import Onboarding from './views/Onboarding';
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import Dashboard from './views/Dashboard';
import Schedule from './views/Schedule';
import Diet from './views/Diet';
import Goals from './views/Goals';
import Resources from './views/Resources';
import Ranking from './views/Ranking';
import Winners from './views/Winners';
import Profile from './views/Profile';
import Admin from './views/Admin';

declare global {
  interface Window {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    toggleTheme: () => void;
  }
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [session, setSession] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(() => {
    const cached = localStorage.getItem('has_profile');
    return cached === 'true' ? true : null;
  }); // null = loading/unknown
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    window.showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };

    // Splash Timer
    setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    window.toggleTheme = () => {
      setIsDarkMode(prev => {
        const next = !prev;
        localStorage.setItem('theme', next ? 'dark' : 'light');
        return next;
      });
    };

    const handleOnline = () => {
      setIsOnline(true);
      window.showToast('Conexão restabelecida! Sincronizando...', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      window.showToast('Você está offline. Algumas funções podem não funcionar.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Dark Mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auth Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile();
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile();
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDarkMode]);

  const checkProfile = async () => {
    // Se estivermos offline e já tivermos o cache de perfil, não precisamos nem tentar
    if (!navigator.onLine && localStorage.getItem('has_profile') === 'true') {
      setHasProfile(true);
      setLoading(false);
      return;
    }

    try {
      const stats = await api.getUserStats();
      const has_p = !!stats;
      setHasProfile(has_p);
      if (has_p) {
        localStorage.setItem('has_profile', 'true');
        setIsAdmin(stats.isAdmin === true);
      }
    } catch (e: any) {
      console.error('Profile check error:', e);

      // Lógica de "blindagem" offline:
      // Se houver erro de rede (offline) e já tínhamos perfil antes, mantemos o perfil como true
      if (!navigator.onLine || e.message?.includes('Fetch') || e.code === 'NETWORK_ERROR') {
        if (localStorage.getItem('has_profile') === 'true') {
          setHasProfile(true);
        }
      } else if (e?.code === 'PGRST116' || e?.status === 404) {
        // Apenas se o banco disser explicitamente que não existe, limpamos o cache
        setHasProfile(false);
        localStorage.removeItem('has_profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center animate-in zoom-in-50 fade-in duration-700">
        <div className="w-64 aspect-video flex items-center justify-center mb-0">
          <img src="/logo.png" alt="Estrada Leve" className="w-full h-full object-contain" />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1 w-12 bg-primary rounded-full animate-progress-fast"></div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-primary/60">Carregando</p>
          <div className="h-1 w-12 bg-primary rounded-full animate-progress-fast-delayed"></div>
        </div>
      </div>

      <p className="absolute bottom-10 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest opacity-20">Sua boleia, sua saúde.</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-4 text-primary font-bold">
      <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] uppercase tracking-widest opacity-50">Sincronizando...</p>
    </div>
  );

  if (!session) return <Login onLoginSuccess={() => { }} />;
  if (hasProfile === false) return <Onboarding onComplete={() => setHasProfile(true)} />;

  const renderView = () => {
    switch (activeView) {
      case View.DASHBOARD: return <Dashboard onNavigate={setActiveView} />;
      case View.SCHEDULE: return <Schedule />;
      case View.DIET: return <Diet />;
      case View.GOALS: return <Goals />;
      case View.RESOURCES: return <Resources />;
      case View.RANKING: return <Ranking />;
      case View.WINNERS: return <Winners />;
      case View.PROFILE: return <Profile onNavigate={setActiveView} />;
      case View.ADMIN: return isAdmin ? <Admin /> : <Dashboard onNavigate={setActiveView} />;
      default: return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative bg-background-light dark:bg-background-dark shadow-2xl">
      {/* Dynamic View Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {renderView()}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-[#151c0d] border-t border-gray-200 dark:border-white/5 pb-safe pt-2 px-2 flex justify-between items-center z-50 h-[80px]">
        <NavButton
          active={activeView === View.DASHBOARD}
          onClick={() => setActiveView(View.DASHBOARD)}
          icon="home"
          label="Início"
        />
        <NavButton
          active={activeView === View.RANKING}
          onClick={() => setActiveView(View.RANKING)}
          icon="groups"
          label="Social"
        />
        <NavButton
          active={activeView === View.WINNERS}
          onClick={() => setActiveView(View.WINNERS)}
          icon="emoji_events"
          label="Ranking"
        />
        <NavButton
          active={activeView === View.GOALS}
          onClick={() => setActiveView(View.GOALS)}
          icon="monitoring"
          label="Metas"
        />
        <NavButton
          active={activeView === View.RESOURCES}
          onClick={() => setActiveView(View.RESOURCES)}
          icon="school"
          label="Dicas"
        />
        <NavButton
          active={activeView === View.DIET}
          onClick={() => setActiveView(View.DIET)}
          icon="restaurant_menu"
          label="Dieta"
        />
      </nav>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-[10px] font-black text-center py-1 z-[101] uppercase tracking-widest animate-pulse">
          Sinal Fraco - Modo Offline Ativado 📡
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300 flex items-center gap-3 min-w-[300px] border-l-4 ${toast.type === 'success' ? 'bg-[#adcb90] text-[#151c0d] border-[#151c0d]' :
          toast.type === 'info' ? 'bg-primary text-background-dark border-background-dark' :
            'bg-red-500 text-white border-white'
          }`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'info' ? 'info' : 'error'}
          </span>
          <p className="font-bold">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 w-16 transition-colors ${active ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
  >
    <span className={`material-symbols-outlined text-2xl ${active ? 'material-symbols-filled' : ''}`}>{icon}</span>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
