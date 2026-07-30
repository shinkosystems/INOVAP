import React from 'react';
import { 
  Users, Target, Lightbulb, Shield, Rocket, 
  ArrowRight, Globe, Zap, Heart, Building2, 
  Handshake, Network, Cpu, Flag,
  BrainCircuit, Share2, Coins
} from 'lucide-react';

interface AboutSectionProps {
  onLoginClick: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onLoginClick }) => {
  return (
    <div id="sobre" className="relative bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-500 overflow-hidden">
      {/* Elementos abstratos de fundo */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-green/5 dark:bg-brand-green/[0.03] rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-neon/5 dark:bg-brand-neon/[0.02] rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
        
        {/* Título Principal da Seção */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6">
             <span className="w-2.5 h-2.5 bg-brand-neon rounded-full shadow-[0_0_10px_#00ff9d]"></span>
             <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-[0.2em]">Quem Somos</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Conectando as Peças <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-brand-neon to-emerald-400">do Futuro Regional.</span>
          </h2>
        </div>

        {/* Seção Pilares: Cultura e Colaboração */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-28">
          
          {/* Bloco 1: Cultura da Inovação */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-neon/20 to-brand-green/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500 rounded-[3rem]"></div>
            <div className="relative h-full bg-slate-50 dark:bg-brand-surface/40 border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 md:p-14 backdrop-blur-xl transition-all duration-300 group-hover:border-brand-neon/40 flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-brand-neon/10 rounded-2xl flex items-center justify-center text-brand-neon mb-8">
                  <BrainCircuit size={32} />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                  Cultura da Inovação como diferencial
                </h3>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  No <strong className="text-slate-900 dark:text-white font-bold">INOVAP</strong>, inovação vai além da tecnologia: é uma <strong className="text-slate-900 dark:text-white font-bold">forma de pensar e agir</strong>. Estimulamos a experimentação, a colaboração e o pensamento crítico para que pessoas, organizações e o território se tornem mais <strong className="text-slate-900 dark:text-white font-bold">ágeis, criativos e preparados para o futuro</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Bloco 2: O Poder da Colaboração */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-green/20 to-brand-neon/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500 rounded-[3rem]"></div>
            <div className="relative h-full bg-slate-50 dark:bg-brand-surface/40 border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 md:p-14 backdrop-blur-xl transition-all duration-300 group-hover:border-brand-green/40 flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green mb-8">
                  <Share2 size={32} />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                  O poder da colaboração no Alto Paraopeba
                </h3>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  No <strong className="text-slate-900 dark:text-white font-bold">INOVAP</strong>, acreditamos que <strong className="text-slate-900 dark:text-white font-bold">ninguém inova sozinho</strong>. Quando empresas, startups, instituições de ensino, governo e sociedade civil se conectam, surgem soluções mais fortes, negócios mais sustentáveis e uma <strong className="text-slate-900 dark:text-white font-bold">região mais inovadora e competitiva</strong>.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Atores do Ecossistema (A Hélice do INOVAP) */}
        <div className="py-20 bg-slate-50/50 dark:bg-brand-surface/20 border border-slate-100 dark:border-white/5 rounded-5xl p-8 md:p-12 mb-28">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h3 className="text-3xl font-extrabold mb-6">A Hélice da Inovação</h3>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
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
              <div key={i} className="bg-white dark:bg-brand-black p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 hover:border-brand-neon/30 transition-all duration-300 group shadow-sm flex flex-col h-full hover:scale-105">
                <div className={`w-12 h-12 bg-gradient-to-br ${pillar.color} to-transparent opacity-20 rounded-xl mb-6 flex items-center justify-center`}>
                  <pillar.icon className="text-slate-900 dark:text-white" size={24} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">{pillar.label}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chamada Final */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="w-20 h-20 bg-brand-green/10 dark:bg-brand-green/20 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-12 animate-float">
             <Handshake size={44} className="text-brand-neon" />
          </div>
          <h3 className="text-4xl md:text-5xl font-black mb-8 text-slate-900 dark:text-white">Faça parte desta rede.</h3>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 font-medium leading-relaxed">
            O INOVAP é o ponto de encontro de quem quer transformar o Alto Paraopeba. 
            Independente do seu papel na hélice, há um lugar estratégico para você.
          </p>
          <button onClick={onLoginClick} className="px-10 py-5 bg-brand-green hover:bg-brand-darkGreen dark:bg-brand-neon dark:text-black text-white dark:hover:opacity-90 rounded-2xl font-black text-lg shadow-lg dark:shadow-neon transition-all hover:scale-105">
            Quero me Conectar
          </button>
        </div>

      </div>
    </div>
  );
};
