import React, { useEffect, useState } from 'react';
import { Empresa, Artigo } from '../../types';
import { supabase } from '../../services/supabase';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { MapPin, Globe, Instagram, Linkedin, Building2, ArrowLeft, MessageCircle, FileText, ImageOff, Quote, Star, TrendingUp, Users, Share, Sun, Moon, ChevronRight } from 'lucide-react';

interface CompanyPublicPageProps {
    empresa: Empresa;
    onBack?: () => void;
    onLoginClick: () => void;
}

export const CompanyPublicPage: React.FC<CompanyPublicPageProps> = ({ empresa, onBack, onLoginClick }) => {
    const themeColor = empresa.cor_primaria || '#10b981';
    const [articles, setArticles] = useState<Artigo[]>([]);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Artigo | null>(null);

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

    const testimonials = [
        { id: 1, text: "Uma parceria estratégica que transformou nossos resultados.", author: "Carlos Silva", role: "CEO, TechStart" },
        { id: 2, text: "Inovação real e compromisso com o ecossistema.", author: "Ana Souza", role: "Diretora de Inovação" },
        { id: 3, text: "A equipe mais preparada do Alto Paraopeba.", author: "Roberto Mendes", role: "Investidor Anjo" }
    ];

    const [pageTheme, setPageTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (savedTheme) {
            setPageTheme(savedTheme);
            if (savedTheme === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
            } else {
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    const togglePageTheme = () => {
        const newTheme = pageTheme === 'dark' ? 'light' : 'dark';
        setPageTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black transition-colors duration-300">
            {onBack ? (
                <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
                    <button onClick={onBack} className="pointer-events-auto bg-white/70 dark:bg-black/50 backdrop-blur-md text-slate-900 dark:text-white px-5 py-2.5 rounded-full flex items-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-xl shadow-black/5">
                        <ArrowLeft size={16} /> Voltar para o Sistema
                    </button>
                    <button
                        onClick={togglePageTheme}
                        className="pointer-events-auto w-10 h-10 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-xl shadow-black/5"
                    >
                        {pageTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            ) : (
                <Navbar onLoginClick={onLoginClick} />
            )}

            <div className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden">
                {empresa.banner ? (
                    <div className="absolute inset-0 z-0">
                        <img src={empresa.banner} alt="Banner" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/80 dark:from-black/80 via-white/40 dark:via-black/40 to-white dark:to-black"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-white dark:to-black z-0">
                        <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    </div>
                )}

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up">
                    {empresa.logo ? (
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-white rounded-3xl p-2 mb-8 shadow-2xl dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                            <img src={empresa.logo} alt={empresa.nome} className="w-full h-full object-contain rounded-2xl" />
                        </div>
                    ) : (
                        <div className="w-32 h-32 bg-slate-100 dark:bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md border border-slate-200 dark:border-white/10">
                            <Building2 size={48} className="text-slate-400 dark:text-white/50" />
                        </div>
                    )}

                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight uppercase">
                        {empresa.nome}
                    </h1>

                    {empresa.slogan && (
                        <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-300 font-medium max-w-2xl leading-relaxed italic">
                            {empresa.slogan}
                        </p>
                    )}

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <a href="#sobre" className="px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-all shadow-2xl">
                            Conheça Mais
                        </a>
                        {empresa.whatsapp && (
                            <button
                                onClick={handleWhatsappClick}
                                className="px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border-2 flex items-center gap-2 hover:bg-brand-neon hover:text-black hover:border-brand-neon transition-all"
                                style={{ color: themeColor, borderColor: themeColor }}
                            >
                                <MessageCircle size={20} /> Entrar em Contato
                            </button>
                        )}
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}?empresa=${empresa.id}`;
                                navigator.clipboard.writeText(url);
                                alert('Link de compartilhamento copiado!');
                            }}
                            className="px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            <Share size={20} /> Compartilhar
                        </button>
                    </div>
                </div>
            </div>

            <section className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: Star, value: "4.9", label: "Avaliação Média" },
                            { icon: TrendingUp, value: "+120", label: "Projetos Entregues" },
                            { icon: Users, value: "2k+", label: "Impacto Gerado" },
                            { icon: FileText, value: `${articles.length}+`, label: "Artigos Publicados" }
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center gap-4 justify-center md:justify-start">
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 shadow-sm" style={{ color: themeColor }}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="sobre" className="py-24 bg-white dark:bg-black relative">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-16 items-start">
                        <div className="flex-1 space-y-6">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                                <span className="w-12 h-1.5 rounded-full" style={{ backgroundColor: themeColor }}></span>
                                Sobre Nós
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed whitespace-pre-line font-medium">
                                {empresa.descricao || 'Nenhuma descrição fornecida pela empresa.'}
                            </p>
                        </div>

                        <div className="w-full md:w-80 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-white/10 pb-4 uppercase tracking-tighter">Detalhes</h3>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300 font-bold">
                                <li className="flex items-start gap-3">
                                    <MapPin size={18} style={{ color: themeColor }} />
                                    <span>{empresa.cidade} - {empresa.uf}</span>
                                </li>
                                {empresa.site && (
                                    <li className="flex items-center gap-3">
                                        <Globe size={18} style={{ color: themeColor }} />
                                        <a href={empresa.site} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors truncate">{empresa.site.replace('https://', '')}</a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white dark:bg-black border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-4">
                                <span className="text-brand-neon mr-2">/</span>Publicações
                            </h2>
                            <p className="text-slate-500 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Insights e novidades do nosso time</p>
                        </div>
                        <div className="h-0.5 flex-1 bg-slate-100 dark:bg-white/5 mx-8 mb-4 hidden md:block"></div>
                        <div className="flex gap-2">
                            <div className="w-12 h-1.5 rounded-full bg-brand-neon"></div>
                            <div className="w-4 h-1.5 rounded-full bg-slate-200 dark:bg-white/10"></div>
                        </div>
                    </div>

                    {loadingArticles ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {articles.map((art) => (
                                <div
                                    key={art.id}
                                    onClick={() => setSelectedArticle(art)}
                                    className="group bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden hover:bg-white dark:hover:bg-white/[0.04] transition-all hover:shadow-2xl hover:shadow-black/5 cursor-pointer"
                                >
                                    <div className="aspect-[16/9] overflow-hidden relative">
                                        <img src={art.capa} alt={art.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-6 left-6 flex gap-2">
                                            {art.tags?.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-10 space-y-6">
                                        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                            <span>{new Date(art.created_at).toLocaleDateString('pt-BR')}</span>
                                            <span className="w-1 h-1 bg-slate-200 dark:bg-white/10 rounded-full"></span>
                                            <span>5 min leitura</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight group-hover:text-brand-neon transition-colors line-clamp-2">
                                            {art.titulo}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 font-medium italic">
                                            {art.subtitulo}
                                        </p>
                                        <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white group-hover:gap-4 transition-all">
                                            Ler Artigo Completo <ChevronRight size={14} className="text-brand-neon" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
                            <FileText size={48} className="mx-auto text-slate-300 dark:text-white/10 mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhuma publicação encontrada no momento.</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="py-20 bg-slate-50 dark:bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-green/5 pointer-events-none"></div>
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-16 text-center uppercase tracking-tighter">O que dizem sobre nós</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t) => (
                            <div key={t.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-10 rounded-[3rem] relative shadow-xl shadow-black/[0.02]">
                                <Quote size={40} className="text-slate-100 dark:text-white/10 absolute top-8 right-8" />
                                <p className="text-slate-600 dark:text-slate-300 mb-8 font-medium leading-relaxed italic">"{t.text}"</p>
                                <div>
                                    <div className="text-slate-900 dark:text-white font-black uppercase text-sm tracking-tight">{t.author}</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">{t.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {selectedArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/95 backdrop-blur-3xl animate-fade-in" onClick={() => setSelectedArticle(null)}></div>
                    <div className="relative w-full max-w-5xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[90vh] animate-fade-in-up">
                        <div className="h-48 md:h-80 relative overflow-hidden shrink-0">
                            <img src={selectedArticle.capa} className="w-full h-full object-cover" alt={selectedArticle.titulo} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-8 left-8 right-8">
                                <div className="flex gap-2 mb-4">
                                    {selectedArticle.tags?.map((tag, idx) => (
                                        <span key={idx} className="bg-brand-neon text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase tracking-tighter">{selectedArticle.titulo}</h1>
                            </div>
                            <button onClick={() => setSelectedArticle(null)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all">
                                <ArrowLeft size={20} className="rotate-90 md:rotate-0" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-10">
                                <div className="space-y-4">
                                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                                        Publicado em {new Date(selectedArticle.created_at).toLocaleDateString('pt-BR')} • 5 min leitura
                                    </p>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white italic leading-relaxed">
                                        {selectedArticle.subtitulo}
                                    </h2>
                                </div>
                                <div className="h-0.5 w-20" style={{ backgroundColor: themeColor }}></div>
                                <div
                                    className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed space-y-6 font-medium article-content"
                                    dangerouslySetInnerHTML={{ __html: selectedArticle.conteudo.replace(/\n/g, '<br/>') }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!onBack && <Footer />}
        </div>
    );
};