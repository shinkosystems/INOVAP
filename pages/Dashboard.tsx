
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
  Plus,
  ChevronRight as ChevronRightIcon,
  Sun, Moon,
  Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Link, Quote, Eraser, Code, Undo, Redo, Shield
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');

  // Redirecionamento de abas restritas
  useEffect(() => {
    if (!user) return;
    const hasAccess = user.governanca || (user.gts && user.gts.length > 0);
    if (!hasAccess && (activeTab === 'tasks' || activeTab === 'articles')) {
      setActiveTab('overview');
    }
  }, [user, activeTab]);

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
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

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
  const [gtMemberSearchTerm, setGtMemberSearchTerm] = useState('');

  // Members Screen States
  const [selectedMemberForGts, setSelectedMemberForGts] = useState<User | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

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
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const articleCoverInputRef = useRef<HTMLInputElement>(null);
  const eventCoverInputRef = useRef<HTMLInputElement>(null);

  // Ticket States
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<Inscricao | null>(null);

  // Agenda States
  const [selectedEventDetails, setSelectedEventDetails] = useState<Evento | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>(new Date().getFullYear());
  const [newEventData, setNewEventData] = useState<Partial<Evento>>({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    tipo: 'Workshop',
    imagem_capa: '',
    vagas: 100,
    exclusivo: false
  });
  const [isProcessingInscription, setIsProcessingInscription] = useState<number | null>(null);


  // Gamification Edit States
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Check-in States
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      const [gtsRes, usersRes, eventsRes, ticketsRes, articlesRes, rulesRes, logsRes, inscriptionsCountRes, tasksRes, empresasRes] = await Promise.all([
        supabase.from('gts').select('*').order('gt'),
        supabase.from('users').select('*').order('pontos', { ascending: false }),
        supabase.from('eventos').select('*').order('data_inicio', { ascending: true }),
        supabase.from('inscricoes').select('*, evento:eventos(*)').eq('user_id', user.id),
        supabase.from('artigos').select('*').eq('autor', user.uuid).order('created_at', { ascending: false }),
        supabase.from('pontuacao_regras').select('*').order('valor', { ascending: false }),
        supabase.from('pontuacao_logs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('inscricoes').select('evento_id'),
        supabase.from('tarefas').select('*, responsavel:users(*), gt:gts(*)').order('prazo', { ascending: true }),
        supabase.from('empresas').select('*')
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
      if (empresasRes.data) setEmpresas(empresasRes.data);

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

  const execEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const handleInsertLink = () => {
    const url = prompt('Insira a URL do link:', 'https://');
    if (url) {
      execEditorCommand('createLink', url);
    }
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAction(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `article_content_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('imagensBlog')
        .upload(`artigos/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('imagensBlog').getPublicUrl(`artigos/${fileName}`);

      // Focus editor and insert image
      editorRef.current?.focus();
      execEditorCommand('insertImage', data.publicUrl);
      showNotification('success', 'Imagem inserida no conteúdo!');
    } catch (e) {
      showNotification('error', 'Erro ao subir imagem para o conteúdo.');
    } finally {
      setIsProcessingAction(false);
      if (contentImageInputRef.current) contentImageInputRef.current.value = '';
    }
  };

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
    const finalConteudo = editorRef.current?.innerHTML || '';
    const { error } = await supabase.from('artigos').insert([{ ...newArticleData, conteudo: finalConteudo, autor: user.uuid, aprovado: false }]);
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

  const handleEventCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAction(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `event_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('imagensBlog')
        .upload(`eventos/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('imagensBlog')
        .getPublicUrl(`eventos/${fileName}`);

      setNewEventData(prev => ({ ...prev, imagem_capa: publicUrl }));
      showNotification('success', 'Imagem do evento carregada!');
    } catch (e) {
      console.error(e);
      showNotification('error', 'Erro ao subir imagem do evento.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Agenda Actions
  const handleWithdrawTicket = async (evt: Evento) => {
    if (!user) return;
    const { error } = await supabase.from('inscricoes').insert([{ evento_id: evt.id, user_id: user.id, status: 'confirmado' }]);
    if (!error) { showNotification('success', 'Ingresso retirado!'); fetchData(); }
  };

  const handleInscription = async (eventId: number) => {
    if (!user) {
      showNotification('error', 'Você precisa estar logado para se inscrever.');
      return;
    }
    setIsProcessingInscription(eventId);
    try {
      const { error } = await supabase.from('inscricoes').insert([{ evento_id: eventId, user_id: user.id, status: 'confirmado' }]);
      if (error) throw error;
      showNotification('success', 'Inscrição realizada com sucesso!');
      fetchData(); // Re-fetch data to update tickets and event stats
    } catch (error: any) {
      console.error('Erro ao se inscrever:', error);
      showNotification('error', error.message || 'Erro ao se inscrever no evento.');
    } finally {
      setIsProcessingInscription(null);
    }
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
      scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => { handleCheckin(text); stopScanner(); }, () => { });
      scannerRef.current = scanner;
    }
    return () => { if (scannerRef.current) scannerRef.current.stop(); };
  }, [isScanning, activeTab]);

  // Agenda Actions
  const handleCreateEvent = async () => {
    if (!newEventData.titulo || !newEventData.data_inicio || !newEventData.local) {
      showNotification('error', 'Preencha os campos obrigatórios.');
      return;
    }
    const { error } = await supabase.from('eventos').insert([
      { ...newEventData, criado_por: user.uuid }
    ]);
    if (!error) {
      showNotification('success', 'Evento criado com sucesso!');
      setIsAddingEvent(false);
      setNewEventData({
        titulo: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        local: '',
        tipo: 'Workshop',
        imagem_capa: '',
        vagas: 100,
        exclusivo: false
      });
      fetchData();
    } else {
      showNotification('error', 'Erro ao criar evento.');
    }
  };

  // GT Management
  const handleCreateGt = async () => {
    if (!newGtName.trim()) return;
    const { error } = await supabase.from('gts').insert([{ gt: newGtName }]);
    if (!error) { showNotification('success', 'GT Criado!'); setIsAddingGt(false); setNewGtName(''); fetchData(); }
  };

  const handleDeleteGt = async (gtId: number) => {
    const { data, error } = await supabase.from('gts').delete().eq('id', gtId).select();
    if (error) {
      showNotification('error', 'Erro ao remover GT: ' + error.message);
    } else if (!data || data.length === 0) {
      showNotification('error', 'Falha na exclusão. Verifique as permissões de RLS no banco de dados para a tabela gts.');
    } else {
      showNotification('success', 'GT Removido com sucesso!');
      setSelectedGtForManagement(null);
      fetchData();
    }
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

  const handleToggleUserGovernanca = async (target: User) => {
    const newValue = !target.governanca;
    const { error } = await supabase.from('users').update({ governanca: newValue }).eq('id', target.id);
    if (!error) {
      showNotification('success', newValue ? 'Promovido à Governança' : 'Removido da Governança');
      fetchData();
      if (selectedMemberForGts && selectedMemberForGts.id === target.id) {
        setSelectedMemberForGts({ ...selectedMemberForGts, governanca: newValue });
      }
    }
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

  // Members filtered for "Add Member" list in GT management
  const potentialGtMembers = useMemo(() => {
    if (!selectedGtForManagement) return [];
    return members.filter(m =>
      !m.gts?.includes(selectedGtForManagement.id) &&
      (gtMemberSearchTerm === '' || m.nome.toLowerCase().includes(gtMemberSearchTerm.toLowerCase()) || m.email.toLowerCase().includes(gtMemberSearchTerm.toLowerCase()))
    );
  }, [members, selectedGtForManagement, gtMemberSearchTerm]);

  const filteredMembers = useMemo(() => {
    return members.filter(m =>
      memberSearchTerm === '' ||
      m.nome.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
  }, [members, memberSearchTerm]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black flex transition-colors duration-300">
      {/* Sidebar Compacta/Contextual - UI3.0 Minimalist */}
      <aside className="hidden lg:flex flex-col w-20 hover:w-72 group transition-all duration-500 border-r border-transparent bg-slate-50 dark:bg-brand-surface fixed h-full z-40 overflow-hidden shadow-2xl shadow-black/5">
        <div className="p-6 flex flex-col items-center">
          <div className="w-10 h-10 bg-brand-neon rounded-2xl flex items-center justify-center shadow-neon shrink-0">
            <Logo dark={false} className="scale-75 invert" />
          </div>
          <div className="mt-4 text-[8px] font-black uppercase tracking-[0.3em] text-brand-neon opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">PAINEL</div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'ranking', label: 'Ranking', icon: Star },
            { id: 'members', label: 'Membros', icon: Users },
            { id: 'tasks', label: 'Tarefas', icon: ListTodo, restricted: true },
            { id: 'agenda', label: 'Agenda', icon: CalendarRange },
            { id: 'articles', label: 'Meus Artigos', icon: FileText, restricted: true },
            { id: 'my_events', label: 'Ingressos', icon: Ticket }
          ]
            .filter(item => {
              if (item.restricted) {
                return user.governanca || (user.gts && user.gts.length > 0);
              }
              return true;
            })
            .map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-4 px-3.5 py-3.5 rounded-2xl font-bold transition-all relative ${activeTab === item.id ? 'bg-brand-neon/20 text-brand-green dark:text-brand-neon shadow-sm shadow-brand-neon/10' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white'}`}
              >
                <item.icon size={22} className="shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">{item.label}</span>
                {activeTab === item.id && <div className="absolute left-0 w-1 h-6 bg-brand-neon rounded-full" />}
              </button>
            ))}

          {user.governanca && (
            <>
              <div className="pt-6 px-4 group-hover:border-t border-slate-200/40 dark:border-white/[0.02]">
                <div className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-4">GOVERNANÇA</div>
              </div>
              {[
                { id: 'gts_manage', label: 'Gestão de GTs', icon: Boxes },
                { id: 'articles_manage', label: 'Aprovar Artigos', icon: CheckSquare },
                { id: 'gamification', label: 'Gamificação', icon: Trophy },
                { id: 'checkin', label: 'Check-in', icon: ScanLine }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center gap-4 px-3.5 py-3.5 rounded-2xl font-bold transition-all relative ${activeTab === item.id ? 'bg-brand-neon/20 text-brand-green dark:text-brand-neon shadow-sm shadow-brand-neon/10' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <item.icon size={22} className="shrink-0" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">{item.label}</span>
                  {activeTab === item.id && <div className="absolute left-0 w-1 h-6 bg-brand-neon rounded-full" />}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 pt-6 border-t border-slate-200/40 dark:border-white/[0.02]">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-3.5 py-3.5 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all">
            <LogOut size={22} className="shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-bold">Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-20 min-h-screen relative bg-white dark:bg-brand-black transition-all duration-500 pb-32 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10 py-6 lg:py-8 bg-white/40 dark:bg-brand-black/40 backdrop-blur-3xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-center text-slate-500 dark:text-slate-400"
            >
              <MenuIcon size={20} />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-slate-900 dark:text-white text-xl font-black tracking-tight">Olá, {user.nome.split(' ')[0]} 👋</h2>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Status do Ecossistema: <span className="text-brand-neon">Ativo</span></p>
            </div>
            <div className="lg:hidden">
              <h2 className="text-slate-900 dark:text-white text-sm font-black tracking-tight">Olá, {user.nome.split(' ')[0]} 👋</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              title={theme === 'dark' ? "Modo Diurno" : "Modo Noturno"}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={onProfileClick} className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all group">
              <span className="hidden sm:inline text-[11px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{user.nome.split(' ')[0]}</span>
              <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-slate-200 dark:bg-white/5">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="m-auto mt-2 text-slate-400" />}
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar/Drawer - UI3.0 Refined */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-brand-surface shadow-2xl flex flex-col animate-slide-in-left">
              <div className="p-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-neon rounded-xl flex items-center justify-center shadow-neon">
                    <Logo dark={false} className="scale-50 invert" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">PAINEL</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={20} /></button>
              </div>

              <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {[
                  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'ranking', label: 'Ranking', icon: Star },
                  { id: 'members', label: 'Membros', icon: Users },
                  { id: 'tasks', label: 'Tarefas', icon: ListTodo, restricted: true },
                  { id: 'agenda', label: 'Agenda', icon: CalendarRange },
                  { id: 'articles', label: 'Meus Artigos', icon: FileText, restricted: true },
                  { id: 'my_events', label: 'Ingressos', icon: Ticket }
                ]
                  .filter(item => {
                    if (item.restricted) {
                      return user.governanca || (user.gts && user.gts.length > 0);
                    }
                    return true;
                  })
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as Tab); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-brand-neon/10 text-brand-neon' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}
                    >
                      <item.icon size={20} />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}

                {user.governanca && (
                  <>
                    <div className="pt-6 px-4">
                      <div className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-4">GOVERNANÇA</div>
                    </div>
                    {[
                      { id: 'gts_manage', label: 'Gestão de GTs', icon: Boxes },
                      { id: 'articles_manage', label: 'Aprovar Artigos', icon: CheckSquare },
                      { id: 'gamification', label: 'Gamificação', icon: Trophy },
                      { id: 'checkin', label: 'Check-in', icon: ScanLine }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as Tab); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-brand-neon/10 text-brand-neon' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}
                      >
                        <item.icon size={20} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </nav>

              <div className="p-6 border-t border-slate-100 dark:border-white/5">
                <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500/60 font-bold hover:bg-red-500/5">
                  <LogOut size={20} />
                  <span className="text-sm">Encerrar Sessão</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {notification && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
              <div className={`px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-3xl border flex items-center gap-3 ${notification.type === 'success' ? 'bg-brand-neon/10 border-brand-neon/40 text-brand-neon' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
                {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span className="font-extrabold text-[11px] uppercase tracking-[0.15em]">{notification.message}</span>
                <button onClick={() => setNotification(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-brand-neon/10 border-t-brand-neon animate-spin"></div>
                <div className="absolute inset-0 bg-brand-neon/20 blur-xl rounded-full"></div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Sincronizando Ecossistema</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {/* Overview Tab - UI3.0 Minimalist (Borderless) */}
              {activeTab === 'overview' && (
                <div className="space-y-8 md:space-y-16">
                  {/* Stats Grid - Ultra Minimalist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-brand-neon p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-black relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                      <Trophy className="absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" size={160} />
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-8 md:mb-16">Patrimônio de Inovação</div>
                      <div className="text-5xl md:text-7xl font-black tracking-tighter leading-none">{user.pontos || 0}</div>
                      <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-black/60">InovaPoints Ganhos</div>
                    </div>
                    {[
                      { label: 'Unidades Ativas', value: user.gts?.length || 0, icon: Boxes },
                      { label: 'Produção Intelectual', value: user.artigos || 0, icon: FileText },
                      { label: 'Experiências', value: myTickets.length, icon: Ticket }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-brand-surface p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] group transition-all duration-500 hover:bg-slate-100 dark:hover:bg-brand-elevated">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] mb-8 md:mb-16">{stat.label}</div>
                        <div className="flex items-end justify-between">
                          <div className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-slate-800 dark:text-slate-100">{stat.value}</div>
                          <stat.icon className="text-slate-200 dark:text-slate-800 group-hover:text-brand-neon transition-colors duration-500" size={40} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Activity Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 group">
                      <h3 className="text-[11px] font-black mb-8 flex items-center justify-between text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
                        <span>Ranking de Lideranças</span>
                        <Star size={14} className="text-brand-neon" />
                      </h3>
                      <div className="space-y-1">
                        {ranking.slice(0, 5).map((u, i) => (
                          <div key={u.id} className="flex items-center justify-between p-4 bg-transparent rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-white/[0.03] group/item">
                            <div className="flex items-center gap-4">
                              <span className={`text-[10px] font-black ${i === 0 ? 'text-brand-neon' : 'text-slate-300 dark:text-slate-700'}`}>0{i + 1}</span>
                              <span className="font-bold text-sm text-slate-600 dark:text-slate-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">{u.nome}</span>
                            </div>
                            <span className="text-slate-400 dark:text-slate-600 group-hover/item:text-brand-neon font-black text-xs transition-colors">{u.pontos} pt</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-4 group">
                      <h3 className="text-[11px] font-black mb-8 flex items-center justify-between text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
                        <span>Fluxo de Tarefas</span>
                        <PlusCircle size={14} className="opacity-40 cursor-pointer hover:opacity-100 transition-opacity" />
                      </h3>
                      <div className="space-y-1">
                        {mySortedTasks.slice(0, 5).map(task => (
                          <div key={task.id} onClick={() => setSelectedTaskDetail(task)} className="p-4 bg-transparent rounded-2xl cursor-pointer group/item transition-all hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-500 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors line-clamp-1">{task.titulo}</h4>
                            <div className="h-0 group-hover/item:h-5 opacity-0 group-hover/item:opacity-100 transition-all duration-300 overflow-hidden flex items-center gap-2 text-[9px] font-black text-brand-neon mt-2 uppercase tracking-widest">
                              <CalendarClock size={12} />
                              <span>Expira em {task.prazo ? new Date(task.prazo).toLocaleDateString() : 'A definir'}</span>
                            </div>
                          </div>
                        ))}
                        {mySortedTasks.length === 0 && <div className="flex flex-col items-center py-10 opacity-20"><CheckCircle size={32} className="mb-2" /><p className="text-[10px] font-bold uppercase tracking-widest text-center">Tudo pronto</p></div>}
                      </div>
                    </div>

                    <div className="lg:col-span-4 group">
                      <h3 className="text-[11px] font-black mb-8 flex items-center justify-between text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
                        <span>Agenda Sincronizada</span>
                        <CalendarRange size={14} className="opacity-40" />
                      </h3>
                      <div className="space-y-1">
                        {events.slice(0, 5).map(evt => (
                          <div key={evt.id} className="p-4 bg-transparent rounded-2xl group/item transition-all hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-500 group-hover/item:text-slate-900 dark:group-hover/item:text-white line-clamp-1 transition-colors">{evt.titulo}</h4>
                              <span className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase">{new Date(evt.data_inicio).toLocaleDateString()}</span>
                            </div>
                            <div className="h-0 group-hover/item:h-5 opacity-0 group-hover/item:opacity-100 transition-all duration-300 overflow-hidden text-brand-neon text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-2">
                              <MapPin size={10} /> {evt.local.split(',')[0]}
                            </div>
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
                      <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white"><FileText className="text-brand-neon" size={40} /> {isCreatingArticle ? 'Novo Artigo' : 'Meus Artigos'}</h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Compartilhe conhecimento com o ecossistema.</p>
                    </div>
                    {isCreatingArticle ? (
                      <button onClick={() => setIsCreatingArticle(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-brand-elevated text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-200 dark:border-white/10 relative z-10">
                        <X size={24} />
                      </button>
                    ) : (
                      <button onClick={() => setIsCreatingArticle(true)} className="bg-brand-neon text-black px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-black hover:text-white dark:hover:bg-white transition-all shadow-lg shadow-brand-neon/20"><PlusCircle size={20} /> ESCREVER ARTIGO</button>
                    )}
                  </div>

                  {isCreatingArticle ? (
                    <div className="bg-slate-50/50 dark:bg-brand-surface/40 border border-transparent rounded-[3rem] p-8 md:p-12 animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-neon via-brand-green to-brand-neon"></div>

                      <div className="space-y-8 max-w-5xl mx-auto pt-2">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Título da Obra</label>
                          <input
                            type="text"
                            placeholder="Ex: O Futuro da IA no Alto Paraopeba"
                            value={newArticleData.titulo}
                            onChange={(e) => setNewArticleData({ ...newArticleData, titulo: e.target.value })}
                            className="w-full bg-white dark:bg-brand-surface/50 border-none rounded-[2.5rem] p-10 text-4xl font-black outline-none focus:ring-4 focus:ring-brand-neon/10 text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                          <div className="md:col-span-4 space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Identidade Visual</label>
                            <div onClick={() => articleCoverInputRef.current?.click()} className="group h-80 bg-white dark:bg-brand-surface/50 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-brand-neon transition-all relative overflow-hidden">
                              {newArticleData.capa ? (
                                <div className="relative w-full h-full">
                                  <img src={newArticleData.capa} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs uppercase tracking-widest">
                                    Alterar Imagem
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-8">
                                  <div className="w-16 h-16 bg-slate-50 dark:bg-brand-elevated rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:text-brand-neon transition-all">
                                    <ImageIcon size={32} />
                                  </div>
                                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">Arraste uma capa premium ou clique para subir</p>
                                </div>
                              )}
                              <input type="file" ref={articleCoverInputRef} className="hidden" onChange={handleArticleCoverUpload} />
                            </div>
                          </div>

                          <div className="md:col-span-8 space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Corpo do Artigo</label>
                            <div className="flex flex-col h-full bg-white dark:bg-brand-surface/50 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5">
                              {/* Modern Editor Toolbar */}
                              <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-xl">
                                  <button onClick={() => execEditorCommand('undo')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Desfazer"><Undo size={14} /></button>
                                  <button onClick={() => execEditorCommand('redo')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Refazer"><Redo size={14} /></button>
                                </div>

                                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

                                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-xl">
                                  <button onClick={() => execEditorCommand('bold')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Negrito"><Bold size={14} /></button>
                                  <button onClick={() => execEditorCommand('italic')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Itálico"><Italic size={14} /></button>
                                  <button onClick={() => execEditorCommand('underline')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Sublinhado"><Underline size={14} /></button>
                                  <button onClick={() => execEditorCommand('strikeThrough')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Riscado"><Strikethrough size={14} /></button>
                                </div>

                                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

                                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-xl">
                                  <button onClick={() => execEditorCommand('formatBlock', 'h1')} className="px-2 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-[9px] font-black text-slate-500 transition-all" title="H1">H1</button>
                                  <button onClick={() => execEditorCommand('formatBlock', 'h2')} className="px-2 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-[9px] font-black text-slate-500 transition-all" title="H2">H2</button>
                                </div>

                                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

                                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-xl">
                                  <button onClick={() => execEditorCommand('justifyLeft')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Alinhar Esquerda"><AlignLeft size={14} /></button>
                                  <button onClick={() => execEditorCommand('justifyCenter')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Centralizar"><AlignCenter size={14} /></button>
                                  <button onClick={() => execEditorCommand('justifyRight')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Alinhar Direita"><AlignRight size={14} /></button>
                                </div>

                                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

                                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-xl">
                                  <button onClick={() => execEditorCommand('insertUnorderedList')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Lista Marcadores"><List size={14} /></button>
                                  <button onClick={() => execEditorCommand('insertOrderedList')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Lista Numerada"><ListOrdered size={14} /></button>
                                </div>

                                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

                                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-xl">
                                  <button onClick={handleInsertLink} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Inserir Link"><Link size={14} /></button>
                                  <button onClick={() => execEditorCommand('formatBlock', 'blockquote')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Citação"><Quote size={14} /></button>
                                  <button onClick={() => execEditorCommand('formatBlock', 'pre')} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Código"><Code size={14} /></button>
                                  <button onClick={() => contentImageInputRef.current?.click()} className="w-8 h-8 rounded-lg hover:bg-brand-neon hover:text-black flex items-center justify-center text-slate-500 transition-all" title="Inserir Imagem"><ImageIcon size={14} /></button>
                                </div>

                                <div className="ml-auto flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-xl">
                                  <button onClick={() => execEditorCommand('removeFormat')} className="w-8 h-8 rounded-lg hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-500 transition-all" title="Limpar Formatação"><Eraser size={14} /></button>
                                </div>
                                <input type="file" ref={contentImageInputRef} className="hidden" accept="image/*" onChange={handleContentImageUpload} />
                              </div>

                              <div
                                ref={editorRef}
                                contentEditable
                                data-placeholder="Comece a escrever sua obra-prima aqui..."
                                onInput={(e) => {
                                  const html = e.currentTarget.innerHTML;
                                  setNewArticleData(prev => ({ ...prev, conteudo: html }));
                                }}
                                className="flex-1 min-h-[500px] max-h-[700px] overflow-y-auto p-12 outline-none prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 selection:bg-brand-neon/30 focus:shadow-inner"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-10">
                          <button
                            onClick={handleSaveArticle}
                            disabled={isProcessingAction || !newArticleData.titulo}
                            className="group bg-brand-neon text-black px-12 py-6 rounded-[2rem] font-black shadow-neon hover:scale-105 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs"
                          >
                            Submeter para Curadoria
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                          </button>
                        </div>
                      </div>
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

              {/* Agenda Tab - UI3.0 Refined */}
              {activeTab === 'agenda' && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                        <CalendarRange className="text-brand-neon" size={40} /> Próximas Experiências
                      </h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Participe dos melhores momentos do Alto Paraopeba.</p>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-4">
                      {user.governanca && (
                        <button
                          onClick={() => setIsAddingEvent(true)}
                          className="flex items-center gap-3 bg-brand-neon text-black px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-neon hover:scale-105 transition-all"
                        >
                          <Plus size={18} /> Novo Evento
                        </button>
                      )}
                      <div className="flex gap-4 bg-slate-50 dark:bg-brand-surface p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-transparent text-[10px] font-black uppercase p-3 focus:outline-none text-slate-600 dark:text-white cursor-pointer"><option value="all">Todo o ano</option>{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 self-center"></div>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-transparent text-[10px] font-black uppercase p-3 focus:outline-none text-slate-600 dark:text-white cursor-pointer"><option value="all">Ano</option><option value={2025}>2025</option><option value={2026}>2026</option></select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {prioritizedEvents.map(evt => {
                      const isInscribed = myTickets.some(t => t.evento_id === evt.id);
                      const eventDate = new Date(evt.data_inicio);
                      return (
                        <div key={evt.id} onClick={() => setSelectedEventDetails(evt)} className="group relative bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] overflow-hidden hover:bg-white dark:hover:bg-brand-elevated transition-all duration-500 cursor-pointer border border-transparent hover:border-brand-neon/10 hover:shadow-2xl hover:shadow-brand-neon/5">
                          <div className="h-56 bg-slate-200 dark:bg-slate-900 relative overflow-hidden">
                            {evt.imagem_capa ? (
                              <img src={evt.imagem_capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-neon/20 to-transparent">
                                <Calendar size={48} className="text-brand-neon/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                              <span className="bg-brand-neon text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider self-start shadow-lg">
                                {evt.tipo}
                              </span>
                              {isInscribed && (
                                <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider self-start border border-white/10">
                                  Inscrito
                                </span>
                              )}
                            </div>

                            <div className="absolute bottom-6 left-6 right-6">
                              <div className="flex items-center gap-3 text-white">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/20">
                                  <span className="block text-sm font-black leading-none">{eventDate.getDate()}</span>
                                  <span className="block text-[8px] font-black uppercase text-brand-neon">{monthNames[eventDate.getMonth()].substring(0, 3)}</span>
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-xl font-black text-white leading-tight truncate">{evt.titulo}</h3>
                                  <div className="flex items-center gap-2 text-[9px] font-bold text-white/60 mt-1 uppercase tracking-widest truncate">
                                    <MapPin size={10} className="text-brand-neon" /> {evt.local.split(',')[0]}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-8">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 mb-6 min-h-[40px] leading-relaxed">
                              {evt.descricao || "Participe deste encontro incrível com a comunidade INOVAP."}
                            </p>
                            <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-white/5">
                              <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-brand-surface bg-slate-200 dark:bg-brand-elevated overflow-hidden">
                                    <UserIcon size={12} className="m-auto mt-1 text-slate-400" />
                                  </div>
                                ))}
                                <span className="pl-4 text-[9px] font-black uppercase text-slate-400 dark:text-slate-600 self-center">+{eventStats[evt.id] || 0} confirmados</span>
                              </div>
                              <span className="text-brand-neon font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                Ver Detalhes <ChevronRightIcon size={14} />
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {selectedEventDetails && (
                    <div className="fixed inset-0 z-[100] bg-white dark:bg-black animate-fade-in overflow-y-auto">
                      {(() => {
                        const isInscribed = myTickets.some(t => t.evento_id === selectedEventDetails.id);
                        return (
                          <div className="relative min-h-screen flex flex-col md:flex-row">
                            <div className="w-full md:w-2/5 h-64 md:h-screen sticky top-0 md:relative overflow-hidden shrink-0">
                              {selectedEventDetails.imagem_capa ? (
                                <img src={selectedEventDetails.imagem_capa} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-brand-neon">
                                  <Calendar size={80} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
                              <div className="absolute bottom-12 left-12 right-12 z-20">
                                <div className="flex flex-col gap-3">
                                  {selectedEventDetails.exclusivo && (
                                    <div className="flex items-center gap-2 bg-brand-purple/20 backdrop-blur-md border border-brand-purple/40 text-brand-purple px-4 py-1.5 rounded-full w-fit">
                                      <Shield size={14} className="fill-current" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Acesso Restrito</span>
                                    </div>
                                  )}
                                  <h2 className="text-4xl md:text-7xl font-black text-white leading-tight uppercase tracking-tighter shadow-black/20 drop-shadow-2xl">{selectedEventDetails.titulo}</h2>
                                  <div className="flex flex-wrap gap-3 mt-4">
                                    <span className="bg-brand-neon text-black px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-neon">{selectedEventDetails.tipo}</span>
                                    {isInscribed && (
                                      <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Inscrito</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => setSelectedEventDetails(null)} className="absolute top-10 left-10 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all z-50">
                                <ArrowLeft size={24} />
                              </button>
                            </div>

                            <div className="flex-1 bg-white dark:bg-brand-surface p-10 md:p-24">
                              <div className="max-w-3xl space-y-16">
                                <section className="space-y-8">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-1 bg-brand-neon rounded-full"></div>
                                    <h3 className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.4em]">Propósito do Evento</h3>
                                  </div>
                                  <div className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic whitespace-pre-line">
                                    {selectedEventDetails.descricao || 'Nenhuma descrição detalhada fornecida.'}
                                  </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-10 group hover:bg-brand-neon/5 transition-all">
                                    <div className="w-14 h-14 bg-white dark:bg-brand-elevated rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 group-hover:text-brand-neon transition-all">
                                      <MapPin size={28} />
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Localização das Ideias</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedEventDetails.local}</div>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-10 group hover:bg-brand-purple/5 transition-all">
                                    <div className="w-14 h-14 bg-white dark:bg-brand-elevated rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 group-hover:text-brand-purple transition-all">
                                      <Calendar size={28} />
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cronograma de Ação</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                      {new Date(selectedEventDetails.data_inicio).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }).replace('-feira', '')}h
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-16 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                                  <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map(i => (
                                      <div key={i} className="w-14 h-14 rounded-2xl bg-white dark:bg-brand-elevated border-4 border-white dark:border-brand-surface flex items-center justify-center text-slate-300 dark:text-slate-700">
                                        <UsersIcon size={22} />
                                      </div>
                                    ))}
                                    <div className="px-6 h-14 rounded-2xl bg-brand-neon/10 flex items-center gap-2 border-4 border-white dark:border-brand-surface">
                                      <span className="text-[10px] font-black text-brand-neon uppercase tracking-tighter">+{eventStats[selectedEventDetails.id] || 0} Confirmados</span>
                                    </div>
                                  </div>

                                  {!isInscribed ? (
                                    <button
                                      onClick={() => handleInscription(selectedEventDetails.id)}
                                      disabled={isProcessingInscription === selectedEventDetails.id}
                                      className="w-full md:w-auto bg-slate-900 dark:bg-brand-neon text-white dark:text-black px-12 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                    >
                                      {isProcessingInscription === selectedEventDetails.id ? (
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <>Garantir Minha Vaga <Ticket size={18} className="group-hover:rotate-12 transition-transform" /></>
                                      )}
                                    </button>
                                  ) : (
                                    <div className="w-full md:w-auto px-10 py-6 bg-brand-green/10 border-2 border-brand-green/20 rounded-3xl flex items-center gap-4 text-brand-green">
                                      <div className="w-10 h-10 rounded-xl bg-brand-green/20 flex items-center justify-center shadow-sm">
                                        <CheckCircle size={20} className="text-brand-green" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Sua presença está confirmada</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {isAddingEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/95 backdrop-blur-3xl" onClick={() => setIsAddingEvent(false)}></div>
                      <div className="relative w-full max-w-4xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[4rem] overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-12 md:p-16 space-y-12">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Fundar Nova Experiência</h2>
                              <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Crie um marco estratégico para o ecossistema.</p>
                            </div>
                            <button onClick={() => setIsAddingEvent(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-all">
                              <X size={24} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Nome do Evento</label>
                                <input
                                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl px-8 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 transition-all font-bold text-slate-800 dark:text-white"
                                  placeholder="Ex: Summit Tech 2026"
                                  value={newEventData.titulo}
                                  onChange={(e) => setNewEventData({ ...newEventData, titulo: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Localização</label>
                                <input
                                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl px-8 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 transition-all font-bold text-slate-800 dark:text-white"
                                  placeholder="Ex: Centro de Inovação, Ouro Branco"
                                  value={newEventData.local}
                                  onChange={(e) => setNewEventData({ ...newEventData, local: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Data e Hora</label>
                                  <input
                                    type="datetime-local"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl px-8 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 transition-all font-bold text-slate-800 dark:text-white"
                                    value={newEventData.data_inicio}
                                    onChange={(e) => setNewEventData({ ...newEventData, data_inicio: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Vagas</label>
                                  <input
                                    type="number"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl px-8 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 transition-all font-bold text-slate-800 dark:text-white"
                                    value={newEventData.vagas}
                                    onChange={(e) => setNewEventData({ ...newEventData, vagas: parseInt(e.target.value) })}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Tipo de Ação</label>
                                <select
                                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl px-8 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 transition-all font-bold text-slate-800 dark:text-white appearance-none"
                                  value={newEventData.tipo}
                                  onChange={(e) => setNewEventData({ ...newEventData, tipo: e.target.value })}
                                >
                                  <option>Workshop</option>
                                  <option>Meetup</option>
                                  <option>Congresso</option>
                                  <option>Happy Hour</option>
                                  <option>Demo Day</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Imagem de Capa</label>
                                <div
                                  onClick={() => eventCoverInputRef.current?.click()}
                                  className="group relative h-48 bg-slate-50 dark:bg-black/40 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:border-brand-neon transition-all flex flex-col items-center justify-center p-4 text-center"
                                >
                                  {newEventData.imagem_capa ? (
                                    <>
                                      <img src={newEventData.imagem_capa} className="absolute inset-0 w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                                        Alterar Imagem
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-12 h-12 bg-white dark:bg-brand-elevated rounded-2xl flex items-center justify-center mb-3 group-hover:text-brand-neon transition-colors">
                                        <CameraIcon size={24} />
                                      </div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors">Clique para subir capa do evento</p>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    ref={eventCoverInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleEventCoverUpload}
                                  />
                                  {isProcessingAction && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                      <Loader2 className="animate-spin text-brand-neon" size={24} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Propósito (Descrição)</label>
                                <textarea
                                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl px-8 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 transition-all font-bold text-slate-800 dark:text-white h-32 resize-none"
                                  placeholder="Descreva o impacto esperado deste encontro..."
                                  value={newEventData.descricao}
                                  onChange={(e) => setNewEventData({ ...newEventData, descricao: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-4 pt-4">
                            <button
                              onClick={() => setIsAddingEvent(false)}
                              className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleCreateEvent}
                              className="w-[70%] bg-brand-neon text-black py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-neon hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                              <Plus size={20} /> Publicar no Ecossistema
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ingressos Tab - UI3.0 Refined */}
              {activeTab === 'my_events' && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                      <Ticket className="text-brand-neon" size={40} /> Minhas Experiências
                    </h2>
                    <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Seus acessos exclusivos ao futuro do ecossistema.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myTickets.map(ticket => (
                      <div key={ticket.id} onClick={() => setSelectedTicketForQr(ticket)} className="group relative bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] p-10 hover:bg-white dark:hover:bg-brand-elevated transition-all duration-500 cursor-pointer border border-transparent hover:border-brand-neon/10 hover:shadow-2xl hover:shadow-brand-neon/5 overflow-hidden">
                        {/* Ticket Decorative Elements */}
                        <div className="absolute top-1/2 -left-4 w-8 h-8 bg-white dark:bg-brand-black rounded-full -translate-y-1/2 border border-slate-200 dark:border-white/5"></div>
                        <div className="absolute top-1/2 -right-4 w-8 h-8 bg-white dark:bg-brand-black rounded-full -translate-y-1/2 border border-slate-200 dark:border-white/5"></div>

                        <div className="flex justify-between items-start mb-8 relative">
                          <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${ticket.status === 'checkin_realizado' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-neon/10 text-brand-neon'}`}>
                            {ticket.status === 'checkin_realizado' ? 'Impacto Validado' : 'Acesso Confirmado'}
                          </div>
                          <div className="w-12 h-12 bg-white dark:bg-brand-surface rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:border-brand-neon/30 transition-colors">
                            <QrIcon size={24} className="text-slate-400 group-hover:text-brand-neon transition-colors" />
                          </div>
                        </div>

                        <div className="space-y-2 mb-10">
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2 uppercase tracking-tighter group-hover:text-brand-neon transition-colors">
                            {ticket.evento?.titulo}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                            <Calendar size={12} className="text-brand-neon" /> {ticket.evento ? new Date(ticket.evento.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : '-'}
                          </div>
                        </div>

                        <div className="pt-8 border-t border-dashed border-slate-200 dark:border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{ticket.evento?.local.split(',')[0]}</p>
                          </div>
                          <button className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-neon hover:translate-x-1 transition-transform">
                            Visualizar <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {myTickets.length === 0 && (
                      <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3.5rem] bg-slate-50/30 dark:bg-transparent">
                        <Ticket size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
                        <h3 className="text-xl font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Nenhuma experiência resgatada</h3>
                        <p className="text-slate-500 mt-4 text-sm font-medium">Explore a agenda e participe do ecossistema.</p>
                      </div>
                    )}
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

                  <div className="flex items-center gap-6 bg-slate-50 dark:bg-brand-surface p-6 rounded-[2.5rem]">
                    <div className="flex-1 space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.3em] ml-4">Unidade de Atuação</label>
                      <select value={taskFilters.gt} onChange={(e) => setTaskFilters({ ...taskFilters, gt: e.target.value === 'all' ? 'all' : parseInt(e.target.value) })} className="w-full bg-white dark:bg-brand-elevated rounded-2xl px-6 py-4 text-xs font-bold text-slate-800 dark:text-white outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all">
                        <option value="all">Sincronizar Todos os Grupos</option>
                        {gts.map(g => <option key={g.id} value={g.id}>{g.gt}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.3em] ml-4">Responsável Direto</label>
                      <select value={taskFilters.user} onChange={(e) => setTaskFilters({ ...taskFilters, user: e.target.value === 'all' ? 'all' : parseInt(e.target.value) })} className="w-full bg-white dark:bg-brand-elevated rounded-2xl px-6 py-4 text-xs font-bold text-slate-800 dark:text-white outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all">
                        <option value="all">Filtrar por Todos os Membros</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                      </select>
                    </div>
                  </div>

                  {taskViewMode === 'list' ? (
                    <div className="bg-transparent overflow-hidden">
                      <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                          <tr>
                            <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Atividade</th>
                            <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Progresso</th>
                            <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Deadline</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map(t => (
                            <tr key={t.id} onClick={() => setSelectedTaskDetail(t)} className="group cursor-pointer">
                              <td className="px-10 py-6 bg-slate-50/50 dark:bg-brand-surface/40 rounded-l-[2rem] group-hover:bg-slate-100 dark:group-hover:bg-brand-elevated transition-colors">
                                <p className="font-black text-slate-700 dark:text-slate-200 text-lg tracking-tight group-hover:text-brand-neon transition-colors">{t.titulo}</p>
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">{t.gt?.gt || 'Ecossistema'}</p>
                              </td>
                              <td className="px-10 py-6 bg-slate-50/50 dark:bg-brand-surface/40 group-hover:bg-slate-100 dark:group-hover:bg-brand-elevated transition-colors">
                                <span className={`inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] ${t.status === 'Concluído' ? 'text-brand-neon' : t.status === 'Em Andamento' ? 'text-orange-400' : 'text-slate-400'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'Concluído' ? 'bg-brand-neon shadow-neon' : t.status === 'Em Andamento' ? 'bg-orange-400 shadow-lg shadow-orange-500/20' : 'bg-slate-400'}`}></div>
                                  {t.status}
                                </span>
                              </td>
                              <td className="px-10 py-6 bg-slate-50/50 dark:bg-brand-surface/40 rounded-r-[2rem] group-hover:bg-slate-100 dark:group-hover:bg-brand-elevated transition-colors text-slate-500 dark:text-slate-600 font-bold text-sm">
                                {t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR') : 'Fluxo contínuo'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-brand-surface p-6 rounded-[2.5rem]">
                        <div className="flex items-center gap-2 bg-white dark:bg-brand-elevated p-1.5 rounded-2xl">
                          <button onClick={() => setCalendarViewType('month')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${calendarViewType === 'month' ? 'bg-brand-neon text-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>Mês</button>
                          <button onClick={() => setCalendarViewType('week')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${calendarViewType === 'week' ? 'bg-brand-neon text-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>Semana</button>
                          <button onClick={() => setCalendarViewType('day')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${calendarViewType === 'day' ? 'bg-brand-neon text-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>Dia</button>
                        </div>
                        <div className="flex items-center gap-8">
                          <button onClick={() => navigateCalendar(-1)} className="text-slate-400 hover:text-brand-neon transition-colors"><ChevronLeft size={24} /></button>
                          <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight min-w-[240px] text-center uppercase">{calendarAnchorDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
                          <button onClick={() => navigateCalendar(1)} className="text-slate-400 hover:text-brand-neon transition-colors"><ChevronRightIcon size={24} /></button>
                        </div>
                        <button onClick={() => setCalendarAnchorDate(new Date())} className="px-8 py-3 bg-white dark:bg-brand-elevated rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-white hover:bg-brand-neon hover:text-black transition-all">Hoje</button>
                      </div>
                      <div className="bg-slate-50 dark:bg-brand-surface rounded-[3rem] p-10">
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

              {/* Modal Detalhes Tarefa - UI3.0 Refined */}
              {selectedTaskDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                  <div className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-3xl animate-fade-in" onClick={() => setSelectedTaskDetail(null)}></div>
                  <div className="relative w-full max-w-5xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[4.5rem] p-12 md:p-20 max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                    <button onClick={() => setSelectedTaskDetail(null)} className="absolute top-12 right-12 w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-slate-50 dark:bg-brand-elevated text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={28} /></button>

                    <div className="flex flex-col gap-16">
                      <div className="space-y-6">
                        <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest self-start inline-block ${selectedTaskDetail.status === 'Concluído' ? 'bg-brand-neon/10 text-brand-neon' : 'bg-orange-500/10 text-orange-400'}`}>
                          Atividade {selectedTaskDetail.status}
                        </div>
                        <h3 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight max-w-3xl">{selectedTaskDetail.titulo}</h3>
                        <div className="h-1.5 w-32 bg-brand-neon rounded-full"></div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                        <div className="lg:col-span-7 space-y-12">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Briefing Operacional</label>
                            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
                              {selectedTaskDetail.descricao || "Esta atividade compõe o fluxo de crescimento do GT e deve ser executada com foco em excelência e impacto sistêmico."}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-10">
                            <div className="bg-slate-50/50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-4">Liderança</label>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-brand-black flex items-center justify-center border border-slate-100 dark:border-white/10 overflow-hidden">
                                  {selectedTaskDetail.responsavel?.avatar ? <img src={selectedTaskDetail.responsavel.avatar} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-300" />}
                                </div>
                                <p className="font-black text-slate-800 dark:text-white text-sm">{selectedTaskDetail.responsavel?.nome || 'Ecossistema'}</p>
                              </div>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-4">Prazo Fatal</label>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-brand-black flex items-center justify-center text-brand-neon border border-slate-100 dark:border-white/10">
                                  <Calendar size={20} />
                                </div>
                                <p className="font-black text-lg text-slate-800 dark:text-white text-sm">
                                  {selectedTaskDetail.prazo ? new Date(selectedTaskDetail.prazo).toLocaleDateString('pt-BR') : 'Sem expiração'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Atualizar Estado da Tarefa</label>
                            <div className="flex gap-4 p-2 bg-slate-100/50 dark:bg-brand-surface rounded-[2.5rem] border border-slate-200/50 dark:border-white/5">
                              {['Pendente', 'Em Andamento', 'Concluído'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleUpdateTaskField(selectedTaskDetail.id, 'status', s)}
                                  className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedTaskDetail.status === s ? 'bg-brand-neon text-black shadow-neon' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-5 space-y-10">
                          <label className="text-xl font-black uppercase tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                            <MessageSquare size={22} className="text-brand-neon" />
                            Diário de Evolução
                          </label>
                          <div className="h-[450px] bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-[3rem] p-8 overflow-y-auto space-y-6 flex flex-col custom-scrollbar">
                            {taskComments.map(c => (
                              <div key={c.id} className="animate-fade-in group">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-brand-elevated border border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden">
                                    {c.autor?.avatar ? <img src={c.autor.avatar} className="w-full h-full object-cover" /> : <UserIcon size={10} className="text-slate-400" />}
                                  </div>
                                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{c.autor?.nome}</span>
                                </div>
                                <div className="bg-white dark:bg-brand-elevated p-6 rounded-[2rem] rounded-tl-none text-sm text-slate-700 dark:text-slate-300 font-medium border border-slate-100 dark:border-white/5 shadow-sm group-hover:border-brand-neon/20 transition-all">
                                  {c.conteudo}
                                </div>
                              </div>
                            ))}
                            {taskComments.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                <Zap size={32} className="mb-4" />
                                <p className="text-[9px] font-black uppercase tracking-[0.3em]">Nenhum registro de progresso ainda</p>
                              </div>
                            )}
                          </div>

                          <div className="relative group">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                              placeholder="Registrar log de progresso..."
                              className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-[2rem] py-6 pl-8 pr-20 text-sm focus:ring-4 focus:ring-brand-neon/10 transition-all text-slate-900 dark:text-white font-medium"
                            />
                            <button onClick={handlePostComment} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-neon text-black rounded-2xl flex items-center justify-center shadow-neon hover:scale-110 transition-transform">
                              <Send size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Nova Tarefa - UI3.0 Refined */}
              {isAddingTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                  <div className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-3xl animate-fade-in" onClick={() => setIsAddingTask(false)}></div>
                  <div className="relative w-full max-w-4xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[4.5rem] p-12 md:p-20 shadow-2xl animate-fade-in-up">
                    <button onClick={() => setIsAddingTask(false)} className="absolute top-12 right-12 w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-slate-50 dark:bg-brand-elevated text-slate-400 hover:text-red-500 transition-all"><X size={28} /></button>

                    <div className="flex items-center gap-8 mb-16">
                      <div className="w-20 h-20 bg-brand-neon/10 rounded-[2.5rem] flex items-center justify-center text-brand-neon border border-brand-neon/20">
                        <PlusCircle size={40} />
                      </div>
                      <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Engenharia de Ação</h3>
                        <p className="text-slate-500 font-medium mt-1">Crie uma nova diretriz estratégica para o ecossistema.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                      <div className="md:col-span-8 space-y-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Título da Atividade</label>
                          <input
                            type="text"
                            value={newTaskData.titulo}
                            onChange={(e) => setNewTaskData({ ...newTaskData, titulo: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-[2.5rem] p-8 text-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-neon/10 transition-all"
                            placeholder="Ex: Refatorar fluxo de autenticação..."
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Documentação de Apoio (Opcional)</label>
                          <textarea
                            value={newTaskData.descricao}
                            onChange={(e) => setNewTaskData({ ...newTaskData, descricao: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-[2.5rem] p-8 text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-4 focus:ring-brand-neon/10 transition-all min-h-[150px] resize-none"
                            placeholder="Descreva os requisitos e objetivos desta tarefa..."
                          />
                        </div>
                      </div>

                      <div className="md:col-span-4 space-y-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">Célula Responsável</label>
                          <select value={newTaskData.gt_id} onChange={(e) => setNewTaskData({ ...newTaskData, gt_id: parseInt(e.target.value) })} className="w-full bg-slate-100 dark:bg-brand-elevated/50 rounded-2xl px-6 py-5 text-xs font-black text-slate-700 dark:text-white outline-none appearance-none cursor-pointer border border-transparent focus:border-brand-neon transition-all">
                            <option value="">Selecionar GT</option>
                            {gts.map(g => <option key={g.id} value={g.id}>{g.gt}</option>)}
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">Líder da Atividade</label>
                          <select value={newTaskData.responsavel_id} onChange={(e) => setNewTaskData({ ...newTaskData, responsavel_id: parseInt(e.target.value) })} className="w-full bg-slate-100 dark:bg-brand-elevated/50 rounded-2xl px-6 py-5 text-xs font-black text-slate-700 dark:text-white outline-none appearance-none cursor-pointer border border-transparent focus:border-brand-neon transition-all">
                            <option value="">Membro Responsável</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">Ponto de Entrega</label>
                          <input type="date" value={newTaskData.prazo} onChange={(e) => setNewTaskData({ ...newTaskData, prazo: e.target.value })} className="w-full bg-slate-100 dark:bg-brand-elevated/50 rounded-2xl px-6 py-5 text-xs font-black text-slate-700 dark:text-white outline-none border border-transparent focus:border-brand-neon transition-all" />
                        </div>

                        <div className="pt-6">
                          <button
                            onClick={handleCreateTask}
                            disabled={!newTaskData.titulo || !newTaskData.gt_id}
                            className="w-full bg-brand-neon text-black py-8 rounded-[2.5rem] font-black shadow-neon hover:scale-105 transition-all text-[11px] uppercase tracking-[0.3em]"
                          >
                            Lançar Tarefa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gamification Tab Refined */}
              {activeTab === 'gamification' && (
                <div className="space-y-12">
                  <div className="flex justify-between items-end gap-8">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                        <Trophy className="text-brand-neon" size={40} /> Patrimônio Intelectual
                      </h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Visualize sua contribuição e evolução no ecossistema.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] p-12 hover:bg-white dark:hover:bg-brand-elevated transition-all shadow-sm group">
                      <h3 className="text-xl font-black mb-10 flex items-center justify-between text-slate-900 dark:text-white uppercase tracking-[0.2em] opacity-60">
                        <span>Regras de Merito</span>
                        <Settings size={18} className="text-brand-neon group-hover:rotate-90 transition-transform duration-500" />
                      </h3>
                      <div className="space-y-4">
                        {rules.map(rule => (
                          <div key={rule.id} className="flex items-center justify-between p-6 bg-white/40 dark:bg-brand-black/20 rounded-[2rem] border border-transparent hover:border-brand-neon/20 transition-all group/rule">
                            <span className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase tracking-tight">{rule.acao}</span>
                            <div className="flex items-center gap-4">
                              {editingRuleId === rule.id ? (
                                <div className="flex items-center gap-2 animate-fade-in">
                                  <input
                                    type="number"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="w-20 bg-white dark:bg-brand-elevated border border-brand-neon rounded-xl px-3 py-2 text-center font-black text-brand-neon focus:outline-none"
                                    autoFocus
                                  />
                                  <button onClick={handleSaveRule} className="p-2 bg-brand-neon text-black rounded-lg shadow-neon"><Save size={16} /></button>
                                  <button onClick={() => setEditingRuleId(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><X size={16} /></button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-2xl font-black text-brand-neon tracking-tighter">
                                    +{rule.valor}
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-2">pts</span>
                                  </span>
                                  {user.governanca && (
                                    <button onClick={() => handleEditRule(rule)} className="p-2 text-slate-300 dark:text-slate-700 hover:text-brand-neon transition-colors opacity-0 group-rule:opacity-100">
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

                    <div className="bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] p-12 hover:bg-white dark:hover:bg-brand-elevated transition-all shadow-sm">
                      <h3 className="text-xl font-black mb-10 flex items-center justify-between text-slate-900 dark:text-white uppercase tracking-[0.2em] opacity-60">
                        <span>Extrato de Impacto</span>
                        <History size={18} className="text-brand-neon" />
                      </h3>
                      <div className="flex-1 space-y-3">
                        {logs.map(log => (
                          <div key={log.id} className="p-6 bg-white/40 dark:bg-brand-black/20 rounded-[2rem] flex items-center justify-between border border-transparent hover:border-white/5 transition-all">
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{log.motivo || 'Contribuição ao Ecossistema'}</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 block tracking-widest">
                                {new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-2xl font-black text-brand-green tracking-tighter">+{log.pontos_atribuidos}</span>
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <div className="py-20 text-center opacity-40">
                            <Zap size={32} className="mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Gerando conexões e impacto...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gestão de Artigos Tab - UI3.0 Refined */}
              {activeTab === 'articles_manage' && user.governanca && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                        <CheckSquare className="text-brand-neon" size={40} /> Curadoria Estratégica
                      </h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Valide a produção intelectual do ecossistema.</p>
                    </div>
                    <div className="flex gap-2 bg-slate-50 dark:bg-brand-surface p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                      <button
                        onClick={() => setArticleFilter('pending')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${articleFilter === 'pending' ? 'bg-brand-neon text-black shadow-neon' : 'text-slate-400 dark:text-slate-600 hover:text-slate-800 dark:hover:text-white'}`}
                      >
                        Pendentes ({articlesInReview.length})
                      </button>
                      <button
                        onClick={() => setArticleFilter('active')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${articleFilter === 'active' ? 'bg-brand-neon text-black shadow-neon' : 'text-slate-400 dark:text-slate-600 hover:text-slate-800 dark:hover:text-white'}`}
                      >
                        Ativos ({activeArticles.length})
                      </button>
                    </div>
                  </div>

                  <div className="bg-transparent overflow-hidden">
                    <table className="w-full text-left border-separate border-spacing-y-4">
                      <thead>
                        <tr>
                          <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Material para Revisão</th>
                          <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] text-right">Ações de Curadoria</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArticlesForManage.map(art => (
                          <tr key={art.id} className="group">
                            <td className="px-10 py-8 bg-slate-50/50 dark:bg-brand-surface/40 rounded-l-[3rem] group-hover:bg-white dark:group-hover:bg-brand-elevated transition-colors border border-transparent hover:border-brand-neon/10">
                              <div className="flex items-center gap-8">
                                <div className="w-24 h-16 bg-slate-100 dark:bg-brand-black rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
                                  {art.capa ? <img src={art.capa} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="text-slate-300" /></div>}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight truncate group-hover:text-brand-neon transition-colors">{art.titulo}</h4>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-widest">Autor ID: {art.autor.substring(0, 8)} • {new Date(art.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8 bg-slate-50/50 dark:bg-brand-surface/40 rounded-r-[3rem] group-hover:bg-white dark:group-hover:bg-brand-elevated transition-colors text-right relative overflow-hidden">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                <button
                                  onClick={() => setSelectedArticleForReview(art)}
                                  className="w-12 h-12 bg-white dark:bg-brand-surface rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-neon hover:border-brand-neon/40 transition-all shadow-sm"
                                >
                                  <Eye size={20} />
                                </button>
                                {!art.aprovado && (
                                  <button
                                    onClick={() => handleApproveArticle(art.id)}
                                    disabled={isProcessingAction}
                                    className="px-8 bg-brand-neon text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-neon/20"
                                  >
                                    Validar Conhecimento
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal de Revisão de Artigos - UI3.0 Refined */}
                  {selectedArticleForReview && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-3xl animate-fade-in" onClick={() => setSelectedArticleForReview(null)}></div>
                      <div className="relative w-full max-w-5xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[4.5rem] p-12 md:p-20 max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-in-up flex flex-col gap-12">
                        <button onClick={() => setSelectedArticleForReview(null)} className="absolute top-12 right-12 w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-slate-50 dark:bg-brand-elevated text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={28} /></button>

                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <span className="bg-brand-neon/10 text-brand-neon px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                              {selectedArticleForReview.aprovado ? 'Conhecimento Validado' : 'Aguardando Curadoria'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(selectedArticleForReview.created_at).toLocaleDateString()}</span>
                          </div>
                          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">{selectedArticleForReview.titulo}</h1>
                          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">{selectedArticleForReview.subtitulo}</p>
                        </div>

                        {selectedArticleForReview.capa && (
                          <div className="w-full h-[450px] rounded-[3.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-xl">
                            <img src={selectedArticleForReview.capa} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                          </div>
                        )}

                        <div className="prose dark:prose-invert prose-lg max-w-none">
                          <div className="text-slate-600 dark:text-slate-300 font-medium leading-[1.8] tracking-tight" dangerouslySetInnerHTML={{ __html: selectedArticleForReview.conteudo }} />
                        </div>

                        {!selectedArticleForReview.aprovado && (
                          <div className="sticky bottom-0 mt-10 pt-10 border-t border-slate-100 dark:border-white/5 bg-gradient-to-t from-white dark:from-brand-surface to-transparent pb-10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-slate-400">
                                <Info size={18} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Ao validar, este material será propagado para todo o ecossistema.</p>
                              </div>
                              <button
                                onClick={() => handleApproveArticle(selectedArticleForReview.id)}
                                disabled={isProcessingAction}
                                className="bg-brand-neon text-black px-12 py-6 rounded-[2rem] font-black shadow-neon hover:scale-105 transition-all flex items-center gap-4 text-xs uppercase tracking-widest"
                              >
                                <CheckCircle size={20} /> Validar Agora
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gestão GTs - UI3.0 Refined */}
              {activeTab === 'gts_manage' && user.governanca && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                        <Boxes className="text-brand-neon" size={40} /> Unidades de Atuação
                      </h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Gerencie os Grupos de Trabalho e a força motriz do ecossistema.</p>
                    </div>
                    <button onClick={() => setIsAddingGt(true)} className="bg-brand-neon text-black px-10 py-4 rounded-2xl font-black shadow-lg shadow-brand-neon/20 hover:scale-105 transition-all uppercase tracking-widest text-[10px]">
                      Novo GT
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gts.map(gt => (
                      <div key={gt.id} onClick={() => { setSelectedGtForManagement(gt); setGtMemberSearchTerm(''); }} className="group bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] p-10 hover:bg-white dark:hover:bg-brand-elevated transition-all duration-500 cursor-pointer border border-transparent hover:border-brand-neon/10 hover:shadow-2xl hover:shadow-brand-neon/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-neon/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="w-16 h-16 bg-white dark:bg-brand-black rounded-2xl flex items-center justify-center text-brand-neon mb-8 border border-slate-200 dark:border-white/10 group-hover:border-brand-neon transition-colors">
                          <Boxes size={32} />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-brand-neon transition-colors">{gt.gt}</h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mt-2">Grupo de Trabalho Oficial</p>

                        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {members.filter(m => m.gts?.includes(gt.id)).slice(0, 3).map((m, i) => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-brand-surface bg-slate-200 overflow-hidden">
                                {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="m-auto mt-2 text-slate-400" />}
                              </div>
                            ))}
                            <span className="pl-4 text-[9px] font-bold text-slate-400 self-center uppercase">Gestão de Impacto</span>
                          </div>
                          <ArrowRight size={18} className="text-brand-neon translate-x-4 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal Novo GT - UI3.0 Borderless */}
                  {isAddingGt && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-3xl animate-fade-in" onClick={() => setIsAddingGt(false)}></div>
                      <div className="relative w-full max-w-xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[4rem] p-12 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.1)] animate-fade-in-up">
                        <button onClick={() => setIsAddingGt(false)} className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-brand-elevated text-slate-400 hover:text-red-500 transition-all"><X size={24} /></button>

                        <div className="w-20 h-20 bg-brand-neon/10 rounded-[2rem] flex items-center justify-center text-brand-neon border border-brand-neon/20 mb-10">
                          <Boxes size={40} />
                        </div>

                        <h3 className="text-4xl font-black mb-4 text-slate-900 dark:text-white uppercase tracking-tighter">Novo Grupo de Trabalho</h3>
                        <p className="text-slate-500 mb-12 font-medium">Defina uma nova unidade de atuação para impulsionar o ecossistema.</p>

                        <div className="space-y-10">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Nome do GT</label>
                            <input
                              type="text"
                              value={newGtName}
                              onChange={(e) => setNewGtName(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-brand-elevated border-none rounded-[2rem] p-8 text-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-neon/10 transition-all"
                              placeholder="Fomentando a Inovação..."
                            />
                          </div>

                          <div className="flex gap-4 pt-6">
                            <button onClick={() => setIsAddingGt(false)} className="flex-1 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cancelar</button>
                            <button
                              onClick={handleCreateGt}
                              disabled={!newGtName.trim()}
                              className="flex-[2] bg-brand-neon text-black py-6 rounded-[2rem] font-black shadow-neon hover:scale-105 transition-all text-[10px] uppercase tracking-widest"
                            >
                              Fundar GT
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Gerenciar GT Específico - UI3.0 Refined */}
                  {selectedGtForManagement && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-3xl animate-fade-in" onClick={() => setSelectedGtForManagement(null)}></div>
                      <div className="relative w-full max-w-6xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[4.5rem] p-12 md:p-20 max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                        <div className="absolute top-12 right-12 flex gap-4">
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm('Tem certeza que deseja apagar este GT de forma permanente?')) handleDeleteGt(selectedGtForManagement.id) }} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Apagar GT"><Trash2 size={24} /></button>
                          <button onClick={() => setSelectedGtForManagement(null)} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-slate-50 dark:bg-brand-elevated text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"><X size={28} /></button>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-10 mb-20">
                          <div className="w-24 h-24 bg-brand-neon text-black rounded-[2.5rem] flex items-center justify-center shadow-neon border-4 border-white dark:border-brand-surface"><Boxes size={48} /></div>
                          <div>
                            <h3 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedGtForManagement.gt}</h3>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-brand-neon font-black text-[10px] uppercase tracking-[0.3em]">Gestão Operacional</span>
                              <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full"></div>
                              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">{members.filter(m => m.gts?.includes(selectedGtForManagement.id)).length} Agentes Ativos</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                          <div className="space-y-12">
                            <h4 className="text-xl font-black flex items-center gap-4 text-slate-900 dark:text-white uppercase tracking-tight">
                              <div className="w-2 h-8 bg-brand-neon rounded-full"></div>
                              Membros da Célula
                            </h4>
                            <div className="space-y-3 pr-4 custom-scrollbar">
                              {members.filter(m => m.gts?.includes(selectedGtForManagement.id)).map(member => (
                                <div key={member.id} className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] border border-transparent hover:border-brand-neon/10 transition-all group">
                                  <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-brand-black border border-slate-100 dark:border-white/10 overflow-hidden group-hover:scale-105 transition-transform">
                                      {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-4 text-slate-300" />}
                                    </div>
                                    <div>
                                      <span className="font-black text-slate-900 dark:text-white block tracking-tight">{member.nome}</span>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.email}</span>
                                    </div>
                                  </div>
                                  <button onClick={() => handleRemoveMemberFromGt(member)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"><UserMinus size={20} /></button>
                                </div>
                              ))}
                              {members.filter(m => m.gts?.includes(selectedGtForManagement.id)).length === 0 && (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem]">
                                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Aguardando novos agentes...</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-12">
                            <h4 className="text-xl font-black flex items-center gap-4 text-slate-900 dark:text-white uppercase tracking-tight">
                              <div className="w-2 h-8 bg-brand-neon rounded-full opacity-50"></div>
                              Integrar Nova Mente
                            </h4>
                            <div className="space-y-8">
                              <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-neon transition-colors" size={20} />
                                <input
                                  type="text"
                                  placeholder="Convocar por nome ou e-mail..."
                                  value={gtMemberSearchTerm}
                                  onChange={(e) => setGtMemberSearchTerm(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-[2rem] py-6 pl-16 pr-8 text-sm focus:ring-4 focus:ring-brand-neon/10 transition-all text-slate-900 dark:text-white font-medium"
                                />
                              </div>
                              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                                {potentialGtMembers.map(member => (
                                  <div key={member.id} onClick={() => handleAddMemberToGt(member)} className="w-full flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-transparent hover:border-brand-neon hover:bg-white dark:hover:bg-brand-elevated transition-all cursor-pointer group">
                                    <div className="flex items-center gap-5">
                                      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-brand-black border border-slate-100 dark:border-white/10 overflow-hidden group-hover:scale-110 transition-transform">
                                        {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-4 text-slate-300" />}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-black text-slate-900 dark:text-white block truncate tracking-tight">{member.nome}</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest block truncate">{member.email}</span>
                                      </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-brand-neon/10 text-brand-neon flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <PlusCircle size={20} />
                                    </div>
                                  </div>
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

              {/* Check-in Tab - UI3.0 Refined */}
              {activeTab === 'checkin' && user.governanca && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                      <ScanLine className="text-brand-neon" size={40} /> Validação de Presença
                    </h2>
                    <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Controle de fluxo e impacto presencial do ecossistema.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] p-12 md:p-20 flex flex-col items-center justify-center min-h-[600px] transition-all hover:bg-white dark:hover:bg-brand-elevated border border-transparent hover:border-brand-neon/10">
                      {!isScanning ? (
                        <div className="text-center space-y-12 animate-fade-in-up">
                          <div className="relative">
                            <div className="w-32 h-32 bg-brand-neon text-black rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-neon relative z-10">
                              <ScanLine size={56} />
                            </div>
                            <div className="absolute inset-0 bg-brand-neon blur-3xl opacity-20 scale-150 rounded-full"></div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Scanner de Impacto</h3>
                            <p className="text-slate-500 max-w-xs mx-auto font-medium leading-relaxed block">Posicione o ticket QR para validar a presença e atribuir pontuação de mérito instantaneamente.</p>
                          </div>
                          <button
                            onClick={startScanner}
                            className="group bg-brand-neon text-black px-14 py-7 rounded-[2rem] font-black shadow-neon hover:scale-105 transition-all flex items-center gap-4 mx-auto tracking-[0.2em] text-[10px] uppercase"
                          >
                            <CameraIcon size={24} className="group-hover:rotate-12 transition-transform" /> Iniciar Protocolo
                          </button>
                        </div>
                      ) : (
                        <div className="w-full space-y-12 animate-fade-in">
                          <div className="relative group">
                            <div id="reader" className="overflow-hidden rounded-[4rem] border-8 border-brand-neon/20 shadow-neon bg-black aspect-square max-w-sm mx-auto relative z-10"></div>
                            <div className="absolute inset-0 bg-brand-neon/5 blur-[100px] rounded-full"></div>
                            {/* Scanner Viewfinder Elements */}
                            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-brand-neon z-20 rounded-tl-2xl"></div>
                            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-brand-neon z-20 rounded-tr-2xl"></div>
                            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-brand-neon z-20 rounded-bl-2xl"></div>
                            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-brand-neon z-20 rounded-br-2xl"></div>
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-brand-neon/40 animate-scan z-20"></div>
                          </div>
                          <button
                            onClick={stopScanner}
                            className="w-full max-w-sm mx-auto bg-slate-100 dark:bg-white/5 text-slate-400 p-7 rounded-[2rem] font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-4 uppercase text-[10px] tracking-[0.3em]"
                          >
                            <X size={20} /> Encerrar Scanner
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] p-12 hover:bg-white dark:hover:bg-brand-elevated transition-all border border-transparent hover:border-white/5 flex flex-col">
                      <h3 className="text-xl font-black mb-10 flex items-center justify-between text-slate-900 dark:text-white uppercase tracking-[0.2em] opacity-60">
                        <span>Fluxo de Validação</span>
                        <History size={18} className="text-brand-neon" />
                      </h3>
                      <div className="flex-1 space-y-6">
                        {/* Placeholder for real-time history or actual logs */}
                        <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3.5rem] bg-white/30 dark:bg-black/10 h-full flex flex-col items-center justify-center group">
                          <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <CheckCircle size={40} className="text-slate-300 dark:text-slate-700 opacity-40" />
                          </div>
                          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] max-w-[240px] mx-auto leading-relaxed">Aguardando sinais do ecossistema para validação...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranking Tab - UI3.0 Borderless */}
              {activeTab === 'ranking' && (
                <div className="space-y-12">
                  <div className="flex justify-between items-end gap-8">
                    <div>
                      <h2 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                        <Trophy className="text-brand-neon" size={32} /> Ranking de Impacto
                      </h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium text-sm md:text-base">Os líderes da transformação no ecossistema.</p>
                    </div>
                  </div>

                  <div className="bg-transparent overflow-hidden">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                      <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                          <tr>
                            <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Posição</th>
                            <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Perfil do Membro</th>
                            <th className="px-10 py-4 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] text-right">Potencial Acumulado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ranking.map((u, i) => (
                            <tr key={u.id} className="group transition-all duration-300">
                              <td className="px-10 py-6 bg-slate-50/50 dark:bg-brand-surface/40 rounded-l-[2rem] group-hover:bg-slate-100 dark:group-hover:bg-brand-elevated transition-colors text-center">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl mx-auto ${i === 0 ? 'bg-brand-neon text-black shadow-neon scale-110' : i === 1 ? 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300' : i === 2 ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-700'}`}>
                                  {i + 1}
                                </div>
                              </td>
                              <td className="px-10 py-6 bg-slate-50/50 dark:bg-brand-surface/40 group-hover:bg-slate-100 dark:group-hover:bg-brand-elevated transition-colors">
                                <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden group-hover:border-brand-neon/30 transition-colors">
                                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300 dark:text-slate-800" />}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight">{u.nome}</p>
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">Hélice da Inovação</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-6 bg-slate-50/50 dark:bg-brand-surface/40 rounded-r-[2rem] group-hover:bg-slate-100 dark:group-hover:bg-brand-elevated transition-colors text-right">
                                <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-brand-neon transition-colors">
                                  {u.pontos}
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">pts</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                      {ranking.map((u, i) => (
                        <div key={u.id} className="bg-slate-50/50 dark:bg-brand-surface/40 p-6 rounded-[2rem] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i === 0 ? 'bg-brand-neon text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                              {i + 1}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-white/10 overflow-hidden">
                              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-2.5 text-slate-300" />}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white text-sm">{u.nome}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Membro</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-brand-neon leading-none">{u.pontos}</p>
                            <p className="text-[8px] font-black text-slate-500 uppercase">PTS</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Members Tab - UI3.0 Refined */}
              {activeTab === 'members' && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                      <h2 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                        <Users size={32} className="text-brand-neon" /> Comunidade INOVAP
                      </h2>
                      <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium text-sm md:text-base">Conecte-se com as mentes brilhantes do nosso ecossistema.</p>
                    </div>

                    <div className="relative w-full md:w-80 group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-neon transition-colors" size={18} />
                      <input
                        type="text"
                        placeholder="Buscar membro..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-brand-surface/50 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-neon/30 focus:bg-white dark:focus:bg-brand-elevated transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(m => {
                      const memberCompany = empresas.find(e => e.responsavel === m.uuid);
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (user?.governanca) {
                              setSelectedMemberForGts(m);
                            } else if (memberCompany) {
                              onViewCompany(memberCompany);
                            }
                          }}
                          className={`bg-slate-50/50 dark:bg-brand-surface/40 rounded-[3rem] p-8 flex items-center gap-6 group hover:bg-white dark:hover:bg-brand-elevated transition-all border border-transparent hover:border-brand-neon/10 hover:shadow-2xl hover:shadow-brand-neon/5 relative overflow-hidden ${(user?.governanca || memberCompany) ? 'cursor-pointer' : ''}`}
                        >
                          {/* Decorative Background Element */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-neon/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                          <div className="relative">
                            <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500 ring-0 group-hover:ring-4 ring-brand-neon/10">
                              {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <Users size={32} className="text-slate-300 dark:text-slate-800" />}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-neon rounded-full border-4 border-white dark:border-brand-surface flex items-center justify-center">
                              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight truncate">{m.nome}</h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-600 font-bold mt-1 truncate lowercase">{m.email}</p>

                            <div className="mt-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                              <div className="px-3 py-1 bg-brand-neon/10 rounded-full text-[9px] font-black text-brand-neon uppercase tracking-tighter">
                                {m.pontos || 0} Inovapoints
                              </div>
                              <button className="text-[10px] font-black text-slate-400 hover:text-brand-neon dark:hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
                                {user?.governanca ? 'Gerenciar GTs' : memberCompany ? 'Ver Empresa' : 'Ver Perfil'} <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredMembers.length === 0 && (
                      <div className="col-span-full py-20 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-6">
                          <Users size={32} className="text-slate-300 dark:text-slate-700" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 dark:text-slate-600">Nenhum membro encontrado...</h3>
                        <p className="text-sm text-slate-500 mt-2">Tente ajustar os termos da sua busca.</p>
                      </div>
                    )}
                  </div>

                  {/* Modal de Gestão de Membro e Seus GTs - UI3.0 Borderless */}
                  {selectedMemberForGts && user?.governanca && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-3xl animate-fade-in" onClick={() => setSelectedMemberForGts(null)}></div>
                      <div className="relative w-full max-w-2xl bg-white dark:bg-brand-surface border border-slate-100 dark:border-white/5 rounded-[4rem] p-12 md:p-16 shadow-2xl animate-fade-in-up">
                        <button onClick={() => setSelectedMemberForGts(null)} className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-brand-elevated text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={24} /></button>

                        <div className="flex flex-col items-center text-center mb-12">
                          <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-[3.5rem] bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden ring-8 ring-brand-neon/5">
                              {selectedMemberForGts.avatar ? <img src={selectedMemberForGts.avatar} className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-slate-300 dark:text-slate-800" />}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-brand-neon text-black p-3 rounded-2xl shadow-neon border-4 border-white dark:border-brand-surface">
                              <ShieldCheck size={20} />
                            </div>
                          </div>
                          <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedMemberForGts.nome}</h3>
                          <p className="text-slate-500 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 italic">{selectedMemberForGts.email}</p>
                        </div>

                        <div className="space-y-8">
                          <button
                            onClick={() => handleToggleUserGovernanca(selectedMemberForGts)}
                            className={`w-full flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all ${selectedMemberForGts.governanca ? 'bg-brand-neon/10 border-brand-neon/40' : 'bg-slate-50 dark:bg-brand-elevated border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                          >
                            <div className="flex items-center gap-3">
                              <ShieldCheck size={20} className={selectedMemberForGts.governanca ? 'text-brand-neon' : 'text-slate-400 dark:text-slate-600'} />
                              <div className="flex flex-col text-left">
                                <span className={`text-[11px] font-black uppercase tracking-tight ${selectedMemberForGts.governanca ? 'text-brand-neon' : 'text-slate-600 dark:text-slate-300'}`}>
                                  Acesso à Governança
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium">Tem poderes em toda a plataforma</span>
                              </div>
                            </div>
                            <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${selectedMemberForGts.governanca ? 'bg-brand-neon' : 'bg-slate-300 dark:bg-slate-700'}`}>
                              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${selectedMemberForGts.governanca ? 'translate-x-6' : ''}`} />
                            </div>
                          </button>

                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Células de Atuação</h4>
                            <span className="text-[10px] font-bold text-brand-neon">{(selectedMemberForGts.gts || []).length} GTs</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {gts.map(gt => {
                              const isMember = selectedMemberForGts.gts?.includes(gt.id);
                              return (
                                <button
                                  key={gt.id}
                                  onClick={() => isMember ? handleRemoveMemberFromGt(selectedMemberForGts, gt.id) : handleAddMemberToGt(selectedMemberForGts, gt.id)}
                                  className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all group/btn ${isMember ? 'bg-brand-neon/10 border-brand-neon/40 text-brand-neon' : 'bg-slate-50 dark:bg-brand-elevated border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-white/10'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Boxes size={18} className={isMember ? 'text-brand-neon' : 'text-slate-400 dark:text-slate-600'} />
                                    <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[120px]">{gt.gt}</span>
                                  </div>
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isMember ? 'bg-brand-neon text-black' : 'bg-white dark:bg-brand-surface text-slate-200 dark:text-slate-800'}`}>
                                    {isMember ? <CheckSquare size={14} /> : <Plus size={14} />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 dark:border-white/5">
                          <button
                            onClick={() => setSelectedMemberForGts(null)}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all"
                          >
                            Finalizar Gestão
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Bottom Navigation for Mobile - UI3.0 Tab Bar Refined */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] z-[60] animate-fade-in-up">
          <nav className="bg-white/80 dark:bg-brand-surface/80 backdrop-blur-3xl border border-slate-200/40 dark:border-white/5 rounded-[2.8rem] p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
            {[
              { id: 'overview', label: 'Início', icon: LayoutDashboard },
              { id: 'members', label: 'Fórum', icon: Users },
              { id: 'tasks', label: 'Ações', icon: CheckSquare, restricted: true },
              { id: 'agenda', label: 'Agenda', icon: CalendarRange },
              { id: 'profile', label: 'Perfil', icon: UserIcon, action: onProfileClick }
            ]
              .filter(item => {
                if (item.restricted) {
                  return user.governanca || (user.gts && user.gts.length > 0);
                }
                return true;
              })
              .map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => item.action ? item.action() : setActiveTab(item.id as Tab)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-16 rounded-[2rem] transition-all duration-500 ${isActive ? 'text-brand-neon' : 'text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <div className={`transition-all duration-500 ease-out ${isActive ? 'scale-110 -translate-y-1.5' : 'scale-100 translate-y-0'}`}>
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {isActive ? (
                      <span className="absolute bottom-2 text-[8px] font-black uppercase tracking-[0.2em] animate-fade-in-up pb-0.5">{item.label}</span>
                    ) : (
                      <div className="absolute bottom-2 w-1 h-1 bg-slate-300 dark:bg-slate-800 rounded-full opacity-0 translate-y-2" />
                    )}
                    {isActive && (
                      <div className="absolute -top-1 w-12 h-0.5 bg-gradient-to-r from-transparent via-brand-neon to-transparent blur-[1px]" />
                    )}
                  </button>
                );
              })}
          </nav>
        </div>
      </main>
    </div>
  );
};
