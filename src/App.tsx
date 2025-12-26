
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
  const [hasProfile, setHasProfile] = useState<boolean | null>(null); // null = loading
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    window.showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };

    window.toggleTheme = () => {
      setIsDarkMode(prev => {
        const next = !prev;
        localStorage.setItem('theme', next ? 'dark' : 'light');
        return next;
      });
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
    try {
      const stats = await api.getUserStats();
      setHasProfile(!!stats);
    } catch (e) {
      console.error(e);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-primary font-bold">Carregando...</div>;

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
      case View.PROFILE: return <Profile />;
      case View.ADMIN: return <Admin />;
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
          icon="leaderboard"
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
