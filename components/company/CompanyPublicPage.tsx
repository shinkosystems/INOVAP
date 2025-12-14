import React, { useEffect, useState } from 'react';
import { Empresa, Artigo } from '../../types';
import { supabase } from '../../services/supabase';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { MapPin, Globe, Instagram, Linkedin, Building2, ArrowLeft, MessageCircle, FileText, ImageOff, Quote, Star, TrendingUp, Users } from 'lucide-react';

interface CompanyPublicPageProps {
  empresa: Empresa;
  onBack?: () => void;
  onLoginClick: () => void;
}

export const CompanyPublicPage: React.FC<CompanyPublicPageProps> = ({ empresa, onBack, onLoginClick }) => {
  const themeColor = empresa.cor_primaria || '#10b981';
  const [articles, setArticles] = useState<Artigo[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // Fetch approved articles written by the company owner
  useEffect(() => {
      async function fetchCompanyArticles() {
          if (!empresa.responsavel) return;
          try {
              const { data, error } = await supabase
                .from('artigos')
                .select('*')
                .eq('autor', empresa.responsavel)
                .eq('aprovado', true)
                .order('created_at', { ascending: false })
                .limit(3);
              
              if (!error && data) {
                  setArticles(data);
              }
          } catch (e) {
              console.error("Erro ao buscar artigos da empresa", e);
          } finally {
              setLoadingArticles(false);
          }
      }
      fetchCompanyArticles();
  }, [empresa]);

  const handleWhatsappClick = () => {
      if (!empresa.whatsapp) return;
      const number = empresa.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/55${number}`, '_blank');
  };

  // Mocked Testimonials Data
  const testimonials = [
      { id: 1, text: "Uma parceria estratégica que transformou nossos resultados.", author: "Carlos Silva", role: "CEO, TechStart" },
      { id: 2, text: "Inovação real e compromisso com o ecossistema.", author: "Ana Souza", role: "Diretora de Inovação" },
      { id: 3, text: "A equipe mais preparada do Vale do Paraíba.", author: "Roberto Mendes", role: "Investidor Anjo" }
  ];

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
                 {empresa.whatsapp && (
                    <button 
                        onClick={handleWhatsappClick}
                        className="px-8 py-3 rounded-xl font-bold border flex items-center gap-2 hover:bg-white/10 transition-colors"
                        style={{color: themeColor, borderColor: themeColor}}
                    >
                        <MessageCircle size={20} /> Entrar em Contato
                    </button>
                 )}
             </div>
         </div>
      </div>

      {/* Stats Section (Mocked for Visuals) */}
      <section className="border-b border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                      { icon: Star, value: "4.9", label: "Avaliação Média" },
                      { icon: TrendingUp, value: "+120", label: "Projetos Entregues" },
                      { icon: Users, value: "2k+", label: "Impacto Gerado" },
                      { icon: FileText, value: `${articles.length}+`, label: "Artigos Publicados" }
                  ].map((stat, i) => (
                      <div key={i} className="flex items-center gap-4 justify-center md:justify-start">
                          <div className="p-3 rounded-xl bg-white/5" style={{color: themeColor}}>
                              <stat.icon size={24} />
                          </div>
                          <div>
                              <div className="text-2xl font-bold text-white">{stat.value}</div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-24 bg-black relative">
          <div className="max-w-6xl mx-auto px-6">
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

      {/* Latest Articles Section */}
      {articles.length > 0 && (
          <section className="py-20 bg-[#050505] border-t border-white/5">
              <div className="max-w-6xl mx-auto px-6">
                  <h2 className="text-3xl font-bold text-white mb-12 flex items-center gap-3">
                      <span className="w-8 h-1 rounded-full" style={{backgroundColor: themeColor}}></span>
                      Blog da {empresa.nome}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {articles.map((article) => (
                          <div key={article.id} className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                               <div className="h-40 bg-slate-900 relative overflow-hidden">
                                   {article.capa ? (
                                       <img src={article.capa} alt={article.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                   ) : (
                                       <div className="w-full h-full flex items-center justify-center"><ImageOff className="text-slate-700" /></div>
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                               </div>
                               <div className="p-6">
                                   <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{article.titulo}</h3>
                                   <p className="text-sm text-slate-400 line-clamp-3 mb-4">{article.subtitulo}</p>
                                   <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-white border border-white/5">
                                       Ler Artigo
                                   </span>
                               </div>
                          </div>
                      ))}
                  </div>
              </div>
          </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20 bg-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-green/5 pointer-events-none"></div>
          <div className="max-w-6xl mx-auto px-6 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-12 text-center">O que dizem sobre nós</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {testimonials.map((t) => (
                      <div key={t.id} className="bg-white/5 border border-white/5 p-8 rounded-3xl relative">
                          <Quote size={40} className="text-white/10 absolute top-6 right-6" />
                          <div className="flex gap-1 text-yellow-500 mb-4">
                              {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                          </div>
                          <p className="text-slate-300 mb-6 font-light leading-relaxed">"{t.text}"</p>
                          <div>
                              <div className="text-white font-bold">{t.author}</div>
                              <div className="text-xs text-slate-500 uppercase tracking-wide">{t.role}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Footer / CTA Section */}
      <section id="contato" className="py-20 border-t border-white/10 bg-white/[0.02]">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-8">Vamos construir o futuro juntos?</h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">Entre em contato para parcerias e negócios.</p>
              
              {empresa.whatsapp ? (
                   <button 
                        onClick={handleWhatsappClick}
                        className="px-10 py-4 rounded-2xl font-bold text-black text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-3 mx-auto"
                        style={{backgroundColor: themeColor}}
                    >
                        <MessageCircle size={24} /> Falar no WhatsApp
                    </button>
              ) : (
                  <button 
                    className="px-10 py-4 rounded-2xl font-bold text-black text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    style={{backgroundColor: themeColor}}
                  >
                      Entrar em Contato
                  </button>
              )}
              
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