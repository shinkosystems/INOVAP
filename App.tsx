import React, { useState, useEffect } from 'react';
// Added missing ArrowRight icon from lucide-react
import { ArrowRight } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/landing/Hero';
import { EcosystemSection } from './components/landing/EcosystemSection';
import { AboutSection } from './components/landing/AboutSection';
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
import { GroupsPage } from './pages/GroupsPage';
import { GovernancePage } from './pages/GovernancePage';
import { AdminPage } from './pages/AdminPage';
import { AcademyPage } from './pages/AcademyPage';
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
  GROUPS,
  GOVERNANCE,
  ADMIN,
  ACADEMY
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [previewEmpresa, setPreviewEmpresa] = useState<Empresa | null>(null);
  const [loginInitialIsSignUp, setLoginInitialIsSignUp] = useState(false);
  const [academyEnabled, setAcademyEnabled] = useState(false);

  useEffect(() => {
    const checkAcademy = async () => {
      try {
        const { data } = await supabase.from('configuracoes').select('*').eq('key', 'youtube_channel_url');
        if (data && data.length > 0 && data[0].value) {
          setAcademyEnabled(true);
        } else {
          setAcademyEnabled(false);
        }
      } catch (e) {
        setAcademyEnabled(false);
      }
    };
    checkAcademy();
  }, [currentPage]); // Recarrega quando a página muda para manter sincronizado ao navegar entre telas

  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const empresaId = params.get('empresa') || (params.get('page') === 'empresa' ? params.get('id') : null);

      if (empresaId) {
        const { data } = await supabase.from('empresas').select('*').eq('id', empresaId).single();
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
            userData.is_admin = true;
          }

          setUser(userData);
          
          // Check if should go directly to admin page if user is admin
          const params = new URLSearchParams(window.location.search);
          if (params.get('page') === 'admin' && userData.is_admin) {
            setCurrentPage(Page.ADMIN);
          } else {
            setCurrentPage(Page.DASHBOARD);
          }
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
      if (currentPage !== Page.LANDING) {
        setCurrentPage(Page.LANDING);
        setTimeout(() => {
          const element = document.getElementById('sobre');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo(0, 0);
          }
        }, 100);
      } else {
        const element = document.getElementById('sobre');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo(0, 0);
        }
      }
    } else if (target === 'governanca') {
      setCurrentPage(Page.GOVERNANCE);
      window.scrollTo(0, 0);
    } else if (target === 'gts') {
      setCurrentPage(Page.GROUPS);
      window.scrollTo(0, 0);
    } else if (target === 'admin') {
      if (user?.is_admin) {
        setCurrentPage(Page.ADMIN);
        window.scrollTo(0, 0);
      }
    } else if (target === 'login') {
      setCurrentPage(Page.LOGIN);
      window.scrollTo(0, 0);
    } else if (target === 'academy') {
      setCurrentPage(Page.ACADEMY);
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
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setCurrentPage(Page.LANDING)}
            initialIsSignUp={loginInitialIsSignUp}
          />
        );

      case Page.DASHBOARD:
        return (
          <Dashboard
            onLogout={handleLogout}
            user={user}
            onProfileClick={() => setCurrentPage(Page.PROFILE)}
            onViewCompany={handleViewCompany}
            onNavigate={handleNavigate}
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
        ) : <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setCurrentPage(Page.DASHBOARD)} initialIsSignUp={false} />;

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

      case Page.ACADEMY:
        return (
          <AcademyPage
            onLoginClick={() => setCurrentPage(Page.LOGIN)}
            onNavigate={handleNavigate}
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



      case Page.GOVERNANCE:
        return (
          <GovernancePage
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

      case Page.ADMIN:
        return (
          <AdminPage
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );

      case Page.LANDING:
      default:
        return (
          <div className="bg-black min-h-screen text-white selection:bg-brand-neon selection:text-black">
            <Navbar onLoginClick={() => setCurrentPage(Page.LOGIN)} onNavigate={handleNavigate} academyEnabled={academyEnabled} />
            <Hero />
            <EcosystemSection onNavigate={handleNavigate} />
            <Stats />
            <WorkingGroups />
            <LatestNews
              onViewAll={() => handleNavigate('artigos')}
              onArticleClick={handleOpenArticle}
            />
            <Events
              onLoginClick={(isSignUp) => {
                setLoginInitialIsSignUp(isSignUp || false);
                setCurrentPage(Page.LOGIN);
              }}
            />

            <AboutSection onLoginClick={() => setCurrentPage(Page.LOGIN)} />

            <Footer />
          </div>
        );
    }
  };

  return (
    <>
      {renderContent()}
      {(currentPage !== Page.LOGIN && currentPage !== Page.LANDING && currentPage !== Page.ADMIN) && <Footer />}
    </>
  );
};

export default App;