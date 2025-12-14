import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Logo } from '../components/ui/Logo';
import { LayoutDashboard, FileText, Users, LogOut, TrendingUp, Award, Star, Medal, Briefcase, ChevronRight, X, Save, Edit3, Loader2, ShieldCheck, Shield, Layers, PlusCircle, UserPlus, Trash2, CheckCircle, AlertCircle, Image as ImageIcon, Hash, Upload, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Type, Eye, Check, XCircle, MessageSquare, Send, ThumbsUp, BarChart3, Search, Filter, Clock, Settings, User as UserIcon, Calendar, MapPin, Ticket, QrCode, ScanLine, CalendarRange, ArrowRight } from 'lucide-react';
import { User, GT, Artigo, MuralPost, Evento, Inscricao, Cargo } from '../types';
import { supabase } from '../services/supabase';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
  onProfileClick: () => void;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'mural' | 'management' | 'my_events' | 'events_manage' | 'checkin' | 'agenda';

// Componente Rich Text Editor
const RichTextEditor: React.FC<{ value: string; onChange: (html: string) => void }> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML && value) {
            editorRef.current.innerHTML = value;
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };
    
     const handleImageUploadInEditor = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `editor_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error } = await supabase.storage.from('imagensBlog').upload(`imagensBlog/${fileName}`, file);
            if (!error) {
                 const { data } = supabase.storage.from('imagensBlog').getPublicUrl(`imagensBlog/${fileName}`);
                 execCmd('insertImage', data.publicUrl);
            }
        } finally { setIsUploading(false); if(fileInputRef.current) fileInputRef.current.value = ''; }
    };

    return (
        <div className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-white/5 focus-within:ring-2 focus-within:ring-brand-neon focus-within:bg-black transition-all">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                    <button type="button" onClick={() => execCmd('bold')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"><Bold size={18} /></button>
                    <button type="button" onClick={() => execCmd('italic')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"><Italic size={18} /></button>
                </div>
                 <div className="flex items-center gap-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors ${isUploading ? 'opacity-50' : ''}`} disabled={isUploading}>
                        <ImageIcon size={18} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUploadInEditor} />
                </div>
            </div>
            <div ref={editorRef} contentEditable onInput={handleInput} className="flex-1 p-6 min-h-[200px] outline-none text-white prose prose-invert max-w-none overflow-y-auto custom-scrollbar" />
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [gts, setGts] = useState<GT[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  
  // General States
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Member Edit States
  const [editedGTs, setEditedGTs] = useState<number[]>([]); 
  const [editedGovernanca, setEditedGovernanca] = useState<boolean>(false);
  const [editedCargo, setEditedCargo] = useState<number>(0);

  // Article States
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [articleForm, setArticleForm] = useState({ id: 0, titulo: '', subtitulo: '', conteudo: '', capa: '', tags: [] as string[], aprovado: false });
  const [allArticles, setAllArticles] = useState<Artigo[]>([]);

  // Mural States
  const [muralPosts, setMuralPosts] = useState<MuralPost[]>([]);
  const [activeMuralGtId, setActiveMuralGtId] = useState<number | null>(null); // null = Geral
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostingMural, setIsPostingMural] = useState(false);

  // Event States
  const [myTickets, setMyTickets] = useState<Inscricao[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Evento[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Inscricao | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState<Partial<Evento>>({
      titulo: '', descricao: '', data_inicio: '', local: '', tipo: 'Meetup', vagas: 50
  });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [managedEvents, setManagedEvents] = useState<Evento[]>([]);
  const [isRegistering, setIsRegistering] = useState<number | null>(null);

  // Checkin Scanner
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [checkinMessage, setCheckinMessage] = useState('');

  const userPoints = (user?.artigos || 0) * 150 + 50; 
  const userLevel = Math.floor(userPoints / 500) + 1;
  const progressPercent = Math.min(100, (userPoints % 500) / 500 * 100);

  // Access Control Logic
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

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch Available Events (Future) - Everyone needs this
    const { data: futureEvents } = await supabase.from('eventos').select('*').gte('data_inicio', new Date().toISOString()).order('data_inicio', { ascending: true });
    if (futureEvents) setAvailableEvents(futureEvents);

    // Fetch My Tickets - Everyone needs this
    const { data: tickets } = await supabase.from('inscricoes').select('*, evento:eventos(*)').eq('user_id', user.id);
    if (tickets) setMyTickets(tickets);

    // --- RESTRICTED DATA FETCHING ---
    // If restricted, we don't need to fetch heavy data for tabs they can't see
    if (isRestrictedUser) return;

    // Fetch Users & Ranking
    const { data: userData } = await supabase.from('users').select('*').order('artigos', { ascending: false });
    if (userData) {
        setMembers(userData.map(u => ({...u, gts: normalizeGTs(u.gts)})));
        setRanking(userData.slice(0, 20));
    }
    
    // Fetch GTs & Cargos
    const { data: gtData } = await supabase.from('gts').select('*').order('gt');
    if (gtData) setGts(gtData);
    const { data: cargoData } = await supabase.from('cargos').select('*').order('cargo');
    if (cargoData) setCargos(cargoData);

    // Fetch Articles
    if (user.governanca) {
        const { data: articles } = await supabase.from('artigos').select('*').order('created_at', { ascending: false });
        if (articles) setAllArticles(articles);
    } else {
         const { data: articles } = await supabase.from('artigos').select('*').eq('autor', user.uuid).order('created_at', { ascending: false });
         if (articles) setAllArticles(articles);
    }

    // Fetch Mural
    const { data: mural } = await supabase.from('mural_posts').select('*, users(nome)').order('created_at', { ascending: false });
    if (mural) setMuralPosts(mural.map((p: any) => ({...p, user_nome: p.users?.nome || 'Usuário'})));

    // Fetch Managed Events (Governance)
    if (user.governanca) {
        const { data: events } = await supabase.from('eventos').select('*').order('data_inicio', { ascending: false });
        if (events) setManagedEvents(events);
    }

  }, [user, isRestrictedUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Handlers ---

  const handlePostMural = async () => {
      if (!newPostContent.trim() || !user) return;
      setIsPostingMural(true);
      try {
          const { error } = await supabase.from('mural_posts').insert([{
              user_id: user.id,
              gt_id: activeMuralGtId || 0, // 0 for General
              conteudo: newPostContent,
              likes: 0
          }]);
          if (error) throw error;
          setNewPostContent('');
          fetchData();
          showNotification('success', 'Postado no mural!');
      } catch (e) {
          showNotification('error', 'Erro ao postar.');
      } finally {
          setIsPostingMural(false);
      }
  };

  const handleMemberEditClick = (member: User) => {
      setSelectedMember(member);
      setEditedGTs(member.gts || []);
      setEditedGovernanca(member.governanca || false);
      setEditedCargo(member.cargo || 0);
  };

  const handleToggleGT = (gtId: number) => {
      if (editedGTs.includes(gtId)) {
          setEditedGTs(editedGTs.filter(id => id !== gtId));
      } else {
          setEditedGTs([...editedGTs, gtId]);
      }
  };

  const handleSaveMember = async () => {
      if (!selectedMember) return;
      setIsUpdating(true);
      try {
          const { error } = await supabase.from('users').update({
              gts: editedGTs,
              governanca: editedGovernanca,
              cargo: editedCargo
          }).eq('id', selectedMember.id);
          
          if (error) throw error;
          showNotification('success', 'Membro atualizado!');
          setSelectedMember(null);
          fetchData();
      } catch (e) {
          showNotification('error', 'Erro ao atualizar membro.');
      } finally {
          setIsUpdating(false);
      }
  };

  const handleSaveArticle = async () => {
      if (!articleForm.titulo || !articleForm.conteudo) {
          showNotification('error', 'Título e conteúdo obrigatórios');
          return;
      }
      setIsSubmittingArticle(true);
      try {
          const payload = {
              titulo: articleForm.titulo,
              subtitulo: articleForm.subtitulo,
              conteudo: articleForm.conteudo,
              capa: articleForm.capa,
              tags: articleForm.tags,
              autor: user?.uuid,
              aprovado: user?.governanca ? articleForm.aprovado : false // Only gov can approve directly
          };

          if (articleForm.id) {
              // Update
              const { error } = await supabase.from('artigos').update(payload).eq('id', articleForm.id);
              if (error) throw error;
          } else {
              // Insert
              const { error } = await supabase.from('artigos').insert([payload]);
              if (error) throw error;
          }
          
          showNotification('success', articleForm.id ? 'Artigo atualizado!' : 'Artigo enviado para aprovação!');
          setIsArticleModalOpen(false);
          setArticleForm({ id: 0, titulo: '', subtitulo: '', conteudo: '', capa: '', tags: [], aprovado: false });
          fetchData();
      } catch (e) {
          showNotification('error', 'Erro ao salvar artigo.');
      } finally {
          setIsSubmittingArticle(false);
      }
  };

  const handleDeleteArticle = async (id: number) => {
      if (!confirm('Tem certeza?')) return;
      try {
          const { error } = await supabase.from('artigos').delete().eq('id', id);
          if (error) throw error;
          fetchData();
          showNotification('success', 'Artigo removido.');
      } catch(e) { showNotification('error', 'Erro ao remover.'); }
  };

  // --- Event & Scanner Handlers ---
  const handleSaveEvent = async () => {
      if (!eventForm.titulo || !eventForm.data_inicio) return;
      setIsSubmittingEvent(true);
      try {
          const { error } = await supabase.from('eventos').insert([{
              ...eventForm,
              criado_por: user?.uuid
          }]);
          if (error) throw error;
          showNotification('success', 'Evento criado com sucesso!');
          setIsEventModalOpen(false);
          setEventForm({ titulo: '', descricao: '', data_inicio: '', local: '', tipo: 'Meetup', vagas: 50 });
          fetchData();
      } catch (e) {
          showNotification('error', 'Erro ao criar evento.');
      } finally {
          setIsSubmittingEvent(false);
      }
  };

  const handleRegisterForEvent = async (evento: Evento) => {
      if (!user) return;
      setIsRegistering(evento.id);
      try {
          // Check redundancy client side first for speed (double checked by DB constraint)
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
          showNotification('success', 'Inscrição realizada com sucesso! Veja seu ingresso na aba Meus Eventos.');
          
          // Refresh data to show in My Events
          fetchData(); 
      } catch (e: any) {
          console.error(e);
          showNotification('error', 'Erro ao realizar inscrição.');
      } finally {
          setIsRegistering(null);
      }
  };

  useEffect(() => {
      if (activeTab === 'checkin' && !scannerRef.current) {
          const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
          scanner.render(onScanSuccess, (err) => { console.warn(err); });
          scannerRef.current = scanner;
      }
      return () => {
          if (scannerRef.current && activeTab !== 'checkin') {
             try { scannerRef.current.clear(); scannerRef.current = null; } catch(e) {}
          }
      }
  }, [activeTab]);

  const onScanSuccess = async (decodedText: string) => {
       if (checkinStatus === 'success') return;
       await handleCheckIn(decodedText);
  };

  const handleCheckIn = async (ticketId: string) => {
      setCheckinStatus('idle');
      try {
          const { data, error } = await supabase.from('inscricoes').select('*, user:users(nome), evento:eventos(titulo)').eq('id', ticketId).single();
          if (error || !data) { setCheckinStatus('error'); setCheckinMessage('Ticket inválido.'); return; }
          if (data.status === 'checkin_realizado') { setCheckinStatus('error'); setCheckinMessage(`Check-in já feito para ${data.user.nome}.`); return; }
          const { error: updateError } = await supabase.from('inscricoes').update({ status: 'checkin_realizado', checkin_at: new Date().toISOString() }).eq('id', ticketId);
          if (updateError) throw updateError;
          setCheckinStatus('success'); setCheckinMessage(`${data.user.nome} - ${data.evento.titulo}`);
          setTimeout(() => { setCheckinStatus('idle'); setCheckinMessage(''); }, 5000);
      } catch (e) { setCheckinStatus('error'); setCheckinMessage('Erro ao processar.'); }
  };

  const getGTName = (id?: number | number[]) => { 
      if(Array.isArray(id)) return id.length ? 'Múltiplos' : 'Sem GT'; 
      return gts.find(g => g.id === id)?.gt || 'GT'; 
  }
  const getCargoName = (id?: number) => cargos.find(c => c.id === id)?.cargo || 'Membro';

  // Construct Sidebar Items conditionally
  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
    { id: 'agenda', icon: CalendarRange, label: 'Agenda de Eventos' },
    { id: 'my_events', icon: Ticket, label: 'Meus Eventos' },
  ];

  if (!isRestrictedUser) {
    sidebarItems.push(
      { id: 'mural', icon: MessageSquare, label: 'Mural dos GTs' },
      { id: 'ranking', icon: Award, label: 'Ranking' },
      { id: 'members', icon: Users, label: 'Membros' },
      { id: 'articles', icon: FileText, label: 'Artigos' }
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex font-sans overflow-hidden relative">
      {/* Sidebar */}
      <div className="w-72 bg-white/[0.03] backdrop-blur-xl border-r border-white/5 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-3xl h-[calc(100vh-2rem)]">
        <div className="h-24 flex items-center px-8"><Logo dark /></div>
        
        <div className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-medium ${
                activeTab === item.id ? 'bg-brand-green text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}

          {user?.governanca && (
             <>
                <div className="h-px bg-white/10 my-2 mx-4"></div>
                <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">Governança</div>
                <button onClick={() => setActiveTab('events_manage')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'events_manage' ? 'bg-brand-neon text-black' : 'text-slate-400 hover:text-white'}`}>
                  <Calendar size={20} /> <span>Gestão de Eventos</span>
                </button>
                <button onClick={() => setActiveTab('checkin')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'checkin' ? 'bg-brand-neon text-black' : 'text-slate-400 hover:text-white'}`}>
                  <ScanLine size={20} /> <span>Check-in (QR)</span>
                </button>
             </>
          )}

           <div className="h-px bg-white/10 my-2 mx-4"></div>
           <button onClick={onProfileClick} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-slate-400 hover:bg-white/5 hover:text-white">
                <Settings size={20} /><span>Meu Perfil</span>
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Header */}
        <header className="h-24 flex items-center justify-between px-8 md:px-12 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white tracking-tight capitalize">
              {activeTab === 'agenda' ? 'Agenda de Eventos' : activeTab.replace('_', ' ')}
          </h2>
          <div className="flex items-center gap-4">
               <button className="w-12 h-12 rounded-full bg-brand-green overflow-hidden" onClick={onProfileClick}>
                    {user?.avatar && <img src={user.avatar} className="w-full h-full object-cover" />}
               </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth">
            
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="relative bg-gradient-to-r from-brand-green/20 to-blue-900/20 rounded-3xl p-10 border border-white/10 overflow-hidden backdrop-blur-md">
                        <h1 className="text-4xl font-bold mb-4 text-white">Olá, {user?.nome.split(' ')[0]}</h1>
                        <p className="text-slate-300">
                            {isRestrictedUser 
                                ? 'Inscreva-se em eventos para interagir com o ecossistema.' 
                                : 'Acesse o mural do seu GT para ver as novidades.'
                            }
                        </p>
                        
                        <div className="mt-8 flex gap-4">
                             <div className="bg-black/30 p-4 rounded-xl">
                                 <div className="text-brand-neon text-2xl font-bold">{userLevel}</div>
                                 <div className="text-xs text-slate-400 uppercase">Nível</div>
                             </div>
                             <div className="bg-black/30 p-4 rounded-xl">
                                 <div className="text-white text-2xl font-bold">{userPoints}</div>
                                 <div className="text-xs text-slate-400 uppercase">Pontos</div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AGENDA (EVENTOS DISPONÍVEIS) */}
            {activeTab === 'agenda' && (
                <div className="animate-fade-in-up">
                    {availableEvents.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Não há eventos futuros agendados.</h3>
                            <p className="text-slate-400">Fique de olho no mural do seu GT para novidades.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableEvents.map(evt => {
                                const isRegistered = myTickets.some(t => t.evento_id === evt.id);
                                const date = new Date(evt.data_inicio);

                                return (
                                    <div key={evt.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col hover:border-brand-neon/30 transition-all group">
                                        <div className="h-40 bg-slate-900 relative">
                                            {evt.imagem_capa ? (
                                                <img src={evt.imagem_capa} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green/20 to-blue-900/20">
                                                    <Calendar size={32} className="text-white/20" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-neon uppercase border border-white/10">
                                                {evt.tipo}
                                            </div>
                                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent flex items-end">
                                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 text-center border border-white/10 min-w-[3.5rem]">
                                                    <div className="text-xs uppercase text-slate-400">{date.toLocaleString('pt-BR', { month: 'short' })}</div>
                                                    <div className="text-xl font-bold text-white leading-none">{date.getDate()}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-xl font-bold text-white mb-2">{evt.titulo}</h3>
                                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                                                <MapPin size={14} /> {evt.local}
                                            </div>
                                            <p className="text-slate-400 text-sm line-clamp-3 mb-6">{evt.descricao}</p>
                                            
                                            <div className="mt-auto pt-4 border-t border-white/5">
                                                {isRegistered ? (
                                                    <button disabled className="w-full py-3 rounded-xl bg-brand-green/10 text-brand-green font-bold border border-brand-green/30 flex items-center justify-center gap-2 cursor-default">
                                                        <CheckCircle size={18} /> Inscrito
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRegisterForEvent(evt)}
                                                        disabled={isRegistering === evt.id}
                                                        className="w-full py-3 rounded-xl bg-brand-neon text-black font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isRegistering === evt.id ? <Loader2 className="animate-spin" size={18} /> : <Ticket size={18} />}
                                                        Inscrever-se
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MURAL */}
            {activeTab === 'mural' && !isRestrictedUser && (
                <div className="animate-fade-in-up max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                             <button onClick={() => setActiveMuralGtId(null)} className={`px-4 py-2 rounded-full text-sm font-bold ${activeMuralGtId === null ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>Geral</button>
                             {user?.gts?.map((gtId) => {
                                 const gtName = gts.find(g => g.id === gtId)?.gt;
                                 return (
                                    <button key={gtId} onClick={() => setActiveMuralGtId(gtId)} className={`px-4 py-2 rounded-full text-sm font-bold ${activeMuralGtId === gtId ? 'bg-brand-neon text-black' : 'bg-white/5 text-slate-400'}`}>
                                        {gtName}
                                    </button>
                                 )
                             })}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
                        <textarea 
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Compartilhe algo com o grupo..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white mb-4 focus:border-brand-neon focus:outline-none"
                            rows={3}
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Postando em: {activeMuralGtId === null ? 'Geral' : getGTName(activeMuralGtId)}</span>
                            <button onClick={handlePostMural} disabled={isPostingMural} className="bg-brand-neon text-black px-6 py-2 rounded-xl font-bold hover:bg-white transition-colors">
                                {isPostingMural ? 'Enviando...' : 'Publicar'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {muralPosts
                            .filter(p => activeMuralGtId === null ? true : p.gt_id === activeMuralGtId)
                            .map(post => (
                            <div key={post.id} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-neon font-bold">
                                            {post.user_nome.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{post.user_nome}</div>
                                            <div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()} • {getGTName(post.gt_id)}</div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-300 leading-relaxed">{post.conteudo}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RANKING */}
            {activeTab === 'ranking' && !isRestrictedUser && (
                <div className="animate-fade-in-up">
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-black/20 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Pos</th>
                                    <th className="px-6 py-4">Membro</th>
                                    <th className="px-6 py-4">Nível</th>
                                    <th className="px-6 py-4 text-right">Pontos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ranking.map((member, index) => {
                                    const pts = (member.artigos || 0) * 150 + 50;
                                    const lvl = Math.floor(pts/500) + 1;
                                    return (
                                        <tr key={member.id} className={`hover:bg-white/5 ${user?.id === member.id ? 'bg-brand-neon/5' : ''}`}>
                                            <td className="px-6 py-4 font-mono text-slate-400">#{index + 1}</td>
                                            <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                                {index === 0 && <Medal className="text-yellow-400" size={16} />}
                                                {member.nome}
                                            </td>
                                            <td className="px-6 py-4"><span className="bg-white/10 px-2 py-1 rounded text-xs">Lvl {lvl}</span></td>
                                            <td className="px-6 py-4 text-right font-mono text-brand-neon">{pts}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MEMBROS */}
            {activeTab === 'members' && !isRestrictedUser && (
                <div className="animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map(member => (
                            <div key={member.id} onClick={() => user?.governanca && handleMemberEditClick(member)} className={`bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 ${user?.governanca ? 'cursor-pointer hover:border-brand-neon' : ''}`}>
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xl">
                                    {member.nome.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{member.nome}</div>
                                    <div className="text-xs text-slate-500">{getCargoName(member.cargo)}</div>
                                    <div className="text-xs text-brand-neon mt-1">{getGTName(member.gts)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ARTIGOS */}
            {activeTab === 'articles' && !isRestrictedUser && (
                <div className="animate-fade-in-up">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white">Gerenciar Artigos</h3>
                        <button onClick={() => { setArticleForm({id:0, titulo:'', subtitulo:'', conteudo:'', capa:'', tags:[], aprovado:false}); setIsArticleModalOpen(true); }} className="bg-brand-neon text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-colors">
                            <PlusCircle size={18} /> Novo Artigo
                        </button>
                    </div>
                    <div className="space-y-4">
                        {allArticles.map(artigo => (
                            <div key={artigo.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-white text-lg">{artigo.titulo}</div>
                                    <div className="text-sm text-slate-400">Autor: {members.find(m => m.uuid === artigo.autor)?.nome || 'Desconhecido'}</div>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded ${artigo.aprovado ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {artigo.aprovado ? 'Publicado' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setArticleForm({...artigo, id: artigo.id, tags: artigo.tags || []}); setIsArticleModalOpen(true); }} className="p-2 bg-white/10 rounded-lg hover:bg-white hover:text-black transition-colors"><Edit3 size={18} /></button>
                                    <button onClick={() => handleDeleteArticle(artigo.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MEUS EVENTOS */}
            {activeTab === 'my_events' && (
                <div className="animate-fade-in-up">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white">Meus Ingressos</h3>
                        <button onClick={() => setActiveTab('agenda')} className="flex items-center gap-2 text-brand-neon text-sm font-bold hover:underline">
                             Ver Agenda Completa <ArrowRight size={16} />
                        </button>
                    </div>

                    {myTickets.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <Ticket size={48} className="mx-auto text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Você não tem eventos agendados</h3>
                            <button onClick={() => setActiveTab('agenda')} className="mt-4 bg-brand-neon text-black px-6 py-2 rounded-xl font-bold">Ver Agenda Pública</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myTickets.map(ticket => (
                                <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col group hover:border-brand-neon/50 transition-all">
                                    <div className="h-32 bg-slate-900 relative">
                                        {ticket.evento?.imagem_capa && <img src={ticket.evento.imagem_capa} className="w-full h-full object-cover opacity-60" />}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                                        <div className="absolute bottom-4 left-4 font-bold text-white">{ticket.evento?.titulo}</div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Calendar size={14} /> {new Date(ticket.evento?.data_inicio || '').toLocaleString()}</div>
                                        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${ticket.status === 'checkin_realizado' ? 'bg-green-500/20 text-green-500' : 'bg-brand-neon/20 text-brand-neon'}`}>{ticket.status === 'checkin_realizado' ? 'Check-in OK' : 'Confirmado'}</span>
                                            <button onClick={() => setSelectedTicket(ticket)} className="flex items-center gap-2 text-white hover:text-brand-neon font-bold text-sm">
                                                <QrCode size={16} /> Ver Ticket
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* GESTÃO DE EVENTOS */}
            {activeTab === 'events_manage' && (
                <div className="animate-fade-in-up">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white">Eventos Cadastrados</h3>
                        <button onClick={() => setIsEventModalOpen(true)} className="bg-brand-neon text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-colors"><PlusCircle size={18} /> Criar Evento</button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-black/20 text-slate-500 text-xs uppercase"><tr><th className="px-6 py-4">Evento</th><th className="px-6 py-4">Data</th><th className="px-6 py-4">Tipo</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {managedEvents.map(evt => (
                                    <tr key={evt.id} className="hover:bg-white/5">
                                        <td className="px-6 py-4 font-bold text-white">{evt.titulo}</td>
                                        <td className="px-6 py-4">{new Date(evt.data_inicio).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{evt.tipo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CHECKIN SCANNER */}
            {activeTab === 'checkin' && (
                <div className="animate-fade-in-up max-w-2xl mx-auto">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">Scanner de Entrada</h3>
                        <div className="mb-8 bg-black rounded-xl overflow-hidden border-2 border-white/10 relative h-64 md:h-80 flex items-center justify-center"><div id="reader" className="w-full h-full"></div></div>
                        {checkinStatus === 'success' && <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-xl text-center mb-6 animate-pulse"><CheckCircle size={32} className="mx-auto mb-2" /><div className="text-xl font-bold">Check-in Realizado!</div><div>{checkinMessage}</div></div>}
                        {checkinStatus === 'error' && <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-xl text-center mb-6"><AlertCircle size={32} className="mx-auto mb-2" /><div className="font-bold">Erro</div><div>{checkinMessage}</div></div>}
                        <div className="flex gap-2"><input type="text" placeholder="Código manual..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" /><button onClick={() => handleCheckIn(manualCode)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold">Validar</button></div>
                    </div>
                </div>
            )}
        </main>
      </div>

      {/* MODAL EDIT MEMBER */}
      {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md p-8 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                  <h2 className="text-2xl font-bold text-white mb-6">Editar Membro: {selectedMember.nome}</h2>
                  <div className="space-y-4">
                       <div>
                            <label className="text-sm text-slate-400 block mb-2">Governança</label>
                            <button onClick={() => setEditedGovernanca(!editedGovernanca)} className={`w-full py-3 rounded-xl border transition-all ${editedGovernanca ? 'bg-brand-neon/20 border-brand-neon text-brand-neon' : 'bg-white/5 border-white/10 text-slate-500'}`}>{editedGovernanca ? 'Sim (Admin)' : 'Não (Membro)'}</button>
                       </div>
                       <div>
                            <label className="text-sm text-slate-400 block mb-2">Cargo</label>
                            <select value={editedCargo} onChange={(e) => setEditedCargo(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"><option value={0}>Sem Cargo</option>{cargos.map(c => <option key={c.id} value={c.id}>{c.cargo}</option>)}</select>
                       </div>
                       
                       {/* SELETOR DE GTs */}
                       <div>
                            <label className="text-sm text-slate-400 block mb-2">Grupos de Trabalho</label>
                            <div className="flex flex-wrap gap-2">
                                {gts.map((gt) => {
                                    const isSelected = editedGTs.includes(gt.id);
                                    return (
                                        <button 
                                            key={gt.id}
                                            onClick={() => handleToggleGT(gt.id)}
                                            className={`px-3 py-2 rounded-lg text-sm transition-all border ${isSelected ? 'bg-brand-neon/20 border-brand-neon text-brand-neon' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        >
                                            {gt.gt}
                                        </button>
                                    );
                                })}
                            </div>
                       </div>

                       <button onClick={handleSaveMember} className="w-full py-3 bg-brand-neon text-black font-bold rounded-xl mt-4">{isUpdating ? 'Salvando...' : 'Salvar Alterações'}</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL ARTICLE */}
      {isArticleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col p-8 animate-fade-in-up">
                   <div className="flex justify-between mb-6"><h2 className="text-2xl font-bold text-white">{articleForm.id ? 'Editar Artigo' : 'Novo Artigo'}</h2><button onClick={() => setIsArticleModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button></div>
                   <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                       <input type="text" placeholder="Título" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-bold" value={articleForm.titulo} onChange={(e) => setArticleForm({...articleForm, titulo: e.target.value})} />
                       <input type="text" placeholder="Subtítulo" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={articleForm.subtitulo} onChange={(e) => setArticleForm({...articleForm, subtitulo: e.target.value})} />
                       <RichTextEditor value={articleForm.conteudo} onChange={(html) => setArticleForm({...articleForm, conteudo: html})} />
                       {user?.governanca && <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl"><input type="checkbox" checked={articleForm.aprovado} onChange={(e) => setArticleForm({...articleForm, aprovado: e.target.checked})} className="w-5 h-5 accent-brand-neon" /><label>Aprovado / Publicado</label></div>}
                   </div>
                   <div className="pt-4 mt-4 border-t border-white/10 flex justify-end gap-4"><button onClick={() => setIsArticleModalOpen(false)} className="px-6 py-3 rounded-xl bg-white/5 text-white">Cancelar</button><button onClick={handleSaveArticle} className="px-6 py-3 rounded-xl bg-brand-neon text-black font-bold">{isSubmittingArticle ? 'Salvando...' : 'Salvar Artigo'}</button></div>
               </div>
          </div>
      )}

      {/* MODAL EVENT CREATE */}
      {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg p-8 animate-fade-in-up">
                   <h2 className="text-2xl font-bold text-white mb-6">Novo Evento</h2>
                   <div className="space-y-4">
                       <input type="text" placeholder="Título" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={eventForm.titulo} onChange={(e) => setEventForm({...eventForm, titulo: e.target.value})} />
                       <div className="grid grid-cols-2 gap-4"><input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={eventForm.data_inicio} onChange={(e) => setEventForm({...eventForm, data_inicio: e.target.value})} /><select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={eventForm.tipo} onChange={(e) => setEventForm({...eventForm, tipo: e.target.value})}><option>Meetup</option><option>Workshop</option><option>Conferência</option></select></div>
                       <input type="text" placeholder="Local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={eventForm.local} onChange={(e) => setEventForm({...eventForm, local: e.target.value})} />
                       <textarea placeholder="Descrição" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={eventForm.descricao} onChange={(e) => setEventForm({...eventForm, descricao: e.target.value})} />
                       <div className="flex gap-4 pt-4"><button onClick={() => setIsEventModalOpen(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-white">Cancelar</button><button onClick={handleSaveEvent} className="flex-1 py-3 bg-brand-neon text-black font-bold rounded-xl">{isSubmittingEvent ? <Loader2 className="animate-spin mx-auto"/> : 'Criar'}</button></div>
                   </div>
               </div>
          </div>
      )}

      {/* MODAL QR TICKET */}
      {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
              <div className="bg-white text-black rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl animate-fade-in-up relative" onClick={e => e.stopPropagation()}>
                  <div className="h-32 bg-brand-green p-6 relative"><h2 className="text-2xl font-bold mt-2">{selectedTicket.evento?.titulo}</h2><div className="absolute -bottom-6 left-0 w-full h-12 bg-white rounded-t-[50%]"></div></div>
                  <div className="px-8 py-6 text-center"><div className="mb-6"><div className="font-bold text-lg">{user?.nome}</div></div><div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 inline-block mb-6"><QRCode value={selectedTicket.id} size={180} /></div><p className="text-xs text-slate-400 font-mono break-all">{selectedTicket.id}</p>{selectedTicket.status === 'checkin_realizado' && <div className="mt-4 bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold uppercase">Check-in Realizado</div>}</div>
              </div>
          </div>
      )}

    </div>
  );
};