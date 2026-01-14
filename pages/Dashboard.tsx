import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Logo } from '../components/ui/Logo';
import { 
  LayoutDashboard, FileText, Users, LogOut, Award, ShieldCheck, Shield, Layers, PlusCircle, 
  UserPlus, Trash2, CheckCircle, AlertCircle, Image as ImageIcon, Hash, Upload, 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Eye, Check, 
  XCircle, MessageSquare, Send, ThumbsUp, BarChart3, Search, Filter, Clock, Settings, 
  User as UserIcon, Calendar, MapPin, Ticket, QrCode, ScanLine, CalendarRange, 
  ArrowRight, Sun, Moon, Plus, Camera, Search as SearchIcon, Users2, CheckSquare,
  Info, Crown, Boxes, UserMinus, ArrowLeft, ChevronDown, UserCheck, ShieldAlert,
  UserCog, ClipboardCheck, BookOpen, Trash, PenTool, ImageOff, Link, Type, X, Loader2,
  TrendingUp, Star, Globe, Zap, MoreHorizontal, UserPlus2, UserPlus as UserPlusIcon
} from 'lucide-react';
import { User, GT, Artigo, MuralPost, Evento, Inscricao, Cargo } from '../types';
import { supabase } from '../services/supabase';

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
  onProfileClick: () => void;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'mural' | 'agenda' | 'my_events' | 'articles_manage' | 'users_manage' | 'gts_manage';

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

  // States abas membros
  const [memberSearch, setMemberSearch] = useState('');
  const [newPost, setNewPost] = useState('');
  const [availableEvents, setAvailableEvents] = useState<Evento[]>([]);
  const [myTickets, setMyTickets] = useState<Inscricao[]>([]);
  
  // Governança States
  const [pendingArticles, setPendingArticles] = useState<(Artigo & { author_name?: string })[]>([]);
  const [selectedArticlePreview, setSelectedArticlePreview] = useState<(Artigo & { author_name?: string }) | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState<number | null>(null);
  const [selectedGtForManagement, setSelectedGtForManagement] = useState<GT | null>(null);
  const [gtMemberSearch, setGtMemberSearch] = useState('');

  // Editor State
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [articleForm, setArticleForm] = useState({ titulo: '', subtitulo: '', conteudo: '', capa: '', gt_id: 0, tags: [] as string[] });
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  // Helper for text formatting in the rich text editor
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [gtsRes, cargosRes] = await Promise.all([
        supabase.from('gts').select('*').order('gt'),
        supabase.from('cargos').select('*')
      ]);
      if (gtsRes.data) setGts(gtsRes.data);
      if (cargosRes.data) setCargos(cargosRes.data);

      const { data: userData } = await supabase.from('users').select('*').order('artigos', { ascending: false });
      let currentMembers: User[] = [];
      if (userData) {
        currentMembers = userData;
        setMembers(userData);
        setRanking(userData.slice(0, 10));
      }

      const { data: articles } = await supabase.from('artigos').select('*').eq('autor', user.uuid).order('created_at', { ascending: false });
      if (articles) setMyArticles(articles);

      const { data: posts } = await supabase.from('mural_posts').select('*, users(nome, avatar)').order('created_at', { ascending: false }).limit(20);
      if (posts) setMuralPosts(posts as any);

      const { data: futureEvents } = await supabase.from('eventos').select('*').order('data_inicio', { ascending: true });
      if (futureEvents) setAvailableEvents(futureEvents);
      
      const { data: tickets } = await supabase.from('inscricoes').select('*, evento:eventos(*)').eq('user_id', user.id);
      if (tickets) setMyTickets(tickets);

      if (user.governanca) {
        const { data: pending } = await supabase.from('artigos').select('*').eq('aprovado', false).order('created_at', { ascending: false });
        if (pending) {
            setPendingArticles(pending.map((p: any) => ({
                ...p,
                author_name: currentMembers.find(m => m.uuid === p.autor)?.nome || 'Inovador'
            })));
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Funções Administrativas
  const handleToggleGovernanca = async (userId: number, currentStatus: boolean) => {
      setIsUpdatingUser(userId);
      try {
          const { error } = await supabase.from('users').update({ governanca: !currentStatus }).eq('id', userId);
          if (error) throw error;
          showNotification('success', 'Acesso atualizado com sucesso!');
          fetchData();
      } catch (e) { showNotification('error', 'Erro ao atualizar acesso.'); } finally { setIsUpdatingUser(null); }
  };

  const handleUpdateUserCargo = async (userId: number, cargoId: number) => {
      setIsUpdatingUser(userId);
      try {
          const { error } = await supabase.from('users').update({ cargo: cargoId }).eq('id', userId);
          if (error) throw error;
          showNotification('success', 'Cargo atualizado!');
          fetchData();
      } catch (e) { showNotification('error', 'Erro ao mudar cargo.'); } finally { setIsUpdatingUser(null); }
  };

  const handleToggleMemberInGt = async (targetUser: User, gtId: number, isAdding: boolean) => {
      setIsUpdatingUser(targetUser.id);
      try {
          let updatedGts = [...(targetUser.gts || [])];
          if (isAdding) {
              if (!updatedGts.includes(gtId)) updatedGts.push(gtId);
          } else {
              updatedGts = updatedGts.filter(id => id !== gtId);
          }

          const { error } = await supabase.from('users').update({ gts: updatedGts }).eq('id', targetUser.id);
          if (error) throw error;
          
          showNotification('success', isAdding ? 'Membro adicionado ao grupo!' : 'Membro removido do grupo!');
          await fetchData();
      } catch (e) {
          showNotification('error', 'Erro ao atualizar membros do GT.');
      } finally {
          setIsUpdatingUser(null);
      }
  };

  const handleApproveArticle = async (id: number) => {
    try {
      const { error } = await supabase.from('artigos').update({ aprovado: true }).eq('id', id);
      if (error) throw error;
      const article = pendingArticles.find(a => a.id === id);
      if (article) {
          const { data: author } = await supabase.from('users').select('artigos').eq('uuid', article.autor).single();
          if (author) await supabase.from('users').update({ artigos: (author.artigos || 0) + 1 }).eq('uuid', article.autor);
      }
      showNotification('success', 'Artigo aprovado e publicado!');
      setSelectedArticlePreview(null);
      fetchData();
    } catch (e) { showNotification('error', 'Erro ao aprovar.'); }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;
    try {
      const { error } = await supabase.from('mural_posts').insert([{ user_id: user.id, user_nome: user.nome, conteudo: newPost, gt_id: user.gts?.[0] || 1 }]);
      if (error) throw error;
      setNewPost('');
      showNotification('success', 'Postado no mural!');
      fetchData();
    } catch (e) { showNotification('error', 'Erro ao postar.'); }
  };

  const submitArticle = async () => {
    const content = editorRef.current?.innerHTML || '';
    if (!articleForm.titulo || !content || content === '<br>' || articleForm.gt_id === 0) {
      showNotification('error', 'Preencha todos os campos.');
      return;
    }
    setIsSubmittingArticle(true);
    try {
      const { error } = await supabase.from('artigos').insert([{ ...articleForm, conteudo: content, autor: user?.uuid, aprovado: false }]);
      if (error) throw error;
      showNotification('success', 'Artigo enviado para curadoria!');
      setIsCreatingArticle(false);
      setArticleForm({ titulo: '', subtitulo: '', conteudo: '', capa: '', gt_id: 0, tags: [] });
      fetchData();
    } catch (e) { showNotification('error', 'Erro ao salvar.'); } finally { setIsSubmittingArticle(false); }
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

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex font-sans overflow-hidden relative transition-colors duration-300">
      
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in-up px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border bg-brand-green/20 border-brand-green text-brand-neon font-bold flex items-center gap-2">
            <CheckCircle size={18} /> {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-slate-50 dark:bg-white/[0.03] backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-[2.5rem] h-[calc(100vh-2rem)] shadow-sm">
        <div className="h-24 flex items-center px-8 cursor-pointer" onClick={() => setActiveTab('overview')}><Logo /></div>
        <div className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as Tab); setSelectedGtForManagement(null); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <item.icon size={22} /> <span>{item.label}</span>
            </button>
          ))}
          {user?.governanca && (
             <>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-6 mx-4"></div>
                <div className="px-5 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Governança</div>
                <button onClick={() => { setActiveTab('articles_manage'); setSelectedGtForManagement(null); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'articles_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <ClipboardCheck size={22} /> <span>Aprovação Artigos</span>
                </button>
                <button onClick={() => { setActiveTab('users_manage'); setSelectedGtForManagement(null); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'users_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <UserCog size={22} /> <span>Gestão Acessos</span>
                </button>
                <button onClick={() => { setActiveTab('gts_manage'); setSelectedGtForManagement(null); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'gts_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <Boxes size={22} /> <span>Gestão de GTs</span>
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
            {activeTab === 'articles_manage' ? 'Fila de Curadoria' : activeTab === 'users_manage' ? 'Controle de Acessos' : activeTab === 'gts_manage' ? (selectedGtForManagement ? `Membros: ${selectedGtForManagement.gt}` : 'Grupos de Trabalho') : activeTab.replace('_', ' ')}
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
            
            {/* ABA: VISÃO GERAL */}
            {activeTab === 'overview' && (
                <div className="animate-fade-in-up space-y-12">
                    <div className="bg-gradient-to-br from-brand-green/20 to-brand-neon/5 dark:from-brand-green/30 dark:to-emerald-900/10 rounded-[3rem] p-12 border border-slate-200 dark:border-white/10 relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-5xl font-black mb-4">Olá, {user?.nome.split(' ')[0]}!</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl font-medium leading-relaxed">Continue conectando peças e construindo o futuro do Alto Paraopeba.</p>
                        </div>
                        <Zap size={200} className="absolute -right-20 -bottom-20 text-brand-neon/10 -rotate-12" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                            <FileText className="text-brand-neon mb-6" size={32} />
                            <div className="text-4xl font-black mb-2">{myArticles.length}</div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Seus Artigos</div>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                            <Award className="text-brand-green mb-6" size={32} />
                            <div className="text-4xl font-black mb-2">#{members.findIndex(m => m.uuid === user?.uuid) + 1}</div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sua Posição</div>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                            <Ticket className="text-cyan-400 mb-6" size={32} />
                            <div className="text-4xl font-black mb-2">{myTickets.length}</div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Tickets</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ABA: RANKING */}
            {activeTab === 'ranking' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden">
                        {ranking.map((member, i) => (
                            <div key={member.id} className="p-8 flex items-center justify-between border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${i < 3 ? 'bg-brand-neon text-black' : 'bg-white/5 text-slate-500'}`}>{i + 1}</div>
                                    <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-green/20">
                                        {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-4 text-black" />}
                                    </div>
                                    <div><div className="font-bold text-lg">{member.nome}</div><div className="text-xs text-slate-500">{cargos.find(c => c.id === member.cargo)?.cargo}</div></div>
                                </div>
                                <div className="text-right"><div className="text-2xl font-black text-brand-neon">{member.artigos}</div><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Artigos</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABA: MEMBROS */}
            {activeTab === 'members' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                        <input type="text" placeholder="Buscar inovadores..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl py-6 pl-16 pr-6 focus:border-brand-neon outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {members.filter(m => m.nome.toLowerCase().includes(memberSearch.toLowerCase())).map(member => (
                            <div key={member.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-green/10 mb-6">{member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={32} className="m-auto mt-5 text-slate-400" />}</div>
                                <h4 className="font-bold mb-2">{member.nome}</h4>
                                <span className="text-[10px] font-black uppercase text-brand-neon bg-brand-neon/10 px-3 py-1 rounded-full mb-6">{cargos.find(c => c.id === member.cargo)?.cargo}</span>
                                <button className="w-full bg-slate-50 dark:bg-white/5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-neon hover:text-black transition-all">Ver Perfil</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABA: MURAL */}
            {activeTab === 'mural' && (
                <div className="animate-fade-in-up space-y-8 max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                        <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="O que você está inovando hoje?" className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[100px]"></textarea>
                        <div className="flex justify-end pt-4 border-t border-white/5"><button onClick={handleCreatePost} className="bg-brand-neon text-black px-8 py-3 rounded-2xl font-black flex items-center gap-2">Publicar</button></div>
                    </div>
                    {muralPosts.map(post => (
                        <div key={post.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-green/20">{post.users?.avatar ? <img src={post.users.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-3" />}</div>
                                <div><div className="font-bold">{post.users?.nome || post.user_nome}</div><div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString('pt-BR')}</div></div>
                            </div>
                            <p className="text-lg leading-relaxed mb-6">{post.conteudo}</p>
                            <div className="flex gap-6 pt-6 border-t border-white/5"><button className="flex items-center gap-2 text-slate-500 hover:text-brand-neon"><ThumbsUp size={18} /> {post.likes || 0}</button></div>
                        </div>
                    ))}
                </div>
            )}

            {/* ABAS GOVERNANÇA */}
            {activeTab === 'articles_manage' && (
                <div className="animate-fade-in-up space-y-8">
                    {!selectedArticlePreview ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {pendingArticles.map(artigo => (
                                <div key={artigo.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col group">
                                    <div className="text-[10px] font-black text-brand-neon uppercase tracking-widest mb-2">{artigo.author_name}</div>
                                    <h4 className="font-bold text-lg mb-6 flex-1 line-clamp-2">{artigo.titulo}</h4>
                                    <button onClick={() => setSelectedArticlePreview(artigo)} className="w-full bg-brand-neon text-black py-3 rounded-xl font-black flex items-center justify-center gap-2"><Eye size={18} /> Revisar</button>
                                </div>
                            ))}
                            {pendingArticles.length === 0 && <div className="col-span-full py-32 text-center text-slate-500 font-bold border border-dashed border-white/10 rounded-3xl">Fila de curadoria vazia.</div>}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-12">
                            <button onClick={() => setSelectedArticlePreview(null)} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white font-bold"><ArrowLeft size={18} /> Voltar</button>
                            <h1 className="text-4xl font-black mb-12">{selectedArticlePreview.titulo}</h1>
                            <div className="prose dark:prose-invert max-w-none pt-12 border-t border-white/10" dangerouslySetInnerHTML={{ __html: selectedArticlePreview.conteudo }}></div>
                            <div className="mt-12 flex gap-4 pt-12 border-t border-white/10">
                                <button onClick={() => handleApproveArticle(selectedArticlePreview.id)} className="bg-brand-neon text-black px-12 py-4 rounded-2xl font-black shadow-xl shadow-brand-neon/20">Aprovar e Publicar</button>
                                <button className="bg-red-500 text-white px-10 py-4 rounded-2xl font-bold">Rejeitar Artigo</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users_manage' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-500">Inovador</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-500">Governança</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-500">Cargo</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-500">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {members.map(member => (
                                    <tr key={member.id} className="hover:bg-white/[0.01]">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">{member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-2" />}</div>
                                                <div><div className="font-bold text-sm">{member.nome}</div><div className="text-[10px] text-slate-500">{member.email}</div></div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <button 
                                                onClick={() => handleToggleGovernanca(member.id, !!member.governanca)}
                                                disabled={isUpdatingUser === member.id}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${member.governanca ? 'bg-brand-neon/20 border-brand-neon text-brand-neon' : 'bg-white/5 border-white/10 text-slate-500'}`}
                                            >
                                                {isUpdatingUser === member.id ? <Loader2 size={12} className="animate-spin" /> : member.governanca ? 'Sim' : 'Não'}
                                            </button>
                                        </td>
                                        <td className="p-6">
                                            <select 
                                                value={member.cargo || 3}
                                                onChange={(e) => handleUpdateUserCargo(member.id, Number(e.target.value))}
                                                disabled={isUpdatingUser === member.id}
                                                className="bg-transparent text-sm font-bold text-slate-400 focus:text-brand-neon outline-none"
                                            >
                                                {cargos.map(c => <option key={c.id} value={c.id} className="bg-black text-white">{c.cargo}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-6"><button className="p-2 text-slate-500 hover:text-white"><MoreHorizontal size={18} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'gts_manage' && (
                <div className="animate-fade-in-up space-y-8">
                    {!selectedGtForManagement ? (
                        <>
                            <div className="flex justify-between items-center mb-8">
                                <div><h3 className="text-xl font-bold">Grupos de Trabalho Ativos</h3><p className="text-sm text-slate-500">Gerencie a estrutura e contagem de cada GT.</p></div>
                                <button className="bg-brand-neon text-black px-8 py-3 rounded-xl font-black flex items-center gap-2"><Plus size={18} /> Novo GT</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {gts.map(gt => (
                                    <div 
                                        key={gt.id} 
                                        onClick={() => setSelectedGtForManagement(gt)}
                                        className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:border-brand-neon/50 transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-brand-neon/10 rounded-3xl flex items-center justify-center text-brand-neon group-hover:bg-brand-neon group-hover:text-black transition-all"><Boxes size={28} /></div>
                                            <div><h4 className="text-xl font-black mb-1">{gt.gt}</h4><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{members.filter(m => m.gts?.includes(gt.id)).length} Membros Vinculados</p></div>
                                        </div>
                                        <button className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-brand-neon transition-colors"><Settings size={20} /></button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-12">
                            <button onClick={() => { setSelectedGtForManagement(null); setGtMemberSearch(''); }} className="flex items-center gap-2 text-slate-500 hover:text-brand-neon font-bold transition-all"><ArrowLeft size={18} /> Voltar para lista de GTs</button>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* MEMBROS ATUAIS NO GT */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <h3 className="text-xl font-black flex items-center gap-2"><CheckCircle className="text-brand-neon" /> Membros Atuais</h3>
                                        <span className="bg-brand-neon text-black text-[10px] font-black px-2 py-1 rounded-full">{members.filter(m => m.gts?.includes(selectedGtForManagement.id)).length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {members.filter(m => m.gts?.includes(selectedGtForManagement.id)).map(member => (
                                            <div key={member.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-green/10">
                                                        {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-2" />}
                                                    </div>
                                                    <div><div className="font-bold text-sm">{member.nome}</div><div className="text-[10px] text-slate-500">{cargos.find(c => c.id === member.cargo)?.cargo}</div></div>
                                                </div>
                                                <button 
                                                    onClick={() => handleToggleMemberInGt(member, selectedGtForManagement.id, false)}
                                                    disabled={isUpdatingUser === member.id}
                                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                >
                                                    {isUpdatingUser === member.id ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={18} />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ADICIONAR NOVOS MEMBROS */}
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-4 border-b border-white/10 pb-4">
                                        <h3 className="text-xl font-black flex items-center gap-2"><PlusCircle className="text-brand-green" /> Adicionar Inovadores</h3>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Buscar inovador para adicionar..." 
                                                value={gtMemberSearch}
                                                onChange={(e) => setGtMemberSearch(e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-brand-neon outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {members
                                            .filter(m => !m.gts?.includes(selectedGtForManagement.id))
                                            .filter(m => m.nome.toLowerCase().includes(gtMemberSearch.toLowerCase()))
                                            .map(member => (
                                                <div key={member.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:border-brand-neon/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10">
                                                            {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-2 text-slate-400" />}
                                                        </div>
                                                        <div><div className="font-bold text-sm">{member.nome}</div><div className="text-[10px] text-slate-500">{cargos.find(c => c.id === member.cargo)?.cargo}</div></div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleToggleMemberInGt(member, selectedGtForManagement.id, true)}
                                                        disabled={isUpdatingUser === member.id}
                                                        className="p-2 text-slate-500 hover:text-brand-neon hover:bg-brand-neon/10 rounded-xl transition-all"
                                                    >
                                                        {isUpdatingUser === member.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlusIcon size={18} />}
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ABA: AGENDA & TICKETS (Sempre acessíveis) */}
            {activeTab === 'agenda' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
                    {availableEvents.map(event => (
                        <div key={event.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden group">
                            <div className="h-44 bg-slate-900 relative">
                                {event.imagem_capa ? <img src={event.imagem_capa} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" /> : <div className="w-full h-full flex items-center justify-center bg-brand-green/10 text-brand-neon"><CalendarRange size={40} /></div>}
                                <div className="absolute top-4 left-4 bg-brand-neon text-black text-[10px] font-black px-3 py-1 rounded-full uppercase">{event.tipo}</div>
                            </div>
                            <div className="p-8"><h4 className="font-black text-lg mb-4">{event.titulo}</h4><div className="flex items-center gap-3 text-slate-500 text-sm mb-8"><Calendar size={14} /> {new Date(event.data_inicio).toLocaleDateString('pt-BR')}</div><button className="w-full bg-brand-neon text-black py-4 rounded-2xl font-black hover:scale-105 transition-all">Garantir Ingresso</button></div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'my_events' && (
                <div className="animate-fade-in-up space-y-8">
                    {myTickets.length === 0 ? <div className="py-32 text-center opacity-50 font-bold">Você não possui tickets ainda.</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {myTickets.map(ticket => (
                                <div key={ticket.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex gap-8 relative overflow-hidden group">
                                    <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center"><QrCode size={80} className="text-black" /></div>
                                    <div><div className="text-[10px] font-black text-brand-neon uppercase tracking-widest mb-2">Confirmado</div><h4 className="text-2xl font-black mb-4">{ticket.evento?.titulo}</h4><div className="flex items-center gap-2 text-slate-500 text-sm"><Calendar size={14} /> {new Date(ticket.evento?.data_inicio || '').toLocaleDateString('pt-BR')}</div></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'articles' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="flex justify-between items-center"><h3 className="text-2xl font-black flex items-center gap-3"><PenTool className="text-brand-neon" /> Suas Publicações</h3><button onClick={() => setIsCreatingArticle(true)} className="bg-brand-neon text-black px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-brand-neon/20 flex items-center gap-2"><Plus size={20} /> Novo Artigo</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {myArticles.map(artigo => (
                            <div key={artigo.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden group">
                                <div className="h-44 bg-slate-900 relative">{artigo.capa ? <img src={artigo.capa} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" /> : <div className="w-full h-full flex items-center justify-center bg-brand-green/10"><ImageIcon className="text-brand-green/30" /></div>}<div className="absolute top-4 right-4">{artigo.aprovado ? <span className="bg-brand-neon text-black text-[10px] font-black px-3 py-1 rounded-full">PUBLICADO</span> : <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full">EM REVISÃO</span>}</div></div>
                                <div className="p-6"><h4 className="font-bold text-lg mb-4 line-clamp-2">{artigo.titulo}</h4><button className="w-full bg-slate-50 dark:bg-white/5 py-3 rounded-xl text-xs font-bold hover:bg-brand-neon hover:text-black transition-all">Editar Artigo</button></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>

      {/* MODAL EDITOR DE ARTIGO COMPLETO (RESTAURADO) */}
      {isCreatingArticle && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsCreatingArticle(false)}></div>
              <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-6xl h-full md:h-[95vh] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-fade-in-up">
                  <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-4"><div className="p-3 bg-brand-neon/10 rounded-2xl text-brand-neon"><PenTool size={24} /></div><div><h3 className="text-xl font-black">Editor de Conhecimento</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">INOVAP Lab</p></div></div>
                      <button onClick={() => setIsCreatingArticle(false)} className="text-slate-500 hover:text-white transition-colors p-2"><X size={28} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
                      <div className="w-full md:w-80 border-r border-white/10 p-8 space-y-8 overflow-y-auto">
                          <div><label className="text-[10px] font-black text-brand-neon uppercase mb-4 block">Categoria</label><select value={articleForm.gt_id} onChange={(e) => setArticleForm(prev => ({ ...prev, gt_id: Number(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-neon outline-none">{<option value={0}>GT...</option>}{gts.map(gt => <option key={gt.id} value={gt.id} className="bg-black">{gt.gt}</option>)}</select></div>
                      </div>
                      <div className="flex-1 flex flex-col">
                          <div className="px-8 py-4 bg-white/[0.02] border-b border-white/10 flex gap-2"><button onClick={() => execCommand('bold')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-brand-neon"><Bold size={18} /></button><button onClick={() => execCommand('formatBlock', 'h2')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-brand-neon"><Heading1 size={18} /></button></div>
                          <div className="flex-1 p-8 md:p-14 overflow-y-auto bg-black/20"><input type="text" value={articleForm.titulo} onChange={(e) => setArticleForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Título do Artigo" className="w-full bg-transparent border-none focus:ring-0 text-4xl font-black mb-4"/><input type="text" value={articleForm.subtitulo} onChange={(e) => setArticleForm(prev => ({ ...prev, subtitulo: e.target.value }))} placeholder="Subtítulo..." className="w-full bg-transparent border-none focus:ring-0 text-xl font-light mb-12 text-slate-500"/><div ref={editorRef} contentEditable suppressContentEditableWarning={true} className="prose prose-invert max-w-none focus:outline-none min-h-[400px] text-lg leading-relaxed text-slate-300"></div></div>
                      </div>
                  </div>
                  <div className="px-8 py-6 border-t border-white/10 flex justify-end gap-4 flex-shrink-0">
                      <button onClick={() => setIsCreatingArticle(false)} className="px-8 py-3 font-bold text-slate-500">Descartar</button>
                      <button onClick={submitArticle} disabled={isSubmittingArticle} className="bg-brand-neon text-black px-12 py-3 rounded-xl font-black hover:scale-105 transition-all flex items-center gap-2">{isSubmittingArticle ? <Loader2 className="animate-spin" /> : <Send size={20} />} Enviar para Curadoria</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};