
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
  Info
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

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'mural' | 'management' | 'my_events' | 'events_manage' | 'checkin' | 'agenda';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(localStorage.getItem('theme') as 'dark' | 'light' || 'dark');
  
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const [myTickets, setMyTickets] = useState<Inscricao[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Evento[]>([]);
  
  // Event Form State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState<Partial<Evento>>({
      titulo: '', descricao: '', data_inicio: '', local: '', tipo: 'Meetup', vagas: 50, imagem_capa: ''
  });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isUploadingEventImg, setIsUploadingEventImg] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement>(null);

  // Event Details/Management State (Governance)
  const [managedEvents, setManagedEvents] = useState<Evento[]>([]);
  const [selectedEventDetails, setSelectedEventDetails] = useState<Evento | null>(null);
  const [eventAttendees, setEventAttendees] = useState<(Inscricao & { users: User })[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [manualTicketId, setManualTicketId] = useState('');

  // User Ticket Modal State (Participant)
  const [isUserTicketModalOpen, setIsUserTicketModalOpen] = useState(false);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Inscricao | null>(null);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Evento | null>(null);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [isRegistering, setIsRegistering] = useState<number | null>(null);

  const userPoints = (user?.artigos || 0) * 150 + 50; 
  const userLevel = Math.floor(userPoints / 500) + 1;
  const isRestrictedUser = !user?.governanca && (!user?.gts || user.gts.length === 0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
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
    
    const { data: futureEvents } = await supabase.from('eventos').select('*').gte('data_inicio', new Date().toISOString()).order('data_inicio', { ascending: true });
    if (futureEvents) setAvailableEvents(futureEvents);
    
    const { data: tickets } = await supabase.from('inscricoes').select('*, evento:eventos(*)').eq('user_id', user.id);
    if (tickets) setMyTickets(tickets);

    if (!isRestrictedUser) {
        const { data: userData } = await supabase.from('users').select('*').order('artigos', { ascending: false });
        if (userData) {
            setMembers(userData);
            setRanking(userData.slice(0, 20));
        }
    }

    if (user.governanca) {
        const { data: events } = await supabase.from('eventos').select('*').order('data_inicio', { ascending: false });
        if (events) setManagedEvents(events);
    }
  }, [user, isRestrictedUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // QR SCANNER LOGIC
  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 15, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
    }, 150);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Erro ao limpar scanner", err));
        scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
      stopScanner();
      await handleCheckIn(decodedText);
  };

  const onScanFailure = (error: any) => {};

  const handleCheckIn = async (ticketId: string) => {
      if (!ticketId) return;
      try {
          const { data: ticket, error: fetchError } = await supabase
            .from('inscricoes')
            .select('*, users(nome)')
            .eq('id', ticketId)
            .single();

          if (fetchError || !ticket) {
              showNotification('error', 'Ticket inválido ou não encontrado.');
              return;
          }

          if (ticket.status === 'checkin_realizado') {
              showNotification('error', `Check-in já realizado para ${ticket.users?.nome}.`);
              return;
          }

          const { error: updateError } = await supabase
            .from('inscricoes')
            .update({ status: 'checkin_realizado', checkin_at: new Date().toISOString() })
            .eq('id', ticketId);

          if (updateError) throw updateError;

          showNotification('success', `Presença confirmada: ${ticket.users?.nome}`);
          setManualTicketId('');
          if (selectedEventDetails) fetchAttendees(selectedEventDetails.id);
      } catch (e) {
          showNotification('error', 'Erro ao processar check-in.');
      }
  };

  // ATTENDEES LOGIC
  const fetchAttendees = async (eventId: number) => {
      setIsLoadingAttendees(true);
      try {
          const { data, error } = await supabase
            .from('inscricoes')
            .select('*, users(*)')
            .eq('evento_id', eventId);
          
          if (error) throw error;
          setEventAttendees(data || []);
      } catch (e) {
          showNotification('error', 'Erro ao carregar lista de inscritos.');
      } finally {
          setIsLoadingAttendees(false);
      }
  };

  const handleOpenEventDetails = (evt: Evento) => {
      setSelectedEventDetails(evt);
      setIsDetailModalOpen(true);
      setAttendeeSearch('');
      fetchAttendees(evt.id);
  };

  const handleSaveEvent = async () => {
      if (!eventForm.titulo || !eventForm.data_inicio) {
          showNotification('error', 'Título e Data de Início são obrigatórios.');
          return;
      }
      setIsSubmittingEvent(true);
      try {
          if (editingEventId) {
              const { error } = await supabase
                .from('eventos')
                .update({ ...eventForm })
                .eq('id', editingEventId);
              if (error) throw error;
              showNotification('success', 'Evento atualizado!');
          } else {
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

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Excluir este evento permanentemente?')) return;
    try {
        const { error } = await supabase.from('eventos').delete().eq('id', eventId);
        if (error) throw error;
        showNotification('success', 'Evento removido.');
        fetchData();
    } catch (e) {
        showNotification('error', 'Erro ao excluir.');
    }
  };

  const handleEditEventClick = (e: React.MouseEvent, evt: Evento) => {
      e.stopPropagation();
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

  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploadingEventImg(true);
      try {
          const fileName = `event_${Date.now()}.${file.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage.from('imagensBlog').upload(`eventos/${fileName}`, file);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('imagensBlog').getPublicUrl(`eventos/${fileName}`);
          setEventForm(prev => ({ ...prev, imagem_capa: data.publicUrl }));
          showNotification('success', 'Imagem carregada!');
      } catch (error) {
          showNotification('error', 'Erro no upload.');
      } finally {
          setIsUploadingEventImg(false);
      }
  };

  const handleRegisterForEvent = async (evento: Evento) => {
    if (!user) return;
    setIsRegistering(evento.id);
    try {
        const { error } = await supabase.from('inscricoes').insert([{
            evento_id: evento.id,
            user_id: user.id,
            status: 'confirmado'
        }]);
        if (error) throw error;
        showNotification('success', 'Ingresso garantido com sucesso!');
        fetchData(); 
    } catch (e: any) {
        showNotification('error', 'Erro ao realizar inscrição.');
    } finally {
        setIsRegistering(null);
    }
  };

  const handleAgendaCardClick = (evt: Evento) => {
    const ticket = myTickets.find(t => t.evento_id === evt.id);
    if (ticket) {
        setSelectedTicketForModal(ticket);
        setSelectedEventForModal(evt);
        setIsUserTicketModalOpen(true);
    } else {
        setSelectedEventForModal(evt);
        setIsUserTicketModalOpen(true);
    }
  };

  const filteredAttendees = eventAttendees.filter(a => 
      a.users?.nome?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      a.users?.email?.toLowerCase().includes(attendeeSearch.toLowerCase())
  );

  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
    { id: 'agenda', icon: CalendarRange, label: 'Agenda de Eventos' },
    { id: 'my_events', icon: Ticket, label: 'Meus Eventos' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex font-sans overflow-hidden relative">
      
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
      <div className="w-72 bg-slate-50 dark:bg-white/[0.03] backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-3xl h-[calc(100vh-2rem)] shadow-sm">
        <div className="h-24 flex items-center px-8 cursor-pointer" onClick={() => setActiveTab('overview')}><Logo dark={theme === 'dark'} /></div>
        <div className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-medium ${activeTab === item.id ? 'bg-brand-green text-black' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
          {user?.governanca && (
             <>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-2 mx-4"></div>
                <div className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Governança</div>
                <button onClick={() => setActiveTab('events_manage')} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-medium ${activeTab === 'events_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white transition-colors'}`}>
                  <Calendar size={20} /> <span>Gestão de Eventos</span>
                </button>
             </>
          )}
        </div>
        <div className="p-4"><button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors font-medium"><LogOut size={20} /> Sair</button></div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab === 'events_manage' ? 'Gestão de Eventos' : activeTab.replace('_', ' ')}</h2>
          <div className="flex items-center gap-4">
               <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
               <button onClick={onProfileClick} className="w-10 h-10 rounded-full bg-brand-green overflow-hidden border-2 border-slate-200 dark:border-white/10 transition-transform hover:scale-105">
                    {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto text-black" size={20}/>}
               </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth">
            {activeTab === 'overview' && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="bg-gradient-to-r from-brand-green/10 to-blue-500/10 dark:from-brand-green/20 dark:to-blue-900/20 rounded-3xl p-10 border border-slate-200 dark:border-white/10 relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold mb-4">Olá, {user?.nome.split(' ')[0]}!</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl">Bem-vindo ao centro de comando do INOVAP. Gerencie seus eventos e acompanhe o ecossistema.</p>
                        </div>
                        <div className="absolute right-[-5%] top-[-10%] w-64 h-64 bg-brand-neon/10 rounded-full blur-3xl"></div>
                    </div>
                </div>
            )}

            {activeTab === 'agenda' && (
                <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableEvents.map(evt => {
                        const isRegistered = myTickets.some(t => t.evento_id === evt.id);
                        return (
                            <div 
                                key={evt.id} 
                                onClick={() => handleAgendaCardClick(evt)}
                                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col hover:border-brand-neon/30 transition-all shadow-sm group cursor-pointer"
                            >
                                <div className="h-44 bg-slate-900 relative">
                                    {evt.imagem_capa && <img src={evt.imagem_capa} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />}
                                    <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-brand-neon uppercase tracking-widest">{evt.tipo}</span>
                                    {isRegistered && (
                                        <div className="absolute top-4 right-4 p-2 bg-brand-green text-black rounded-full shadow-lg animate-float">
                                            <QrCode size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-brand-green transition-colors">{evt.titulo}</h3>
                                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 font-light">{evt.descricao}</p>
                                    <div className="mt-auto space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <MapPin size={14} className="text-brand-green" /> {evt.local}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRegisterForEvent(evt); }}
                                            disabled={isRegistered || isRegistering === evt.id}
                                            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isRegistered ? 'bg-brand-green/10 text-brand-green cursor-default' : 'bg-brand-neon text-black hover:scale-[1.02]'}`}
                                        >
                                            {isRegistering === evt.id ? <Loader2 size={18} className="animate-spin" /> : (isRegistered ? <CheckCircle size={18}/> : <Ticket size={18}/>)}
                                            {isRegistered ? 'Ver Ingresso' : 'Garantir Ingresso'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

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
                                <div 
                                    key={ticket.id} 
                                    onClick={() => handleAgendaCardClick(ticket.evento as Evento)}
                                    className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col sm:flex-row shadow-xl cursor-pointer hover:border-brand-neon/30 transition-all"
                                >
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

            {activeTab === 'events_manage' && user?.governanca && (
                <div className="animate-fade-in-up space-y-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold">Monitor de Eventos</h3>
                            <p className="text-sm text-slate-500">Gestão centralizada de inscritos e presenças.</p>
                        </div>
                        <button onClick={() => setIsEventModalOpen(true)} className="bg-brand-neon text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-brand-neon/20 hover:scale-105 transition-all">
                            <Plus size={20} /> Novo Evento
                        </button>
                    </div>

                    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Informações do Evento</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ocupação</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                                {managedEvents.map(evt => (
                                    <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer group" onClick={() => handleOpenEventDetails(evt)}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green group-hover:bg-brand-green group-hover:text-black transition-all">
                                                    <Calendar size={20}/>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-green transition-colors">{evt.titulo}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                        <Clock size={12}/> {new Date(evt.data_inicio).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                                <Users2 size={14} className="text-brand-green"/>
                                                <span className="text-xs font-bold">{evt.vagas} Vagas</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenEventDetails(evt); startScanner(); }} className="p-2 text-brand-neon hover:bg-brand-neon/10 rounded-lg transition-all" title="Scan QR"><ScanLine size={20}/></button>
                                                <button onClick={(e) => handleEditEventClick(e, evt)} className="p-2 text-slate-400 hover:text-brand-neon transition-colors" title="Editar"><Edit3 size={18}/></button>
                                                <button onClick={(e) => {e.stopPropagation(); handleDeleteEvent(evt.id);}} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Remover"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
      </div>

      {/* MODAL DETALHES DO TICKET (USUÁRIO) */}
      {isUserTicketModalOpen && selectedEventForModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setIsUserTicketModalOpen(false)}></div>
              <div className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
                  <div className="h-48 bg-slate-900 relative">
                      {selectedEventForModal.imagem_capa && <img src={selectedEventForModal.imagem_capa} className="w-full h-full object-cover opacity-80" />}
                      <button onClick={() => setIsUserTicketModalOpen(false)} className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-md rounded-full text-white"><X size={20} /></button>
                  </div>
                  <div className="p-8 text-center -mt-8 bg-white dark:bg-[#0a0a0a] rounded-t-[3rem] relative z-10 flex flex-col items-center">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{selectedEventForModal.titulo}</h3>
                      <p className="text-slate-500 text-sm mb-8 line-clamp-2 px-4">{selectedEventForModal.descricao}</p>

                      {selectedTicketForModal ? (
                          <div className="w-full space-y-8 flex flex-col items-center">
                              <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex items-center justify-center">
                                  <QRCode value={selectedTicketForModal.id} size={200} bgColor="#ffffff" fgColor="#000000" />
                              </div>
                              <div className="p-4 rounded-2xl bg-brand-green/10 border border-brand-green/20 text-center w-full">
                                  <div className="text-[10px] font-bold text-brand-green uppercase tracking-[0.2em] mb-1">Status</div>
                                  <div className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                                      {selectedTicketForModal.status === 'checkin_realizado' ? 'Check-in Realizado' : 'Ingresso Válido'}
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="w-full py-12 px-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 text-center">
                              <Info size={40} className="mx-auto text-slate-400 mb-4" />
                              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sem ingresso ativo</h4>
                              <button onClick={() => handleRegisterForEvent(selectedEventForModal)} disabled={isRegistering === selectedEventForModal.id} className="mt-4 bg-brand-neon text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto">
                                  {isRegistering === selectedEventForModal.id ? <Loader2 size={18} className="animate-spin" /> : <Ticket size={18}/>}
                                  Garantir Ingresso
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL GESTÃO DETALHADA (GOVERNANÇA) */}
      {isDetailModalOpen && selectedEventDetails && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-fade-in" onClick={() => { setIsDetailModalOpen(false); stopScanner(); }}></div>
              <div className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[92vh]">
                  
                  {/* Header Detalhado */}
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/60 backdrop-blur-md relative overflow-hidden">
                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-brand-neon/10 border border-brand-neon/30 text-brand-neon text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">{selectedEventDetails.tipo}</span>
                              <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={12}/> {selectedEventDetails.local}</span>
                          </div>
                          <h3 className="text-3xl font-bold text-white tracking-tight">{selectedEventDetails.titulo}</h3>
                      </div>
                      <button onClick={() => { setIsDetailModalOpen(false); stopScanner(); }} className="p-3 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                          <X size={28} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                      {/* Lista de Inscritos */}
                      <div className="flex-1 overflow-hidden flex flex-col p-8 border-r border-white/5">
                          <div className="flex items-center justify-between mb-8 gap-4">
                              <div className="flex items-center gap-4">
                                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Inscritos</h4>
                                  <span className="px-2 py-0.5 bg-white/5 rounded text-brand-neon text-xs font-mono">{eventAttendees.length}</span>
                              </div>
                              <div className="relative flex-1 max-w-xs">
                                  <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                  <input 
                                      type="text" 
                                      placeholder="Filtrar inscritos..." 
                                      value={attendeeSearch}
                                      onChange={(e) => setAttendeeSearch(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-brand-neon transition-all" 
                                  />
                              </div>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                              {isLoadingAttendees ? (
                                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                                      <Loader2 size={32} className="animate-spin text-brand-green" />
                                      <span className="text-slate-500 text-sm">Carregando lista...</span>
                                  </div>
                              ) : (
                                  <>
                                      {filteredAttendees.map(att => (
                                          <div key={att.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all hover:border-brand-green/20">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-11 h-11 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-neon font-bold text-lg">
                                                      {att.users?.avatar ? <img src={att.users.avatar} className="w-full h-full object-cover rounded-full" /> : att.users?.nome?.charAt(0).toUpperCase()}
                                                  </div>
                                                  <div>
                                                      <div className="text-sm font-bold text-white group-hover:text-brand-green transition-colors">{att.users?.nome}</div>
                                                      <div className="text-[10px] text-slate-500 font-mono">{att.users?.email}</div>
                                                  </div>
                                              </div>
                                              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${att.status === 'checkin_realizado' ? 'bg-brand-green/10 text-brand-neon border border-brand-green/20' : 'bg-slate-800/50 text-slate-500 border border-white/5'}`}>
                                                  {att.status === 'checkin_realizado' ? <><CheckSquare size={12}/> Presente</> : 'Confirmado'}
                                              </div>
                                          </div>
                                      ))}
                                      {filteredAttendees.length === 0 && <div className="text-center py-20 text-slate-600 italic text-sm">Nenhum resultado encontrado.</div>}
                                  </>
                              )}
                          </div>
                      </div>

                      {/* Controle de Scanner */}
                      <div className="w-full md:w-[360px] bg-white/[0.01] p-8 flex flex-col gap-8">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 text-center">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Inscritos</div>
                                  <div className="text-2xl font-bold text-white font-mono">{eventAttendees.length}</div>
                              </div>
                              <div className="bg-brand-neon/5 rounded-2xl p-5 border border-brand-neon/20 text-center">
                                  <div className="text-[10px] font-bold text-brand-neon uppercase tracking-widest mb-1">Presenças</div>
                                  <div className="text-2xl font-bold text-brand-neon font-mono">{eventAttendees.filter(a => a.status === 'checkin_realizado').length}</div>
                              </div>
                          </div>

                          <div className="bg-black/60 border border-white/10 rounded-3xl p-6 text-center shadow-inner">
                              {!isScanning ? (
                                  <button onClick={startScanner} className="w-full bg-brand-neon text-black py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-brand-neon/10">
                                      <Camera size={20} /> Iniciar Scanner Portaria
                                  </button>
                              ) : (
                                  <div className="space-y-4 animate-fade-in">
                                      <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-brand-neon shadow-[0_0_20px_rgba(0,255,157,0.2)]"></div>
                                      <button onClick={stopScanner} className="w-full py-3 text-red-500 text-xs font-bold uppercase tracking-widest">Fechar Câmera</button>
                                  </div>
                              )}
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                              <div className="flex items-center gap-3 text-brand-neon mb-4">
                                  <QrCode size={18} />
                                  <span className="font-bold text-xs uppercase tracking-widest">Entrada Manual</span>
                              </div>
                              <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="UUID do Ticket..." 
                                    value={manualTicketId}
                                    onChange={(e) => setManualTicketId(e.target.value)}
                                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-neon" 
                                  />
                                  <button onClick={() => handleCheckIn(manualTicketId)} className="bg-brand-neon text-black p-3 rounded-xl hover:scale-105 transition-all"><ChevronRight size={18}/></button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* EVENT MODAL (CRIAÇÃO/EDIÇÃO) */}
      {isEventModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={closeEventModal}></div>
              <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3"><Calendar className="text-brand-neon" /> {editingEventId ? 'Editar Evento' : 'Novo Evento'}</h3>
                      <button onClick={closeEventModal} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                  </div>
                  <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Título do Evento</label>
                              <input type="text" value={eventForm.titulo} onChange={(e) => setEventForm({...eventForm, titulo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all" />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Descrição</label>
                              <textarea value={eventForm.descricao} onChange={(e) => setEventForm({...eventForm, descricao: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all resize-none" />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Data e Hora</label>
                              <input type="datetime-local" value={eventForm.data_inicio} onChange={(e) => setEventForm({...eventForm, data_inicio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon" />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Vagas</label>
                              <input type="number" value={eventForm.vagas} onChange={(e) => setEventForm({...eventForm, vagas: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white" />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Local</label>
                              <input type="text" value={eventForm.local} onChange={(e) => setEventForm({...eventForm, local: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white" />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Imagem (URL)</label>
                              <div className="flex gap-2">
                                  <input type="text" value={eventForm.imagem_capa} onChange={(e) => setEventForm({...eventForm, imagem_capa: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs" />
                                  <button onClick={() => eventImageInputRef.current?.click()} className="p-3 bg-brand-neon/10 border border-brand-neon/30 text-brand-neon rounded-2xl hover:bg-brand-neon hover:text-black transition-all">{isUploadingEventImg ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}</button>
                                  <input type="file" ref={eventImageInputRef} className="hidden" accept="image/*" onChange={handleEventImageUpload} />
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="p-8 bg-white/5 flex justify-end gap-4">
                      <button onClick={closeEventModal} className="px-6 py-3 font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
                      <button onClick={handleSaveEvent} disabled={isSubmittingEvent} className="bg-brand-neon text-black px-10 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-brand-neon/20">
                          {isSubmittingEvent ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                          Salvar Evento
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
