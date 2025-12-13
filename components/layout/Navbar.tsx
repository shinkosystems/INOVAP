import React, { useState, useEffect } from 'react';
import { Logo } from '../ui/Logo';
import { Menu, X, LogIn } from 'lucide-react';

interface NavbarProps {
  onLoginClick: () => void;
  onNavigate?: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Início', target: 'inicio' },
    { label: 'Grupos de Trabalho', target: 'gts' },
    { label: 'O Ecossistema', target: 'sobre' },
    { label: 'Artigos', target: 'artigos' }
  ];

  const handleNavClick = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(target);
    } else {
      // Fallback para comportamento padrão se onNavigate não for passado (ex: dentro do dashboard)
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
            mx-auto transition-all duration-300 rounded-3xl border border-brand-border
            ${scrolled 
                ? 'bg-black/60 backdrop-blur-xl shadow-lg shadow-black/20' 
                : 'bg-black/30 backdrop-blur-md'}
        `}>
            <div className="flex justify-between h-16 items-center px-6">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={(e) => handleNavClick(e, 'inicio')}>
                <Logo dark />
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                    <a 
                        key={item.label} 
                        href={`#${item.target}`}
                        onClick={(e) => handleNavClick(e, item.target)}
                        className="text-sm font-medium text-slate-300 hover:text-brand-neon hover:shadow-[0_0_15px_rgba(0,255,157,0.5)] transition-all duration-300"
                    >
                        {item.label}
                    </a>
                ))}
                
                <button 
                onClick={onLoginClick}
                className="bg-brand-green/20 border border-brand-green/50 text-brand-neon px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-neon hover:text-black hover:border-brand-neon transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                <LogIn size={16} />
                Área do Membro
                </button>
            </div>

            <div className="md:hidden flex items-center">
                <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-brand-neon transition-colors">
                {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
            </div>
        </div>
      </div>

      {/* Mobile Menu Glass */}
      {isOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 z-50">
            <div className="bg-black/80 backdrop-blur-xl border border-brand-border rounded-3xl p-4 space-y-2 shadow-2xl">
                {navItems.map((item) => (
                    <a 
                        key={item.label}
                        href={`#${item.target}`} 
                        onClick={(e) => handleNavClick(e, item.target)} 
                        className="block px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors"
                    >
                        {item.label}
                    </a>
                ))}
                <button 
                onClick={() => {
                    setIsOpen(false);
                    onLoginClick();
                }}
                className="w-full mt-4 bg-brand-neon text-black px-5 py-3 rounded-xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                <LogIn size={18} />
                Área do Membro
                </button>
            </div>
        </div>
      )}
    </nav>
  );
};