import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Artigo } from '../../types';
import { Calendar, ArrowRight, ImageOff } from 'lucide-react';

interface LatestNewsProps {
  onViewAll?: () => void;
  onArticleClick?: (id: number) => void;
}

export const LatestNews: React.FC<LatestNewsProps> = ({ onViewAll, onArticleClick }) => {
  const [news, setNews] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const { data, error } = await supabase
          .from('artigos')
          .select('*')
          .limit(3)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setNews(data || []);
      } catch (e) {
        console.error("Error loading news", e);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (!loading && news.length === 0) return null;

  return (
    <div id="artigos" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Novidades</h2>
            <p className="text-slate-400">Atualizações do ecossistema em tempo real.</p>
          </div>
          <button 
            onClick={onViewAll}
            className="hidden md:flex items-center gap-2 text-brand-neon font-medium hover:gap-3 transition-all"
          >
            Ler todas <ArrowRight size={20} />
          </button>
        </div>

        {loading ? (
           <div className="flex justify-center p-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onArticleClick && onArticleClick(item.id)}
                className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-brand-neon/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col h-full cursor-pointer hover:-translate-y-1"
              >
                <div className="h-56 bg-slate-900 relative overflow-hidden">
                  {item.capa ? (
                    <img src={item.capa} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                        <ImageOff size={32} />
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 text-brand-neon text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Artigo
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1 relative">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                    <Calendar size={14} />
                    <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-brand-neon transition-colors">
                    {item.titulo}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1 font-light leading-relaxed">
                    {item.subtitulo}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {item.tags && item.tags.map((tag, i) => (
                        <span key={i} className="text-xs font-medium text-slate-300 bg-white/10 border border-white/5 px-3 py-1 rounded-lg">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center md:hidden">
            <button onClick={onViewAll} className="inline-flex items-center gap-2 text-brand-neon font-medium">
                Ler todas <ArrowRight size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};