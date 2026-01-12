import React from 'react';
import { ArrowRight, Zap, Users, Globe } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div id="inicio" className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-white dark:bg-brand-black transition-colors duration-500">
      {/* iOS 26 Abstract Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-green/20 dark:bg-brand-green/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-900/20 rounded-full blur-[100px]"></div>
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-brand-neon/10 dark:bg-brand-neon/10 rounded-full blur-[80px] animate-float"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-lg mb-8 animate-fade-in-up">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-neon"></span>
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-200 tracking-wide">O futuro do Alto Paraopeba</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-bold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            Conexão <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon via-brand-green to-blue-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              Transparente
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Uma plataforma unificada. Um ecossistema vivo. O INOVAP conecta mentes brilhantes através de uma interface fluida e inteligente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <a href="#gts" className="group px-8 py-4 bg-brand-green text-black rounded-3xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 flex items-center gap-2">
              Explorar Grupos
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#sobre" className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 backdrop-blur-md rounded-3xl font-bold transition-all hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-2">
              Saiba Mais
            </a>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          {[
            { icon: Users, title: "Conexão", desc: "Networking estratégico em tempo real." },
            { icon: Zap, title: "Inovação", desc: "Tecnologias disruptivas e aceleração." },
            { icon: Globe, title: "Expansão", desc: "Desenvolvimento sem fronteiras." }
          ].map((item, index) => (
            <div key={index} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl p-8 rounded-3xl hover:border-brand-neon/30 transition-all duration-500 group shadow-sm dark:shadow-none">
              <div className="w-14 h-14 bg-brand-green/10 dark:bg-brand-green/20 rounded-2xl flex items-center justify-center text-brand-green dark:text-brand-neon mb-6 group-hover:scale-110 transition-transform">
                <item.icon size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};