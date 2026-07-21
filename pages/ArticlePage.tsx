// @sos-edit: false
import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { Artigo } from '../types';
import { Calendar, ArrowLeft, User, Clock, Share2, Tag, ImageOff, Building2 } from 'lucide-react';

interface ArticlePageProps {
  articleId: number | null;
  onBack: () => void;
  onLoginClick: () => void;
  onNavigate: (target: string) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ articleId, onBack, onLoginClick, onNavigate }) => {
  const [artigo, setArtigo] = useState<Artigo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('Autor INOVAP');
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artigos')
          .select('*')
          .eq('id', articleId)
          .single();

        if (error) throw error;
        setArtigo(data);

        if (data.autor) {
            // Buscar empresa associada ao autor
            const { data: companyData } = await supabase
                .from('empresas')
                .select('nome, logo')
                .eq('responsavel', data.autor)
                .maybeSingle();

            if (companyData && companyData.nome) {
                setCompanyName(companyData.nome);
                setCompanyLogo(companyData.logo || null);
            }

            const { data: userData } = await supabase
                .from('users')
                .select('nome')
                .eq('uuid', data.autor)
                .maybeSingle();
            if (userData) setAuthorName(userData.nome);
        }

      } catch (error) {
        console.error('Erro ao carregar artigo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-black min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (!artigo) {
    return (
        <div className="bg-white dark:bg-black min-h-screen flex flex-col items-center justify-center text-slate-900 dark:text-white">
            <h2 className="text-2xl font-bold mb-4">Artigo não encontrado</h2>
            <button onClick={onBack} className="text-brand-green hover:underline">Voltar para a biblioteca</button>
        </div>
    );
  }

  const isValidCapa = artigo.capa && artigo.capa !== '[object Object]' && artigo.capa.trim() !== '' && !imageError;

  return (
    <div className="bg-white dark:bg-black min-h-screen text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black transition-colors duration-300">
      <Navbar onLoginClick={onLoginClick} onNavigate={onNavigate} />

      <div className="fixed top-0 left-0 h-1 bg-brand-neon z-[60] w-full origin-left transform scale-x-0 animate-[grow_1s_ease-out_forwards]"></div>

      <article className="pb-20">
        <div className="relative w-full h-[60vh] min-h-[400px]">
          {isValidCapa ? (
             <img src={artigo.capa} alt="" onError={() => setImageError(true)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center">
                <ImageOff size={64} className="text-slate-400 dark:text-slate-700" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
          
          <div className="absolute top-24 left-4 md:left-8 z-20">
            <button onClick={onBack} className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white hover:bg-white hover:text-black transition-all group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                Voltar
            </button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-5xl mx-auto">
             <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up">
                 {artigo.tags?.map((tag, i) => (
                     <span key={i} className="bg-brand-neon text-black text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide">
                         {tag}
                     </span>
                 ))}
             </div>
             <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                 {artigo.titulo}
             </h1>
             <p className="text-xl md:text-2xl text-slate-200 font-light leading-relaxed max-w-3xl animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                 {artigo.subtitulo}
             </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10">
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0">
                        {companyLogo ? (
                            <img src={companyLogo} alt={companyName || authorName} className="w-full h-full object-contain rounded-xl" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                            <div className="w-full h-full rounded-xl bg-brand-green/20 flex items-center justify-center">
                                <Building2 size={20} className="text-brand-green" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-slate-900 dark:text-white font-bold">{companyName || authorName}</div>
                        <div className="text-slate-500 text-xs font-medium">{companyName ? 'Empresa Representante' : 'Colaborador INOVAP'}</div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{new Date(artigo.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>5 min de leitura</span>
                    </div>
                </div>
            </div>

            <div className="prose prose-lg prose-invert max-w-none">
                <div 
                  className="text-slate-700 dark:text-slate-300 leading-8 font-light space-y-6 text-lg prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-bold prose-a:text-brand-green"
                  dangerouslySetInnerHTML={{ __html: artigo.conteudo }}
                />
            </div>

            <div className="mt-16 bg-slate-50 dark:bg-white/5 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-brand-green/20 text-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Gostou deste conteúdo?</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8">Junte-se ao INOVAP para acessar conteúdos exclusivos e conectar-se com os autores.</p>
                <button onClick={onLoginClick} className="bg-brand-green text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                    Criar conta gratuita
                </button>
            </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};