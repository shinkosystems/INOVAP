import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/landing/Hero';
import { Stats } from './components/landing/Stats';
import { WorkingGroups } from './components/landing/WorkingGroups';
import { LatestNews } from './components/landing/LatestNews';
import { Events } from './components/landing/Events';
import { Footer } from './components/layout/Footer';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { User } from './types';
import { supabase } from './services/supabase';

enum Page {
  LANDING,
  LOGIN,
  DASHBOARD
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on mount
  useEffect(() => {
      const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
             // If session exists, try to get profile data
              const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('uuid', session.user.id)
              .single();
              
              if (profile) {
                  setUser({ ...profile, email: session.user.email || '', uuid: session.user.id });
                  setCurrentPage(Page.DASHBOARD);
              }
          }
      };
      checkSession();
  }, []);


  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage(Page.LANDING);
  };

  const renderContent = () => {
    switch (currentPage) {
      case Page.LOGIN:
        return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setCurrentPage(Page.LANDING)} />;
      
      case Page.DASHBOARD:
        return <Dashboard onLogout={handleLogout} user={user} />;
      
      case Page.LANDING:
      default:
        return (
          <div className="bg-black min-h-screen text-white selection:bg-brand-neon selection:text-black">
            <Navbar onLoginClick={() => setCurrentPage(Page.LOGIN)} />
            <Hero />
            <Stats />
            <WorkingGroups />
            <LatestNews />
            <Events />
            
            {/* About Section - Glass Dark */}
            <section id="sobre" className="py-32 bg-brand-black relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black via-brand-green/5 to-black"></div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-16">
                   <div className="flex-1 relative">
                      <div className="absolute inset-0 bg-brand-neon rounded-3xl blur-2xl opacity-20 transform rotate-3"></div>
                      <img 
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                        alt="Colaboração" 
                        className="relative rounded-3xl shadow-2xl border border-white/10 opacity-90 grayscale hover:grayscale-0 transition-all duration-700"
                      />
                   </div>
                   <div className="flex-1">
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Por que o INOVAP?</h2>
                      <p className="text-lg text-slate-400 mb-8 leading-relaxed font-light">
                        Acreditamos que a inovação não acontece isoladamente. O INOVAP foi criado para quebrar silos e conectar universidades, startups, investidores e grandes corporações em um ambiente de troca contínua.
                      </p>
                      <ul className="space-y-6">
                        {[
                          "Acesso a mentores especializados",
                          "Visibilidade para sua startup ou projeto",
                          "Conexão direta com fundos de investimento",
                          "Participação em eventos exclusivos"
                        ].map((item, i) => (
                           <li key={i} className="flex items-center gap-4 text-slate-300 font-medium p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-neon text-xs font-bold">✓</div>
                              {item}
                           </li>
                        ))}
                      </ul>
                   </div>
                </div>
              </div>
            </section>

            <Footer />
          </div>
        );
    }
  };

  return (
    <>
      {renderContent()}
    </>
  );
};

export default App;