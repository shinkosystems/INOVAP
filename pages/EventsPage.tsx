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
                .order('data_inicio', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (evento: Evento) => {
        const isPast = new Date(evento.data_inicio) < new Date();
        if (isPast) return;

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
                if (error.code === '23505') {
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6 font-black uppercase tracking-[0.2em] text-[10px]">
                        <span className="w-2 h-2 bg-brand-neon rounded-full animate-pulse"></span>
                        Calendário do Ecossistema
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black mb-6 text-slate-900 dark:text-white tracking-tighter uppercase italic">Experiências INOVAP</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                        Conecte-se com as mentes que estão transformando o futuro do nosso território.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-neon border-t-transparent"></div>
                    </div>
                ) : (
                    <>
                        {events.length === 0 ? (
                            <div className="text-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
                                <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-6" />
                                <p className="text-xl font-bold text-slate-400">Nenhum evento encontrado no momento.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                {events.map((evt) => {
                                    const dataInicio = new Date(evt.data_inicio);
                                    const isPast = dataInicio < new Date();

                                    return (
                                        <div key={evt.id} className={`group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden hover:border-brand-neon transition-all duration-500 flex flex-col shadow-sm hover:shadow-2xl hover:shadow-brand-neon/10 ${isPast ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                            <div className="h-56 bg-slate-900 relative overflow-hidden">
                                                {evt.imagem_capa ? (
                                                    <img src={evt.imagem_capa} alt={evt.titulo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-neon/10 to-transparent">
                                                        <Calendar size={48} className="text-white/10" />
                                                    </div>
                                                )}
                                                <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                                                    <span className={`bg-black/60 backdrop-blur-md border border-white/10 ${isPast ? 'text-slate-400' : 'text-brand-neon'} text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest`}>
                                                        {isPast ? 'Encerrado' : evt.tipo}
                                                    </span>
                                                    {evt.exclusivo && (
                                                        <span className="bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2">
                                                            <Lock size={12} /> Exclusivo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-8 flex-1 flex flex-col">
                                                <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                                    <span>{dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                    <div className="w-1 h-1 rounded-full bg-brand-neon"></div>
                                                    <span>{dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</span>
                                                </div>

                                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4 line-clamp-2 uppercase tracking-tighter leading-tight italic group-hover:text-brand-neon transition-colors">{evt.titulo}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-8 font-medium leading-relaxed">{evt.descricao}</p>

                                                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col gap-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                                            <MapPin size={14} className="text-brand-neon" /> {evt.local || 'Território INOVAP'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                                            <Tag size={14} className="text-brand-neon" /> {evt.vagas} Vagas
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => !isPast && handleRegister(evt)}
                                                        disabled={registering === evt.id || isPast}
                                                        className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isPast
                                                            ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                                            : 'bg-brand-neon text-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-neon'
                                                            }`}
                                                    >
                                                        {registering === evt.id ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                                                        {isPast ? 'Evento Concluído' : (user ? 'Garantir Ingresso' : 'Login para Participar')}
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