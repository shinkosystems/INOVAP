import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { GT, Empresa } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  FileText, 
  Scale, 
  CheckCircle2, 
  Download, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  GitBranch,
  Briefcase,
  GraduationCap,
  Globe,
  Settings
} from 'lucide-react';

interface GovernancePageProps {
  onLoginClick: () => void;
  onNavigate: (target: string) => void;
}

interface GovernanceMember {
  id: number;
  nome: string;
  cargo: string;
  entidade: string;
  foto?: string;
  categoria: 'conselho' | 'coordenacao';
}

export const GovernancePage: React.FC<GovernancePageProps> = ({ onLoginClick, onNavigate }) => {
  const [gts, setGts] = useState<GT[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'papeis' | 'decisoes' | 'indicadores' | 'documentos'>('papeis');
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({});

  // Membros da Governança (Mock estruturado representativo da hélice do Alto Paraopeba)
  const governancaMembros: GovernanceMember[] = [
    {
      id: 1,
      nome: "Thereza Legg",
      cargo: "Coordenadora Geral Executiva",
      entidade: "Representante da Sociedade Civil / Tecnologia",
      foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      categoria: "coordenacao"
    },
    {
      id: 2,
      nome: "Prof. Dr. Ricardo Bastos",
      cargo: "Diretor Científico & Acadêmico",
      entidade: "UFSJ - Campus Ouro Branco",
      foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
      categoria: "coordenacao"
    },
    {
      id: 3,
      nome: "Ana Carolina Mendes",
      cargo: "Secretária Executiva de Projetos",
      entidade: "Gerdau Inovação",
      foto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
      categoria: "coordenacao"
    },
    {
      id: 4,
      nome: "Marcos Paulo Silveira",
      cargo: "Conselheiro Estratégico",
      entidade: "Secretaria de Desenvolvimento de Ouro Branco",
      foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      categoria: "conselho"
    },
    {
      id: 5,
      nome: "Patricia Toledo",
      cargo: "Conselheira da Indústria",
      entidade: "CSN Mineração",
      foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
      categoria: "conselho"
    },
    {
      id: 6,
      nome: "Felipe Drummond",
      cargo: "Conselheiro de Startups",
      entidade: "Hub Alto Paraopeba Digital",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      categoria: "conselho"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gtsRes, empresasRes] = await Promise.all([
          supabase.from('gts').select('*').order('gt'),
          supabase.from('empresas').select('*').order('nome')
        ]);
        
        if (gtsRes.data) setGts(gtsRes.data);
        if (empresasRes.data) setEmpresas(empresasRes.data);
      } catch (error) {
        console.error("Erro ao carregar dados da governança:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAccordion = (id: number) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getInstitutionCategoryLabel = (emp: Empresa) => {
    // Categorização rápida
    const nome = emp.nome.toLowerCase();
    if (nome.includes('prefeitura') || nome.includes('secretaria') || nome.includes('estado')) {
      return { label: 'Setor Público', style: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    }
    if (nome.includes('universidade') || nome.includes('faculdade') || nome.includes('ifmg') || nome.includes('ufsj')) {
      return { label: 'Academia / ICT', style: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
    }
    if (nome.includes('associação') || nome.includes('ong') || nome.includes('cooperativa')) {
      return { label: 'Terceiro Setor', style: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }
    return { label: 'Setor Privado', style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black transition-colors duration-300">
      <Navbar onLoginClick={onLoginClick} onNavigate={onNavigate} />

      {/* Hero / Introdução */}
      <section className="relative pt-44 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/5 dark:bg-brand-green/[0.03] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-8">
             <ShieldCheck size={18} className="text-brand-green dark:text-brand-neon" />
             <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">Estrutura e Transparência</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-8">
            Governança INOVAP
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
            A Governança do INOVAP articula as lideranças do Alto Paraopeba para viabilizar decisões democráticas, projetos de impacto sustentável e prestação de contas à sociedade.
          </p>
        </div>
      </section>

      {/* Bloco 1 — Organograma Visual */}
      <section className="py-16 bg-slate-50 dark:bg-brand-surface/20 border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">Modelo Organizacional</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm font-medium">
              Representação do fluxo de tomada de decisão e cooperação no ecossistema de inovação.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual do Organograma */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Conselho Deliberativo */}
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:border-brand-neon/40 transition-all flex items-center gap-6">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Scale size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Conselho Deliberativo (Estratégico)</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                    Representantes das hélices do ecossistema. Define as diretrizes macro, diretórios estratégicos e aprova regimentos.
                  </p>
                </div>
              </div>

              {/* Setas Verticais */}
              <div className="flex justify-center text-slate-300 dark:text-slate-700 text-xl font-bold py-1">↓</div>

              {/* Coordenação Executiva */}
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:border-brand-green/40 transition-all flex items-center gap-6">
                <div className="w-12 h-12 bg-brand-green/10 text-brand-green dark:text-brand-neon rounded-2xl flex items-center justify-center shrink-0">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Coordenação Executiva (Operacional)</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                    Gestão diária do ecossistema. Facilita a comunicação entre GTs, gerencia a plataforma e realiza a captação de recursos.
                  </p>
                </div>
              </div>

              {/* Setas Verticais */}
              <div className="flex justify-center text-slate-300 dark:text-slate-700 text-xl font-bold py-1">↓</div>

              {/* Base de Operação (GTs e Instituições) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Grupos de Trabalho (GTs)</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Executam os projetos verticais.</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Instituições Apoiadoras</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Empresas e Academia integradas.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Texto Explicativo Lateral */}
            <div className="lg:col-span-4 bg-white/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-4xl p-8 space-y-6">
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">Como se estruturam as decisões?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                O modelo foi desenhado para evitar o engessamento típico de conselhos tradicionais. A coordenação executiva opera com autonomia ágil, enquanto o conselho garante a aderência aos objetivos de longo prazo do Alto Paraopeba.
              </p>
              <div className="space-y-3 pt-4 border-t border-slate-150 dark:border-white/5">
                <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <CheckCircle2 size={16} className="text-brand-green shrink-0" />
                  <span>Descentralização operacional</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <CheckCircle2 size={16} className="text-brand-green shrink-0" />
                  <span>Representatividade balanceada</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <CheckCircle2 size={16} className="text-brand-green shrink-0" />
                  <span>Foco em metas regionais tangíveis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 2 — Coordenação e Conselho */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-extrabold mb-4">Lideranças da Governança</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm font-medium">
            Conheça os representantes da Hélice que lideram as ações e dão suporte aos grupos de trabalho.
          </p>
        </div>

        {/* Divisão por categorias de governança */}
        <div className="space-y-16">
          
          {/* Coordenação Executiva */}
          <div>
            <h3 className="text-2xl font-bold mb-8 text-brand-green dark:text-brand-neon border-l-4 border-brand-green dark:border-brand-neon pl-4">
              Coordenação Executiva
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {governancaMembros.filter(m => m.categoria === 'coordenacao').map(member => (
                <div key={member.id} className="bg-slate-50 dark:bg-brand-surface/40 border border-slate-200 dark:border-white/5 rounded-4xl p-6 flex items-center gap-5 hover:border-brand-neon/30 transition-all">
                  <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-black border border-slate-300 dark:border-white/10 overflow-hidden shrink-0">
                    {member.foto ? (
                      <img src={member.foto} alt={member.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="m-auto text-slate-400 mt-4" size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{member.nome}</h4>
                    <p className="text-brand-green dark:text-brand-neon text-xs font-bold mt-0.5">{member.cargo}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1 tracking-wider">{member.entidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conselho Deliberativo */}
          <div>
            <h3 className="text-2xl font-bold mb-8 text-amber-500 border-l-4 border-amber-500 pl-4">
              Conselho Estratégico / Deliberativo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {governancaMembros.filter(m => m.categoria === 'conselho').map(member => (
                <div key={member.id} className="bg-slate-50 dark:bg-brand-surface/40 border border-slate-200 dark:border-white/5 rounded-4xl p-6 flex items-center gap-5 hover:border-amber-500/30 transition-all">
                  <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-black border border-slate-300 dark:border-white/10 overflow-hidden shrink-0">
                    {member.foto ? (
                      <img src={member.foto} alt={member.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="m-auto text-slate-400 mt-4" size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{member.nome}</h4>
                    <p className="text-amber-500 text-xs font-bold mt-0.5">{member.cargo}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1 tracking-wider">{member.entidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Bloco 3 — Grupos de Trabalho (GTs) */}
      <section className="py-24 bg-slate-50 dark:bg-white/[0.01] border-y border-slate-150 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl font-extrabold mb-4">Grupos de Trabalho (GTs)</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm font-medium">
                As frentes setoriais responsáveis pela proposição de projetos práticos e fomento de suas verticais.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('gts')}
              className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-white/10 text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              Ver Detalhes dos Grupos <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-brand-green" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gts.slice(0, 6).map(gt => (
                <div key={gt.id} className="bg-white dark:bg-brand-surface/40 p-8 rounded-4xl border border-slate-200/50 dark:border-white/5 flex flex-col h-full hover:border-brand-green/30 transition-all">
                  <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-2">{gt.gt}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium flex-1">
                    {gt.descricao || `Vertical ativa desenvolvendo projetos e conexões na área de ${gt.gt.toLowerCase()}.`}
                  </p>
                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-brand-green uppercase tracking-wider">Ativo</span>
                    <button 
                      onClick={() => onNavigate('gts')}
                      className="text-xs text-slate-400 hover:text-brand-green flex items-center gap-1 transition-colors"
                    >
                      Membros →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bloco 4 — Instituições Participantes */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold mb-4">Instituições Apoiadoras</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm font-medium">
            Entidades públicas e privadas conectadas ao ecossistema que sustentam a governança local.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {empresas.map(empresa => {
              const cat = getInstitutionCategoryLabel(empresa);
              return (
                <div key={empresa.id} className="bg-slate-50/50 dark:bg-brand-surface/20 p-6 rounded-3xl border border-slate-150 dark:border-white/5 flex flex-col justify-between h-full hover:scale-105 transition-all">
                  <div>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${cat.style}`}>
                      {cat.label}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mt-4 mb-2">{empresa.nome}</h4>
                    {empresa.slogan && <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">{empresa.slogan}</p>}
                  </div>
                  <div className="pt-6 mt-6 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{empresa.cidade} - {empresa.uf}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bloco 5 — Papéis, Responsabilidades e Regimentos (Documentos) */}
      <section className="py-24 bg-slate-50 dark:bg-brand-surface/10 border-t border-slate-150 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">Regimento e Papéis</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Entenda os direitos, deveres, regras de tomada de decisão e indicadores do INOVAP.
            </p>
          </div>

          {/* Abas */}
          <div className="flex justify-center border-b border-slate-200 dark:border-white/10 mb-12">
            {[
              { id: 'papeis', label: 'Papéis' },
              { id: 'decisoes', label: 'Decisões' },
              { id: 'indicadores', label: 'Metas / Indicadores' },
              { id: 'documentos', label: 'Estatuto' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-bold text-sm border-b-2 transition-all -mb-px ${
                  activeTab === tab.id 
                    ? 'border-brand-green dark:border-brand-neon text-slate-800 dark:text-white font-extrabold' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas */}
          <div className="bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-5xl p-8 md:p-12 shadow-sm">
            
            {activeTab === 'papeis' && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-green dark:text-brand-neon"><Briefcase size={20} /> Direitos e Deveres do Participante</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Qualquer organização ou profissional que integra o ecossistema concorda em manter uma postura ética, colaborativa e ativa.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-white/[0.01] p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                    <h4 className="font-extrabold text-sm mb-3">Deveres Principais</h4>
                    <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <li className="flex gap-2">✔ Compartilhar conhecimento aberto.</li>
                      <li className="flex gap-2">✔ Participar das reuniões ordinárias de seu GT.</li>
                      <li className="flex gap-2">✔ Fomentar o desenvolvimento local.</li>
                      <li className="flex gap-2">✔ Respeitar a propriedade intelectual.</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/[0.01] p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                    <h4 className="font-extrabold text-sm mb-3">Direitos Principais</h4>
                    <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <li className="flex gap-2">✔ Propor projetos em parceria nos GTs.</li>
                      <li className="flex gap-2">✔ Divulgar vagas, artigos e eventos.</li>
                      <li className="flex gap-2">✔ Acessar a rede de mentores e investidores.</li>
                      <li className="flex gap-2">✔ Votar e propor novas verticais.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'decisoes' && (
              <div className="space-y-6 animate-fade-in-up text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-green dark:text-brand-neon"><Scale size={20} /> Tomada de Decisão</h3>
                <p>
                  As decisões estratégicas do INOVAP são colegiadas. Projetos propostos em GTs passam pela análise da **Coordenação Executiva** para verificar a viabilidade técnica e impacto regional.
                </p>
                <p>
                  Se o projeto demandar recursos coletivos ou alterar as políticas do ecossistema, é submetido à votação no **Conselho Deliberativo**, onde cada hélice possui representatividade equivalente (governo, empresas, academia, startups, sociedade).
                </p>
                <div className="p-4 bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-2xl flex gap-3 items-start">
                  <div className="text-amber-500 shrink-0 mt-0.5">ℹ</div>
                  <p className="text-xs">Propostas de novos GTs ou emendas ao regimento podem ser propostas por qualquer membro e requerem aprovação de maioria simples do conselho.</p>
                </div>
              </div>
            )}

            {activeTab === 'indicadores' && (
              <div className="space-y-6 animate-fade-in-up text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-green dark:text-brand-neon"><CheckCircle2 size={20} /> Metas e Indicadores de Sucesso</h3>
                <p>
                  O INOVAP monitora de perto os indicadores do Alto Paraopeba para avaliar o impacto real do ecossistema:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    { label: "Projetos Cocriados", desc: "Meta de 20 projetos ativos anualmente integrando indústrias e academia." },
                    { label: "Startups Geradas / Tracionadas", desc: "Fomentar o surgimento de novas empresas de base tecnológica." },
                    { label: "Talentos Capacitados", desc: "Número de profissionais em workshops de IA e Desenvolvimento." },
                    { label: "Volume de Conexões", desc: "Número de negócios iniciados por rodadas de matchmaking." }
                  ].map((ind, i) => (
                    <div key={i} className="p-5 border border-slate-100 dark:border-white/5 rounded-2xl">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mb-1 uppercase tracking-wider">{ind.label}</h4>
                      <p className="text-[11px] leading-relaxed text-slate-400">{ind.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'documentos' && (
              <div className="space-y-6 animate-fade-in-up text-center py-6">
                <div className="w-16 h-16 bg-brand-green/10 dark:bg-brand-neon/10 text-brand-green dark:text-brand-neon rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Estatuto e Regimento Geral</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
                  Baixe o documento oficial do INOVAP com todos os detalhes legais, termos de participação e governança do Alto Paraopeba.
                </p>
                <div className="pt-4">
                  <button className="inline-flex items-center gap-2 bg-brand-green dark:bg-brand-neon text-white dark:text-black hover:opacity-90 font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-md">
                    <Download size={18} /> Baixar Estatuto (PDF)
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
