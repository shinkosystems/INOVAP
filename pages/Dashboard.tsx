import React, { useState, useEffect, useCallback } from 'react';
import { Logo } from '../components/ui/Logo';
import { LayoutDashboard, FileText, Users, LogOut, TrendingUp, Award, Star, Medal, Briefcase, ChevronRight, X, Save, Edit3, Loader2, ShieldCheck, Shield, Layers, PlusCircle, UserPlus, Trash2 } from 'lucide-react';
import { User, GT } from '../types';
import { supabase } from '../services/supabase';

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'gts';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [gts, setGts] = useState<GT[]>([]);
  
  // State for Member Modal
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedGT, setEditedGT] = useState<number | undefined>(undefined);
  const [editedGovernanca, setEditedGovernanca] = useState<boolean>(false);

  // State for GT Management (Governance only)
  const [newGtName, setNewGtName] = useState('');
  const [isCreatingGt, setIsCreatingGt] = useState(false);
  const [managingGt, setManagingGt] = useState<GT | null>(null);
  const [userToAdd, setUserToAdd] = useState<string>(''); // User ID to add to GT
  
  const userPoints = (user?.artigos || 0) * 150 + 50; 
  const userLevel = Math.floor(userPoints / 500) + 1;
  const nextLevelPoints = userLevel * 500;
  const progressPercent = Math.min(100, (userPoints % 500) / 500 * 100);

  const fetchData = useCallback(async () => {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .order('artigos', { ascending: false });
    
    if (userData) {
        const usersWithPoints = userData.map(u => ({
            ...u,
            pontos: (u.artigos * 150) + Math.floor(Math.random() * 100),
            nivel: 'Inovador' 
        }));
        setRanking(usersWithPoints.slice(0, 20)); 
        setMembers(usersWithPoints); 
    }

    const { data: gtData } = await supabase.from('gts').select('*').order('gt', { ascending: true });
    if (gtData) setGts(gtData);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getGTName = (id?: number) => {
      if (!id) return 'Sem GT';
      return gts.find(g => g.id === id)?.gt || 'GT Desconhecido';
  };

  // --- Member Modal Logic ---
  const handleMemberClick = (member: User) => {
      setSelectedMember(member);
      setEditedGT(member.gt);
      setEditedGovernanca(member.governanca || false);
  };

  const handleSaveMember = async () => {
      if (!selectedMember) return;
      setIsUpdating(true);

      try {
          const { error } = await supabase
              .from('users')
              .update({ 
                gt: editedGT,
                governanca: editedGovernanca 
              })
              .eq('id', selectedMember.id);

          if (error) throw error;
          await fetchData(); // Refresh all data
          setSelectedMember(null);
      } catch (error) {
          console.error("Erro ao atualizar membro:", error);
          alert("Erro ao salvar alterações.");
      } finally {
          setIsUpdating(false);
      }
  };

  // --- GT Management Logic ---
  const handleCreateGT = async () => {
      if (!newGtName.trim()) return;
      setIsCreatingGt(true);
      try {
          // Insere no banco de dados
          const { error } = await supabase
            .from('gts')
            .insert([{ gt: newGtName.trim() }]);

          if (error) throw error;
          
          setNewGtName('');
          
          // Atualiza a lista de GTs imediatamente
          await fetchData();
          
          // Opcional: Feedback visual simples pode ser adicionado aqui

      } catch (error: any) {
          console.error('Error creating GT:', error);
          if (error.code === '23505') {
              alert('Este grupo de trabalho já existe!');
          } else {
              alert(`Erro ao criar grupo: ${error.message || 'Tente novamente.'}`);
          }
      } finally {
          setIsCreatingGt(false);
      }
  };

  const handleAddUserToGt = async () => {
      if (!managingGt || !userToAdd) return;
      setIsUpdating(true);
      try {
          const { error } = await supabase
              .from('users')
              .update({ gt: managingGt.id })
              .eq('id', userToAdd); // userToAdd is the numeric ID cast to string in select

          if (error) throw error;
          await fetchData();
          setUserToAdd('');
          alert('Membro adicionado ao grupo!');
      } catch (error) {
          console.error('Error adding user to GT:', error);
          alert('Erro ao adicionar membro.');
      } finally {
          setIsUpdating(false);
      }
  };

  // Helper to count members per GT
  const getMemberCount = (gtId: number) => {
      return members.filter(m => m.gt === gtId).length;
  };

  return (
    <div className="min-h-screen bg-black text-white flex font-sans overflow-hidden relative">
      {/* Abstract Background Orbs */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-green/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Glass Sidebar */}
      <div className="w-72 bg-white/[0.03] backdrop-blur-xl border-r border-white/5 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-3xl h-[calc(100vh-2rem)]">
        <div className="h-24 flex items-center px-8">
          <Logo dark />
        </div>
        
        <div className="flex-1 py-4 px-4 space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
            { id: 'ranking', icon: Award, label: 'Ranking' },
            { id: 'members', icon: Users, label: 'Membros' },
            { id: 'articles', icon: FileText, label: 'Artigos' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-medium ${
                activeTab === item.id 
                  ? 'bg-brand-green text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}

          {/* Governance Only Tab */}
          {user?.governanca && (
             <>
                <div className="h-px bg-white/10 my-2 mx-4"></div>
                <button 
                  onClick={() => setActiveTab('gts')}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-medium ${
                    activeTab === 'gts' 
                      ? 'bg-brand-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.4)]' 
                      : 'text-brand-neon hover:bg-brand-neon/10'
                  }`}
                >
                  <Layers size={20} />
                  <span>Gestão de Grupos</span>
                </button>
             </>
          )}
        </div>

        {/* User Card */}
        <div className="p-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-green/5 group-hover:bg-brand-green/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                        <Star size={16} fill="currentColor" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Nível {userLevel}</div>
                        <div className="text-sm font-bold text-white">Explorador</div>
                    </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative z-10 mb-2">
                    <div className="bg-brand-green h-full rounded-full shadow-[0_0_10px_#10b981]" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 text-right">{userPoints} pts</div>
            </div>
            
            <button onClick={onLogout} className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors text-sm w-full p-4 mt-2">
                <LogOut size={16} />
                Sair
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Header */}
        <header className="h-24 flex items-center justify-between px-8 md:px-12 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
                {activeTab === 'overview' && 'Painel de Controle'}
                {activeTab === 'ranking' && 'Ranking'}
                {activeTab === 'members' && 'Comunidade'}
                {activeTab === 'articles' && 'Biblioteca'}
                {activeTab === 'gts' && 'Gestão de Grupos'}
            </h2>
            <p className="text-slate-500 text-sm">Bem-vindo ao futuro do ecossistema.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:block px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-brand-neon text-sm font-medium">
                {getGTName(user?.gt)}
            </div>
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{user?.nome || 'Convidado'}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[150px]">{user?.email}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-green to-blue-600 p-[2px] shadow-lg shadow-brand-green/20">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <span className="font-bold text-lg text-white">{user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                </div>
            </div>
            {/* Mobile Menu Button would go here */}
            <button className="md:hidden text-white" onClick={onLogout}><LogOut /></button>
          </div>
        </header>

        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth">
            
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in-up">
                    {/* Hero Banner */}
                    <div className="relative bg-gradient-to-r from-brand-green/20 to-blue-900/20 rounded-3xl p-10 border border-white/10 overflow-hidden backdrop-blur-md">
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-brand-green/10 to-transparent"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold mb-4 text-white">Olá, {user?.nome.split(' ')[0]}</h1>
                            <p className="text-slate-300 max-w-xl text-lg font-light leading-relaxed mb-8">
                                Você já acumulou <span className="text-brand-neon font-bold">{userPoints} INOVA Coins</span>. 
                                Sua contribuição está acelerando o ecossistema.
                            </p>
                            <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                Ver Missões Diárias
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Posição Geral", value: "#12", icon: Medal, color: "text-yellow-400" },
                            { label: "Artigos Publicados", value: user?.artigos || 0, icon: FileText, color: "text-brand-neon" },
                            { label: "Eventos", value: "3", icon: Briefcase, color: "text-blue-400" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors backdrop-blur-sm group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform text-white">
                                        <stat.icon size={24} className={stat.color} />
                                    </div>
                                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Stats</span>
                                </div>
                                <h3 className="text-4xl font-bold text-white mb-1">{stat.value}</h3>
                                <p className="text-slate-400 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Content Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Feed */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-white">Feed do Ecossistema</h3>
                                <button className="p-2 hover:bg-white/10 rounded-full text-white"><ChevronRight /></button>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { title: "Novo edital de fomento aberto", time: "2h atrás", type: "Oportunidade", bg: "bg-purple-500" },
                                    { title: "Startup do Vale recebe aporte", time: "5h atrás", type: "Notícia", bg: "bg-blue-500" },
                                    { title: "Reunião GT Saúde confirmada", time: "1d atrás", type: "Agenda", bg: "bg-brand-green" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                        <div className={`w-2 h-12 rounded-full ${item.bg} shadow-[0_0_10px_currentColor] opacity-60 group-hover:opacity-100 transition-opacity`}></div>
                                        <div className="flex-1 pb-4 border-b border-white/5 group-hover:border-white/10 transition-colors">
                                            <h4 className="text-white font-medium group-hover:text-brand-neon transition-colors">{item.title}</h4>
                                            <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                                <span>{item.type}</span> • <span>{item.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Challenges */}
                        <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 blur-[80px] rounded-full"></div>
                            
                            <h3 className="text-xl font-bold text-white mb-6 relative z-10">Desafios Ativos</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-brand-green/50 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white group-hover:text-brand-neon">Hackathon Smart Cities</h4>
                                        <span className="text-xs bg-brand-green/20 text-brand-neon px-2 py-1 rounded">+500 XP</span>
                                    </div>
                                    <p className="text-sm text-slate-400 font-light">Desenvolva soluções para mobilidade urbana.</p>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white group-hover:text-blue-400">Mentoria Voluntária</h4>
                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">+200 XP</span>
                                    </div>
                                    <p className="text-sm text-slate-400 font-light">Apoie novas startups do ecossistema.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ranking' && (
                <div className="animate-fade-in-up">
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                        <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="text-2xl font-bold text-white">Leaderboard</h3>
                            <p className="text-slate-400">Top membros engajados.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/20 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-8 py-5">#</th>
                                        <th className="px-8 py-5">Membro</th>
                                        <th className="px-8 py-5">Grupo</th>
                                        <th className="px-8 py-5 text-right">Artigos</th>
                                        <th className="px-8 py-5 text-right">XP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {ranking.map((r, index) => (
                                        <tr key={index} 
                                            onClick={() => handleMemberClick(r)}
                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-8 py-5 text-white font-mono">
                                                {index < 3 ? <span className="text-xl">{['🥇','🥈','🥉'][index]}</span> : `#${index + 1}`}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/10 group-hover:border-brand-neon/50 transition-colors">
                                                        {r.nome.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-brand-neon transition-colors flex items-center gap-2">
                                                            {r.nome}
                                                            {r.governanca && <ShieldCheck size={14} className="text-brand-neon" />}
                                                        </div>
                                                        <div className="text-xs text-slate-500">Nível {Math.floor((r.pontos || 0) / 500) + 1}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-300 border border-white/5">
                                                    {getGTName(r.gt)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right text-slate-400">{r.artigos}</td>
                                            <td className="px-8 py-5 text-right font-bold text-brand-neon font-mono">{r.pontos}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="animate-fade-in-up">
                    <div className="mb-8 flex gap-4">
                        <input type="text" placeholder="Buscar membros..." className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-green focus:outline-none focus:bg-black transition-all" />
                        <button className="bg-brand-green text-black px-8 rounded-2xl font-bold hover:bg-brand-neon transition-colors">Buscar</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((m) => (
                            <div 
                                key={m.id} 
                                onClick={() => handleMemberClick(m)}
                                className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:border-brand-green/30 hover:bg-white/[0.08] transition-all flex items-center gap-5 cursor-pointer group hover:-translate-y-1"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-xl font-bold text-slate-300 border border-white/5 group-hover:scale-110 group-hover:text-brand-neon transition-all">
                                    {m.nome.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg group-hover:text-brand-neon transition-colors flex items-center gap-2">
                                        {m.nome}
                                        {m.governanca && <ShieldCheck size={16} className="text-brand-neon" />}
                                    </h4>
                                    <p className="text-sm text-slate-500 mb-2 truncate max-w-[180px] font-light">{m.email}</p>
                                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-slate-400 border border-white/5 group-hover:border-brand-green/30 transition-colors">{getGTName(m.gt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'articles' && (
                <div className="h-full flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 border-dashed animate-fade-in-up">
                    <div className="p-6 bg-white/5 rounded-full mb-6">
                        <FileText size={48} className="text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Seus Artigos</h3>
                    <p className="text-slate-400 mb-8 max-w-md text-center font-light">Contribua com o conhecimento do ecossistema. Publique inovações e pesquisas.</p>
                    <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-brand-neon transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        Escrever Novo Artigo
                    </button>
                </div>
            )}

            {/* GT MANAGEMENT TAB (GOVERNANCE ONLY) */}
            {activeTab === 'gts' && user?.governanca && (
                 <div className="animate-fade-in-up space-y-8">
                     {/* Creation Section */}
                     <div className="bg-white/5 border border-brand-neon/30 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-neon/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                         <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                             <PlusCircle className="text-brand-neon" />
                             Criar Novo Grupo de Trabalho
                         </h3>
                         <div className="flex gap-4">
                             <input 
                                type="text" 
                                value={newGtName}
                                onChange={(e) => setNewGtName(e.target.value)}
                                placeholder="Nome do Grupo (ex: Inteligência Artificial)" 
                                className="flex-1 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-brand-neon focus:outline-none"
                             />
                             <button 
                                type="button"
                                onClick={handleCreateGT}
                                disabled={isCreatingGt || !newGtName.trim()}
                                className="bg-brand-neon text-black px-8 rounded-2xl font-bold hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
                             >
                                 {isCreatingGt ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                 Criar GT
                             </button>
                         </div>
                     </div>

                     {/* GT List */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {gts.map((gt) => {
                             const memberCount = getMemberCount(gt.id);
                             return (
                                 <div key={gt.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-brand-neon/50 transition-all group relative">
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="p-3 bg-white/5 rounded-2xl text-brand-neon border border-white/5">
                                             <Layers size={24} />
                                         </div>
                                         <div className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-400 border border-white/5">
                                             ID: {gt.id}
                                         </div>
                                     </div>
                                     <h4 className="text-xl font-bold text-white mb-2">{gt.gt}</h4>
                                     <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                                         <Users size={14} />
                                         <span>{memberCount} membros ativos</span>
                                     </div>
                                     <button 
                                        onClick={() => setManagingGt(gt)}
                                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                                     >
                                         <Edit3 size={16} /> Gerenciar
                                     </button>
                                 </div>
                             )
                         })}
                     </div>
                 </div>
            )}
        </main>
      </div>

      {/* MEMBER DETAIL MODAL */}
      {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
                onClick={() => setSelectedMember(null)}
              ></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                  {/* Modal Header/Cover */}
                  <div className="h-32 bg-gradient-to-r from-brand-green/20 to-blue-900/20 relative">
                      <button 
                        onClick={() => setSelectedMember(null)}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="px-8 pb-8 relative">
                      {/* Avatar */}
                      <div className="w-24 h-24 rounded-3xl bg-black border-4 border-[#0a0a0a] -mt-12 mb-6 flex items-center justify-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-brand-green to-blue-600 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                           <span className="text-4xl font-bold text-white">{selectedMember.nome.charAt(0)}</span>
                      </div>

                      <div className="mb-6">
                          <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                              {selectedMember.nome}
                              {selectedMember.governanca && <ShieldCheck className="text-brand-neon" />}
                          </h2>
                          <p className="text-slate-400 font-light">{selectedMember.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nível</div>
                              <div className="text-xl font-bold text-white">Explorador</div>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pontos</div>
                              <div className="text-xl font-bold text-brand-neon">{selectedMember.pontos} XP</div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <label className="block text-sm font-medium text-slate-300">Grupo de Trabalho (GT)</label>
                          <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                  <Users size={18} />
                              </div>
                              <select 
                                value={editedGT || ''}
                                onChange={(e) => setEditedGT(Number(e.target.value) || undefined)}
                                className="block w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-neon focus:bg-black transition-all cursor-pointer"
                              >
                                  <option value="" className="bg-black text-slate-400">Sem Grupo Definido</option>
                                  {gts.map((gt) => (
                                      <option key={gt.id} value={gt.id} className="bg-black text-white">{gt.gt}</option>
                                  ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                                  <Edit3 size={16} />
                              </div>
                          </div>

                          <label className="block text-sm font-medium text-slate-300 mt-4">Configurações</label>
                          <div 
                              onClick={() => setEditedGovernanca(!editedGovernanca)}
                              className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors select-none"
                          >
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg transition-colors ${editedGovernanca ? 'bg-brand-neon/20 text-brand-neon' : 'bg-slate-800 text-slate-500'}`}>
                                      <Shield size={20} />
                                  </div>
                                  <div>
                                      <div className={`font-medium transition-colors ${editedGovernanca ? 'text-white' : 'text-slate-400'}`}>Membro da Governança</div>
                                      <div className="text-xs text-slate-500">Acesso administrativo e liderança</div>
                                  </div>
                              </div>
                              
                              <div className={`w-12 h-7 rounded-full transition-colors relative ${editedGovernanca ? 'bg-brand-neon' : 'bg-slate-700'}`}>
                                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${editedGovernanca ? 'left-6' : 'left-1'}`}></div>
                              </div>
                          </div>
                          
                          <button 
                            onClick={handleSaveMember}
                            disabled={isUpdating}
                            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-brand-neon transition-all flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isUpdating ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                              Salvar Alterações
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* GT MANAGEMENT MODAL */}
      {managingGt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
                onClick={() => setManagingGt(null)}
              ></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
                  <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <div className="text-xs text-brand-neon uppercase tracking-widest mb-1">Gerenciando</div>
                              <h2 className="text-2xl font-bold text-white">{managingGt.gt}</h2>
                          </div>
                          <button onClick={() => setManagingGt(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                              <X size={20} className="text-white" />
                          </button>
                      </div>

                      <div className="space-y-6">
                          {/* Add Member */}
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                              <label className="block text-sm font-medium text-slate-300 mb-2">Adicionar Membro ao Grupo</label>
                              <div className="flex gap-2">
                                  <select 
                                    value={userToAdd}
                                    onChange={(e) => setUserToAdd(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-neon"
                                  >
                                      <option value="">Selecione um usuário...</option>
                                      {members
                                        .filter(m => m.gt !== managingGt.id) // Filter users not in this group
                                        .sort((a, b) => a.nome.localeCompare(b.nome))
                                        .map(m => (
                                          <option key={m.id} value={m.id}>
                                              {m.nome} {m.gt ? '(Trocar de GT)' : '(Sem GT)'}
                                          </option>
                                      ))}
                                  </select>
                                  <button 
                                    onClick={handleAddUserToGt}
                                    disabled={!userToAdd || isUpdating}
                                    className="bg-brand-neon text-black p-2 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
                                  >
                                      {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                                  </button>
                              </div>
                          </div>

                          {/* Current Members List */}
                          <div>
                              <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                                  Membros Atuais
                                  <span className="bg-white/10 text-xs px-2 py-1 rounded-full">{getMemberCount(managingGt.id)}</span>
                              </h4>
                              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                  {members.filter(m => m.gt === managingGt.id).length === 0 ? (
                                      <div className="text-slate-500 text-sm text-center py-4">Nenhum membro neste grupo.</div>
                                  ) : (
                                      members.filter(m => m.gt === managingGt.id).map(m => (
                                          <div key={m.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-neon text-xs font-bold">
                                                      {m.nome.charAt(0)}
                                                  </div>
                                                  <div className="text-sm text-white">{m.nome}</div>
                                              </div>
                                              {/* In a real app, we might want to remove user from GT here */}
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};