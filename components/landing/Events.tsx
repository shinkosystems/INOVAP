import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Evento } from '../../types';

export const Events: React.FC = () => {
  const events: Evento[] = [
    { id: 1, titulo: "Café com Inovação: Agronegócio", data: "2024-05-15T09:00:00", local: "Parque Tecnológico SJC", tipo: "Networking" },
    { id: 2, titulo: "Demo Day: Startups do Vale", data: "2024-05-22T14:00:00", local: "Hub de Inovação Taubaté", tipo: "Pitch" },
    { id: 3, titulo: "Workshop: Inteligência Artificial na Indústria", data: "2024-06-05T19:00:00", local: "Online (Zoom)", tipo: "Workshop" },
  ];

  return (
    <div className="py-24 bg-brand-black border-t border-white/5 relative">
      <div className="absolute left-0 bottom-0 w-[400px] h-[400px] bg-brand-green/5 blur-[120px] rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-brand-neon font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Calendário</span>
          <h2 className="text-4xl font-bold text-white">Próximos Eventos</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-brand-green to-emerald-900 rounded-3xl p-10 text-white relative overflow-hidden flex flex-col justify-center shadow-2xl shadow-brand-green/20">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/20 rounded-full blur-3xl mix-blend-overlay"></div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-6">Não perca nada!</h3>
                    <p className="text-emerald-100 mb-8 leading-relaxed font-light text-lg">
                        Conecte-se com outros empreendedores e participe de eventos exclusivos.
                    </p>
                    <button className="w-full py-4 bg-black text-white font-bold rounded-xl transition-all hover:scale-105 hover:bg-white hover:text-black">
                        Ver Agenda Completa
                    </button>
                </div>
            </div>

            {/* Event List */}
            <div className="lg:col-span-2 space-y-4">
                {events.map((evt) => {
                    const date = new Date(evt.data);
                    return (
                        <div key={evt.id} className="flex flex-col md:flex-row items-start md:items-center bg-white/[0.03] border border-white/5 p-6 rounded-3xl hover:bg-white/[0.06] hover:border-white/10 transition-all group backdrop-blur-sm">
                            <div className="flex-shrink-0 w-20 h-20 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-white font-bold mb-4 md:mb-0 md:mr-8 border border-white/5 group-hover:border-brand-neon/50 transition-colors">
                                <span className="text-xs uppercase text-slate-400">{date.toLocaleString('pt-BR', { month: 'short' })}</span>
                                <span className="text-3xl font-mono text-brand-neon">{date.getDate()}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-brand-green/20 border border-brand-green/30 text-brand-neon text-xs font-bold px-3 py-1 rounded-full">{evt.tipo}</span>
                                    <span className="text-slate-500 text-xs flex items-center gap-1">
                                        <Clock size={12} /> {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold text-white group-hover:text-brand-neon transition-colors mb-2">{evt.titulo}</h4>
                                <div className="text-slate-400 text-sm flex items-center gap-2">
                                    <MapPin size={14} className="text-brand-green" /> {evt.local}
                                </div>
                            </div>
                            <div className="mt-6 md:mt-0">
                                <button className="px-6 py-3 border border-white/20 text-white font-medium rounded-xl hover:bg-white hover:text-black text-sm transition-all">
                                    Inscrever-se
                                </button>
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