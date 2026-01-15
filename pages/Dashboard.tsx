
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Logo } from '../components/ui/Logo';
import { 
  LayoutDashboard, Users, LogOut, ShieldCheck, PlusCircle, 
  CheckCircle, AlertCircle, Search, ArrowRight, ArrowLeft, 
  Users2, Crown, Boxes, UserMinus, Loader2, Star, TrendingUp, 
  CalendarRange, Ticket, ScanLine, Menu as MenuIcon, Trophy,
  BookOpen, MapPin, Search as SearchIcon, X, BarChart3, 
  ShieldAlert, Settings, Info, History, Coins, Edit3, 
  CheckSquare, FileText, ExternalLink, Zap, Clock, Save, Camera as CameraIcon,
  Eye, ThumbsUp, Trash2, User as UserIcon, QrCode as QrIcon,
  Bold, Italic, List, ListOrdered, Heading1, Heading2, ImageIcon, Type, Tags, Send,
  CalendarDays, Users as UsersIcon, ChevronRight, Lock, Filter,
  CheckSquare as TaskIcon, ListTodo, CalendarClock, UserCheck,
  LayoutList, Calendar, ChevronLeft, Paperclip, MessageSquare, Download,
  ChevronRight as ChevronRightIcon,
  Sun, Moon
} from 'lucide-react';
import { User, GT, Artigo, Evento, Inscricao, Cargo, PontuacaoRegra, PontuacaoLog, Empresa, Tarefa, TarefaComentario } from '../types';
import { supabase } from '../services/supabase';
import QRCode from 'react-qr-code';
import { Html5Qrcode } from 'html5-qrcode';

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
  onProfileClick: () => void;
  onViewCompany: (empresa: Empresa) => void;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'agenda' | 'my_events' | 'articles_manage' | 'users_manage' | 'gts_manage' | 'gamification' | 'checkin' | 'tasks';
