import React from 'react';
import { Logo } from '../ui/Logo';
import { Mail, MapPin, Phone, Instagram, Linkedin, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-slate-400 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Logo dark className="mb-8" />
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Transformando o Vale do Paraíba em referência mundial de inovação com transparência e conexão.
            </p>
            <div className="flex gap-4">
              {[Instagram, Linkedin, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-brand-neon hover:text-black transition-all duration-300">
                    <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-8 text-lg">Navegação</h4>
            <ul className="space-y-4 text-sm">
              {['Início', 'Grupos de Trabalho', 'Sobre Nós', 'Parceiros', 'Privacidade'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-brand-neon transition-colors block py-1">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-8 text-lg">Contato</h4>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-brand-green"><MapPin size={18} /></div>
                <span>Parque Tecnológico<br />São José dos Campos - SP</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-brand-green"><Phone size={18} /></div>
                <span>(12) 3999-9999</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-brand-green"><Mail size={18} /></div>
                <span>contato@inovap.com.br</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-8 text-lg">Atualizações</h4>
            <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="bg-transparent border-none px-4 py-3 text-sm w-full focus:ring-0 text-white placeholder-slate-600"
              />
              <button className="bg-white text-black hover:bg-brand-neon px-6 py-3 rounded-xl text-sm font-bold transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
          <p>&copy; {new Date().getFullYear()} INOVAP. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0 opacity-50">Design System v26.0</p>
        </div>
      </div>
    </footer>
  );
};