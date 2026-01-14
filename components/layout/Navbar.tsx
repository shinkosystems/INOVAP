import React, { useState, useEffect } from 'react';
import { Logo } from '../ui/Logo';
import { Menu, X, LogIn, Download, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onLoginClick: () => void;
  onNavigate?: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(initialTheme);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const navItems = [
    { label: 'Início', target: 'inicio' },
    { label: 'Sobre', target: 'sobre' },
    { label: 'Grupos', target: 'gts' },
    { label: 'Artigos', target: 'artigos' },
    { label: 'Agenda', target: 'eventos' }
  ];

  const handleNavClick = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(target);
    } else {
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`
            mx-auto transition-all duration-500 rounded-3xl border 
            ${theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-white/70'}
            backdrop-blur-xl shadow-xl
            ${scrolled ? 'shadow-black/10' : 'shadow-transparent'}
        `}>
            <div className="flex justify-between h-16 items-center px-6">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={(e) => handleNavClick(e, 'inicio')}>
                <Logo dark={theme === 'dark'} />
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                    <a 
                        key={item.label} 
                        href={`#${item.target}`}
                        onClick={(e) => handleNavClick(e, item.target)}
                        className={`text-sm font-semibold transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'text-slate-400 hover:text-brand-neon' 
                            : 'text-slate-600 hover:text-brand-green'
                        }`}
                    >
                        {item.label}
                    </a>
                ))}

                <button 
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-full transition-all border ${
                    theme === 'dark' 
                      ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button 
                  onClick={onLoginClick}
                  className={`
                    px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 border shadow-lg
                    ${theme === 'dark'
                      ? 'bg-brand-green/20 border-brand-green/40 text-brand-neon hover:bg-brand-neon hover:text-black shadow-brand-neon/10'
                      : 'bg-brand-green border-brand-green text-white hover:bg-brand-darkGreen shadow-brand-green/20'
                    }
                  `}
                >
                  <LogIn size={18} />
                  Área do Membro
                </button>
            </div>

            <div className="md:hidden flex items-center gap-4">
                <button 
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-all ${
                    theme === 'dark' ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={() => setIsOpen(!isOpen)} className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} hover:text-brand-neon transition-colors`}>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
            </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 z-50 animate-fade-in-up">
            <div className={`backdrop-blur-2xl border rounded-[2rem] p-6 space-y-3 shadow-2xl ${
              theme === 'dark' ? 'bg-black/90 border-white/10' : 'bg-white/95 border-slate-200'
            }`}>
                {navItems.map((item) => (
                    <a 
                        key={item.label}
                        href={`#${item.target}`} 
                        onClick={(e) => handleNavClick(e, item.target)} 
                        className={`block px-5 py-4 rounded-2xl text-lg font-bold transition-colors ${
                          theme === 'dark' ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {item.label}
                    </a>
                ))}
                <button 
                  onClick={() => { setIsOpen(false); onLoginClick(); }}
                  className="w-full mt-6 bg-brand-neon text-black px-5 py-4 rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-neon/20"
                >
                  <LogIn size={20} />
                  Área do Membro
                </button>
            </div>
        </div>
      )}
    </nav>
  );
};