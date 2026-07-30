import React, { useState } from 'react';
import { 
  Compass, 
  Users, 
  Zap, 
  Play, 
  ArrowRight,
  Building2, 
  Briefcase, 
  Rocket, 
  GraduationCap, 
  Atom, 
  Globe,
  FolderKanban,
  BookOpen,
  Share2,
  SearchCode,
  TrendingUp,
  MapPin,
  ChevronRight,
  UserPlus
} from 'lucide-react';

type TabType = 'que-e' | 'quem-participa' | 'que-acontece' | 'como-participar';

export const EcosystemSection: React.FC<{ onNavigate?: (target: string) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('que-e');

  const tabs = [
    { id: 'que-e' as TabType, label: '1. O que é', icon: Compass, desc: 'Entenda o conceito' },
    { id: 'quem-participa' as TabType, label: '2. Quem participa', icon: Users, desc: 'Os atores conectados' },
    { id: 'que-acontece' as TabType, label: '3. O que acontece', icon: Zap, desc: 'Os resultados gerados' },
    { id: 'como-participar' as TabType, label: '4. Como participar', icon: Play, desc: 'Dê o primeiro passo' },
  ];

  return (
    <section id="ecossistema" className="py-28 bg-slate-50 dark:bg-black relative overflow-hidden transition-colors duration-500">
      {/* Elementos visuais de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-green/[0.02] dark:bg-brand-neon/[0.02] rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-green dark:text-brand-neon uppercase tracking-[0.3em] bg-brand-green/10 dark:bg-brand-neon/10 px-4 py-2 rounded-full">
            Entenda o Ecossistema
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mt-6 mb-4 tracking-tight leading-tight">
            Como funciona o INOVAP?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Desmistificamos o conceito abstrato de "ecossistema" em quatro respostas simples e ações bem concretas.
          </p>
        </div>

        {/* Abas de Navegação / Layout Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  p-6 rounded-3xl text-left border transition-all duration-300 relative group
                  ${isActive 
                    ? 'bg-white dark:bg-brand-surface border-brand-green dark:border-brand-neon shadow-xl shadow-brand-green/5 dark:shadow-brand-neon/5 scale-[1.02]' 
                    : 'bg-white/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-brand-surface/40'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
                  ${isActive 
                    ? 'bg-brand-green text-white dark:bg-brand-neon dark:text-black font-bold' 
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:scale-110'
                  }
                `}>
                  <Icon size={20} />
                </div>
                <h3 className={`font-black text-base tracking-tight transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {tab.label}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  {tab.desc}
                </p>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-8 h-1 bg-brand-green dark:bg-brand-neon rounded-t-full hidden lg:block"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="bg-white dark:bg-brand-surface/50 border border-slate-100 dark:border-white/5 rounded-5xl p-8 md:p-12 shadow-2xl backdrop-blur-xl transition-all duration-500">
          
          {/* ABA 1: O que é */}
          {activeTab === 'que-e' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center animate-fade-in-up">
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  A liga que une quem constrói o futuro no Alto Paraopeba
                </h3>
                <p className="text-slate-500 dark:text-slate-300 leading-relaxed text-base font-light">
                  Muitas pessoas ouvem a palavra <strong className="font-semibold text-slate-800 dark:text-white">“ecossistema”</strong> e pensam em algo distante ou teórico. No INOVAP, traduzimos isso na prática.
                </p>
                <p className="text-slate-500 dark:text-slate-300 leading-relaxed text-base font-light">
                  Nós somos um <strong>orquestrador de inovação</strong>. Isso significa que nossa função é identificar as necessidades das indústrias, a inteligência das universidades, a agilidade das startups e o apoio das prefeituras, conectando-os para criar projetos de impacto regional.
                </p>
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green dark:text-brand-neon shrink-0">
                    💡
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nossa Missão Principal</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Gerar prosperidade e reter talentos no Alto Paraopeba por meio do empreendedorismo inovador e desenvolvimento tecnológico integrado.
                    </p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="w-full max-w-sm aspect-square rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center p-8 relative animate-pulse-slow">
                  <div className="w-full h-full rounded-full bg-brand-green/5 dark:bg-brand-neon/5 flex flex-col items-center justify-center text-center p-6 relative">
                    <Compass size={48} className="text-brand-green dark:text-brand-neon mb-4" />
                    <span className="text-lg font-black text-slate-800 dark:text-white">INOVAP</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Orquestrador Central</span>
                  </div>
                  {/* Satélites de conexão */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-brand-surface border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg shadow-md">🏫</div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-brand-surface border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg shadow-md">🏢</div>
                  <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-brand-surface border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg shadow-md">🚀</div>
                  <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-brand-surface border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg shadow-md">🏛️</div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: Quem participa */}
          {activeTab === 'quem-participa' && (
            <div className="space-y-10 animate-fade-in-up">
              <div className="max-w-3xl">
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                  A Hélice de Atores do Ecossistema
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  A inovação regional só acontece quando múltiplos setores se conectam. Cada ator tem um papel indispensável:
                </p>
              </div>

              {/* Fluxograma Horizontal de Conexão */}
              <div className="hidden lg:flex items-center justify-between p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl gap-4">
                {[
                  { label: 'Governo', icon: Building2, color: 'text-blue-500 bg-blue-500/10' },
                  { label: 'Empresas', icon: Briefcase, color: 'text-amber-500 bg-amber-500/10' },
                  { label: 'Startups', icon: Rocket, color: 'text-brand-neon bg-brand-neon/10' },
                  { label: 'Academia', icon: GraduationCap, color: 'text-purple-500 bg-purple-500/10' },
                  { label: 'ICTs', icon: Atom, color: 'text-rose-500 bg-rose-500/10' },
                  { label: 'Sociedade', icon: Globe, color: 'text-emerald-500 bg-emerald-500/10' }
                ].map((actor, idx) => (
                  <React.Fragment key={actor.label}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${actor.color}`}>
                        <actor.icon size={26} />
                      </div>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{actor.label}</span>
                    </div>
                    {idx < 5 && (
                      <div className="flex items-center text-slate-300 dark:text-slate-700 font-black">
                        ↔
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Detalhes dos Atores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { 
                    icon: Building2, 
                    title: "Governo", 
                    desc: "Prefeituras e secretarias locais que oferecem leis de fomento, desburocratização e espaço para testes de soluções públicas." 
                  },
                  { 
                    icon: Briefcase, 
                    title: "Empresas & Indústrias", 
                    desc: "Grandes corporações e comércios que trazem os reais desafios do mercado e investem no desenvolvimento de novas soluções." 
                  },
                  { 
                    icon: Rocket, 
                    title: "Startups & Empreendedores", 
                    desc: "Negócios inovadores que desenvolvem tecnologias escaláveis em tempo recorde e buscam validação no mercado local." 
                  },
                  { 
                    icon: GraduationCap, 
                    title: "Academia (Universidades)", 
                    desc: "Instituições de ensino que capacitam profissionais altamente qualificados e produzem conhecimento científico de ponta." 
                  },
                  { 
                    icon: Atom, 
                    title: "ICTs", 
                    desc: "Institutos de Ciência e Tecnologia dedicados a transformar pesquisas abstratas em projetos de engenharia aplicados à indústria." 
                  },
                  { 
                    icon: Globe, 
                    title: "Sociedade Civil", 
                    desc: "A comunidade de moradores do Alto Paraopeba, que valida soluções, indica dores urbanas e consome a inovação gerada." 
                  }
                ].map((actor, idx) => {
                  const Icon = actor.icon;
                  return (
                    <div key={idx} className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all">
                      <div className="w-10 h-10 rounded-xl bg-brand-green/10 dark:bg-brand-neon/10 text-brand-green dark:text-brand-neon flex items-center justify-center mb-4">
                        <Icon size={20} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">{actor.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{actor.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 3: O que acontece */}
          {activeTab === 'que-acontece' && (
            <div className="space-y-10 animate-fade-in-up">
              <div className="max-w-3xl">
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                  O que geramos a partir dessas conexões?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Não criamos conexões apenas para conversar. O ecossistema gera produtos concretos e valor real para a economia e sociedade:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: FolderKanban,
                    title: "Projetos Compartilhados",
                    desc: "Iniciativas conjuntas onde empresas contratam startups e a universidade atua no desenvolvimento tecnológico."
                  },
                  {
                    icon: BookOpen,
                    title: "Capacitação & Workshops",
                    desc: "Eventos práticos focados em tecnologia, inteligência artificial, programação, pitch e modelagem de negócios."
                  },
                  {
                    icon: Share2,
                    title: "Networking Qualificado",
                    desc: "Fóruns e eventos potenciais aproximando tomadores de decisão das grandes indústrias de novos talentos regionais."
                  },
                  {
                    icon: SearchCode,
                    title: "Pesquisa Aplicada",
                    desc: "Artigos e teses das universidades ganham viabilidade comercial, saindo do papel direto para o mercado corporativo."
                  },
                  {
                    icon: Rocket,
                    title: "Novo Empreendedorismo",
                    desc: "Alunos das universidades e profissionais criam novos modelos de negócios locais de base tecnológica inovadora."
                  },
                  {
                    icon: TrendingUp,
                    title: "Desenvolvimento Regional",
                    desc: "Atração de investimentos para o Alto Paraopeba, retenção de cérebros e criação de empregos com salários elevados."
                  }
                ].map((result, idx) => {
                  const Icon = result.icon;
                  return (
                    <div key={idx} className="p-8 rounded-4xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 flex gap-5 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-brand-green/10 dark:bg-brand-neon/10 text-brand-green dark:text-brand-neon flex items-center justify-center shrink-0">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-2">{result.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{result.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 4: Como participar */}
          {activeTab === 'como-participar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center animate-fade-in-up">
              <div className="lg:col-span-7 space-y-8">
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                    Como posso me envolver?
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    A participação é aberta e baseada na colaboração ativa. Siga estes passos simples para fazer parte:
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      step: "1",
                      title: "Crie seu Perfil",
                      desc: "Cadastre-se como pessoa física ou como representante de uma instituição (empresa, universidade ou startup) na nossa Área do Membro."
                    },
                    {
                      step: "2",
                      title: "Inscreva-se nos Grupos de Trabalho (GTs)",
                      desc: "Temos grupos focados em Agronegócio, Cidades Inteligentes, Indústria 4.0, Energias Renováveis e Educação. É lá que os projetos nascem."
                    },
                    {
                      step: "3",
                      title: "Frequente Nossos Eventos",
                      desc: "Participe de rodadas de negócios, meetups e encontros organizados pelo INOVAP para expandir sua rede de contatos."
                    },
                    {
                      step: "4",
                      title: "Colabore e Interaja",
                      desc: "Proponha desafios que sua instituição enfrenta ou ofereça suas tecnologias para resolver as dores de outros membros."
                    }
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-5 items-start">
                      <div className="w-8 h-8 rounded-full bg-brand-green dark:bg-brand-neon text-white dark:text-black font-extrabold text-xs flex items-center justify-center shrink-0 shadow-lg shadow-brand-green/20 dark:shadow-brand-neon/20">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{step.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed font-medium">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-4xl p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-brand-green/20 dark:bg-brand-neon/20 text-brand-green dark:text-brand-neon flex items-center justify-center mx-auto">
                  <UserPlus size={30} />
                </div>
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">Pronto para inovar no Alto Paraopeba?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  A nossa plataforma online é o ponto de encontro virtual para as conexões acontecerem todos os dias de maneira orgânica.
                </p>
                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    onClick={() => onNavigate && onNavigate('login')} 
                    className="w-full py-4 bg-brand-green hover:bg-brand-darkGreen dark:bg-brand-neon dark:text-black text-white dark:hover:opacity-90 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-neon"
                  >
                    Acessar Área do Membro
                    <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('gts')} 
                    className="w-full py-4 bg-white/50 hover:bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white dark:hover:bg-white/[0.06] rounded-2xl font-bold transition-all border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2"
                  >
                    Conhecer os Grupos (GTs)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
