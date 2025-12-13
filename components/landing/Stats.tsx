import React from 'react';

export const Stats: React.FC = () => {
  return (
    <div className="py-10 bg-black relative">
       {/* Separator line */}
       <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-green/50 to-transparent"></div>
       
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
                { number: "50+", label: "Empresas" },
                { number: "12", label: "Grupos" },
                { number: "200+", label: "Projetos" },
                { number: "15k", label: "Impacto" }
            ].map((stat, i) => (
                <div key={i} className="relative group cursor-default">
                    <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-2 group-hover:to-brand-neon transition-all duration-500">
                        {stat.number}
                    </div>
                    <div className="text-brand-green font-medium tracking-widest text-xs uppercase opacity-80">{stat.label}</div>
                    
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-brand-neon/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none"></div>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};