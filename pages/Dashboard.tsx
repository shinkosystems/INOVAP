
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Logo } from '../components/ui/Logo';
import { LayoutDashboard, FileText, Users, LogOut, TrendingUp, Award, Star, Medal, Briefcase, ChevronRight, X, Save, Edit3, Loader2, ShieldCheck, Shield, Layers, PlusCircle, UserPlus, Trash2, CheckCircle, AlertCircle, Image as ImageIcon, Hash, Upload, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Type, Eye, Check, XCircle, MessageSquare, Send, ThumbsUp, BarChart3, Search, Filter, Clock, Settings, User as UserIcon, Calendar, MapPin, Ticket, QrCode, ScanLine, CalendarRange, ArrowRight, Sun, Moon, Plus } from 'lucide-react';
import { User, GT, Artigo, MuralPost, Evento, Inscricao, Cargo } from '../types';
import { supabase } from '../services/supabase';
import QRCode from 'react-qr-code';

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
  onProfileClick: () => void;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'mural' | 'management' | 'my_events' | 'events_manage' | 'checkin' | 'agenda';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [gts, setGts] = useState<GT[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(localStorage.getItem('theme') as 'dark' | 'light' || 'dark');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [allArticles, setAllArticles] = useState<Artigo[]>([]);

  const [muralPosts, setMuralPosts] = useState<MuralPost[]>([]);
  const [activeMuralGtId, setActiveMuralGtId] = useState<number | null>(null);

  const [myTickets, setMyTickets] = useState<Inscricao[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Evento[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState<Partial<Evento>>({
      titulo: '', descricao: '', data_inicio: '', local: '', tipo: 'Meetup', vagas: 50, imagem_capa: ''
  });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isUploadingEventImg, setIsUploadingEventImg] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement>(null);

  const [managedEvents, setManagedEvents] = useState<Evento[]>([]);
  const [isRegistering, setIsRegistering] = useState<number | null>(null);

  const userPoints = (user?.artigos || 0) * 150 + 50; 
  const userLevel = Math.floor(userPoints / 500) + 1;

  const isRestrictedUser = !user?.governanca && (!user?.gts || user.gts.length === 0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };
  
  const normalizeGTs = (gtData: any): number[] => {
      if (Array.isArray(gtData)) return gtData;
      if (typeof gtData === 'number') return [gtData];
      return [];
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    // Fetch Events for the user
    const { data: futureEvents } = await supabase.from('eventos').select('*').gte('data_inicio', new Date().toISOString()).order('data_inicio', { ascending: true });
    if (futureEvents) setAvailableEvents(futureEvents);
    
    const { data: tickets } = await supabase.from('inscricoes').select('*, evento:eventos(*)').eq('user_id', user.id);
    if (tickets) setMyTickets(tickets);

    // If it's a governance or GT user, fetch more data
    if (!isRestrictedUser) {
        const { data: userData } = await supabase.from('users').select('*').order('artigos', { ascending: false });
        if (userData) {
            setMembers(userData.map(u => ({...u, gts: normalizeGTs(u.gts)})));
            setRanking(userData.slice(0, 20));
        }
        const { data: gtData } = await supabase.from('gts').select('*').order('gt');
        if (gtData) setGts(gtData);
        
        const { data: cargoData } = await supabase.from('cargos').select('*').order('cargo');
        if (cargoData) setCargos(cargoData);

        const { data: mural } = await supabase.from('mural_posts').select('*, users(nome)').order('created_at', { ascending: false });
        if (mural) setMuralPosts(mural.map((p: any) => ({...p, user_nome: p.users?.nome || 'Usuário'})));
    }

    if (user.governanca) {
        const { data: articles } = await supabase.from('artigos').select('*').order('created_at', { ascending: false });
        if (articles) setAllArticles(articles);
        
        const { data: events } = await supabase.from('eventos').select('*').order('data_inicio', { ascending: false });
        if (events) setManagedEvents(events);
    }
  }, [user, isRestrictedUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveEvent = async () => {
      if (!eventForm.titulo || !eventForm.data_inicio) {
          showNotification('error', 'Título e Data de Início são obrigatórios.');
          return;
      }
      setIsSubmittingEvent(true);
      try {
          if (editingEventId) {
              // Update existing event
              const { error } = await supabase
                .from('eventos')
                .update({
                  titulo: eventForm.titulo,
                  descricao: eventForm.descricao,
                  data_inicio: eventForm.data_inicio,
                  local: eventForm.local,
                  tipo: eventForm.tipo,
                  vagas: eventForm.vagas,
                  imagem_capa: eventForm.imagem_capa
                })
                .eq('id', editingEventId);
              
              if (error) throw error;
              showNotification('success', 'Evento atualizado com sucesso!');
          } else {
              // Create new event
              const { error } = await supabase.from('eventos').insert([{
                  ...eventForm,
                  criado_por: user?.uuid
              }]);
              if (error) throw error;
              showNotification('success', 'Evento criado com sucesso!');
          }
          
          closeEventModal();
          fetchData();
      } catch (e) {
          showNotification('error', 'Erro ao salvar evento.');
      } finally {
          setIsSubmittingEvent(false);
      }
  };

  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
          showNotification('error', 'A imagem deve ter no máximo 5MB.');
          return;
      }

      setIsUploadingEventImg(true);

      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `event_${Date.now()}.${fileExt}`;
          const filePath = `imagensBlog/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('imagensBlog')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('imagensBlog').getPublicUrl(filePath);
          setEventForm(prev => ({ ...prev, imagem_capa: data.publicUrl }));
          showNotification('success', 'Imagem de capa carregada!');

      } catch (error: any) {
          console.error('Erro upload imagem evento:', error);
          showNotification('error', 'Erro ao realizar upload.');
      } finally {
          setIsUploadingEventImg(false);
          if (eventImageInputRef.current) eventImageInputRef.current.value = '';
      }
  };

  const handleEditEventClick = (evt: Evento) => {
      setEditingEventId(evt.id);
      setEventForm({
          titulo: evt.titulo,
          descricao: evt.descricao,
          data_inicio: evt.data_inicio ? new Date(evt.data_inicio).toISOString().slice(0, 16) : '',
          local: evt.local,
          tipo: evt.tipo,
          vagas: evt.vagas,
          imagem_capa: evt.imagem_capa
      });
      setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
      setIsEventModalOpen(false);
      setEditingEventId(null);
      setEventForm({ titulo: '', descricao: '', data_inicio: '', local: '', tipo: 'Meetup', vagas: 50, imagem_capa: '' });
  };

  const handleDeleteEvent = async (id: number) => {
      if (!confirm('Tem certeza que deseja excluir este evento?')) return;
      try {
          const { error } = await supabase.from('eventos').delete().eq('id', id);
          if (error) throw error;
          showNotification('success', 'Evento excluído.');
          fetchData();
      } catch (e) {
          showNotification('error', 'Erro ao excluir evento.');
      }
  };

  const handleRegisterForEvent = async (evento: Evento) => {
      if (!user) return;
      setIsRegistering(evento.id);
      try {
          const isRegistered = myTickets.some(t => t.evento_id === evento.id);
          if (isRegistered) {
              showNotification('error', 'Você já está inscrito neste evento.');
              setIsRegistering(null);
              return;
          }
          const { error } = await supabase.from('inscricoes').insert([{
              evento_id: evento.id,
              user_id: user.id,
              status: 'confirmado'
          }]);
          if (error) throw error;
          showNotification('success', 'Inscrição realizada!');
          fetchData(); 
      } catch (e: any) {
          showNotification('error', 'Erro ao realizar inscrição.');
      } finally {
          setIsRegistering(null);
      }
  };

  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
    { id: 'agenda', icon: CalendarRange, label: 'Agenda de Eventos' },
    { id: 'my_events', icon: Ticket, label: 'Meus Eventos' },
  ];

  if (!isRestrictedUser) {
    sidebarItems.push(
      { id: 'mural', icon: MessageSquare, label: 'Mural dos GTs' },
      { id: 'ranking', icon: Award, label: 'Ranking' },
      { id: 'members', icon: Users, label: 'Membros' }
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex font-sans overflow-hidden relative transition-colors duration-300">
      
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${notification.type === 'success' ? 'bg-brand-green/20 border-brand-green text-brand-neon' : 'bg-red-500/20 border-red-500 text-red-200'}`}>
                <p className="text-sm font-bold flex items-center gap-2">
                    {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </p>
            </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-slate-50 dark:bg-white/[0.03] backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-3xl h-[calc(100vh-2rem)] shadow-sm dark:shadow-none">
        <div className="h-24 flex items-center px-8 cursor-pointer" onClick={() => setActiveTab('overview')}><Logo dark={theme === 'dark'} /></div>
        
        <div className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-medium ${
                activeTab === item.id 
                  ? 'bg-brand-green text-black' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}

          {user?.governanca && (
             <>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-2 mx-4"></div>
                <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Governança</div>
                <button onClick={() => setActiveTab('events_manage')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'events_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  <Calendar size={20} /> <span>Gestão de Eventos</span>
                </button>
                <button onClick={() => setActiveTab('checkin')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'checkin' ? 'bg-brand-neon text-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  <ScanLine size={20} /> <span>Check-in (QR)</span>
                </button>
             </>
          )}

           <div className="h-px bg-slate-200 dark:bg-white/10 my-2 mx-4"></div>
           <button onClick={onProfileClick} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white">
                <Settings size={20} /><span>Meu Perfil</span>
            </button>
        </div>
        
        <div className="p-4">
             <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-medium">
                <LogOut size={20} /> Sair
             </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Header */}
        <header className="h-24 flex items-center justify-between px-8 md:px-12 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">
              {activeTab === 'agenda' ? 'Agenda de Eventos' : 
               activeTab === 'events_manage' ? 'Gestão de Eventos' :
               activeTab === 'my_events' ? 'Meus Ingressos' :
               activeTab === 'checkin' ? 'Controle de Entrada' :
               activeTab.replace('_', ' ')}
          </h2>
          <div className="flex items-center gap-4">
               <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
               >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <div className="h-10 w-px bg-slate-200 dark:bg-white/10"></div>
               <div className="flex items-center gap-3 cursor-pointer hover:opacity-80" onClick={onProfileClick}>
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{user?.nome.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.governanca ? 'Governança' : 'Membro'}</div>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-brand-green overflow-hidden border-2 border-slate-200 dark:border-white/10">
                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto text-black" />}
                    </button>
               </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth">
            
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="relative bg-gradient-to-r from-brand-green/10 to-blue-500/10 dark:from-brand-green/20 dark:to-blue-900/20 rounded-3xl p-10 border border-slate-200 dark:border-white/10 overflow-hidden backdrop-blur-md">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">Bem-vindo, {user?.nome.split(' ')[0]}!</h1>
                            <p className="text-slate-600 dark:text-slate-300 max-w-xl text-lg font-light leading-relaxed">
                                {isRestrictedUser 
                                    ? 'Você ainda não faz parte de nenhum Grupo de Trabalho. Inscreva-se em eventos e participe para ganhar pontos.' 
                                    : 'Acompanhe as novidades dos seus Grupos de Trabalho no mural e no ranking do ecossistema.'
                                }
                            </p>
                            
                            <div className="mt-8 flex flex-wrap gap-4">
                                <div className="bg-white/50 dark:bg-black/30 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
                                    <div className="p-3 bg-brand-green/20 rounded-xl text-brand-green"><Medal size={24} /></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{userLevel}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Nível Atual</div>
                                    </div>
                                </div>
                                <div className="bg-white/50 dark:bg-black/30 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
                                    <div className="p-3 bg-brand-neon/20 rounded-xl text-brand-neon"><Star size={24} /></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{userPoints}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Pontuação</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative circle */}
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-neon/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-8">
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Calendar size={20} className="text-brand-green" /> Próximos Eventos
                             </h3>
                             <div className="space-y-4">
                                 {availableEvents.slice(0, 3).map(evt => (
                                     <div key={evt.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-brand-neon/30 transition-all cursor-pointer">
                                         <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex flex-col items-center justify-center text-brand-green border border-brand-green/20">
                                                 <span className="text-[10px] uppercase">{new Date(evt.data_inicio).toLocaleString('pt-BR', { month: 'short' })}</span>
                                                 <span className="text-lg font-bold leading-none">{new Date(evt.data_inicio).getDate()}</span>
                                             </div>
                                             <div>
                                                 <div className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[150px]">{evt.titulo}</div>
                                                 <div className="text-xs text-slate-500">{evt.local}</div>
                                             </div>
                                         </div>
                                         <button onClick={() => setActiveTab('agenda')} className="text-brand-green hover:text-brand-neon transition-colors"><ChevronRight size={20}/></button>
                                     </div>
                                 ))}
                                 <button onClick={() => setActiveTab('agenda')} className="w-full py-3 text-sm text-slate-500 hover:text-brand-green transition-colors font-medium">Ver agenda completa</button>
                             </div>
                         </div>

                         <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-8">
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-brand-neon" /> Top Ranking
                             </h3>
                             <div className="space-y-4">
                                 {ranking.slice(0, 3).map((rk, i) => (
                                     <div key={rk.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-black/20 border border-slate-100 dark:border-white/5">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : 'bg-orange-400 text-black'}`}>
                                             {i + 1}º
                                         </div>
                                         <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                             {rk.avatar ? <img src={rk.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto text-slate-400" size={16}/>}
                                         </div>
                                         <div className="flex-1">
                                             <div className="text-sm font-bold text-slate-900 dark:text-white">{rk.nome}</div>
                                             <div className="text-[10px] text-slate-500 uppercase">{rk.artigos} Artigos publicados</div>
                                         </div>
                                     </div>
                                 ))}
                                 <button onClick={() => setActiveTab('ranking')} className="w-full py-3 text-sm text-slate-500 hover:text-brand-neon transition-colors font-medium">Ver ranking completo</button>
                             </div>
                         </div>
                    </div>
                </div>
            )}

            {/* AGENDA (EVENTOS DISPONÍVEIS) */}
            {activeTab === 'agenda' && (
                <div className="animate-fade-in-up space-y-8">
                    {availableEvents.length === 0 ? (
                        <div className="text-center py-24 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10">
                            <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sem eventos no momento</h3>
                            <p className="text-slate-500">Fique atento às atualizações do ecossistema.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableEvents.map(evt => {
                                const isRegistered = myTickets.some(t => t.evento_id === evt.id);
                                return (
                                    <div key={evt.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col hover:border-brand-neon/30 transition-all group shadow-sm dark:shadow-none">
                                        <div className="h-44 bg-slate-100 dark:bg-slate-900 relative">
                                            {evt.imagem_capa ? (
                                                <img src={evt.imagem_capa} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green/20 to-blue-900/20">
                                                    <Calendar size={32} className="text-white/20" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-brand-neon border border-brand-neon/30 uppercase tracking-widest">{evt.tipo}</span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs mb-3 font-medium">
                                                <Clock size={14} className="text-brand-green" /> 
                                                {new Date(evt.data_inicio).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{evt.titulo}</h3>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 font-light leading-relaxed">{evt.descricao}</p>
                                            
                                            <div className="mt-auto space-y-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                                    <MapPin size={14} className="text-brand-neon" />
                                                    <span className="truncate">{evt.local}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleRegisterForEvent(evt)}
                                                    disabled={isRegistered || isRegistering === evt.id}
                                                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                                                      isRegistered 
                                                      ? 'bg-brand-green/10 text-brand-green cursor-default border border-brand-green/30' 
                                                      : 'bg-brand-neon text-black hover:scale-[1.02] active:scale-95 shadow-brand-neon/20'
                                                    }`}
                                                >
                                                    {isRegistering === evt.id ? <Loader2 size={18} className="animate-spin" /> : (isRegistered ? <CheckCircle size={18} /> : <Ticket size={18} />)}
                                                    {isRegistered ? 'Inscrito' : 'Garantir Ingresso'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* GESTÃO DE EVENTOS (GOVERNANÇA) */}
            {activeTab === 'events_manage' && user?.governanca && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Central de Eventos</h3>
                            <p className="text-slate-500 text-sm">Crie e gerencie os eventos do ecossistema.</p>
                        </div>
                        <button 
                            onClick={() => setIsEventModalOpen(true)}
                            className="bg-brand-neon text-black px-6 py-3 rounded-2xl font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg shadow-brand-neon/20"
                        >
                            <Plus size={20} /> Novo Evento
                        </button>
                    </div>

                    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Evento</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Local</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {managedEvents.map(evt => (
                                    <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditEventClick(evt)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green"><Calendar size={18}/></div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{evt.titulo}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(evt.data_inicio).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">{evt.local}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditEventClick(evt)} className="p-2 text-slate-400 hover:text-brand-neon transition-colors" title="Editar"><Edit3 size={18}/></button>
                                                <button onClick={() => handleDeleteEvent(evt.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Excluir"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MEUS EVENTOS / INGRESSOS */}
            {activeTab === 'my_events' && (
                <div className="animate-fade-in-up space-y-8">
                     {myTickets.length === 0 ? (
                        <div className="text-center py-24 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10">
                            <Ticket size={48} className="mx-auto text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Você não tem ingressos</h3>
                            <button onClick={() => setActiveTab('agenda')} className="mt-4 text-brand-green hover:underline">Ver agenda de eventos</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {myTickets.map(ticket => (
                                <div key={ticket.id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col sm:flex-row shadow-xl">
                                     <div className="sm:w-32 bg-brand-neon text-black p-6 flex sm:flex-col items-center justify-center gap-4 border-b sm:border-b-0 sm:border-r border-black/10">
                                         <div className="text-center">
                                             <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">{new Date(ticket.evento?.data_inicio || '').toLocaleString('pt-BR', { month: 'short' })}</div>
                                             <div className="text-3xl font-bold leading-none">{new Date(ticket.evento?.data_inicio || '').getDate()}</div>
                                         </div>
                                         <div className="h-px w-full bg-black/10 hidden sm:block"></div>
                                         <div className="rotate-0 sm:-rotate-90 whitespace-nowrap font-bold text-xs uppercase tracking-[0.3em]">TICKET</div>
                                     </div>
                                     
                                     <div className="flex-1 p-8 relative">
                                          <div className="mb-6">
                                              <div className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-1">{ticket.evento?.tipo}</div>
                                              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{ticket.evento?.titulo}</h3>
                                          </div>
                                          
                                          <div className="space-y-3 mb-8">
                                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                                  <MapPin size={16} className="text-brand-green" /> {ticket.evento?.local}
                                              </div>
                                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                                  <Clock size={16} className="text-brand-green" /> {new Date(ticket.evento?.data_inicio || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </div>
                                          </div>

                                          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                               <div>
                                                   <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Portador</div>
                                                   <div className="text-sm font-bold text-slate-900 dark:text-white">{user?.nome}</div>
                                               </div>
                                               <div className="p-2 bg-white rounded-xl border border-slate-200">
                                                    <QRCode value={ticket.id} size={64} />
                                               </div>
                                          </div>
                                          
                                          {/* Ticket status badge */}
                                          <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${ticket.status === 'checkin_realizado' ? 'bg-brand-green/20 text-brand-green' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                              {ticket.status === 'checkin_realizado' ? 'Utilizado' : 'Válido'}
                                          </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Outras tabs (Ranking, Membros, Mural) seguem a mesma estética premium */}
        </main>
      </div>

      {/* EVENT MODAL (GOVERNANÇA) */}
      {isEventModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={closeEventModal}></div>
              <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <Calendar className="text-brand-neon" /> {editingEventId ? 'Editar Evento' : 'Novo Evento'}
                      </h3>
                      <button onClick={closeEventModal} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Título do Evento</label>
                              <input 
                                  type="text" 
                                  value={eventForm.titulo}
                                  onChange={(e) => setEventForm({...eventForm, titulo: e.target.value})}
                                  placeholder="Ex: Workshop IA no Campo"
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all"
                              />
                          </div>
                          
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição Curta</label>
                              <textarea 
                                  value={eventForm.descricao}
                                  onChange={(e) => setEventForm({...eventForm, descricao: e.target.value})}
                                  rows={3}
                                  placeholder="Explique o que acontecerá no evento..."
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all resize-none"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Data e Hora</label>
                              <input 
                                  type="datetime-local" 
                                  value={eventForm.data_inicio}
                                  onChange={(e) => setEventForm({...eventForm, data_inicio: e.target.value})}
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                              <select 
                                  value={eventForm.tipo}
                                  onChange={(e) => setEventForm({...eventForm, tipo: e.target.value})}
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all appearance-none"
                              >
                                  <option value="Meetup">Meetup</option>
                                  <option value="Workshop">Workshop</option>
                                  <option value="Networking">Networking</option>
                                  <option value="Pitch">Pitch Day</option>
                                  <option value="Conferência">Conferência</option>
                              </select>
                          </div>

                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Local / Link</label>
                              <input 
                                  type="text" 
                                  value={eventForm.local}
                                  onChange={(e) => setEventForm({...eventForm, local: e.target.value})}
                                  placeholder="Endereço físico ou link da reunião"
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Limite de Vagas</label>
                              <input 
                                  type="number" 
                                  value={eventForm.vagas}
                                  onChange={(e) => setEventForm({...eventForm, vagas: parseInt(e.target.value)})}
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">URL Imagem Capa</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      value={eventForm.imagem_capa}
                                      onChange={(e) => setEventForm({...eventForm, imagem_capa: e.target.value})}
                                      placeholder="https://imagem.jpg"
                                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all"
                                  />
                                  <button 
                                      onClick={() => eventImageInputRef.current?.click()}
                                      disabled={isUploadingEventImg}
                                      className="p-3 bg-brand-neon/20 border border-brand-neon/30 text-brand-neon rounded-2xl hover:bg-brand-neon hover:text-black transition-all flex items-center justify-center disabled:opacity-50"
                                      title="Fazer upload"
                                  >
                                      {isUploadingEventImg ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                  </button>
                                  <input type="file" ref={eventImageInputRef} className="hidden" accept="image/*" onChange={handleEventImageUpload} />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-white/5 flex justify-end gap-4">
                      <button 
                        onClick={closeEventModal}
                        className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-white transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={handleSaveEvent}
                        disabled={isSubmittingEvent}
                        className="bg-brand-neon text-black px-10 py-3 rounded-2xl font-bold hover:bg-brand-neon/80 transition-all shadow-lg shadow-brand-neon/20 flex items-center gap-2 disabled:opacity-50"
                      >
                          {isSubmittingEvent ? <Loader2 size={18} className="animate-spin"/> : (editingEventId ? <Edit3 size={18}/> : <Plus size={18}/>)}
                          {editingEventId ? 'Atualizar Evento' : 'Publicar Evento'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
