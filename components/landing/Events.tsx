import React from 'react';
import { Calendar, MapPin, Clock, Trophy } from 'lucide-react';
import { Evento } from '../../types';

// This component is the simplified preview on the landing page.
// We should use real data or keep mock data but link to the full EventsPage.

export const Events: React.FC = () => {
    // Mock data for landing page preview
    const events: Partial<Evento>[] = [
        { id: 1, titulo: "Café com Inovação: Agronegócio", data_inicio: "2024-05-15T09:00:00", local: "Parque Tecnológico SJC", tipo: "Networking" },
        { id: 2, titulo: "Demo Day: Startups do Vale", data_inicio: "2024-05-22T14:00:00", local: "Hub de Inovação Taubaté", tipo: "Pitch" },
        { id: 3, titulo: "Workshop: Inteligência Artificial", data_inicio: "2024-06-05T19:00:00", local: "Online (Zoom)", tipo: "Workshop" },
    ];

    const handleViewAll = () => {
        // Find the navbar logic or use simple href since app handles hash routing or we can add a prop
        const element = document.getElementById('root');
        if (element) {
            // This relies on the parent App.tsx handleNavigate logic being triggered by a prop or global event.
            // Since we are inside a component, a cleaner way is to use a prop, but for this specific change 
            // without touching App.tsx props passed to Events.tsx, we can use a custom event or just a link 
            // that the App.tsx might intercept if we change the architecture, 
            // OR we simply update App.tsx to pass onNavigate to Events component.
            // For now, let's assume the user will click "Ver Agenda Completa" which we will wire up.
        }
    };

    return (
        <div className="py-24 bg-white dark:bg-brand-black relative transition-colors duration-500">
            <div className="absolute left-[-5%] bottom-0 w-[500px] h-[500px] bg-brand-green/[0.03] blur-[120px] rounded-full"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-brand-neon font-black tracking-[0.3em] text-[10px] uppercase mb-4 block opacity-60">Próximas Experiências</span>
                    <h2 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Calendário do Ecossistema</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Featured Card - UI3.0 Minimalist */}
                    <div className="lg:col-span-1 bg-slate-900 dark:bg-brand-surface rounded-5xl p-10 text-white relative overflow-hidden flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-neon/5 rounded-full blur-3xl group-hover:bg-brand-neon/10 transition-colors"></div>
                        <div className="relative z-10">
                            <Trophy className="text-brand-neon mb-6 opacity-40 shrink-0" size={32} />
                            <h3 className="text-2xl font-black mb-6 tracking-tight">Não perca nada!</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed font-medium text-sm">
                                O futuro do Alto Paraopeba acontece aqui. Conecte-se e participe de eventos que transformam o território.
                            </p>
                        </div>
                        <button className="relative z-10 w-full py-4 bg-brand-neon text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-neon text-xs uppercase tracking-widest">
                            Acesse a Agenda
                        </button>
                    </div>

                    {/* Event List - Borderless & Progressive */}
                    <div className="lg:col-span-2 space-y-4">
                        {events.map((evt) => {
                            const date = new Date(evt.data_inicio || '');
                            return (
                                <div key={evt.id} className="flex flex-col md:flex-row items-start md:items-center bg-slate-50/50 dark:bg-brand-surface/20 p-6 rounded-4xl transition-all duration-500 hover:bg-slate-100 dark:hover:bg-brand-elevated group">
                                    <div className="flex-shrink-0 w-16 h-16 bg-white dark:bg-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-slate-900 dark:text-white font-black mb-4 md:mb-0 md:mr-8 transition-colors group-hover:bg-brand-neon group-hover:text-black">
                                        <span className="text-[8px] uppercase text-slate-400 tracking-widest leading-none mb-1 group-hover:text-black/60">{date.toLocaleString('pt-BR', { month: 'short' })}</span>
                                        <span className="text-2xl font-extrabold leading-none">{date.getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-brand-neon text-[8px] font-black uppercase tracking-widest leading-none">{evt.tipo}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">
                                                {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors tracking-tight">{evt.titulo}</h4>
                                        <div className="h-0 group-hover:h-5 opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                                            <div className="text-slate-400 text-[10px] font-medium flex items-center gap-2 mt-2">
                                                <MapPin size={12} className="text-brand-neon/60" /> {evt.local}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
