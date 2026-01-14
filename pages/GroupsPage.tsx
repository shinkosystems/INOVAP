import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { GT, User, Empresa } from '../types';
import { 
  Users, ArrowLeft, Building2, Award, 
  Leaf, Cpu, HeartPulse, Zap, Lightbulb, 
  Star, ChevronRight, Loader2, Search
} from 'lucide-react';

interface GroupsPageProps {
  onLoginClick: () => void;
  onNavigate: (target: string) => void;
  onViewCompany: (empresa: Empresa) => void;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ onLoginClick, onNavigate, onViewCompany }) => {
  const [gts, setGts] = useState<GT[]>([]);
  const [selectedGt, setSelectedGt] = useState<GT | null>(null);
  const [topMembers, setTopMembers] = useState<(User & { empresa?: Empresa })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGTs();
  }, []);

  const fetchGTs = async () => {
    try {
      const { data, error } = await supabase.from('gts').select('*').order('gt');
      if (error) throw error;
      setGts(data || []);
    } catch (e) {
      console.error("Erro ao carregar GTs", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGtDetails = async (gt: GT) => {
    setLoadingDetails(true);
    setSelectedGt(gt);
    try {
      // Busca os top 5 membros do GT baseado em pontos (ou artigos se pontos não existirem)
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .contains('gts', [gt.id])
        .order('artigos', { ascending: false }) // Fallback para artigos enquanto pontos é gerado dinamicamente
        .limit(5);

      if (userError) throw userError;

      const membersWithCompanies = await Promise.all((users || []).map(async (u) => {
        const { data: emp } = await supabase
          .from('empresas')
          .select('*')
          .eq('responsavel', u.uuid)
          .single();
        return { ...u, empresa: emp || undefined };
      }));

      setTopMembers(membersWithCompanies);
    } catch (e) {
      console.error("Erro ao carregar detalhes do GT", e);
    } finally {
      setLoadingDetails(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getIcon = (gtName: string) => {
    const name = gtName.toLowerCase();
    if (name.includes('agro')) return <Leaf size={24} />;
    if (name.includes('indús') || name.includes('cpu')) return <Cpu size={24} />;
    if (name.includes('saúde') || name.includes('bem')) return <HeartPulse size={24} />;
    if (name.includes('energ')) return <Zap size={24} />;
    if (name.includes('cidade') || name.includes('smart')) return <Building2 size={24} />;
    return <Lightbulb size={24} />;
  };

  const filteredGts = gts.filter(g => g.gt.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white dark:bg-black min-h-screen text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black transition-colors duration-300">
      <Navbar onLoginClick={onLoginClick} onNavigate={onNavigate} />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {!selectedGt ? (
          <div className="animate-fade-in-up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6">
                 <Users size={16} className="text-brand-green" />
                 <span className="text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-widest">Verticais Estratégicas</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Grupos de Trabalho</h1>
              <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                Nossos GTs são o coração pulsante do ecossistema, onde a colaboração gera resultados reais.
              </p>
            </div>

            <div className="max-w-xl mx-auto mb-16 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar grupos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-neon transition-all"
                />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-brand-green" size={48} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGts.map((gt) => (
                  <button 
                    key={gt.id}
                    onClick={() => fetchGtDetails(gt)}
                    className="group text-left p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-brand-neon/30 transition-all shadow-sm hover:shadow-2xl flex flex-col h-full"
                  >
                    <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-brand-green mb-6 group-hover:bg-brand-neon group-hover:text-black transition-all">
                      {getIcon(gt.gt)}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{gt.gt}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed flex-1">
                      Desenvolvendo ações estratégicas e conectando os principais atores do setor de {gt.gt.toLowerCase()}.
                    </p>
                    <div className="mt-8 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ver membros e projetos</span>
                       <ChevronRight size={20} className="text-brand-green group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <button 
              onClick={() => setSelectedGt(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-brand-green transition-colors mb-12 font-bold group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar para todos os grupos
            </button>

            <div className="flex flex-col md:flex-row gap-12 items-start mb-20">
              <div className="w-24 h-24 bg-brand-neon/20 rounded-3xl flex items-center justify-center text-brand-neon border border-brand-neon/20">
                {getIcon(selectedGt.gt)}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">{selectedGt.gt}</h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-3xl leading-relaxed">
                  Lideranças e empresas que estão transformando o futuro desta vertical no ecossistema INOVAP.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Award className="text-brand-neon" />
                  Membros Destaque (Top 5)
                </h2>

                {loadingDetails ? (
                   <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : (
                  <div className="space-y-4">
                    {topMembers.length === 0 ? (
                      <p className="text-slate-500 italic">Nenhum membro ativo cadastrado neste grupo ainda.</p>
                    ) : (
                      topMembers.map((member, i) => (
                        <div key={member.id} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-brand-neon/30 transition-all">
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full bg-black border-2 border-white/10 overflow-hidden">
                                {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <Users className="m-auto text-slate-600 mt-4" size={24} />}
                              </div>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-neon text-black rounded-full flex items-center justify-center font-black text-sm border-4 border-white dark:border-black">
                                {i + 1}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-lg font-bold group-hover:text-brand-neon transition-colors">{member.nome}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">{member.artigos} Artigos Publicados</p>
                            </div>
                          </div>

                          {member.empresa ? (
                            <button 
                              onClick={() => onViewCompany(member.empresa!)}
                              className="flex items-center gap-3 bg-white dark:bg-white/10 px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-brand-neon hover:text-black transition-all group/btn"
                            >
                              <Building2 size={18} className="text-brand-green group-hover/btn:text-black" />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase opacity-50">Representante de</p>
                                <p className="text-sm font-bold">{member.empresa.nome}</p>
                              </div>
                            </button>
                          ) : (
                            <div className="text-xs text-slate-500 font-medium italic">Atuando como Profissional Liberal</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                 <div className="bg-brand-neon text-black rounded-[2.5rem] p-10 shadow-2xl shadow-brand-neon/20">
                    <h3 className="text-2xl font-black mb-6">Faça parte deste GT</h3>
                    <p className="font-bold mb-8 opacity-80">Contribua com seu conhecimento e conecte-se com estas lideranças.</p>
                    <button 
                      onClick={onLoginClick}
                      className="w-full bg-black text-white py-4 rounded-2xl font-black hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      Entrar no Grupo <Zap size={18} />
                    </button>
                 </div>

                 <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8">
                    <h4 className="font-bold mb-4 flex items-center gap-2"><Star size={16} className="text-brand-green" /> Impacto Regional</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Este grupo é responsável por articular parcerias público-privadas e fomentar a inovação aberta no território do Alto Paraopeba.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};