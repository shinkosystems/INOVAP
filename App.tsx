import React, { useState, useEffect } from 'react';
// Added missing ArrowRight icon from lucide-react
import { ArrowRight } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/landing/Hero';
import { Stats } from './components/landing/Stats';
import { WorkingGroups } from './components/landing/WorkingGroups';
import { LatestNews } from './components/landing/LatestNews';
import { Events } from './components/landing/Events';
import { Footer } from './components/layout/Footer';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { BlogPage } from './pages/BlogPage';
import { ArticlePage } from './pages/ArticlePage';
import { ProfilePage } from './pages/ProfilePage';
import { CompanyPublicPage } from './components/company/CompanyPublicPage';
import { EventsPage } from './pages/EventsPage';
import { AboutPage } from './pages/AboutPage';
import { GroupsPage } from './pages/GroupsPage';
import { User, Empresa } from './types';
import { supabase } from './services/supabase';

enum Page {
  LANDING,
  LOGIN,
  DASHBOARD,
  BLOG,
  ARTICLE,
  PROFILE,
  COMPANY_PUBLIC,
  EVENTS_PUBLIC,
  ABOUT,
  GROUPS
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [previewEmpresa, setPreviewEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
      const checkSession = async () => {
          const params = new URLSearchParams(window.location.search);
          const pageParam = params.get('page');
          const idParam = params.get('id');

          if (pageParam === 'empresa' && idParam) {
              const { data } = await supabase.from('empresas').select('*').eq('id', idParam).single();
              if (data) {
                  setPreviewEmpresa(data);
                  setCurrentPage(Page.COMPANY_PUBLIC);
                  return;
              }
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
              const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('uuid', session.user.id)
              .single();
              
              if (profile) {
                  let userData: User = { 
                    ...profile, 
                    email: session.user.email || '', 
                    uuid: session.user.id 
                  };

                  if (session.user.email === 'peboorba@gmail.com') {
                      userData.governanca = true;
                      userData.gts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                      userData.cargo = 1; 
                  }

                  setUser(userData);
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

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage(Page.LANDING);
  };

  const handleOpenArticle = (id: number) => {
    setSelectedArticleId(id);
    setCurrentPage(Page.ARTICLE);
    window.scrollTo(0, 0);
  };

  const handleViewCompany = (empresa: Empresa) => {
      setPreviewEmpresa(empresa);
      setCurrentPage(Page.COMPANY_PUBLIC);
      window.scrollTo(0, 0);
  };

  const handleNavigate = (target: string) => {
    if (target === 'artigos') {
      setCurrentPage(Page.BLOG);
      window.scrollTo(0, 0);
    } else if (target === 'eventos') {
      setCurrentPage(Page.EVENTS_PUBLIC);
      window.scrollTo(0, 0);
    } else if (target === 'sobre') {
      setCurrentPage(Page.ABOUT);
      window.scrollTo(0, 0);
    } else if (target === 'gts') {
      setCurrentPage(Page.GROUPS);
      window.scrollTo(0, 0);
    } else {
      if (currentPage !== Page.LANDING) {
        setCurrentPage(Page.LANDING);
        setTimeout(() => {
          const element = document.getElementById(target);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo(0, 0);
          }
        }, 100);
      } else {
        const element = document.getElementById(target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }
      }
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case Page.LOGIN:
        return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setCurrentPage(Page.LANDING)} />;
      
      case Page.DASHBOARD:
        return (
            <Dashboard 
                onLogout={handleLogout} 
                user={user} 
                onProfileClick={() => setCurrentPage(Page.PROFILE)}
                onViewCompany={handleViewCompany}
            />
        );

      case Page.PROFILE:
        return user ? (
            <ProfilePage 
                user={user} 
                onBack={() => setCurrentPage(Page.DASHBOARD)}
                onUpdateUser={handleUpdateUser}
                onLogout={handleLogout}
                onViewCompany={handleViewCompany}
            />
        ) : <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setCurrentPage(Page.LANDING)} />;
      
      case Page.COMPANY_PUBLIC:
        if (!previewEmpresa) return null;
        return (
            <CompanyPublicPage 
                empresa={previewEmpresa} 
                onBack={user ? () => setCurrentPage(Page.PROFILE) : undefined} 
                onLoginClick={() => setCurrentPage(Page.LOGIN)}
            />
        );

      case Page.BLOG:
        return (
            <BlogPage 
                onLoginClick={() => setCurrentPage(Page.LOGIN)} 
                onNavigate={handleNavigate}
                onArticleClick={handleOpenArticle}
            />
        );

      case Page.EVENTS_PUBLIC:
        return (
            <EventsPage 
                user={user}
                onLoginClick={() => setCurrentPage(Page.LOGIN)} 
                onNavigate={handleNavigate}
            />
        );

      case Page.ABOUT:
        return (
            <AboutPage 
                onLoginClick={() => setCurrentPage(Page.LOGIN)} 
                onNavigate={handleNavigate}
            />
        );

      case Page.GROUPS:
        return (
            <GroupsPage 
                onLoginClick={() => setCurrentPage(Page.LOGIN)} 
                onNavigate={handleNavigate}
                onViewCompany={handleViewCompany}
            />
        );

      case Page.ARTICLE:
        return (
            <ArticlePage 
                articleId={selectedArticleId}
                onBack={() => setCurrentPage(Page.BLOG)}
                onLoginClick={() => setCurrentPage(Page.LOGIN)}
                onNavigate={handleNavigate}
            />
        );

      case Page.LANDING:
      default:
        return (
          <div className="bg-black min-h-screen text-white selection:bg-brand-neon selection:text-black">
            <Navbar onLoginClick={() => setCurrentPage(Page.LOGIN)} onNavigate={handleNavigate} />
            <Hero />
            <Stats />
            <WorkingGroups />
            <LatestNews 
                onViewAll={() => handleNavigate('artigos')} 
                onArticleClick={handleOpenArticle}
            />
            <Events /> 
            
            <section id="sobre" className="py-32 bg-brand-black relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black via-brand-green/10 to-black"></div>
              
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
                          "Visibilidade para sua startup or projeto",
                          "Conexão direta com investidores estratégicos",
                          "Participação em eventos exclusivos"
                        ].map((item, i) => (
                           <li key={i} className="flex items-center gap-4 text-slate-300 font-medium p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-neon text-xs font-bold">✓</div>
                              {item}
                           </li>
                        ))}
                      </ul>
                      <button onClick={() => handleNavigate('sobre')} className="mt-12 text-brand-neon font-bold flex items-center gap-2 hover:gap-4 transition-all">
                        Conheça nossa história completa <ArrowRight size={20} />
                      </button>
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