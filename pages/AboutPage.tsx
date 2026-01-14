import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { 
  Users, Target, Lightbulb, Shield, Rocket, 
  ArrowRight, Globe, Zap, Heart, Building2, 
  Landmark, Handshake, Network, Cpu, Wallet, Flag,
  FlaskConical, Coins, Building, BrainCircuit, Share2
} from 'lucide-react';

interface AboutPageProps {
  onLoginClick: () => void;
  onNavigate: (target: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onLoginClick, onNavigate }) => {
  return (
    <div className="bg-white dark:bg-black min-h-screen text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black transition-colors duration-300">
      <Navbar onLoginClick={onLoginClick} onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="relative pt-48 pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-green/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-neon/5 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-10 animate-fade-in-up">
               <span className="w-2.5 h-2.5 bg-brand-neon rounded-full shadow-[0_0_10px_#00ff9d]"></span>
               <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-[0.2em]">O que nos move</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-10 tracking-tight leading-[1.1] animate-fade-in-up">
              Conectando as Peças <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-brand-neon to-emerald-400">do Futuro Regional.</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Seção Pilares: Cultura e Colaboração (ÁREA AMARELA SOLICITADA) */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Bloco 1: Cultura da Inovação */}
            <div className="group relative animate-fade-in-up">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-neon/20 to-brand-green/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative h-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 md:p-14 backdrop-blur-xl transition-all duration-300 group-hover:border-brand-neon/40 flex flex-col">
                <div className="w-16 h-16 bg-brand-neon/10 rounded-2xl flex items-center justify-center text-brand-neon mb-8">
                  <BrainCircuit size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                  Cultura da Inovação como diferencial
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  No <strong className="text-slate-900 dark:text-white font-bold">INOVAP</strong>, inovação vai além da tecnologia: é uma <strong className="text-slate-900 dark:text-white font-bold">forma de pensar e agir</strong>. Estimulamos a experimentação, a colaboração e o pensamento crítico para que pessoas, organizações e o território se tornem mais <strong className="text-slate-900 dark:text-white font-bold">ágeis, criativos e preparados para o futuro</strong>.
                </p>
              </div>
            </div>

            {/* Bloco 2: O Poder da Colaboração */}
            <div className="group relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-green/20 to-brand-neon/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative h-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 md:p-14 backdrop-blur-xl transition-all duration-300 group-hover:border-brand-green/40 flex flex-col">
                <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green mb-8">
                  <Share2 size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                  O poder da colaboração no Alto Paraopeba
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  No <strong className="text-slate-900 dark:text-white font-bold">INOVAP</strong>, acreditamos que <strong className="text-slate-900 dark:text-white font-bold">ninguém inova sozinho</strong>. Quando empresas, startups, instituições de ensino, governo e sociedade civil se conectam, surgem soluções mais fortes, negócios mais sustentáveis e uma <strong className="text-slate-900 dark:text-white font-bold">região mais inovadora e competitiva</strong>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Atores do Ecossistema (A Hélice do INOVAP) */}
      <section className="py-24 bg-slate-50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6">A Hélice da Inovação</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Nosso ecossistema é movido pela interação sinérgica entre cinco atores fundamentais. 
              A conexão entre eles é o que gera desenvolvimento real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { 
                icon: Building2, 
                label: "Setor Privado", 
                color: "from-emerald-500", 
                desc: "Empresas que tracionam o mercado, geram empregos e aplicam a inovação em larga escala." 
              },
              { 
                icon: Coins, 
                label: "Instituições Financeiras", 
                color: "from-brand-green", 
                desc: "Provedores de capital, crédito e investimento necessários para escalar ideias e negócios." 
              },
              { 
                icon: Flag, 
                label: "Setor Público", 
                color: "from-brand-neon", 
                desc: "Governos e órgãos reguladores que criam políticas públicas e infraestrutura para a inovação." 
              },
              { 
                icon: Cpu, 
                label: "ICTs e Ambiente de Inovação", 
                color: "from-cyan-500", 
                desc: "Centros de Pesquisa, Universidades e Hubs que geram ciência e cultivam novas startups." 
              },
              { 
                icon: Heart, 
                label: "Terceiro Setor", 
                color: "from-rose-500", 
                desc: "Associações e ONGs que garantem o impacto social e a sustentabilidade no desenvolvimento." 
              }
            ].map((pillar, i) => (
              <div key={i} className="bg-white dark:bg-brand-black p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-brand-neon/30 transition-all group shadow-sm flex flex-col h-full">
                <div className={`w-12 h-12 bg-gradient-to-br ${pillar.color} to-transparent opacity-20 rounded-xl mb-6 group-hover:scale-110 transition-transform`}></div>
                <pillar.icon className="text-slate-900 dark:text-white mb-4" size={28} />
                <h4 className="text-lg font-bold mb-2">{pillar.label}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chamada Final */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-neon/5 blur-[120px]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-24 h-24 bg-brand-green/20 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-12 animate-float">
             <Handshake size={48} className="text-brand-neon" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-10 text-slate-900 dark:text-white">Faça parte desta rede.</h2>
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-14 font-medium leading-relaxed">
            O INOVAP é o ponto de encontro de quem quer transformar o Alto Paraopeba. 
            Independente do seu papel na hélice, há um lugar estratégico para você.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button onClick={onLoginClick} className="px-12 py-5 bg-brand-neon text-black rounded-2xl font-black text-lg shadow-[0_20px_40px_rgba(0,255,157,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-3">
              Quero me Conectar <ArrowRight size={20} />
            </button>
            <button onClick={() => onNavigate('inicio')} className="px-12 py-5 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
              Ver Home
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};