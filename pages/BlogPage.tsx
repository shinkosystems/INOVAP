import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { Artigo } from '../types';
import { Calendar, Search, ArrowRight, ImageOff } from 'lucide-react';

interface BlogPageProps {
  onLoginClick: () => void;
  onNavigate: (target: string) => void;
  onArticleClick: (id: number) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onLoginClick, onNavigate, onArticleClick }) => {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchArtigos();
  }, []);

  const fetchArtigos = async () => {
    try {
      const { data, error } = await supabase
        .from('artigos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setArtigos(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtigos = artigos.filter(a => 
    a.titulo.toLowerCase().includes(search.toLowerCase()) ||
    a.subtitulo.toLowerCase().includes(search.toLowerCase()) ||
    (a.tags && a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-brand-neon selection:text-black">
      <Navbar onLoginClick={onLoginClick} onNavigate={onNavigate} />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
             <span className="w-2 h-2 bg-brand-neon rounded-full animate-pulse"></span>
             <span className="text-xs font-medium text-slate-300 uppercase tracking-widest">Conhecimento</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">Biblioteca de Inovação</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Explorando as fronteiras da tecnologia, cases de sucesso e o futuro do ecossistema no Vale do Paraíba.
          </p>
          
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-0 bg-brand-neon/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 z-10" />
            <input 
              type="text" 
              placeholder="Buscar artigos, temas ou autores..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full relative z-10 bg-black/50 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all backdrop-blur-md placeholder-slate-500"
            />
          </div>
        </div>

        {loading ? (
             <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
             </div>
        ) : (
            <>
            {filteredArtigos.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <p className="text-lg">Nenhum artigo encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    {filteredArtigos.map((artigo) => (
                        <div 
                            key={artigo.id} 
                            onClick={() => onArticleClick(artigo.id)}
                            className="group flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-brand-neon/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="h-48 overflow-hidden relative">
                                {artigo.capa ? (
                                    <img src={artigo.capa} alt={artigo.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                                ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                        <ImageOff className="text-slate-700" size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        {artigo.tags?.[0] || 'Geral'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <Calendar size={12} />
                                    <span>{new Date(artigo.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-neon transition-colors line-clamp-2">
                                    {artigo.titulo}
                                </h3>
                                <p className="text-slate-400 text-sm mb-6 line-clamp-3 font-light leading-relaxed flex-1">
                                    {artigo.subtitulo}
                                </p>
                                
                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {artigo.tags?.slice(1,3).map((tag, i) => (
                                            <span key={i} className="text-[10px] text-slate-500 border border-white/5 px-2 py-0.5 rounded-md uppercase">{tag}</span>
                                        ))}
                                    </div>
                                    <button className="text-sm font-bold text-white flex items-center gap-2 group-hover:gap-3 transition-all group-hover:text-brand-neon">
                                        Ler Artigo <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </>
        )}
      </div>

      <Footer />
    </div>
  );
};