type CalendarType = 'month' | 'week' | 'day';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, onProfileClick, onViewCompany }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');

  // Data States
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [gts, setGts] = useState<GT[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [eventStats, setEventStats] = useState<Record<number, number>>({});
  const [myTickets, setMyTickets] = useState<Inscricao[]>([]);
  const [myArticles, setMyArticles] = useState<Artigo[]>([]);
  const [rules, setRules] = useState<PontuacaoRegra[]>([]);
  const [logs, setLogs] = useState<PontuacaoLog[]>([]);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  
  // Admin States
  const [allArticles, setAllArticles] = useState<Artigo[]>([]);
  const [articleFilter, setArticleFilter] = useState<'pending' | 'active'>('pending');
  const [selectedArticleForReview, setSelectedArticleForReview] = useState<Artigo | null>(null);
  const [selectedGtForManagement, setSelectedGtForManagement] = useState<GT | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  // GT Management Specific States
  const [isAddingGt, setIsAddingGt] = useState(false);
  const [newGtName, setNewGtName] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Members Screen States
  const [selectedMemberForGts, setSelectedMemberForGts] = useState<User | null>(null);

  // Task Screen States
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarViewType, setCalendarViewType] = useState<CalendarType>('month');
  const [calendarAnchorDate, setCalendarAnchorDate] = useState(new Date());
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Tarefa | null>(null);
  const [taskComments, setTaskComments] = useState<TarefaComentario[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isUploadingAnexo, setIsUploadingAnexo] = useState(false);
  const anexoInputRef = useRef<HTMLInputElement>(null);

  const [taskFilters, setTaskFilters] = useState({
    gt: 'all' as number | 'all',
    user: 'all' as number | 'all'
  });
  const [newTaskData, setNewTaskData] = useState<Partial<Tarefa>>({
    titulo: '',
    descricao: '',
    responsavel_id: undefined,
    gt_id: undefined,
    prazo: '',
    status: 'Pendente'
  });

  // My Articles Specific States
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [newArticleData, setNewArticleData] = useState({
    titulo: '',
    subtitulo: '',
    conteudo: '',
    capa: '',
    tags: [] as string[]
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const articleCoverInputRef = useRef<HTMLInputElement>(null);

  // Ticket States
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<Inscricao | null>(null);

  // Agenda States
  const [selectedEventDetails, setSelectedEventDetails] = useState<Evento | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>(new Date().getFullYear());

  // Gamification Edit States
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Check-in States
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [gtsRes, usersRes, eventsRes, ticketsRes, articlesRes, rulesRes, logsRes, inscriptionsCountRes, tasksRes] = await Promise.all([
        supabase.from('gts').select('*').order('gt'),
        supabase.from('users').select('*').order('pontos', { ascending: false }),
        supabase.from('eventos').select('*').order('data_inicio', { ascending: true }),
        supabase.from('inscricoes').select('*, evento:eventos(*)').eq('user_id', user.id),
        supabase.from('artigos').select('*').eq('autor', user.uuid).order('created_at', { ascending: false }),
        supabase.from('pontuacao_regras').select('*').order('valor', { ascending: false }),
        supabase.from('pontuacao_logs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('inscricoes').select('evento_id'),
        supabase.from('tarefas').select('*, responsavel:users(*), gt:gts(*)').order('prazo', { ascending: true })
      ]);
      
      if (gtsRes.data) setGts(gtsRes.data);
      if (usersRes.data) {
        setMembers(usersRes.data);
        setRanking(usersRes.data);
      }
      if (eventsRes.data) setEvents(eventsRes.data);
      if (ticketsRes.data) setMyTickets(ticketsRes.data as any);
      if (articlesRes.data) setMyArticles(articlesRes.data);
      if (rulesRes.data) setRules(rulesRes.data);
      if (logsRes.data) setLogs(logsRes.data as any);
      if (tasksRes.data) setTasks(tasksRes.data as any);

      if (inscriptionsCountRes.data) {
        const stats: Record<number, number> = {};
        inscriptionsCountRes.data.forEach(ins => {
          stats[ins.evento_id] = (stats[ins.evento_id] || 0) + 1;
        });
        setEventStats(stats);
      }

      if (user.governanca) {
        const { data: allArts } = await supabase.from('artigos').select('*').order('created_at', { ascending: false });
        if (allArts) setAllArticles(allArts);
      }
    } catch (e) {
      console.error(e);
      showNotification('error', 'Erro ao sincronizar dados.');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Task Details Load
  useEffect(() => {
    if (selectedTaskDetail) {
      fetchComments(selectedTaskDetail.id);
    }
  }, [selectedTaskDetail]);

  const fetchComments = async (taskId: number) => {
    const { data } = await supabase.from('tarefa_comentarios').select('*, autor:users(*)').eq('tarefa_id', taskId).order('created_at', { ascending: true });
    setTaskComments(data || []);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedTaskDetail || !user) return;
    const { error } = await supabase.from('tarefa_comentarios').insert([{ tarefa_id: selectedTaskDetail.id, autor_id: user.id, conteudo: newComment }]);
    if (!error) { setNewComment(''); fetchComments(selectedTaskDetail.id); }
  };

  const handleAnexoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTaskDetail) return;
    setIsUploadingAnexo(true);
    try {
      const fileName = `task_${selectedTaskDetail.id}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('imagensBlog').upload(`anexosTarefas/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('imagensBlog').getPublicUrl(`anexosTarefas/${fileName}`);
      const novosAnexos = [...(selectedTaskDetail.anexos || []), { nome: file.name, url: publicUrl }];
      await supabase.from('tarefas').update({ anexos: novosAnexos }).eq('id', selectedTaskDetail.id);
      setSelectedTaskDetail({ ...selectedTaskDetail, anexos: novosAnexos });
      showNotification('success', 'Anexo adicionado!');
    } catch (e) { showNotification('error', 'Falha no upload.'); } finally { setIsUploadingAnexo(false); }
  };

  // Fix: handleUpdateTaskField now also updates selectedTaskDetail to reflect changes in the modal immediately
  const handleUpdateTaskField = async (taskId: number, field: string, value: any) => {
    const { error } = await supabase.from('tarefas').update({ [field]: value }).eq('id', taskId);
    if (!error) { 
      showNotification('success', 'Atualizado!'); 
      fetchData();
      if (selectedTaskDetail?.id === taskId) {
        setSelectedTaskDetail(prev => prev ? { ...prev, [field]: value } : null);
      }
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskData.titulo || !user) return;
    setIsProcessingAction(true);
    const { error } = await supabase.from('tarefas').insert([{ ...newTaskData, criado_por: user.uuid }]);
    if (!error) { showNotification('success', 'Tarefa criada!'); setIsAddingTask(false); fetchData(); }
    setIsProcessingAction(false);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Excluir esta tarefa?')) return;
    const { error } = await supabase.from('tarefas').delete().eq('id', taskId);
    if (!error) { showNotification('success', 'Removida!'); setSelectedTaskDetail(null); fetchData(); }
  };

  // Memoized Filters
  const filteredTasks = useMemo(() => tasks.filter(t => (taskFilters.gt === 'all' || t.gt_id === taskFilters.gt) && (taskFilters.user === 'all' || t.responsavel_id === taskFilters.user)), [tasks, taskFilters]);
  const mySortedTasks = useMemo(() => tasks.filter(t => t.responsavel_id === user?.id && t.status !== 'Concluído').sort((a, b) => (a.prazo && b.prazo) ? new Date(a.prazo).getTime() - new Date(b.prazo).getTime() : 0), [tasks, user]);
  const activeArticles = useMemo(() => allArticles.filter(a => a.aprovado), [allArticles]);
  const articlesInReview = useMemo(() => allArticles.filter(a => !a.aprovado), [allArticles]);
  const filteredArticlesForManage = useMemo(() => articleFilter === 'active' ? activeArticles : articlesInReview, [articleFilter, activeArticles, articlesInReview]);

  // Calendar Logic
  const navigateCalendar = (direction: number) => {
    const newDate = new Date(calendarAnchorDate);
    if (calendarViewType === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (calendarViewType === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setDate(newDate.getDate() + direction);
    setCalendarAnchorDate(newDate);
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const year = calendarAnchorDate.getFullYear();
    const month = calendarAnchorDate.getMonth();
    if (calendarViewType === 'month') {
      const first = new Date(year, month, 1).getDay();
      for (let i = first; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), currentPeriod: false });
      for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) days.push({ date: new Date(year, month, i), currentPeriod: true });
    } else if (calendarViewType === 'week') {
      const start = new Date(calendarAnchorDate);
      start.setDate(calendarAnchorDate.getDate() - calendarAnchorDate.getDay());
      for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push({ date: d, currentPeriod: true }); }
    } else { days.push({ date: new Date(calendarAnchorDate), currentPeriod: true }); }
    return days;
  }, [calendarAnchorDate, calendarViewType]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Tarefa[]> = {};
    filteredTasks.forEach(t => { if (t.prazo) { const k = new Date(t.prazo).toISOString().split('T')[0]; map[k] = [...(map[k] || []), t]; } });
    return map;
  }, [filteredTasks]);

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("taskId"));
    if (!isNaN(id)) await handleUpdateTaskField(id, 'prazo', date.toISOString().split('T')[0]);
  };

  // Article Actions
  const handleApproveArticle = async (id: number) => {
    setIsProcessingAction(true);
    const { error } = await supabase.from('artigos').update({ aprovado: true }).eq('id', id);
    if (!error) { showNotification('success', 'Aprovado!'); setSelectedArticleForReview(null); fetchData(); }
    setIsProcessingAction(false);
  };

  const handleSaveArticle = async () => {
    if (!newArticleData.titulo || !user) return;
    setIsProcessingAction(true);
    const { error } = await supabase.from('artigos').insert([{ ...newArticleData, autor: user.uuid, aprovado: false }]);
    if (!error) { showNotification('success', 'Enviado para revisão!'); setIsCreatingArticle(false); fetchData(); }
    setIsProcessingAction(false);
  };

  const handleArticleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data } = await supabase.storage.from('imagensBlog').upload(`artigos/${Date.now()}_${file.name}`, file);
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('imagensBlog').getPublicUrl(data.path);
      setNewArticleData({ ...newArticleData, capa: publicUrl });
    }
  };

  // Agenda Actions
  const handleWithdrawTicket = async (evt: Evento) => {
    if (!user) return;
    const { error } = await supabase.from('inscricoes').insert([{ evento_id: evt.id, user_id: user.id, status: 'confirmado' }]);
    if (!error) { showNotification('success', 'Ingresso retirado!'); fetchData(); }
  };

  const prioritizedEvents = useMemo(() => {
    let filtered = [...events];
    if (filterYear !== 'all') filtered = filtered.filter(e => new Date(e.data_inicio).getFullYear() === filterYear);
    if (filterMonth !== 'all') filtered = filtered.filter(e => new Date(e.data_inicio).getMonth() === filterMonth);
    return filtered.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
  }, [events, filterMonth, filterYear]);

  // Checkin Scanner
  const handleCheckin = async (id: string) => {
    const { data, error } = await supabase.from('inscricoes').update({ status: 'checkin_realizado', checkin_at: new Date().toISOString() }).eq('id', id).select('*, user:users(nome)').single();
    if (!error) showNotification('success', `Check-in: ${data.user.nome}`);
    else showNotification('error', 'Código de ingresso inválido ou já utilizado.');
  };

  const startScanner = () => setIsScanning(true);
  const stopScanner = () => { if (scannerRef.current) scannerRef.current.stop(); setIsScanning(false); };

  useEffect(() => {
    if (isScanning && activeTab === 'checkin') {
      const scanner = new Html5Qrcode("reader");
      scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => { handleCheckin(text); stopScanner(); }, () => {});
      scannerRef.current = scanner;
    }
    return () => { if (scannerRef.current) scannerRef.current.stop(); };
  }, [isScanning, activeTab]);

  // GT Management
  const handleCreateGt = async () => {
    if (!newGtName.trim()) return;
    const { error } = await supabase.from('gts').insert([{ gt: newGtName }]);
    if (!error) { showNotification('success', 'GT Criado!'); setIsAddingGt(false); setNewGtName(''); fetchData(); }
  };

  const handleAddMemberToGt = async (target: User, gtId?: number) => {
    const id = gtId || selectedGtForManagement?.id;
    if (!id) return;
    const { error } = await supabase.from('users').update({ gts: [...(target.gts || []), id] }).eq('id', target.id);
    if (!error) { showNotification('success', 'Adicionado!'); fetchData(); }
  };

  const handleRemoveMemberFromGt = async (target: User, gtId?: number) => {
    const id = gtId || selectedGtForManagement?.id;
    if (!id) return;
    const { error = null } = await supabase.from('users').update({ gts: target.gts?.filter(g => g !== id) }).eq('id', target.id);
    if (!error) { showNotification('success', 'Removido!'); fetchData(); }
  };

  // Gamification Actions
  const handleEditRule = (rule: PontuacaoRegra) => {
    setEditingRuleId(rule.id);
    setEditingValue(rule.valor.toString());
  };

  const handleSaveRule = async () => {
    if (editingRuleId === null) return;
    await supabase.from('pontuacao_regras').update({ valor: parseInt(editingValue) }).eq('id', editingRuleId);
    setEditingRuleId(null); fetchData();
  };

  const getGtNameById = (id: number) => gts.find(g => g.id === id)?.gt || `GT ${id}`;

  if (!user) return <div className="flex items-center justify-center h-screen bg-black text-white">Carregando...</div>;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black flex transition-colors duration-300">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050505] fixed h-full z-40">
        <div className="p-10 flex flex-col items-center">
          <Logo dark={theme === 'dark'} className="mb-4 scale-125" />
          <div className="mt-4 text-[11px] font-black uppercase tracking-[0.4em] text-brand-neon">PAINEL DE GESTÃO</div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-6 overflow-y-auto">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-4">MENU</div>
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'ranking', label: 'Ranking', icon: Star },
            { id: 'members', label: 'Membros', icon: Users },
            { id: 'tasks', label: 'Tarefas', icon: ListTodo },
            { id: 'agenda', label: 'Agenda', icon: CalendarRange },
            { id: 'articles', label: 'Meus Artigos', icon: FileText },
            { id: 'my_events', label: 'Ingressos', icon: Ticket }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === item.id ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
          
          {user.governanca && (
            <>
              <div className="pt-8 text-[10px] font-black text-brand-neon uppercase tracking-widest mb-4 px-4">GOVERNANÇA</div>
              {[
                { id: 'gts_manage', label: 'Gestão de GTs', icon: Boxes },
                { id: 'articles_manage', label: 'Aprovar Artigos', icon: CheckSquare },
                { id: 'gamification', label: 'Gamificação', icon: Trophy },
                { id: 'checkin', label: 'Check-in', icon: ScanLine }
              ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === item.id ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
                  <item.icon size={20} /> {item.label}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="p-8 border-t border-slate-200 dark:border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black text-red-500 hover:bg-red-500/10 transition-all"><LogOut size={20} /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 min-h-screen relative bg-white dark:bg-[#000]">
        <header className="sticky top-0 z-30 flex items-center justify-between px-10 py-6 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5">
           <div className="hidden lg:block text-slate-500 dark:text-slate-400 text-sm font-medium">Bem-vindo, <span className="text-slate-900 dark:text-white font-black">{user.nome}</span></div>
           <div className="flex items-center gap-4">
             <button 
                onClick={toggleTheme}
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                title={theme === 'dark' ? "Ativar Modo Diurno" : "Ativar Modo Noturno"}
             >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <button onClick={onProfileClick} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
               {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-500 dark:text-slate-300" />}
             </button>
           </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {notification && (
            <div className="fixed top-24 right-10 z-[100] animate-fade-in-up">
              <div className={`px-8 py-5 rounded-[1.5rem] shadow-2xl backdrop-blur-2xl border flex items-center gap-4 ${notification.type === 'success' ? 'bg-brand-green/20 border-brand-green text-brand-neon' : 'bg-red-500/20 border-red-500 text-red-200'}`}>
                {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                <span className="font-black text-sm uppercase tracking-wider">{notification.message}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <Loader2 className="animate-spin text-brand-neon" size={48} />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="bg-gradient-to-br from-brand-neon to-[#00aa68] p-10 rounded-[2.5rem] text-black relative overflow-hidden group">
                      <Trophy className="absolute -right-6 -bottom-6 opacity-20" size={140} />
                      <div className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-10">InovaPoints</div>
                      <div className="text-6xl font-black tracking-tighter">{user.pontos || 0}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/5 p-10 rounded-[2.5rem]">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-10">Grupos</div>
                      <div className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{user.gts?.length || 0}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/5 p-10 rounded-[2.5rem]">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-10">Artigos</div>
                      <div className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{user.artigos || 0}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/5 p-10 rounded-[2.5rem]">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-10">Ingressos</div>
                      <div className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{myTickets.length}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10">
                       <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-900 dark:text-white"><Star className="text-brand-neon" /> Lideranças</h3>
                       <div className="space-y-4">
                         {ranking.slice(0, 5).map((u, i) => (
                           <div key={u.id} className="flex items-center justify-between p-5 bg-white dark:bg-white/5 rounded-[1.5rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                             <div className="flex items-center gap-5">
                               <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-brand-neon text-black' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>{i + 1}</span>
                               <span className="font-bold text-slate-900 dark:text-white">{u.nome}</span>
                             </div>
                             <span className="text-brand-neon font-mono font-black">{u.pontos} pts</span>
                           </div>
                         ))}
                       </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10">
                       <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-900 dark:text-white"><TaskIcon className="text-brand-neon" /> Minhas Tarefas</h3>
                       <div className="space-y-4">
                         {mySortedTasks.slice(0, 5).map(task => (
                           <div key={task.id} onClick={() => setSelectedTaskDetail(task)} className="p-5 bg-white dark:bg-white/5 rounded-[1.5rem] border border-slate-200 dark:border-white/5 cursor-pointer group shadow-sm dark:shadow-none">
                             <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-neon transition-colors line-clamp-1">{task.titulo}</h4>
                             <div className="flex items-center gap-2 text-[10px] font-bold mt-2">
                               <CalendarClock size={12} className="text-brand-neon" />
                               <span className="text-slate-500 dark:text-slate-400">{task.prazo ? new Date(task.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                             </div>
                           </div>
                         ))}
                         {mySortedTasks.length === 0 && <p className="text-slate-400 dark:text-slate-600 text-center py-10 font-bold uppercase tracking-widest text-xs italic">Nenhuma pendente.</p>}
                       </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10">
                       <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-900 dark:text-white"><CalendarRange className="text-brand-neon" /> Agenda</h3>
                       <div className="space-y-4">
                         {events.slice(0, 5).map(evt => (
                           <div key={evt.id} className="p-5 bg-white dark:bg-white/5 rounded-[1.5rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                             <span className="text-[10px] font-black text-brand-neon uppercase">{evt.tipo}</span>
                             <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">{evt.titulo}</h4>
                             <div className="text-slate-500 dark:text-slate-500 text-xs mt-3 flex items-center gap-2"><MapPin size={14} /> {evt.local}</div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Meus Artigos Tab */}
              {activeTab === 'articles' && (
                <div className="space-y-12">
                   <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white"><FileText className="text-brand-neon" size={40} /> Meus Artigos</h2>
                        <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Compartilhe conhecimento com o ecossistema.</p>
                      </div>
                      <button onClick={() => setIsCreatingArticle(true)} className="bg-brand-neon text-black px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-black hover:text-white dark:hover:bg-white transition-all shadow-lg shadow-brand-neon/20"><PlusCircle size={20} /> ESCREVER ARTIGO</button>
                   </div>

                   {isCreatingArticle ? (
                      <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-12 space-y-8 animate-fade-in-up">
                         <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-900 dark:text-white">Novo Artigo</h3><button onClick={() => setIsCreatingArticle(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button></div>
                         <div className="space-y-6">
                            <input type="text" placeholder="Título impactante" value={newArticleData.titulo} onChange={(e) => setNewArticleData({...newArticleData, titulo: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-2xl font-black outline-none focus:border-brand-neon text-slate-900 dark:text-white" />
                            <input type="text" placeholder="Subtítulo curto" value={newArticleData.subtitulo} onChange={(e) => setNewArticleData({...newArticleData, subtitulo: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-600 dark:text-slate-400 outline-none focus:border-brand-neon" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div onClick={() => articleCoverInputRef.current?.click()} className="h-64 bg-white dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-brand-neon group transition-all">
                                  {newArticleData.capa ? <img src={newArticleData.capa} className="w-full h-full object-cover rounded-[2.5rem]" /> : <><ImageIcon className="text-slate-300 dark:text-slate-700 group-hover:text-brand-neon" size={48} /><p className="text-slate-500 mt-4 text-sm font-bold">Capa do Artigo</p></>}
                                  <input type="file" ref={articleCoverInputRef} className="hidden" onChange={handleArticleCoverUpload} />
                               </div>
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Conteúdo do Artigo (HTML permitido)</label>
                                  <textarea value={newArticleData.conteudo} onChange={(e) => setNewArticleData({...newArticleData, conteudo: e.target.value})} className="w-full h-52 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 outline-none focus:border-brand-neon resize-none font-mono text-sm text-slate-900 dark:text-white" placeholder="<p>Seu texto aqui...</p>" />
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-4 pt-8 border-t border-slate-200 dark:border-white/5"><button onClick={handleSaveArticle} disabled={isProcessingAction || !newArticleData.titulo} className="flex-1 bg-brand-neon text-black py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">PUBLICAR PARA REVISÃO</button></div>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {myArticles.map(art => (
                           <div key={art.id} className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden group shadow-sm dark:shadow-none">
                              <div className="h-40 bg-slate-200 dark:bg-slate-900 relative">{art.capa && <img src={art.capa} className="w-full h-full object-cover opacity-60" />}<div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white">{art.aprovado ? 'Aprovado' : 'Em Revisão'}</div></div>
                              <div className="p-8">
                                <h4 className="text-xl font-black mb-2 line-clamp-1 text-slate-900 dark:text-white">{art.titulo}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-2 mb-6">{art.subtitulo}</p>
                                <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-white/5 pt-4">{new Date(art.created_at).toLocaleDateString()}</div>
                              </div>
                           </div>
                         ))}
                         {myArticles.length === 0 && <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Nenhum artigo ainda.</div>}
                      </div>
                   )}
                </div>
              )}

              {/* Agenda Tab */}
              {activeTab === 'agenda' && (
                <div className="space-y-12">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                      <div>
                        <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white"><CalendarRange className="text-brand-neon" size={40} /> Próximas Experiências</h2>
                        <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Participe dos melhores momentos do Alto Paraopeba.</p>
                      </div>
                      <div className="flex gap-4 bg-slate-100 dark:bg-white/5 p-2 rounded-2xl border border-slate-200 dark:border-white/10">
                        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-transparent text-xs font-black uppercase p-2 focus:outline-none text-slate-700 dark:text-white"><option value="all">Mês</option>{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-transparent text-xs font-black uppercase p-2 focus:outline-none text-slate-700 dark:text-white"><option value="all">Ano</option><option value={2024}>2024</option><option value={2025}>2025</option></select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {prioritizedEvents.map(evt => {
                        const isInscribed = myTickets.some(t => t.evento_id === evt.id);
                        return (
                          <div key={evt.id} onClick={() => setSelectedEventDetails(evt)} className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden hover:border-brand-neon/30 transition-all cursor-pointer group shadow-sm dark:shadow-none">
                             <div className="h-44 bg-slate-200 dark:bg-slate-900 relative">
                               {evt.imagem_capa && <img src={evt.imagem_capa} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                               <div className="absolute top-4 left-4 flex gap-2">
                                  <span className="bg-black/60 px-3 py-1 rounded-full text-[8px] font-black uppercase text-brand-neon">
                                    {evt.tipo}
                                  </span>
                                  {isInscribed && <span className="bg-brand-neon text-black px-3 py-1 rounded-full text-[8px] font-black uppercase">Confirmado</span>}
                               </div>
                             </div>
                             <div className="p-8">
                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{new Date(evt.data_inicio).toLocaleDateString()} • {evt.local}</div>
                                <h3 className="text-xl font-black mb-4 group-hover:text-brand-neon transition-colors text-slate-900 dark:text-white">{evt.titulo}</h3>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/5">
                                   <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600">{evt.vagas ? `${(eventStats[evt.id] || 0)}/${evt.vagas} vagas` : 'Aberto'}</span>
                                   <span className="text-brand-neon font-black text-[10px] uppercase">Detalhes <ArrowRight size={14} className="inline ml-1" /></span>
                                </div>
                             </div>
                          </div>
                        )
                      })}
                   </div>

                   {selectedEventDetails && (
                     <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col animate-fade-in-up transition-colors duration-300">
                        <div className="h-20 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                          <button onClick={() => setSelectedEventDetails(null)} className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase font-black text-xs tracking-widest"><ArrowLeft size={20} /> Voltar</button>
                          {!myTickets.some(t => t.evento_id === selectedEventDetails.id) && (
                            <button onClick={() => handleWithdrawTicket(selectedEventDetails)} className="bg-brand-neon text-black px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"><Ticket size={20} /> RETIRAR INGRESSO</button>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 md:p-20">
                          <div className="max-w-4xl mx-auto space-y-12">
                             <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">{selectedEventDetails.titulo}</h1>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="prose dark:prose-invert prose-lg max-w-none"><p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedEventDetails.descricao}</p></div>
                                <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[2.5rem] space-y-6 border border-slate-200 dark:border-white/5">
                                   <div><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Localização</label><p className="font-bold text-xl text-slate-900 dark:text-white">{selectedEventDetails.local}</p></div>
                                   <div><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Data e Hora</label><p className="font-bold text-xl text-slate-900 dark:text-white">{new Date(selectedEventDetails.data_inicio).toLocaleString()}</p></div>
                                </div>
                             </div>
                          </div>
                        </div>
                     </div>
                   )}
                </div>
              )}

              {/* Ingressos Tab */}
              {activeTab === 'my_events' && (
                <div className="space-y-12">
                   <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white"><Ticket className="text-brand-neon" size={40} /> Meus Ingressos</h2>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {myTickets.map(ticket => (
                        <div key={ticket.id} onClick={() => setSelectedTicketForQr(ticket)} className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 hover:border-brand-neon cursor-pointer transition-all shadow-sm dark:shadow-none">
                           <div className="flex justify-between items-center mb-6"><div className="bg-brand-neon/10 text-brand-neon px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{ticket.status === 'checkin_realizado' ? 'Check-in OK' : 'Confirmado'}</div><QrIcon size={20} className="text-slate-400 dark:text-slate-700" /></div>
                           <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">{ticket.evento?.titulo}</h3>
                           <p className="text-slate-500 dark:text-slate-500 text-xs mb-8">{ticket.evento?.local}</p>
                           <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex items-center gap-2 text-brand-neon font-black text-[10px] uppercase tracking-widest">Exibir QR Code <ArrowRight size={14} /></div>
                        </div>
                      ))}
                      {myTickets.length === 0 && <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Sem ingressos.</div>}
                   </div>

                   {selectedTicketForQr && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                        <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl" onClick={() => setSelectedTicketForQr(null)}></div>
                        <div className="relative w-full max-w-md bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 flex flex-col items-center animate-fade-in-up">
                           <button onClick={() => setSelectedTicketForQr(null)} className="absolute top-8 right-8 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
                           <h3 className="text-3xl font-black text-center mb-10 text-slate-900 dark:text-white">{selectedTicketForQr.evento?.titulo}</h3>
                           <div className="bg-white p-6 rounded-[2.5rem] mb-10 border border-slate-200 dark:border-none shadow-xl"><QRCode value={selectedTicketForQr.id} size={250} /></div>
                           <p className="text-slate-500 dark:text-slate-500 text-center text-sm font-medium">Apresente este código no check-in do evento.</p>
                        </div>
                     </div>
                   )}
                </div>
              )}

              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-12">
                   <div className="flex justify-between items-end gap-8">
                      <div>
                        <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white"><ListTodo className="text-brand-neon" size={40} /> Gestão de Tarefas</h2>
                        <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Hélices do Alto Paraopeba em ação.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 flex">
                            <button onClick={() => setTaskViewMode('list')} className={`p-3 rounded-xl transition-all ${taskViewMode === 'list' ? 'bg-brand-neon text-black' : 'text-slate-400 dark:text-slate-500'}`}><LayoutList size={20} /></button>
                            <button onClick={() => setTaskViewMode('calendar')} className={`p-3 rounded-xl transition-all ${taskViewMode === 'calendar' ? 'bg-brand-neon text-black' : 'text-slate-400 dark:text-slate-500'}`}><Calendar size={20} /></button>
                        </div>
                        {user.governanca && (<button onClick={() => setIsAddingTask(true)} className="bg-brand-neon text-black px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"><PlusCircle size={20} /> NOVA TAREFA</button>)}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 p-6 rounded-[2rem]">
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Filtrar GT</label><select value={taskFilters.gt} onChange={(e) => setTaskFilters({...taskFilters, gt: e.target.value === 'all' ? 'all' : parseInt(e.target.value)})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"><option value="all">Todos</option>{gts.map(g => <option key={g.id} value={g.id}>{g.gt}</option>)}</select></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Filtrar Responsável</label><select value={taskFilters.user} onChange={(e) => setTaskFilters({...taskFilters, user: e.target.value === 'all' ? 'all' : parseInt(e.target.value)})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"><option value="all">Todos</option>{members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></div>
                   </div>

                   {taskViewMode === 'list' ? (
                     <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm dark:shadow-none">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                              <tr><th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Tarefa</th><th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th><th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Prazo</th></tr>
                          </thead>
                          <tbody>
                              {filteredTasks.map(t => (
                                <tr key={t.id} onClick={() => setSelectedTaskDetail(t)} className="border-b border-slate-200 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/[0.02] cursor-pointer group">
                                    <td className="px-10 py-8"><p className="font-black text-slate-900 dark:text-white text-lg group-hover:text-brand-neon transition-colors">{t.titulo}</p><p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t.gt?.gt || 'Geral'}</p></td>
                                    <td className="px-10 py-8"><div className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${t.status === 'Concluído' ? 'text-brand-neon border border-brand-neon/30 bg-brand-neon/5' : 'text-orange-500 dark:text-orange-400 border border-orange-500/30'}`}>{t.status}</div></td>
                                    <td className="px-10 py-8 text-slate-500 dark:text-slate-400 font-bold text-sm">{t.prazo ? new Date(t.prazo).toLocaleDateString() : '-'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                     </div>
                   ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 p-6 rounded-[2rem]">
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                                <button onClick={() => setCalendarViewType('month')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${calendarViewType === 'month' ? 'bg-brand-neon text-black' : 'text-slate-500'}`}>Mês</button>
                                <button onClick={() => setCalendarViewType('week')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${calendarViewType === 'week' ? 'bg-brand-neon text-black' : 'text-slate-500'}`}>Semana</button>
                                <button onClick={() => setCalendarViewType('day')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${calendarViewType === 'day' ? 'bg-brand-neon text-black' : 'text-slate-500'}`}>Dia</button>
                            </div>
                            <div className="flex items-center gap-4"><button onClick={() => navigateCalendar(-1)} className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"><ChevronLeft size={20} /></button><h4 className="text-xl font-black text-slate-900 dark:text-white min-w-[200px] text-center">{calendarAnchorDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4><button onClick={() => navigateCalendar(1)} className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"><ChevronRightIcon size={20} /></button></div>
                            <button onClick={() => setCalendarAnchorDate(new Date())} className="px-6 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black uppercase text-slate-700 dark:text-white">Hoje</button>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden p-8">
                            <div className={`grid ${calendarViewType === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-px bg-slate-200 dark:bg-white/10 rounded-2xl overflow-hidden`}>
                                {calendarDays.map((day, i) => {
                                    const key = day.date.toISOString().split('T')[0];
                                    const dayTasks = tasksByDay[key] || [];
                                    return (
                                        <div key={i} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, day.date)} className={`min-h-[140px] p-4 border-slate-200 dark:border-white/5 border bg-white dark:bg-[#0a0a0a] ${!day.currentPeriod ? 'opacity-20' : ''}`}>
                                            <div className="text-xs font-black text-slate-400 dark:text-slate-600 mb-2">{day.date.getDate()}</div>
                                            <div className="space-y-1">
                                                {dayTasks.map(t => (
                                                    <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("taskId", t.id.toString())} onClick={() => setSelectedTaskDetail(t)} className={`text-[8px] p-1.5 rounded bg-brand-neon/10 text-brand-neon border border-brand-neon/20 font-black cursor-pointer truncate`}>{t.titulo}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                   )}
                </div>
              )}

              {/* Modal Detalhes Tarefa */}
              {selectedTaskDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                  <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl" onClick={() => setSelectedTaskDetail(null)}></div>
                  <div className="relative w-full max-w-4xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl">
                    <button onClick={() => setSelectedTaskDetail(null)} className="absolute top-8 right-8 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
                    <div className="space-y-10">
                       <div><h3 className="text-4xl font-black text-slate-900 dark:text-white">{selectedTaskDetail.titulo}</h3><p className="text-slate-500 dark:text-slate-500 mt-2">{selectedTaskDetail.descricao || 'Sem descrição.'}</p></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                             <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10"><UserIcon size={20} className="text-slate-600 dark:text-slate-300" /></div><div><label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Responsável</label><p className="font-bold text-slate-900 dark:text-white">{selectedTaskDetail.responsavel?.nome || 'Ninguém'}</p></div></div>
                             <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand-neon border border-slate-200 dark:border-white/10"><CalendarClock size={20} /></div><div><label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Entrega</label><p className="font-bold text-slate-900 dark:text-white">{selectedTaskDetail.prazo ? new Date(selectedTaskDetail.prazo).toLocaleDateString() : 'A definir'}</p></div></div>
                             <div className="pt-6 border-t border-slate-200 dark:border-white/5">
                               <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block mb-4">Atualizar Status</label>
                               <div className="flex gap-2">
                                 {['Pendente', 'Em Andamento', 'Concluído'].map(s => (
                                   <button 
                                     key={s} 
                                     onClick={() => handleUpdateTaskField(selectedTaskDetail.id, 'status', s)} 
                                     className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedTaskDetail.status === s ? 'bg-brand-neon text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                   >
                                     {s}
                                   </button>
                                 ))}
                               </div>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2"><MessageSquare size={14} /> Discussão</label>
                             <div className="h-[250px] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 overflow-y-auto space-y-4">{taskComments.map(c => <div key={c.id} className="text-xs"><span className="font-black text-brand-neon block mb-1">{c.autor?.nome}</span><p className="bg-white dark:bg-white/5 p-3 rounded-xl rounded-tl-none text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-none shadow-sm dark:shadow-none">{c.conteudo}</p></div>)}</div>
                             <div className="relative"><input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handlePostComment()} placeholder="Escreva..." className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-xs pr-12 text-slate-900 dark:text-white" /><button onClick={handlePostComment} className="absolute right-4 top-4 text-brand-neon"><Send size={16} /></button></div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Nova Tarefa */}
              {isAddingTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                  <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl" onClick={() => setIsAddingTask(false)}></div>
                  <div className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl">
                    <button onClick={() => setIsAddingTask(false)} className="absolute top-8 right-8 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
                    <h3 className="text-3xl font-black mb-10 text-slate-900 dark:text-white">Nova Tarefa</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Título da Atividade</label>
                        <input type="text" value={newTaskData.titulo} onChange={(e) => setNewTaskData({...newTaskData, titulo: e.target.value})} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-900 dark:text-white outline-none focus:border-brand-neon" placeholder="Ex: Organizar Meetup Mensal" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">GT Responsável</label>
                          <select value={newTaskData.gt_id} onChange={(e) => setNewTaskData({...newTaskData, gt_id: parseInt(e.target.value)})} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-700 dark:text-white outline-none focus:border-brand-neon">
                            <option value="">Selecione o GT</option>
                            {gts.map(g => <option key={g.id} value={g.id}>{g.gt}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Membro Responsável</label>
                          <select value={newTaskData.responsavel_id} onChange={(e) => setNewTaskData({...newTaskData, responsavel_id: parseInt(e.target.value)})} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-700 dark:text-white outline-none focus:border-brand-neon">
                            <option value="">Selecione o Membro</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Prazo de Entrega</label>
                        <input type="date" value={newTaskData.prazo} onChange={(e) => setNewTaskData({...newTaskData, prazo: e.target.value})} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-700 dark:text-white outline-none focus:border-brand-neon" />
                      </div>
                      <button onClick={handleCreateTask} disabled={isProcessingAction} className="w-full bg-brand-neon text-black py-5 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all mt-6">CRIAR TAREFA</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Gamification Tab Content */}
              {activeTab === 'gamification' && (
                <div className="space-y-12">
                   <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                     <Trophy className="text-brand-neon" size={40} /> Gamificação e Score
                   </h2>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-12 shadow-sm dark:shadow-none">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-900 dark:text-white"><Settings size={24} className="text-brand-neon" /> Regras de Pontuação</h3>
                        <div className="space-y-4">
                          {rules.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between p-6 bg-white dark:bg-white/5 rounded-[1.5rem] border border-slate-200 dark:border-white/5 group relative overflow-hidden shadow-sm dark:shadow-none">
                               <span className="font-bold text-slate-700 dark:text-slate-300 text-lg">{rule.acao}</span>
                               <div className="flex items-center gap-3 relative z-10">
                                 {editingRuleId === rule.id ? (
                                   <div className="flex items-center gap-2 animate-fade-in-up">
                                      <input 
                                        type="number" 
                                        value={editingValue} 
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-20 bg-slate-100 dark:bg-black/50 border border-brand-neon/50 rounded-lg px-2 py-1 text-center font-mono font-black text-brand-neon focus:outline-none focus:ring-1 focus:ring-brand-neon"
                                        autoFocus
                                      />
                                      <button onClick={handleSaveRule} className="p-2 bg-brand-neon text-black rounded-lg hover:scale-110 transition-transform">
                                        <Save size={16} />
                                      </button>
                                      <button onClick={() => setEditingRuleId(null)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                        <X size={16} />
                                      </button>
                                   </div>
                                 ) : (
                                   <>
                                     <span className="bg-brand-neon/10 text-brand-neon px-5 py-2 rounded-xl font-mono font-black text-xl border border-brand-neon/20">+{rule.valor}</span>
                                     {user.governanca && (
                                       <button 
                                        onClick={() => handleEditRule(rule)} 
                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-neon transition-colors opacity-0 group-hover:opacity-100"
                                       >
                                         <Edit3 size={18} />
                                       </button>
                                     )}
                                   </>
                                 )}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-12 shadow-sm dark:shadow-none">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-900 dark:text-white"><History size={24} className="text-brand-neon" /> Extrato de Atividades</h3>
                        <div className="space-y-4">
                          {logs.map(log => (
                            <div key={log.id} className="p-5 bg-white dark:bg-white/5 rounded-[1.5rem] border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm dark:shadow-none">
                               <div>
                                 <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{log.motivo || 'Atribuição Automática'}</p>
                                 <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                               </div>
                               <span className="text-brand-green font-black text-xl">+{log.pontos_atribuidos}</span>
                            </div>
                          ))}
                          {logs.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-center py-10 font-bold">Nenhuma atividade pontuada ainda.</p>}
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Gestão de Artigos Tab (Admin) */}
              {activeTab === 'articles_manage' && user.governanca && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                        <CheckSquare className="text-brand-neon" size={40} /> Curadoria de Conteúdo
                      </h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Valide o conhecimento que entra no ecossistema.</p>
                    </div>
                    <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                      <button 
                        onClick={() => setArticleFilter('pending')} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${articleFilter === 'pending' ? 'bg-brand-neon text-black' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        Pendentes ({articlesInReview.length})
                      </button>
                      <button 
                        onClick={() => setArticleFilter('active')} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${articleFilter === 'active' ? 'bg-brand-neon text-black' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        Ativos ({activeArticles.length})
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm dark:shadow-none">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Artigo</th>
                          <th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArticlesForManage.map(art => (
                          <tr key={art.id} className="border-b border-slate-200 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-6">
                                <div className="w-20 h-12 bg-slate-200 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-300 dark:border-white/5 flex-shrink-0">
                                  {art.capa ? <img src={art.capa} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-slate-400 dark:text-slate-700" /></div>}
                                </div>
                                <div>
                                  <h4 className="font-black text-slate-900 dark:text-white text-lg">{art.titulo}</h4>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Por ID: {art.autor.substring(0,8)}... • {new Date(art.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8 text-right">
                              <div className="flex justify-end gap-3">
                                <button 
                                  onClick={() => setSelectedArticleForReview(art)}
                                  className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
                                  title="Visualizar Conteúdo"
                                >
                                  <Eye size={18} />
                                </button>
                                {!art.aprovado && (
                                  <button 
                                    onClick={() => handleApproveArticle(art.id)}
                                    disabled={isProcessingAction}
                                    className="px-6 py-2 bg-brand-neon text-black rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg shadow-brand-neon/20"
                                  >
                                    Aprovar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredArticlesForManage.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-10 py-20 text-center text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] text-xs italic">
                              Nenhum artigo encontrado nesta categoria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal de Revisão */}
                  {selectedArticleForReview && (
                    <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col animate-fade-in-up transition-colors duration-300">
                      <div className="h-20 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                        <button onClick={() => setSelectedArticleForReview(null)} className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase font-black text-xs tracking-widest">
                          <ArrowLeft size={20} /> Fechar
                        </button>
                        {!selectedArticleForReview.aprovado && (
                          <button 
                            onClick={() => handleApproveArticle(selectedArticleForReview.id)}
                            disabled={isProcessingAction}
                            className="bg-brand-neon text-black px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                          >
                            <CheckCircle size={20} /> APROVAR AGORA
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto p-10 md:p-20">
                        <div className="max-w-4xl mx-auto space-y-12">
                          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">{selectedArticleForReview.titulo}</h1>
                          <p className="text-2xl text-slate-500 dark:text-slate-400 font-medium">{selectedArticleForReview.subtitulo}</p>
                          {selectedArticleForReview.capa && (
                            <div className="w-full h-[400px] rounded-[3rem] overflow-hidden border border-slate-200 dark:border-white/10">
                              <img src={selectedArticleForReview.capa} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="prose dark:prose-invert prose-lg max-w-none">
                            <div className="text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: selectedArticleForReview.conteudo }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gestão GTs */}
              {activeTab === 'gts_manage' && user.governanca && (
                <div className="space-y-12">
                   <div className="flex justify-between items-center"><h2 className="text-4xl font-black flex items-center gap-4 text-slate-900 dark:text-white"><Boxes className="text-brand-neon" size={40} /> Gestão de GTs</h2><button onClick={() => setIsAddingGt(true)} className="bg-brand-neon text-black px-6 py-3 rounded-xl font-black shadow-lg">NOVO GT</button></div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {gts.map(gt => (
                        <div key={gt.id} onClick={() => setSelectedGtForManagement(gt)} className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 hover:border-brand-neon cursor-pointer transition-all shadow-sm dark:shadow-none">
                           <div className="w-12 h-12 bg-brand-neon/10 rounded-xl flex items-center justify-center text-brand-neon mb-6"><Boxes size={24} /></div>
                           <h3 className="text-2xl font-black text-slate-900 dark:text-white">{gt.gt}</h3>
                           <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Clique para gerenciar membros.</p>
                        </div>
                      ))}
                   </div>

                   {/* Modal Novo GT */}
                   {isAddingGt && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                        <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl" onClick={() => setIsAddingGt(false)}></div>
                        <div className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl">
                           <button onClick={() => setIsAddingGt(false)} className="absolute top-8 right-8 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
                           <h3 className="text-3xl font-black mb-10 text-slate-900 dark:text-white">Novo GT</h3>
                           <div className="space-y-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Nome do Grupo de Trabalho</label>
                                 <input type="text" value={newGtName} onChange={(e) => setNewGtName(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-900 dark:text-white outline-none focus:border-brand-neon" placeholder="Ex: GT de Inteligência Artificial" />
                              </div>
                              <button onClick={handleCreateGt} disabled={!newGtName.trim()} className="w-full bg-brand-neon text-black py-5 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all">CRIAR GRUPO</button>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Modal Gerenciar GT Específico */}
                   {selectedGtForManagement && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                        <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl" onClick={() => setSelectedGtForManagement(null)}></div>
                        <div className="relative w-full max-w-4xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-12 max-h-[90vh] overflow-y-auto shadow-2xl">
                           <button onClick={() => setSelectedGtForManagement(null)} className="absolute top-8 right-8 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
                           <div className="flex items-center gap-6 mb-12">
                              <div className="w-20 h-20 bg-brand-neon/10 rounded-3xl flex items-center justify-center text-brand-neon border border-brand-neon/20"><Boxes size={40} /></div>
                              <div>
                                 <h3 className="text-4xl font-black text-slate-900 dark:text-white">{selectedGtForManagement.gt}</h3>
                                 <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Gerenciamento de Membros e Projetos</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                 <h4 className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white"><Users2 className="text-brand-neon" /> Membros Ativos</h4>
                                 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                    {members.filter(m => m.gts?.includes(selectedGtForManagement.id)).map(member => (
                                       <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 group shadow-sm dark:shadow-none">
                                          <div className="flex items-center gap-4">
                                             <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-black border border-slate-300 dark:border-white/10 overflow-hidden">
                                                {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto mt-3 text-slate-400 dark:text-slate-600" />}
                                             </div>
                                             <span className="font-bold text-sm text-slate-900 dark:text-white">{member.nome}</span>
                                          </div>
                                          <button onClick={() => handleRemoveMemberFromGt(member)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><UserMinus size={18} /></button>
                                       </div>
                                    ))}
                                    {members.filter(m => m.gts?.includes(selectedGtForManagement.id)).length === 0 && (
                                       <p className="text-slate-400 dark:text-slate-600 italic text-sm py-10 text-center">Nenhum membro vinculado a este GT.</p>
                                    )}
                                 </div>
                              </div>

                              <div className="space-y-8">
                                 <h4 className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white"><PlusCircle className="text-brand-neon" /> Adicionar Membro</h4>
                                 <div className="space-y-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-500">Selecione um membro da comunidade para vincular a este grupo.</p>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                       {members.filter(m => !m.gts?.includes(selectedGtForManagement.id)).map(member => (
                                          <button key={member.id} onClick={() => handleAddMemberToGt(member)} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-brand-neon/50 hover:bg-brand-neon/5 transition-all text-left group shadow-sm dark:shadow-none">
                                             <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-black border border-slate-300 dark:border-white/10 overflow-hidden">
                                                   {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto mt-3 text-slate-400 dark:text-slate-600" />}
                                                </div>
                                                <div>
                                                   <span className="font-bold text-sm text-slate-900 dark:text-white block">{member.nome}</span>
                                                   <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{member.email}</span>
                                                </div>
                                             </div>
                                             <ArrowRight size={16} className="text-brand-neon group-hover:translate-x-1 transition-transform" />
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              )}

              {/* Check-in Tab */}
              {activeTab === 'checkin' && user.governanca && (
                <div className="space-y-12">
                   <div className="flex justify-between items-end gap-8">
                      <div>
                        <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                          <ScanLine className="text-brand-neon" size={40} /> Controle de Check-in
                        </h2>
                        <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Valide a presença dos membros nos eventos oficiais.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-12 flex flex-col items-center justify-center min-h-[500px] shadow-sm dark:shadow-none">
                         {!isScanning ? (
                           <div className="text-center space-y-8 animate-fade-in-up">
                              <div className="w-24 h-24 bg-brand-neon/10 rounded-3xl flex items-center justify-center text-brand-neon mx-auto mb-6">
                                 <QrIcon size={48} />
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Pronto para escanear?</h3>
                              <p className="text-slate-500 dark:text-slate-500 max-w-xs mx-auto">Posicione o QR Code do ingresso do membro em frente à câmera para validar a entrada.</p>
                              <button 
                                onClick={startScanner}
                                className="bg-brand-neon text-black px-12 py-5 rounded-2xl font-black shadow-[0_20px_40px_rgba(0,255,157,0.2)] hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                              >
                                <CameraIcon size={24} /> INICIAR CÂMERA
                              </button>
                           </div>
                         ) : (
                           <div className="w-full space-y-6 animate-fade-in-up">
                              <div id="reader" className="overflow-hidden rounded-[2rem] border-2 border-brand-neon/30 bg-white dark:bg-black aspect-square max-w-sm mx-auto shadow-2xl"></div>
                              <button 
                                onClick={stopScanner}
                                className="w-full max-w-sm mx-auto bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-xl font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                              >
                                <X size={20} /> PARAR SCANNER
                              </button>
                           </div>
                         )}
                      </div>

                      <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-12 shadow-sm dark:shadow-none">
                         <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-slate-900 dark:text-white">
                           <History size={24} className="text-brand-neon" /> Check-ins Recentes
                         </h3>
                         <div className="space-y-4">
                            <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem]">
                               <CheckCircle size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                               <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">Os check-ins validados aparecerão aqui em tempo real.</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Ranking Tab */}
              {activeTab === 'ranking' && (
                <div className="space-y-8">
                  <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Ranking do Ecossistema</h2>
                  <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm dark:shadow-none">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                        <tr><th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Posição</th><th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Membro</th><th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Impacto (Pts)</th></tr>
                      </thead>
                      <tbody>
                        {ranking.map((u, i) => (
                          <tr key={u.id} className="border-b border-slate-200 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="px-10 py-8"><span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i === 0 ? 'bg-brand-neon text-black' : 'text-slate-400 dark:text-slate-500'}`}>{i + 1}</span></td>
                            <td className="px-10 py-8"><div className="flex items-center gap-5"><div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10">{u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <Users size={20} className="text-slate-400 dark:text-slate-600" />}</div><span className="font-black text-slate-900 dark:text-white">{u.nome}</span></div></td>
                            <td className="px-10 py-8 text-right font-mono font-black text-brand-neon text-2xl">{u.pontos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Membros Tab */}
              {activeTab === 'members' && (
                <div className="space-y-8">
                  <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Comunidade INOVAP</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {members.map(m => (
                      <div key={m.id} className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:border-brand-neon transition-all shadow-sm dark:shadow-none">
                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                          {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <Users size={32} className="text-slate-300 dark:text-slate-800" />}
                        </div>
                        <div className="flex-1"><h4 className="font-black text-slate-900 dark:text-white text-xl">{m.nome}</h4><p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mt-1">{m.email}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
