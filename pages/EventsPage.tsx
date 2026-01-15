import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { Evento, User } from '../types';
import { Calendar, MapPin, Clock, Tag, Ticket, Loader2, ArrowRight, Lock, Unlock } from 'lucide-react';

interface EventsPageProps {
  onLoginClick: () => void;
  onNavigate: (target: string) => void;
  user: User | null;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onLoginClick, onNavigate, user }) => {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .gte('data_inicio', new Date().toISOString()) // Apenas eventos futuros
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (evento: Evento) => {
      if (!user) {
          onLoginClick();
          return;
      }
      setRegistering(evento.id);

      try {
          const { error } = await supabase.from('inscricoes').insert([{
              evento_id: evento.id,
              user_id: user.id,
              status: 'confirmado'
          }]);

          if (error) {
              if (error.code === '23505') { // Unique violation
                  alert('Você já está inscrito neste evento!');
              } else {
                  throw error;
              }
          } else {
              alert(`Inscrição confirmada para ${evento.titulo}! Veja seu ingresso no painel.`);
          }
      } catch (e: any) {
          console.error("Erro inscrição:", e);
          alert('Erro ao realizar inscrição.');
      } finally {
          setRegistering(null);
      }
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black transition-colors duration-300">
      <Navbar onLoginClick={onLoginClick} onNavigate={onNavigate} />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6">
             <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
             <span className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-widest">Networking & Conhecimento</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">Agenda do Ecossistema</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Participe de meetups, workshops e conferências exclusivas do INOVAP.
          </p>
        </div>

        {loading ? (
             <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
             </div>
        ) : (
            <>
            {events.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10">
                    <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg text-slate-500 dark:text-slate-400">Nenhum evento futuro agendado no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    {events.map((evt) => {
                        const dataInicio = new Date(evt.data_inicio);
                        return (
                            <div key={evt.id} className="group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden hover:border-brand-green/50 transition-all duration-300 flex flex-col shadow-sm dark:shadow-none">
                                <div className="h-48 bg-slate-900 relative overflow-hidden">
                                    {evt.imagem_capa ? (
                                        <img src={evt.imagem_capa} alt={evt.titulo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-green/20 to-emerald-900/20">
                                            <Calendar size={48} className="text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <span className="bg-black/60 backdrop-blur-md border border-white/10 text-brand-neon text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            {evt.tipo}
                                        </span>
                                        {evt.exclusivo && (
                                            <span className="bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                <Lock size={10} /> Exclusivo
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                                         <div className="flex items-center gap-2 text-white font-mono font-bold">
                                             <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex flex-col items-center justify-center border border-white/10">
                                                 <span className="text-xs uppercase text-slate-400">{dataInicio.toLocaleString('pt-BR', { month: 'short' })}</span>
                                                 <span className="text-lg leading-none">{dataInicio.getDate()}</span>
                                             </div>
                                             <div className="flex flex-col">
                                                 <span className="text-xs text-slate-300">{dataInicio.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                                 <span className="text-xs text-slate-200">{evt.local}</span>
                                             </div>
                                         </div>
                                    </div>
                                </div>
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2">{evt.titulo}</h3>
                                        {!evt.exclusivo && <div className="p-1.5 bg-brand-green/10 rounded-full text-brand-green" title="Aberto ao Público"><Unlock size={14} /></div>}
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 font-light">{evt.descricao}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Tag size={12} /> {evt.vagas} Vagas
                                        </span>
                                        <button 
                                            onClick={() => handleRegister(evt)}
                                            disabled={registering === evt.id}
                                            className="px-4 py-2 bg-brand-green text-black rounded-xl text-sm font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {registering === evt.id ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                                            {user ? 'Inscrever-se' : 'Login para Inscrever'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </>
        )}
      </div>

      <Footer />
    </div>
  );
};