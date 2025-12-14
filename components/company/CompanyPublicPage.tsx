import React from 'react';
import { Empresa } from '../../types';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { MapPin, Globe, Instagram, Linkedin, Building2, ArrowLeft } from 'lucide-react';

interface CompanyPublicPageProps {
  empresa: Empresa;
  onBack?: () => void;
  onLoginClick: () => void;
}

export const CompanyPublicPage: React.FC<CompanyPublicPageProps> = ({ empresa, onBack, onLoginClick }) => {
  const themeColor = empresa.cor_primaria || '#10b981';

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-neon selection:text-black">
      {onBack ? (
          // Navigation when viewing from Dashboard context
          <div className="fixed top-0 left-0 right-0 z-50 p-4">
              <button onClick={onBack} className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 hover:bg-white hover:text-black transition-all">
                  <ArrowLeft size={16} /> Voltar para o Sistema
              </button>
          </div>
      ) : (
          <Navbar onLoginClick={onLoginClick} />
      )}

      {/* Hero Section */}
      <div className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden">
         {/* Background Image */}
         {empresa.banner ? (
             <div className="absolute inset-0 z-0">
                 <img src={empresa.banner} alt="Banner" className="w-full h-full object-cover opacity-60" />
                 <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black"></div>
             </div>
         ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black z-0">
                 <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
             </div>
         )}

         <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up">
             {empresa.logo ? (
                 <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl p-2 mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                     <img src={empresa.logo} alt={empresa.nome} className="w-full h-full object-contain rounded-2xl" />
                 </div>
             ) : (
                 <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/10">
                     <Building2 size={48} className="text-white/50" />
                 </div>
             )}
             
             <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                 {empresa.nome}
             </h1>
             
             {empresa.slogan && (
                 <p className="text-xl md:text-2xl text-slate-300 font-light max-w-2xl leading-relaxed">
                     {empresa.slogan}
                 </p>
             )}

             <div className="mt-12 flex flex-wrap justify-center gap-4">
                 <a href="#sobre" className="px-8 py-3 rounded-xl font-bold bg-white text-black hover:scale-105 transition-transform">
                     Conheça Mais
                 </a>
                 <a href="#contato" 
                    className="px-8 py-3 rounded-xl font-bold border border-white/20 hover:bg-white/10 transition-colors"
                    style={{color: themeColor, borderColor: themeColor}}
                 >
                     Fale Conosco
                 </a>
             </div>
         </div>
      </div>

      {/* About Section */}
      <section id="sobre" className="py-24 bg-black relative">
          <div className="max-w-4xl mx-auto px-6">
              <div className="flex flex-col md:flex-row gap-16 items-start">
                  <div className="flex-1 space-y-6">
                      <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                          <span className="w-8 h-1 rounded-full" style={{backgroundColor: themeColor}}></span>
                          Sobre Nós
                      </h2>
                      <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-line">
                          {empresa.descricao || 'Nenhuma descrição fornecida pela empresa.'}
                      </p>
                  </div>
                  
                  {/* Stats / Details Card */}
                  <div className="w-full md:w-80 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                      <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Detalhes</h3>
                      <ul className="space-y-4 text-sm text-slate-300">
                          <li className="flex items-start gap-3">
                              <MapPin size={18} style={{color: themeColor}} />
                              <span>{empresa.cidade} - {empresa.uf}</span>
                          </li>
                          {empresa.site && (
                              <li className="flex items-center gap-3">
                                  <Globe size={18} style={{color: themeColor}} />
                                  <a href={empresa.site} target="_blank" rel="noreferrer" className="hover:text-white transition-colors truncate">{empresa.site.replace('https://','')}</a>
                              </li>
                          )}
                          <li className="flex items-center gap-3 pt-4">
                              {empresa.instagram && (
                                  <a href={`https://instagram.com/${empresa.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                      <Instagram size={20} />
                                  </a>
                              )}
                              {empresa.linkedin && (
                                  <a href={empresa.linkedin} target="_blank" rel="noreferrer" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                      <Linkedin size={20} />
                                  </a>
                              )}
                          </li>
                      </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer / CTA Section */}
      <section id="contato" className="py-20 border-t border-white/10 bg-white/[0.02]">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-8">Vamos construir o futuro juntos?</h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">Entre em contato para parcerias e negócios.</p>
              <button 
                className="px-10 py-4 rounded-2xl font-bold text-black text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                style={{backgroundColor: themeColor}}
              >
                  Entrar em Contato
              </button>
              
              <div className="mt-16 pt-8 border-t border-white/5 text-slate-600 text-sm">
                  <p>Inovação Powered by <strong>INOVAP</strong></p>
                  <p className="mt-2 text-xs">{empresa.cnpj}</p>
              </div>
          </div>
      </section>
      
      {!onBack && <Footer />}
    </div>
  );
};
