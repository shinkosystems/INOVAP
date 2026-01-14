import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Logo } from '../components/ui/Logo';
import { 
  LayoutDashboard, FileText, Users, LogOut, TrendingUp, Award, Star, Medal, Briefcase, 
  ChevronRight, X, Save, Edit3, Loader2, ShieldCheck, Shield, Layers, PlusCircle, 
  UserPlus, Trash2, CheckCircle, AlertCircle, Image as ImageIcon, Hash, Upload, 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Type, Eye, Check, 
  XCircle, MessageSquare, Send, ThumbsUp, BarChart3, Search, Filter, Clock, Settings, 
  User as UserIcon, Calendar, MapPin, Ticket, QrCode, ScanLine, CalendarRange, 
  ArrowRight, Sun, Moon, Plus, Camera, Search as SearchIcon, Users2, CheckSquare,
  Info, Crown, Boxes
} from 'lucide-react';
import { User, GT, Artigo, MuralPost, Evento, Inscricao, Cargo } from '../types';
import { supabase } from '../services/supabase';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from "html5-qrcode";

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
  onProfileClick: () => void;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'mural' | 'management' | 'my_events' | 'events_manage' | 'checkin' | 'agenda' | 'gts_manage';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [gts, setGts] = useState<GT[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [myArticles, setMyArticles] = useState<Artigo[]>([]);
  const [muralPosts, setMuralPosts] = useState<(MuralPost & { users: { nome: string, avatar?: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // GT Management State
  const [editingGt, setEditingGt] = useState<GT | null>(null);
  const [newGtName, setNewGtName] = useState('');
  const [isSavingGt, setIsSavingGt] = useState(false);

  // Events state
  const [myTickets, setMyTickets] = useState<Inscricao[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Evento[]>([]);
  const [managedEvents, setManagedEvents] = useState<Evento[]>([]);

  // Article Form State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [articleForm, setArticleForm] = useState<Partial<Artigo>>({ titulo: '', subtitulo: '', conteudo: '', capa: '', tags: [] });
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  // Mural State
  const [newPost, setNewPost] = useState('');

  const isRestrictedUser = !user?.governanca && (!user?.gts || user.gts.length === 0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Basic data
      const [gtsRes, cargosRes] = await Promise.all([
        supabase.from('gts').select('*').order('gt'),
        supabase.from('cargos').select('*')
      ]);
      if (gtsRes.data) setGts(gtsRes.data);
      if (cargosRes.data) setCargos(cargosRes.data);

      // Members and Ranking
      const { data: userData } = await supabase.from('users').select('*').order('artigos', { ascending: false });
      if (userData) {
        setMembers(userData);
        setRanking(userData.slice(0, 10));
      }

      // My Articles
      const { data: articles } = await supabase.from('artigos').select('*').eq('autor', user.uuid);
      if (articles) setMyArticles(articles);

      // Mural
      const { data: posts } = await supabase.from('mural_posts').select('*, users(nome, avatar)').order('created_at', { ascending: false }).limit(20);
      if (posts) setMuralPosts(posts as any);

      // Events
      const { data: futureEvents } = await supabase.from('eventos').select('*').order('data_inicio', { ascending: true });
      if (futureEvents) setAvailableEvents(futureEvents);
      
      const { data: tickets } = await supabase.from('inscricoes').select('*, evento:eventos(*)').eq('user_id', user.id);
      if (tickets) setMyTickets(tickets);

      if (user.governanca) {
        const { data: events } = await supabase.from('eventos').select('*').order('data_inicio', { ascending: false });
        if (events) setManagedEvents(events);
      }
    } catch (e) {
      console.error("Error fetching dashboard data", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;
    try {
      const { error } = await supabase.from('mural_posts').insert([{
        user_id: user.id,
        user_nome: user.nome,
        conteudo: newPost,
        gt_id: user.gts?.[0] || 1
      }]);
      if (error) throw error;
      setNewPost('');
      showNotification('success', 'Postado no mural!');
      fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao postar.');
    }
  };

  const handleSaveGt = async () => {
    if (!newGtName.trim()) return;
    setIsSavingGt(true);
    try {
      if (editingGt) {
        const { error } = await supabase.from('gts').update({ gt: newGtName }).eq('id', editingGt.id);
        if (error) throw error;
        showNotification('success', 'GT atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('gts').insert([{ gt: newGtName }]);
        if (error) throw error;
        showNotification('success', 'Novo GT criado!');
      }
      setEditingGt(null);
      setNewGtName('');
      fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao salvar GT.');
    } finally {
      setIsSavingGt(false);
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
    { id: 'ranking', icon: Award, label: 'Ranking' },
    { id: 'members', icon: Users, label: 'Usuários' },
    { id: 'mural', icon: MessageSquare, label: 'Mural' },
    { id: 'articles', icon: FileText, label: 'Meus Artigos' },
    { id: 'agenda', icon: CalendarRange, label: 'Agenda' },
    { id: 'my_events', icon: Ticket, label: 'Meus Tickets' },
  ];

  const getGtName = (id: number) => gts.find(g => g.id === id)?.gt || 'GT';

  // Categories for the Users tab
  const governanceUsers = members.filter(m => m.governanca);
  const gtMembers = members.filter(m => !m.governanca && m.gts && m.gts.length > 0);
  const visitors = members.filter(m => !m.governanca && (!m.gts || m.gts.length === 0));

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex font-sans overflow-hidden relative transition-colors duration-300">
      
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] animate-fade-in-up">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${notification.type === 'success' ? 'bg-brand-green/20 border-brand-green text-brand-neon' : 'bg-red-500/20 border-red-500 text-red-200'}`}>
                <p className="text-sm font-bold flex items-center gap-2">
                    {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </p>
            </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-slate-50 dark:bg-white/[0.03] backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-[2.5rem] h-[calc(100vh-2rem)] shadow-sm">
        <div className="h-24 flex items-center px-8 cursor-pointer" onClick={() => setActiveTab('overview')}><Logo /></div>
        <div className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </button>
          ))}
          {user?.governanca && (
             <>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-6 mx-4"></div>
                <div className="px-5 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Governança</div>
                <button onClick={() => setActiveTab('gts_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'gts_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <Boxes size={22} /> <span>Gestão de GTs</span>
                </button>
                <button onClick={() => setActiveTab('events_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'events_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <Calendar size={22} /> <span>Gestão de Eventos</span>
                </button>
                <button onClick={() => setActiveTab('checkin')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'checkin' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <ScanLine size={22} /> <span>Realizar Check-in</span>
                </button>
             </>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-white/5">
            <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors font-bold">
                <LogOut size={22} /> Sair
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 flex items-center justify-between px-10 flex-shrink-0 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white capitalize">
            {activeTab === 'members' ? 'Usuários' : 
             activeTab === 'events_manage' ? 'Gestão de Eventos' : 
             activeTab === 'gts_manage' ? 'Gestão de GTs' :
             activeTab.replace('_', ' ')}
          </h2>
          <div className="flex items-center gap-4">
               <button onClick={onProfileClick} className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-neon/50 transition-all">
                    <div className="w-10 h-10 rounded-full bg-brand-green overflow-hidden flex items-center justify-center">
                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-black" size={20}/>}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{user?.nome.split(' ')[0]}</span>
               </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
            {activeTab === 'overview' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="bg-gradient-to-br from-brand-green/10 via-transparent to-brand-neon/5 dark:from-brand-green/20 dark:to-emerald-900/10 rounded-[3rem] p-12 border border-slate-200 dark:border-white/10 relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-5xl font-black mb-6">Olá, {user?.nome.split(' ')[0]}!</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl font-medium leading-relaxed">Você já contribuiu com {user?.artigos} artigos para o ecossistema. Continue inovando!</p>
                        </div>
                        <div className="absolute right-[-10%] top-[-20%] w-96 h-96 bg-brand-neon/10 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/5">
                            <h3 className="text-slate-500 text-xs font-black uppercase mb-4 tracking-widest">Meus Pontos</h3>
                            <div className="text-4xl font-black text-brand-neon">{(user?.artigos || 0) * 100}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/5">
                            <h3 className="text-slate-500 text-xs font-black uppercase mb-4 tracking-widest">Sua Posição</h3>
                            <div className="text-4xl font-black text-white">#4</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/5">
                            <h3 className="text-slate-500 text-xs font-black uppercase mb-4 tracking-widest">Nível</h3>
                            <div className="text-4xl font-black text-brand-green">Expert</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'gts_manage' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                             <Edit3 className="text-brand-neon" size={24} />
                             {editingGt ? `Editando GT: ${editingGt.gt}` : 'Criar Novo GT'}
                        </h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input 
                                type="text" 
                                value={newGtName}
                                onChange={(e) => setNewGtName(e.target.value)}
                                placeholder="Nome do Grupo de Trabalho..." 
                                className="flex-1 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 rounded-2xl py-4 px-6 text-slate-900 dark:text-white focus:outline-none focus:border-brand-neon transition-all"
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleSaveGt}
                                    disabled={isSavingGt || !newGtName.trim()}
                                    className="bg-brand-neon text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingGt ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    {editingGt ? 'Atualizar' : 'Criar GT'}
                                </button>
                                {editingGt && (
                                    <button 
                                        onClick={() => { setEditingGt(null); setNewGtName(''); }}
                                        className="bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gts.map(gt => (
                            <div key={gt.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:border-brand-neon/30 transition-all">
                                <div>
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">GT #{gt.id}</div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{gt.gt}</h4>
                                </div>
                                <button 
                                    onClick={() => { setEditingGt(gt); setNewGtName(gt.gt); }}
                                    className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-brand-neon transition-colors"
                                >
                                    <Edit3 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'ranking' && (
                <div className="animate-fade-in-up bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-8">
                    <h3 className="text-2xl font-bold mb-8">Hall da Fama - Top Inovadores</h3>
                    <div className="space-y-4">
                        {ranking.map((member, i) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${i < 3 ? 'bg-brand-neon text-black' : 'text-slate-500'}`}>{i + 1}</div>
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                        {member.avatar && <img src={member.avatar} className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="font-bold">{member.nome}</span>
                                </div>
                                <div className="text-sm font-black text-brand-green">{member.artigos * 100} pts</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="animate-fade-in-up space-y-12">
                    
                    {/* Membros Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <Shield className="text-brand-neon" size={28} />
                            <h3 className="text-2xl font-black">Membros</h3>
                        </div>
                        
                        {/* Governança Subsection */}
                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-2 px-4 text-xs font-black text-brand-green uppercase tracking-[0.2em] mb-4">
                                <Crown size={14} /> Governança
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {governanceUsers.map(member => (
                                    <div key={member.id} className="bg-brand-green/5 dark:bg-brand-neon/5 border border-brand-neon/20 p-5 rounded-3xl flex items-center gap-4 hover:border-brand-neon/50 transition-all group">
                                        <div className="w-14 h-14 rounded-full bg-brand-neon border-4 border-black/20 overflow-hidden flex-shrink-0">
                                            {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-3 text-black" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-neon transition-colors">{member.nome}</h4>
                                            <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">Conselheiro</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Membros de GT Subsection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
                                <Users2 size={14} /> Membros dos GTs
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {gtMembers.map(member => (
                                    <div key={member.id} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-5 rounded-3xl flex items-center gap-4 hover:border-brand-neon/30 transition-all group">
                                        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
                                            {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-3 text-slate-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{member.nome}</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {member.gts?.slice(0, 2).map(id => (
                                                    <span key={id} className="text-[8px] px-1.5 py-0.5 bg-brand-green/10 text-brand-green rounded font-black uppercase">{getGtName(id)}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Visitantes Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-8 pt-8 border-t border-slate-100 dark:border-white/5">
                            <Users size={28} className="text-slate-400" />
                            <h3 className="text-2xl font-black">Visitantes</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {visitors.map(member => (
                                <div key={member.id} className="bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex-shrink-0">
                                        {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-2 text-slate-600" size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{member.nome}</h4>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Interessado</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mural' && (
                <div className="animate-fade-in-up max-w-3xl mx-auto space-y-8">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                        <textarea 
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="O que está acontecendo no seu GT?" 
                            className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none mb-4 min-h-[100px]"
                        />
                        <div className="flex justify-end">
                            <button 
                                onClick={handleCreatePost}
                                className="bg-brand-neon text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Send size={18} /> Publicar
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {muralPosts.map((post) => (
                            <div key={post.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                        {post.users?.avatar && <img src={post.users.avatar} className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{post.users?.nome || post.user_nome}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{new Date(post.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{post.conteudo}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'agenda' && (
                <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {availableEvents.map(evt => {
                        const isRegistered = myTickets.some(t => t.evento_id === evt.id);
                        return (
                            <div key={evt.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col hover:border-brand-neon/30 transition-all group">
                                <div className="h-48 bg-slate-900 relative">
                                    {evt.imagem_capa && <img src={evt.imagem_capa} className="w-full h-full object-cover opacity-80" />}
                                    <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-brand-neon uppercase">{evt.tipo}</span>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold mb-3">{evt.titulo}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">{evt.descricao}</p>
                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                                        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {evt.local}</div>
                                        <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isRegistered ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-neon text-black'}`}>
                                            {isRegistered ? 'Inscrito' : 'Participar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {activeTab === 'my_events' && (
                <div className="animate-fade-in-up space-y-6">
                    {myTickets.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                            <Ticket size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
                            <p className="text-slate-500">Você ainda não garantiu ingressos para nenhum evento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myTickets.map(ticket => (
                                <div key={ticket.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2 block">Ingresso Confirmado</span>
                                        <h3 className="text-xl font-bold mb-2">{ticket.evento?.titulo}</h3>
                                        <div className="text-sm text-slate-500 flex items-center gap-2 mb-4">
                                            <Calendar size={14}/> {new Date(ticket.evento?.data_inicio || '').toLocaleDateString()}
                                        </div>
                                        <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl inline-block border border-slate-200 dark:border-white/10">
                                            <QRCode value={ticket.id} size={100} bgColor="transparent" fgColor="#00ff9d" />
                                        </div>
                                    </div>
                                    <div className="absolute right-[-20px] bottom-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                                        <QrCode size={150} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'articles' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold">Gerenciar Meus Artigos</h3>
                        <button className="px-6 py-2 bg-brand-neon text-black rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2">
                            <Plus size={18} /> Novo Artigo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myArticles.map(art => (
                            <div key={art.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 rounded-3xl flex justify-between items-center group">
                                <div>
                                    <h4 className="font-bold text-lg mb-1">{art.titulo}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black uppercase ${art.aprovado ? 'text-brand-green' : 'text-amber-500'}`}>
                                            {art.aprovado ? 'Aprovado' : 'Em Análise'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase">{new Date(art.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-brand-neon transition-colors">
                                    <Edit3 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};