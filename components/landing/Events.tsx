import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Trophy, X, ArrowLeft, Ticket, Shield, Loader2 } from 'lucide-react';
import { Evento } from '../../types';
import { supabase } from '../../services/supabase';

interface EventsProps {
    onLoginClick: (isSignUp?: boolean) => void;
}

export const Events: React.FC<EventsProps> = ({ onLoginClick }) => {
    const [events, setEvents] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const { data, error } = await supabase
                    .from('eventos')
                    .select('*')
                    .order('data_inicio', { ascending: false });

                if (!error && data) {
                    // Separar e ordenar: Futuros (mais próximos primeiro) depois Passados (mais recentes primeiro)
                    const now = new Date();
                    const upcoming = data.filter(e => new Date(e.data_inicio) >= now).sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
                    const past = data.filter(e => new Date(e.data_inicio) < now).sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());

                    setEvents([...upcoming, ...past].slice(0, 6));
                }
            } catch (e) {
                console.error("Erro ao buscar eventos", e);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, []);

    return (
        <div className="py-24 bg-white dark:bg-brand-black relative transition-colors duration-500 overflow-hidden">
            <div className="absolute left-[-5%] bottom-0 w-[500px] h-[500px] bg-brand-green/[0.03] blur-[120px] rounded-full"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-4 transition-all hover:scale-105">
                        <span className="w-2 h-2 bg-brand-neon rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Networking & Conhecimento</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Agenda do Ecossistema</h2>
                    <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">Participe de meetups, workshops e conferências exclusivas do INOVAP.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Featured Info Card */}
                        <div className="lg:col-span-1 bg-slate-900 dark:bg-brand-surface rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col justify-between group shadow-2xl">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-neon/5 rounded-full blur-3xl group-hover:bg-brand-neon/10 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                                    <Trophy className="text-brand-neon" size={32} />
                                </div>
                                <h3 className="text-3xl font-black mb-6 tracking-tight uppercase leading-none">Conecte-se ao Território</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed font-medium">
                                    O futuro do Alto Paraopeba acontece aqui. Participe ativamente e construa seu networking com as principais mentes da região.
                                </p>
                            </div>
                            <button
                                onClick={() => onLoginClick(true)}
                                className="relative z-10 w-full py-6 bg-brand-neon text-black font-black rounded-3xl transition-all hover:scale-[1.02] active:scale-95 shadow-neon text-xs uppercase tracking-[0.2em]"
                            >
                                Criar Minha Conta
                            </button>
                        </div>

                        {/* Event List */}
                        <div className="lg:col-span-2 space-y-4">
                            {events.map((evt) => {
                                const date = new Date(evt.data_inicio || '');
                                const isPast = date < new Date();
                                return (
                                    <div
                                        key={evt.id}
                                        onClick={() => setSelectedEvent(evt)}
                                        className="flex flex-col md:flex-row items-center bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] transition-all duration-500 hover:bg-white dark:hover:bg-white/[0.05] group cursor-pointer hover:shadow-2xl hover:shadow-black/5"
                                    >
                                        <div className="flex-shrink-0 w-20 h-20 bg-white dark:bg-white/[0.05] rounded-3xl flex flex-col items-center justify-center text-slate-900 dark:text-white font-black mb-4 md:mb-0 md:mr-8 transition-all group-hover:bg-brand-neon group-hover:text-black group-hover:scale-110">
                                            <span className="text-[9px] uppercase text-slate-400 tracking-widest leading-none mb-1 group-hover:text-black/60">{date.toLocaleString('pt-BR', { month: 'short' })}</span>
                                            <span className="text-3xl font-black leading-none uppercase">{date.getDate()}</span>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                                <span className={`${isPast ? 'text-slate-400' : 'text-brand-neon'} text-[9px] font-black uppercase tracking-widest leading-none`}>
                                                    {isPast ? 'Encerrado' : evt.tipo}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                                <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-none">
                                                    {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {evt.local ? evt.local.split(',')[0] : 'Local a definir'}
                                                </span>
                                            </div>
                                            <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white group-hover:text-black dark:group-hover:text-brand-neon transition-colors tracking-tighter uppercase leading-tight italic">{evt.titulo}</h4>
                                        </div>
                                        <div className="mt-4 md:mt-0 md:ml-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-brand-neon group-hover:text-black transition-all">
                                                <ArrowLeft className="rotate-180" size={20} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[4rem] border border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <Calendar size={64} className="mx-auto text-slate-200 dark:text-white/5 mb-8 animate-bounce transition-transform" />
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Silêncio no Ecossistema</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] max-w-sm mx-auto leading-relaxed">Nenhum evento agendado para os próximos dias. Fique atento às nossas redes!</p>
                    </div>
                )}
            </div>

            {/* Event Detail Modal (Full Screen) */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-black animate-fade-in overflow-y-auto">
                    <div className="relative min-h-screen flex flex-col md:flex-row">
                        {/* Hero Section / Sticky Image */}
                        <div className="w-full md:w-2/5 h-64 md:h-screen sticky top-0 md:relative overflow-hidden shrink-0">
                            {selectedEvent.imagem_capa ? (
                                <img src={selectedEvent.imagem_capa} className="w-full h-full object-cover" alt={selectedEvent.titulo} />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-brand-neon">
                                    <Calendar size={80} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-12 left-6 right-6 md:left-20 md:right-20 z-20">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-wrap gap-3">
                                        <span className="bg-brand-neon text-black px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neon">{selectedEvent.tipo}</span>
                                        {selectedEvent.exclusivo && (
                                            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <Shield size={14} /> Exclusivo
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-4xl md:text-7xl font-black text-white leading-tight uppercase tracking-tighter drop-shadow-2xl italic">{selectedEvent.titulo}</h2>
                                    <div className="flex items-center gap-6 mt-4">
                                        <div className="flex items-center gap-2 text-white/60 font-black uppercase text-[10px] tracking-widest">
                                            <MapPin size={16} className="text-brand-neon" /> {selectedEvent.local}
                                        </div>
                                        <div className="flex items-center gap-2 text-white/60 font-black uppercase text-[10px] tracking-widest">
                                            <Clock size={16} className="text-brand-neon" /> {new Date(selectedEvent.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-10 left-10 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all z-50 transition-all group"
                            >
                                <ArrowLeft size={24} className="group-hover:-translate-x-1" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-white dark:bg-brand-surface p-8 md:p-24 overflow-y-visible">
                            <div className="max-w-3xl space-y-16">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-1 bg-brand-neon rounded-full"></div>
                                        <h3 className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.4em]">Propósito do Evento</h3>
                                    </div>
                                    <div className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic whitespace-pre-line">
                                        {selectedEvent.descricao || 'Nenhuma descrição detalhada fornecida por enquanto.'}
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 transition-all hover:bg-brand-neon/5 group">
                                        <div className="w-16 h-16 bg-white dark:bg-brand-elevated rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-slate-100 dark:border-white/5 shadow-sm group-hover:scale-110 group-hover:bg-brand-neon group-hover:text-black transition-all">
                                            <MapPin size={32} />
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Localização</div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight italic">{selectedEvent.local}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 transition-all hover:bg-brand-neon/5 group">
                                        <div className="w-16 h-16 bg-white dark:bg-brand-elevated rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-slate-100 dark:border-white/5 shadow-sm group-hover:scale-110 group-hover:bg-brand-neon group-hover:text-black transition-all">
                                            <Calendar size={32} />
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Cronograma</div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight italic">
                                            {new Date(selectedEvent.data_inicio).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).replace('-feira', '')}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-16 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 pb-20">
                                    <div className="flex flex-col gap-2">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Participe agora</div>
                                        <p className="text-slate-500 font-medium">Garanta seu acesso e comece a inovar conosco.</p>
                                    </div>

                                    <button
                                        onClick={() => onLoginClick(true)}
                                        className="w-full md:w-auto bg-slate-900 dark:bg-brand-neon text-white dark:text-black px-12 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                    >
                                        Retirar Meu Ingresso <Ticket size={24} className="group-hover:rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
