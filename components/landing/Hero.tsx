import React from 'react';
import { ArrowRight, Zap, Users, Globe } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div id="inicio" className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-white dark:bg-brand-black transition-colors duration-500">
      {/* iOS Abstract Background - Multi-layered & Softer */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-green/10 dark:bg-brand-green/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-brand-neon/5 dark:bg-brand-green/5 rounded-full blur-[100px]"></div>
      <div className="absolute top-[30%] left-[10%] w-[250px] h-[250px] bg-brand-neon/5 dark:bg-brand-neon/5 rounded-full blur-[80px] animate-float"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-5xl mx-auto flex flex-col items-center">

          {/* Logo Centralizado - UI3.0 Style */}
          <div className="mb-10 animate-fade-in-up flex flex-col items-center">
            <div className="relative group p-4">
              <div className="absolute inset-0 bg-brand-neon/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <img
                src="https://jmhquynjyekclwxjgupk.supabase.co/storage/v1/object/public/logotipos/logotipos/2.png"
                alt="INOVAP Logo"
                className="h-20 md:h-28 w-auto mb-4 relative z-10 brightness-110"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                INOVAP
              </span>
              <div className="h-1 w-24 bg-brand-neon mt-4 rounded-full opacity-80"></div>
              <span className="mt-4 text-[11px] md:text-[13px] font-bold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                Ecossistema de Inovação
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-md mb-8 animate-fade-in-up shadow-subtle" style={{ animationDelay: '0.1s' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-neon"></span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-300 tracking-wider uppercase">O futuro do Alto Paraopeba</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            O que é o INOVAP <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon via-brand-green to-emerald-400">
              e por que importa para você?
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up font-medium" style={{ animationDelay: '0.3s' }}>
            O ecossistema que conecta pessoas, empresas e governo para transformar ideias em desenvolvimento real. Criamos conexões que impulsionam o Alto Paraopeba.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <a href="#gts" className="group px-10 py-5 bg-black dark:bg-brand-neon dark:text-black text-white rounded-2xl font-black transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-2xl dark:shadow-neon">
              Explorar Ecossistema
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#sobre" className="px-10 py-5 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white rounded-2xl font-black transition-all hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2">
              Sobre Nós
            </a>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {[
            { icon: Users, title: "Conexão", desc: "Networking estratégico em tempo real para membros ativos." },
            { icon: Zap, title: "Inovação", desc: "Tecnologias disruptivas e aceleração de negócios locais." },
            { icon: Globe, title: "Expansão", desc: "Desenvolvimento territorial sustentável sem fronteiras." }
          ].map((item, index) => (
            <div key={index} className="bg-slate-50/50 dark:bg-brand-surface/40 p-10 rounded-5xl transition-all duration-500 hover:bg-slate-100 dark:hover:bg-brand-elevated group">
              <div className="w-10 h-10 bg-brand-neon/10 rounded-xl flex items-center justify-center text-brand-neon mb-8 transition-transform group-hover:scale-110">
                <item.icon size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 tracking-tight">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-500 leading-relaxed font-medium text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};