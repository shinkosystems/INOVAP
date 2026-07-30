import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { AcademyVideo } from '../types';
import { Calendar, Search, ArrowLeft, ImageOff, Youtube, ExternalLink, Play, Clock, ArrowRight, User } from 'lucide-react';

const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface AcademyPageProps {
  onLoginClick: () => void;
  onNavigate: (target: string) => void;
}

export const AcademyPage: React.FC<AcademyPageProps> = ({ onLoginClick, onNavigate }) => {
  const [videos, setVideos] = useState<AcademyVideo[]>([]);
  const [channelUrl, setChannelUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<AcademyVideo | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Carrega canal do youtube
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('key', 'youtube_channel_url')
        .single();
      
      if (configData && configData.value) {
        setChannelUrl(configData.value);
      }

      // Carrega vídeos da academy
      const { data: videosData } = await supabase
        .from('academy_videos')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (videosData) {
        setVideos(videosData);
      }
    } catch (e) {
      console.error("Erro ao buscar dados da Academy", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(v => 
    v.titulo.toLowerCase().includes(search.toLowerCase()) ||
    (v.subtitulo && v.subtitulo.toLowerCase().includes(search.toLowerCase())) ||
    (v.conteudo && v.conteudo.toLowerCase().includes(search.toLowerCase()))
  );

  const getThumbnail = (video: AcademyVideo) => {
    if (video.capa) return video.capa;
    const ytid = getYoutubeVideoId(video.youtube_url);
    return ytid ? `https://img.youtube.com/vi/${ytid}/hqdefault.jpg` : '';
  };

  const handleSelectVideo = (video: AcademyVideo) => {
    setSelectedVideo(video);
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-slate-50 dark:bg-black min-h-screen text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black transition-colors duration-300">
      <Navbar onLoginClick={onLoginClick} onNavigate={onNavigate} academyEnabled={true} />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {selectedVideo ? (
          /* --- MODO DETALHE DO ARTIGO --- */
          <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
            {/* Botão Voltar */}
            <button 
              onClick={() => setSelectedVideo(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Voltar para a Academy
            </button>

            {/* Player de Vídeo do YouTube */}
            {getYoutubeVideoId(selectedVideo.youtube_url) ? (
              <div className="w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl shadow-black/10 dark:shadow-brand-neon/5 relative">
                <iframe 
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedVideo.youtube_url)}?autoplay=1`}
                  title={selectedVideo.titulo}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            ) : (
              <div className="w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center border border-dashed border-slate-350 dark:border-slate-800">
                <ImageOff size={48} className="text-slate-400 mb-4" />
                <p className="text-slate-500 text-sm">Vídeo não disponível ou URL inválida.</p>
              </div>
            )}

            {/* Metadados e Títulos */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-450 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                  <Play size={10} className="fill-red-500" />
                  Vídeo-Aula
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(selectedVideo.created_at || '').toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                {selectedVideo.titulo}
              </h1>
              {selectedVideo.subtitulo && (
                <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium">
                  {selectedVideo.subtitulo}
                </p>
              )}
            </div>

            {/* Conteúdo do Artigo */}
            {selectedVideo.conteudo ? (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-850">
                <div 
                  className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-base whitespace-pre-wrap space-y-4"
                >
                  {selectedVideo.conteudo}
                </div>
              </div>
            ) : (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-850 text-slate-400 italic">
                Sem texto explicativo adicional cadastrado para esta aula.
              </div>
            )}

            {/* Próximas Aulas Recomendadas */}
            {videos.filter(v => v.id !== selectedVideo.id).length > 0 && (
              <div className="pt-16 border-t border-slate-200 dark:border-slate-850 space-y-6">
                <h3 className="text-xl font-bold">Outras Aulas Relacionadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videos
                    .filter(v => v.id !== selectedVideo.id)
                    .slice(0, 2)
                    .map(v => (
                      <div 
                        key={v.id}
                        onClick={() => handleSelectVideo(v)}
                        className="group flex gap-4 p-4 bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-3xl hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
                      >
                        <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                          <img src={getThumbnail(v)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play size={16} className="text-white fill-white" />
                          </div>
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                          <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white group-hover:text-brand-neon transition-colors">{v.titulo}</h4>
                          <p className="text-xs text-slate-450 truncate mt-1">{v.subtitulo || 'Ver artigo da aula'}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* --- MODO LISTAGEM --- */
          <div className="space-y-12">
            {/* Cabeçalho da Lista */}
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6">
                 <span className="w-2 h-2 bg-brand-neon rounded-full animate-pulse"></span>
                 <span className="text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-widest">Capacitação & Aprendizado</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">INOVAP Academy</h1>
              <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                Acesse artigos completos, tutoriais e aulas integradas com o nosso ecossistema de inovação e tecnologia.
              </p>
              
              {/* Barra de Busca */}
              <div className="max-w-xl mx-auto relative group">
                <div className="absolute inset-0 bg-brand-neon/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-slate-400 group-hover:text-brand-neon transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar artigos por título ou assunto..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-neon focus:outline-none rounded-3xl text-sm transition-all shadow-lg shadow-black/[0.02] dark:shadow-none"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="bg-slate-100/50 dark:bg-slate-900/30 border border-slate-250 dark:border-white/5 rounded-[2.5rem] p-12 text-center max-w-md mx-auto">
                <ImageOff size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500 font-medium">Nenhum artigo encontrado para a sua busca.</p>
              </div>
            ) : (
              /* Grid de Artigos */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVideos.map((video) => {
                  const thumb = getThumbnail(video);
                  return (
                    <div 
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      className="group bg-white dark:bg-slate-900/30 border border-slate-200/70 dark:border-white/5 hover:border-slate-300 dark:hover:border-brand-neon/30 rounded-[2.5rem] p-5 transition-all duration-500 cursor-pointer flex flex-col justify-between hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-brand-neon/5"
                    >
                      <div className="space-y-4">
                        {/* Imagem de Capa */}
                        <div className="aspect-video rounded-[1.8rem] overflow-hidden bg-slate-900 border border-slate-200/20 dark:border-white/5 relative">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                              <ImageOff size={32} className="text-slate-450" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                              <Play size={20} className="ml-1 fill-white text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="px-1">
                          <span className="text-[9px] font-black uppercase text-red-500 tracking-widest">Vídeo-Aula</span>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 mt-1 group-hover:text-brand-neon transition-colors">
                            {video.titulo}
                          </h3>
                          {video.subtitulo && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                              {video.subtitulo}
                            </p>
                          )}
                          {video.conteudo && (
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                              {video.conteudo}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer do Card */}
                      <div className="px-1 pt-6 flex items-center justify-between text-xs text-slate-450 border-t border-slate-100 dark:border-slate-800/40 mt-4">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(video.created_at || '').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-brand-neon group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                          Acessar Aula
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA Canal do YouTube */}
            {channelUrl && (
              <div className="flex justify-center pt-8">
                <a 
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-5 bg-slate-100 hover:bg-red-650/10 dark:bg-white/5 hover:text-red-500 font-black rounded-3xl transition-all border border-slate-200 dark:border-white/10 hover:border-red-600/30 scale-100 hover:scale-[1.02] text-xs uppercase tracking-[0.2em] shadow-lg shadow-black/[0.02]"
                >
                  <Youtube size={20} className="text-red-500" />
                  Acessar Canal Oficial no YouTube
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};
