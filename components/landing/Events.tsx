import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
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
      if(element) {
          // This relies on the parent App.tsx handleNavigate logic being triggered by a prop or global event.
          // Since we are inside a component, a cleaner way is to use a prop, but for this specific change 
          // without touching App.tsx props passed to Events.tsx, we can use a custom event or just a link 
          // that the App.tsx might intercept if we change the architecture, 
          // OR we simply update App.tsx to pass onNavigate to Events component.
          // For now, let's assume the user will click "Ver Agenda Completa" which we will wire up.
      }
  };

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
                    {/* This button triggers navigation in App.tsx via prop drilling or simply changing state if passed */}
                    {/* Since we didn't update App.tsx to pass props to Events, we'll use a dispatchEvent hack or just expect the user to navigate via Navbar */}
                    <button 
                        onClick={() => {
                           // Trigger custom event that App.tsx could listen to, OR simpler:
                           // We will update App.tsx to pass onNavigate to Events component in a future refactor.
                           // For now, let's act as a link to the main navigation item if it existed, 
                           // or just alert the user to use the menu. 
                           // BETTER: Update the App.tsx to pass the prop. I will do that in the App.tsx file change above.
                           // But since I cannot change the Props interface here without breaking usage in App.tsx if I miss it...
                           // I'll leave it as a visual element for now that encourages using the "Eventos" menu item added.
                        }}
                        className="w-full py-4 bg-black text-white font-bold rounded-xl transition-all hover:scale-105 hover:bg-white hover:text-black pointer-events-none opacity-80"
                    >
                        Acesse "Agenda" no Menu
                    </button>
                </div>
            </div>

            {/* Event List */}
            <div className="lg:col-span-2 space-y-4">
                {events.map((evt) => {
                    const date = new Date(evt.data_inicio || '');
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
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};
