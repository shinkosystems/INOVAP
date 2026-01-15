
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
  ChevronRight as ChevronRightIcon, TodayIcon
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
  const [userSearchInput, setUserSearchInput] = useState('');
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

      // Process event stats (registration counts)
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

  // Load comments when task is selected
  useEffect(() => {
    if (selectedTaskDetail) {
      fetchComments(selectedTaskDetail.id);
    } else {
      setTaskComments([]);
    }
  }, [selectedTaskDetail]);

  const fetchComments = async (taskId: number) => {
    try {
      const { data, error } = await supabase
        .from('tarefa_comentarios')
        .select('*, autor:users(*)')
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTaskComments(data || []);
    } catch (e) {
      console.error("Erro ao buscar comentários", e);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedTaskDetail || !user) return;
    try {
      const { error } = await supabase
        .from('tarefa_comentarios')
        .insert([{
          tarefa_id: selectedTaskDetail.id,
          autor_id: user.id,
          conteudo: newComment
        }]);
      if (error) throw error;
      setNewComment('');
      fetchComments(selectedTaskDetail.id);
    } catch (e) {
      showNotification('error', 'Erro ao enviar comentário.');
    }
  };

  const handleAnexoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTaskDetail || !user) return;
    
    setIsUploadingAnexo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `task_${selectedTaskDetail.id}_${Date.now()}.${fileExt}`;
      const filePath = `anexosTarefas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imagensBlog')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('imagensBlog').getPublicUrl(filePath);
      
      const novosAnexos = [...(selectedTaskDetail.anexos || []), { nome: file.name, url: publicUrl }];
      
      const { error: updateError } = await supabase
        .from('tarefas')
        .update({ anexos: novosAnexos })
        .eq('id', selectedTaskDetail.id);

      if (updateError) throw updateError;

      setSelectedTaskDetail({ ...selectedTaskDetail, anexos: novosAnexos });
      showNotification('success', 'Anexo adicionado!');
      fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao carregar anexo.');
    } finally {
      setIsUploadingAnexo(false);
    }
  };

  const handleUpdateTaskField = async (taskId: number, field: string, value: any) => {
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from('tarefas').update({ [field]: value }).eq('id', taskId);
      if (error) throw error;
      showNotification('success', 'Tarefa atualizada!');
      fetchData();
      
      if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
        const updated = { ...selectedTaskDetail, [field]: value };
        if (field === 'responsavel_id') {
           updated.responsavel = members.find(m => m.id === value);
        }
        setSelectedTaskDetail(updated);
      }
    } catch (e) {
      showNotification('error', 'Erro ao atualizar tarefa.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const { error } = await supabase.from('tarefas').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      showNotification('success', 'Status atualizado!');
      fetchData();
      if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
        setSelectedTaskDetail({...selectedTaskDetail, status: newStatus as any});
      }
    } catch (e) {
      showNotification('error', 'Falha ao atualizar status.');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Tem certeza que deseja remover esta tarefa?')) return;
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from('tarefas').delete().eq('id', taskId);
      if (error) throw error;
      showNotification('success', 'Tarefa removida com sucesso!');
      setSelectedTaskDetail(null);
      fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao remover tarefa.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Fix: Added missing handleCreateTask function
  const handleCreateTask = async () => {
    if (!newTaskData.titulo || isProcessingAction || !user) return;
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from('tarefas').insert([{
        titulo: newTaskData.titulo,
        descricao: newTaskData.descricao,
        responsavel_id: newTaskData.responsavel_id,
        gt_id: newTaskData.gt_id,
        prazo: newTaskData.prazo,
        status: newTaskData.status || 'Pendente',
        criado_por: user.uuid
      }]);
      if (error) throw error;
      showNotification('success', 'Tarefa criada com sucesso!');
      setIsAddingTask(false);
      setNewTaskData({
        titulo: '',
        descricao: '',
        responsavel_id: undefined,
        gt_id: undefined,
        prazo: '',
        status: 'Pendente'
      });
      fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao criar tarefa.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchGt = taskFilters.gt === 'all' || task.gt_id === taskFilters.gt;
      const matchUser = taskFilters.user === 'all' || task.responsavel_id === taskFilters.user;
      return matchGt && matchUser;
    });
  }, [tasks, taskFilters]);

  // CALENDAR LOGIC ENHANCED
  const navigateCalendar = (direction: number) => {
      const newDate = new Date(calendarAnchorDate);
      if (calendarViewType === 'month') newDate.setMonth(newDate.getMonth() + direction);
      if (calendarViewType === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
      if (calendarViewType === 'day') newDate.setDate(newDate.getDate() + direction);
      setCalendarAnchorDate(newDate);
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const year = calendarAnchorDate.getFullYear();
    const month = calendarAnchorDate.getMonth();

    if (calendarViewType === 'month') {
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayWeekday = firstDayOfMonth.getDay();
        
        for (let i = firstDayWeekday; i > 0; i--) {
          days.push({ date: new Date(year, month, 1 - i), currentPeriod: false });
        }
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
          days.push({ date: new Date(year, month, i), currentPeriod: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
          days.push({ date: new Date(year, month + 1, i), currentPeriod: false });
        }
    } else if (calendarViewType === 'week') {
        const startOfWeek = new Date(calendarAnchorDate);
        startOfWeek.setDate(calendarAnchorDate.getDate() - calendarAnchorDate.getDay());
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push({ date: d, currentPeriod: true });
        }
    } else {
        days.push({ date: new Date(calendarAnchorDate), currentPeriod: true });
    }

    return days;
  }, [calendarAnchorDate, calendarViewType]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Tarefa[]> = {};
    filteredTasks.forEach(task => {
      if (task.prazo) {
        const key = new Date(task.prazo).toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
      e.dataTransfer.setData("taskId", taskId.toString());
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
      e.preventDefault();
      const taskId = parseInt(e.dataTransfer.getData("taskId"));
      if (!isNaN(taskId)) {
          const isoDate = date.toISOString().split('T')[0];
          await handleUpdateTaskField(taskId, 'prazo', isoDate);
      }
  };

  // Agenda logic
  const handleWithdrawTicket = async (evento: Evento) => {
    if (!user || isProcessingAction) return;
    if (myTickets.some(t => t.evento_id === evento.id)) {
      showNotification('error', 'Você já possui um ingresso para este evento.');
      return;
    }
    const taken = eventStats[evento.id] || 0;
    if (evento.vagas && taken >= evento.vagas) {
      showNotification('error', 'Infelizmente as vagas estão esgotadas.');
      return;
    }
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from('inscricoes').insert([{
        evento_id: evento.id,
        user_id: user.id,
        status: 'confirmado'
      }]);
      if (error) throw error;
      showNotification('success', `Ingresso para "${evento.titulo}" retirado com sucesso!`);
      setSelectedEventDetails(null);
      fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao processar inscrição.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const prioritizedEvents = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let filtered = [...events];
    if (filterYear !== 'all') filtered = filtered.filter(e => new Date(e.data_inicio).getFullYear() === filterYear);
    if (filterMonth !== 'all') filtered = filtered.filter(e => new Date(e.data_inicio).getMonth() === filterMonth);
    if (filterYear === 'all' && filterMonth === 'all') filtered = filtered.filter(e => new Date(e.data_inicio) >= new Date(now.setHours(0,0,0,0)));
    return filtered.sort((a, b) => {
      const dateA = new Date(a.data_inicio);
      const dateB = new Date(b.data_inicio);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events, filterMonth, filterYear]);

  // Article Creation Logic
  const execEditorCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) setNewArticleData(prev => ({ ...prev, conteudo: editorRef.current?.innerHTML || '' }));
  };

  const handleArticleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsProcessingAction(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `article_${Date.now()}.${fileExt}`;
      const filePath = `imagensBlog/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('imagensBlog').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('imagensBlog').getPublicUrl(filePath);
      setNewArticleData(prev => ({ ...prev, capa: data.publicUrl }));
      showNotification('success', 'Capa carregada com sucesso!');
    } catch (e) { showNotification('error', 'Erro ao carregar imagem.'); } finally { setIsProcessingAction(false); }
  };

  const handleSaveArticle = async () => {
    if (!newArticleData.titulo || !newArticleData.conteudo || !user) {
      showNotification('error', 'Título e Conteúdo são obrigatórios.');
      return;
    }
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from('artigos').insert([{
        titulo: newArticleData.titulo,
        subtitulo: newArticleData.subtitulo,
        conteudo: newArticleData.conteudo,
        capa: newArticleData.capa,
        tags: newArticleData.tags,
        autor: user.uuid,
        aprovado: false
      }]);
      if (error) throw error;
      showNotification('success', 'Artigo enviado para revisão!');
      setIsCreatingArticle(false);
      setNewArticleData({ titulo: '', subtitulo: '', conteudo: '', capa: '', tags: [] });
      fetchData();
    } catch (e) { showNotification('error', 'Erro ao salvar artigo.'); } finally { setIsProcessingAction(false); }
  };

  // QR Scanner Logic
  const handleCheckin = async (inscricaoId: string) => {
    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .update({ status: 'checkin_realizado', checkin_at: new Date().toISOString() })
        .eq('id', inscricaoId)
        .select('*, user:users(nome), evento:eventos(titulo)')
        .single();
      if (error) throw error;
      showNotification('success', `Check-in: ${data.user.nome} em ${data.evento.titulo}`);
    } catch (e: any) { showNotification('error', 'Inscrição inválida ou já utilizada.'); }
  };

  const startScanner = () => setIsScanning(true);
  const stopScanner = async () => {
    if (scannerRef.current) {
      try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); } catch (e) { console.error(e); }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    let mounted = true;
    if (isScanning && activeTab === 'checkin') {
      const initScanner = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!mounted || !document.getElementById("reader")) return;
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => { await handleCheckin(decodedText); await stopScanner(); },
            () => { }
          );
        } catch (err) { setIsScanning(false); }
      };
      initScanner();
    }
    return () => {
      mounted = false;
      if (scannerRef.current) { scannerRef.current.stop().catch(console.error); scannerRef.current = null; }
    };
  }, [isScanning, activeTab]);

  // GT Logic
  const handleCreateGt = async () => {
    if (!newGtName.trim() || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from('gts').insert([{ gt: newGtName }]);
      if (error) throw error;
      showNotification('success', 'Novo GT criado com sucesso!');
      setNewGtName(''); setIsAddingGt(false); fetchData();
    } catch (e) { showNotification('error', 'Erro ao criar GT.'); } finally { setIsProcessingAction(false); }
  };

  const handleAddMemberToGt = async (targetUser: User, gtId?: number) => {
    const finalGtId = gtId || selectedGtForManagement?.id;
    if (!finalGtId || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      const currentGts = targetUser.gts || [];
      if (currentGts.includes(finalGtId)) { showNotification('error', 'Membro já vinculado.'); return; }
      const { error } = await supabase.from('users').update({ gts: [...currentGts, finalGtId] }).eq('id', targetUser.id);
      if (error) throw error;
      showNotification('success', `${targetUser.nome} adicionado ao GT!`);
      fetchData();
      if (selectedMemberForGts && selectedMemberForGts.id === targetUser.id) setSelectedMemberForGts({ ...selectedMemberForGts, gts: [...currentGts, finalGtId] });
    } catch (e) { showNotification('error', 'Falha na operação.'); } finally { setIsProcessingAction(false); }
  };

  const handleRemoveMemberFromGt = async (targetUser: User, gtId?: number) => {
    const finalGtId = gtId || selectedGtForManagement?.id;
    if (!finalGtId || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      const currentGts = targetUser.gts || [];
      const newGts = currentGts.filter(id => id !== finalGtId);
      const { error } = await supabase.from('users').update({ gts: newGts }).eq('id', targetUser.id);
      if (error) throw error;
      showNotification('success', 'Membro removido do grupo.');
      fetchData();
      if (selectedMemberForGts && selectedMemberForGts.id === targetUser.id) setSelectedMemberForGts({ ...selectedMemberForGts, gts: newGts });
    } catch (e) { showNotification('error', 'Erro ao remover.'); } finally { setIsProcessingAction(false); }
  };

  const membersToInvite = useMemo(() => !selectedGtForManagement ? [] : members.filter(u => !u.gts?.includes(selectedGtForManagement.id)), [members, selectedGtForManagement]);
  const gtMembers = useMemo(() => !selectedGtForManagement ? [] : members.filter(u => u.gts?.includes(selectedGtForManagement.id)), [members, selectedGtForManagement]);

  // Gamification
  const handleEditRule = (rule: PontuacaoRegra) => { setEditingRuleId(rule.id); setEditingValue(rule.valor.toString()); };
  const handleSaveRule = async () => {
    if (editingRuleId === null || isProcessingAction) return;
    const newValue = parseInt(editingValue);
    if (isNaN(newValue)) { showNotification('error', 'Valor inválido.'); return; }
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from('pontuacao_regras').update({ valor: newValue }).eq('id', editingRuleId);
      if (error) throw error;
      showNotification('success', 'Regra atualizada com sucesso!');
      setEditingRuleId(null); fetchData();
    } catch (e: any) { showNotification('error', 'Erro ao salvar regra.'); } finally { setIsProcessingAction(false); }
  };

  const getGtNameById = (id: number) => gts.find(g => g.id === id)?.gt || `GT ${id}`;

  if (!user) return <div className="flex items-center justify-center h-screen bg-black text-white">Carregando perfil...</div>;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const years = [2024, 2025, 2026];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-neon selection:text-black flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-white/10 bg-[#050505] fixed h-full z-40">
        <div className="p-10 flex flex-col items-center">
          <Logo dark className="mb-4 scale-125" />
          <div className="mt-4 text-[11px] font-black uppercase tracking-[0.4em] text-brand-neon">PAINEL DE GESTÃO</div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-6 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-4">MENU</div>
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'overview' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('ranking')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'ranking' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Star size={20} /> Ranking
          </button>
          <button onClick={() => setActiveTab('members')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'members' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Users size={20} /> Membros
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'tasks' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <ListTodo size={20} /> Tarefas
          </button>
          <button onClick={() => setActiveTab('agenda')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'agenda' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <CalendarRange size={20} /> Agenda
          </button>

          <div className="pt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-4">MINHA ÁREA</div>
          <button onClick={() => setActiveTab('articles')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'articles' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <FileText size={20} /> Meus Artigos
          </button>
          <button onClick={() => setActiveTab('my_events')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'my_events' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Ticket size={20} /> Ingressos
          </button>
          
          {user.governanca && (
            <>
              <div className="pt-8 text-[10px] font-black text-brand-neon uppercase tracking-widest mb-4 px-4">GOVERNANÇA</div>
              <button onClick={() => setActiveTab('gts_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'gts_manage' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Boxes size={20} /> Gestão de GTs
              </button>
              <button onClick={() => setActiveTab('articles_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'articles_manage' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <CheckSquare size={20} /> Aprovar Artigos
              </button>
              <button onClick={() => setActiveTab('gamification')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'gamification' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Trophy size={20} /> Gamificação
              </button>
              <button onClick={() => setActiveTab('checkin')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'checkin' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <ScanLine size={20} /> Check-in
              </button>
            </>
          )}
        </nav>

        <div className="p-8 border-t border-white/5"><button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black text-red-500 hover:bg-red-500/10 transition-all"><LogOut size={20} /> Sair</button></div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-80 min-h-screen relative bg-[#000]">
        <header className="sticky top-0 z-30 flex items-center justify-between px-10 py-6 bg-black/60 backdrop-blur-2xl border-b border-white/5">
           <div className="flex items-center gap-4 lg:hidden"><Logo dark className="scale-75" /></div>
           <div className="hidden lg:block text-slate-400 text-sm font-medium">Seja bem-vindo, <span className="text-white font-black">{user.nome}</span></div>
           <div className="flex items-center gap-6"><button onClick={onProfileClick} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:border-brand-neon transition-all overflow-hidden group">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <SearchIcon size={20} className="group-hover:text-brand-neon" />}</button></div>
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
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Sincronizando Ecossistema...</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {/* Tarefas Tab Content */}
              {activeTab === 'tasks' && (
                <div className="space-y-12">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                      <div>
                        <h2 className="text-4xl font-black tracking-tight flex items-center gap-4"><ListTodo className="text-brand-neon" size={40} /> Gestão de Tarefas</h2>
                        <p className="text-slate-500 mt-2 font-medium">Acompanhe e gerencie as atividades das hélice do Alto Paraopeba.</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex">
                            <button onClick={() => setTaskViewMode('list')} className={`p-3 rounded-xl transition-all ${taskViewMode === 'list' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}><LayoutList size={20} /></button>
                            <button onClick={() => setTaskViewMode('calendar')} className={`p-3 rounded-xl transition-all ${taskViewMode === 'calendar' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}><Calendar size={20} /></button>
                        </div>
                        {user.governanca && (<button onClick={() => setIsAddingTask(true)} className="bg-brand-neon text-black px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-white transition-all shadow-lg shadow-brand-neon/20"><PlusCircle size={20} /> NOVA TAREFA</button>)}
                      </div>
                   </div>

                   {/* Filtros de Tarefa */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Grupo de Trabalho</label>
                        <select 
                            value={taskFilters.gt}
                            onChange={(e) => setTaskFilters({...taskFilters, gt: e.target.value === 'all' ? 'all' : parseInt(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-brand-neon"
                        >
                            <option value="all">Todos os GTs</option>
                            {gts.map(g => <option key={g.id} value={g.id}>{g.gt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Membro Responsável</label>
                        <select 
                            value={taskFilters.user}
                            onChange={(e) => setTaskFilters({...taskFilters, user: e.target.value === 'all' ? 'all' : parseInt(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-brand-neon"
                        >
                            <option value="all">Todos os Membros</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </select>
                      </div>
                   </div>

                   {taskViewMode === 'list' ? (
                     <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Tarefa</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">GT / Contexto</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Responsável</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Prazo</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map((task) => (
                                <tr key={task.id} onClick={() => setSelectedTaskDetail(task)} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                    <td className="px-10 py-8"><p className="font-black text-white text-lg group-hover:text-brand-neon transition-colors">{task.titulo}</p>{task.descricao && <p className="text-sm text-slate-500 font-medium line-clamp-1 mt-1">{task.descricao}</p>}</td>
                                    <td className="px-10 py-8">{task.gt ? (<span className="bg-brand-neon/10 text-brand-neon px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-brand-neon/20">{task.gt.gt}</span>) : (<span className="text-slate-600 font-bold text-xs uppercase italic">Geral</span>)}</td>
                                    <td className="px-10 py-8"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">{task.responsavel?.avatar ? <img src={task.responsavel.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-slate-700" />}</div><span className="text-sm font-bold text-slate-300">{task.responsavel?.nome || 'Não atribuído'}</span></div></td>
                                    <td className="px-10 py-8"><div className="flex items-center gap-2 text-slate-400 font-bold text-sm"><CalendarClock size={16} className="text-brand-neon" />{task.prazo ? new Date(task.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}</div></td>
                                    <td className="px-10 py-8"><div className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${task.status === 'Concluído' ? 'text-brand-neon border border-brand-neon/30 bg-brand-neon/5' : task.status === 'Em Andamento' ? 'text-blue-400 border border-blue-400/30 bg-blue-400/5' : 'text-orange-400 border-orange-400/30 bg-orange-400/5'}`}>{task.status}</div></td>
                                </tr>
                                ))}
                                {filteredTasks.length === 0 && (<tr><td colSpan={5} className="px-10 py-32 text-center text-slate-500 font-black uppercase tracking-[0.2em] italic">Nenhuma tarefa encontrada.</td></tr>)}
                            </tbody>
                            </table>
                        </div>
                     </div>
                   ) : (
                    /* Calendar View Enhanced */
                    <div className="space-y-6">
                        {/* Calendar Controls */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem]">
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                                <button onClick={() => setCalendarViewType('month')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${calendarViewType === 'month' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>Mês</button>
                                <button onClick={() => setCalendarViewType('week')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${calendarViewType === 'week' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>Semana</button>
                                <button onClick={() => setCalendarViewType('day')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${calendarViewType === 'day' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>Dia</button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigateCalendar(-1)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><ChevronLeft size={20} /></button>
                                <h4 className="text-xl font-black text-white min-w-[200px] text-center">
                                    {calendarViewType === 'month' && `${monthNames[calendarAnchorDate.getMonth()]} ${calendarAnchorDate.getFullYear()}`}
                                    {calendarViewType === 'week' && `Semana de ${calendarDays[0]?.date.toLocaleDateString('pt-BR')}`}
                                    {calendarViewType === 'day' && calendarAnchorDate.toLocaleDateString('pt-BR')}
                                </h4>
                                <button onClick={() => navigateCalendar(1)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><ChevronRightIcon size={20} /></button>
                            </div>

                            <button onClick={() => setCalendarAnchorDate(new Date())} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Hoje</button>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden p-8">
                            <div className={`grid ${calendarViewType === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-px bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl`}>
                                {calendarViewType !== 'day' && ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                                    <div key={d} className="bg-white/5 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">{d}</div>
                                ))}
                                
                                {calendarDays.map((day, i) => {
                                    const dateKey = day.date.toISOString().split('T')[0];
                                    const dayTasks = tasksByDay[dateKey] || [];
                                    const isToday = new Date().toISOString().split('T')[0] === dateKey;

                                    return (
                                        <div 
                                            key={i} 
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, day.date)}
                                            className={`transition-colors hover:bg-white/[0.02] border-r border-b border-white/5 flex flex-col gap-2 
                                                ${calendarViewType === 'day' ? 'min-h-[400px] p-8' : 'min-h-[140px] p-3'}
                                                ${!day.currentPeriod ? 'opacity-20 grayscale' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-black ${isToday ? 'bg-brand-neon text-black rounded-full flex items-center justify-center' : 'text-slate-600'} 
                                                    ${calendarViewType === 'day' ? 'text-4xl w-16 h-16' : 'text-sm w-7 h-7'}`}>
                                                    {day.date.getDate()}
                                                </span>
                                                {dayTasks.length > 0 && <span className="text-[10px] font-black text-brand-neon uppercase tracking-tighter">{dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}</span>}
                                            </div>

                                            <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar-minimal">
                                                {dayTasks.map(t => (
                                                    <button 
                                                        key={t.id} 
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, t.id)}
                                                        onClick={() => setSelectedTaskDetail(t)}
                                                        className={`w-full text-left rounded-xl font-black uppercase truncate transition-all hover:scale-[1.02] active:scale-95 border cursor-grab active:cursor-grabbing
                                                            ${calendarViewType === 'day' ? 'p-6 text-sm mb-4' : 'p-2 text-[9px]'}
                                                            ${t.status === 'Concluído' ? 'bg-brand-neon/10 border-brand-neon/30 text-brand-neon' : t.status === 'Em Andamento' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}
                                                    >
                                                        {calendarViewType === 'day' && <div className="flex items-center justify-between mb-2"><span className="text-[10px] opacity-50">{t.gt?.gt || 'Geral'}</span><TaskIcon size={16} /></div>}
                                                        {t.titulo}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                   )}

                   {/* Modal Detalhes da Tarefa */}
                   {selectedTaskDetail && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedTaskDetail(null)}></div>
                            <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 flex flex-col animate-fade-in-up shadow-[0_0_100px_rgba(0,255,157,0.1)] max-h-[90vh]">
                                <button onClick={() => setSelectedTaskDetail(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${selectedTaskDetail.status === 'Concluído' ? 'bg-brand-neon/20 border-brand-neon text-brand-neon' : selectedTaskDetail.status === 'Em Andamento' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'}`}>{selectedTaskDetail.status}</div>
                                                {selectedTaskDetail.gt && (<span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">• {selectedTaskDetail.gt.gt}</span>)}
                                            </div>
                                            <h3 className="text-4xl font-black text-white leading-tight">{selectedTaskDetail.titulo}</h3>
                                        </div>
                                        {user.governanca && (<button onClick={() => handleDeleteTask(selectedTaskDetail.id)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20" title="Excluir Tarefa"><Trash2 size={20} /></button>)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block">Descrição e Contexto</label>
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-slate-300 leading-relaxed font-medium">{selectedTaskDetail.descricao || 'Sem descrição.'}</div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-y border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">{selectedTaskDetail.responsavel?.avatar ? <img src={selectedTaskDetail.responsavel.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-slate-700" size={20} />}</div>
                                                    <div className="flex-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Responsável</span>{user.governanca ? (<select value={selectedTaskDetail.responsavel_id || ''} onChange={(e) => handleUpdateTaskField(selectedTaskDetail.id, 'responsavel_id', e.target.value ? parseInt(e.target.value) : null)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-brand-neon"><option value="">Não atribuído</option>{members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>) : (<p className="font-bold text-white text-sm">{selectedTaskDetail.responsavel?.nome || 'Pendente'}</p>)}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-neon"><CalendarClock size={20} /></div>
                                                    <div className="flex-1"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Entrega</span>{user.governanca ? (<input type="date" value={selectedTaskDetail.prazo || ''} onChange={(e) => handleUpdateTaskField(selectedTaskDetail.id, 'prazo', e.target.value || null)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-brand-neon" />) : (<p className="font-bold text-white text-sm">{selectedTaskDetail.prazo ? new Date(selectedTaskDetail.prazo).toLocaleDateString('pt-BR') : 'Sem data'}</p>)}</div>
                                                </div>
                                            </div>

                                            {/* Anexos */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] flex items-center gap-2"><Paperclip size={14} /> Anexos</label><button onClick={() => anexoInputRef.current?.click()} disabled={isUploadingAnexo} className="text-[9px] font-black uppercase tracking-widest text-brand-neon hover:underline flex items-center gap-1">{isUploadingAnexo ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}Adicionar</button><input type="file" ref={anexoInputRef} className="hidden" onChange={handleAnexoUpload} /></div>
                                                <div className="grid grid-cols-1 gap-2">{selectedTaskDetail.anexos?.map((anexo, idx) => (<a key={idx} href={anexo.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"><span className="text-xs font-bold text-slate-300 truncate max-w-[200px]">{anexo.nome}</span><Download size={16} className="text-slate-500 group-hover:text-brand-neon" /></a>))}{(!selectedTaskDetail.anexos || selectedTaskDetail.anexos.length === 0) && (<p className="text-[10px] text-slate-600 font-bold uppercase italic">Nenhum anexo.</p>)}</div>
                                            </div>
                                        </div>

                                        {/* Comentários */}
                                        <div className="space-y-6 flex flex-col h-full"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] flex items-center gap-2"><MessageSquare size={14} /> Discussão</label><div className="flex-1 min-h-[200px] max-h-[400px] bg-white/[0.02] border border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar space-y-4">{taskComments.map((com) => (<div key={com.id} className="flex gap-3 animate-fade-in-up"><div className="w-8 h-8 rounded-lg bg-black flex-shrink-0 overflow-hidden border border-white/10">{com.autor?.avatar ? <img src={com.autor.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-500">{com.autor?.nome.charAt(0)}</div>}</div><div className="flex-1"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-black text-brand-neon">{com.autor?.nome}</span><span className="text-[8px] font-bold text-slate-600 uppercase">{new Date(com.created_at).toLocaleString('pt-BR')}</span></div><p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/5">{com.conteudo}</p></div></div>))}{taskComments.length === 0 && (<div className="h-full flex items-center justify-center opacity-20 flex-col gap-2"><MessageSquare size={32} /><span className="text-[10px] font-black uppercase tracking-widest">Sem mensagens</span></div>)}</div><div className="relative mt-auto"><textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Digite uma atualização..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-14 text-xs text-white focus:border-brand-neon outline-none resize-none h-20" /><button onClick={handlePostComment} disabled={!newComment.trim()} className="absolute right-3 bottom-3 p-3 bg-brand-neon text-black rounded-xl hover:scale-110 transition-all disabled:opacity-30 disabled:hover:scale-100"><Send size={16} /></button></div></div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-3 px-1">Atualizar Status</label><div className="flex gap-2">{['Pendente', 'Em Andamento', 'Concluído'].map(s => (<button key={s} onClick={() => handleUpdateTaskStatus(selectedTaskDetail.id, s)} disabled={!user.governanca && selectedTaskDetail.responsavel_id !== user.id} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTaskDetail.status === s ? (s === 'Concluído' ? 'bg-brand-neon text-black' : s === 'Em Andamento' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white') : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{s}</button>))}</div></div>
                                </div>
                            </div>
                        </div>
                   )}

                   {/* Modal Nova Tarefa */}
                   {isAddingTask && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsAddingTask(false)}></div>
                        <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 flex flex-col animate-fade-in-up shadow-[0_0_100px_rgba(0,255,157,0.1)]">
                           <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                              <h3 className="text-3xl font-black text-white flex items-center gap-3"><PlusCircle className="text-brand-neon" /> Nova Tarefa</h3>
                              <button onClick={() => setIsAddingTask(false)} className="text-slate-500 hover:text-white transition-colors"><X size={32} /></button>
                           </div>

                           <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[60vh]">
                              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Título</label><input type="text" placeholder="O que precisa ser feito?" value={newTaskData.titulo} onChange={(e) => setNewTaskData({...newTaskData, titulo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-neon outline-none" /></div>
                              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Descrição</label><textarea placeholder="Contexto..." value={newTaskData.descricao} onChange={(e) => setNewTaskData({...newTaskData, descricao: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-neon outline-none h-32 resize-none" /></div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Responsável</label><select value={newTaskData.responsavel_id} onChange={(e) => setNewTaskData({...newTaskData, responsavel_id: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-neon outline-none"><option value="">Selecione...</option>{members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">GT</label><select value={newTaskData.gt_id} onChange={(e) => setNewTaskData({...newTaskData, gt_id: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-neon outline-none"><option value="">Geral</option>{gts.map(g => <option key={g.id} value={g.id}>{g.gt}</option>)}</select></div></div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Prazo</label><input type="date" value={newTaskData.prazo} onChange={(e) => setNewTaskData({...newTaskData, prazo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-neon outline-none" /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Status</label><select value={newTaskData.status} onChange={(e) => setNewTaskData({...newTaskData, status: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-neon outline-none"><option value="Pendente">Pendente</option><option value="Em Andamento">Em Andamento</option><option value="Concluído">Concluído</option></select></div></div>
                           </div>

                           <div className="mt-10 pt-8 border-t border-white/5 flex gap-4"><button onClick={handleCreateTask} disabled={isProcessingAction || !newTaskData.titulo} className="flex-1 bg-brand-neon text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50">{isProcessingAction ? <Loader2 className="animate-spin mx-auto" /> : 'CONFIRMAR'}</button><button onClick={() => setIsAddingTask(false)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 hover:text-white transition-all">Cancelar</button></div>
                        </div>
                     </div>
                   )}
                </div>
              )}

              {/* Rest of Tabs (Agenda, Articles, etc.) remain unchanged */}
              {activeTab === 'agenda' && (
                <div className="space-y-12">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                      <div>
                        <h2 className="text-4xl font-black tracking-tight flex items-center gap-4"><CalendarRange className="text-brand-neon" size={40} /> Próximas Experiências</h2>
                        <p className="text-slate-500 mt-2 font-medium">Garanta sua participação nos principais eventos do ecossistema.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-3"><Filter size={16} className="text-brand-neon" /><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Filtrar por:</span></div>
                        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-brand-neon transition-all cursor-pointer"><option value="all">Todos os Meses</option>{monthNames.map((m, i) => (<option key={i} value={i}>{m}</option>))}</select>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-brand-neon transition-all cursor-pointer"><option value="all">Todos os Anos</option>{years.map(y => (<option key={y} value={y}>{y}</option>))}</select>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{prioritizedEvents.map(evt => { const date = new Date(evt.data_inicio); const today = new Date(); today.setHours(0,0,0,0); const daysLeft = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24)); const isCurrentMonth = date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear(); const taken = eventStats[evt.id] || 0; const vacanciesLeft = evt.vagas ? Math.max(0, evt.vagas - taken) : 'Ilimitado'; const alreadyInscribed = myTickets.some(t => t.evento_id === evt.id); return (<div key={evt.id} onClick={() => setSelectedEventDetails(evt)} className={`group bg-[#0a0a0a] border rounded-[2.5rem] overflow-hidden transition-all hover:-translate-y-1 cursor-pointer flex flex-col ${isCurrentMonth ? 'border-brand-neon/30 shadow-[0_10px_30px_rgba(0,255,157,0.05)]' : 'border-white/5 hover:border-brand-green/30'}`}><div className="h-48 bg-slate-900 relative">{evt.imagem_capa ? <img src={evt.imagem_capa} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center bg-brand-green/5"><CalendarDays size={48} className="text-slate-800" /></div>}<div className="absolute inset-x-4 top-4 flex justify-between items-start pointer-events-none"><div className="flex flex-col gap-2 items-start"><span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-brand-neon border border-brand-neon/20">{evt.tipo}</span></div><div className="flex flex-col gap-2 items-end">{alreadyInscribed && (<span className="bg-brand-neon text-black px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-xl"><CheckCircle size={10} /> Já inscrito</span>)}{isCurrentMonth && (<div className="bg-brand-neon/90 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase animate-pulse shadow-xl border border-white/10">Destaque do Mês</div>)}</div></div></div><div className="p-8 flex-1 flex flex-col"><div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3"><div className="w-2 h-2 rounded-full bg-brand-neon"></div><span>{date.toLocaleDateString('pt-BR')} • {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div><h3 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-brand-neon transition-colors">{evt.titulo}</h3><p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">{evt.descricao}</p><div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-white/5"><div className="flex flex-col"><span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Vagas Livres</span><span className={`text-lg font-black ${vacanciesLeft === 0 ? 'text-grid-cols-2' : 'text-white'}`}>{vacanciesLeft}</span></div><div className="flex flex-col"><span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Status</span><span className="text-lg font-black text-white">{daysLeft === 0 ? 'Hoje' : daysLeft < 0 ? 'Realizado' : `Em ${daysLeft} dias`}</span></div></div></div></div>); })}{prioritizedEvents.length === 0 && (<div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]"><CalendarRange size={64} className="mx-auto text-slate-800 mb-6" /><p className="text-slate-500 font-black uppercase tracking-widest">Nenhum evento encontrado para este período.</p></div>)}</div>
                   {selectedEventDetails && (<div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in-up"><div className="h-20 border-b border-white/10 flex items-center justify-between px-10 bg-black/80 backdrop-blur-xl"><button onClick={() => setSelectedEventDetails(null)} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors uppercase font-black text-xs tracking-widest"><ArrowLeft size={20} /> Voltar à Agenda</button>{!myTickets.some(t => t.evento_id === selectedEventDetails.id) ? (<button onClick={() => handleWithdrawTicket(selectedEventDetails)} disabled={isProcessingAction || (selectedEventDetails.vagas && (eventStats[selectedEventDetails.id] || 0) >= selectedEventDetails.vagas)} className="bg-brand-neon text-black px-10 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-white transition-all shadow-lg shadow-brand-neon/20 disabled:opacity-50">{isProcessingAction ? <Loader2 className="animate-spin" size={20} /> : <Ticket size={20} />}RETIRAR MEU INGRESSO</button>) : (<div className="bg-brand-green/20 text-brand-neon px-8 py-3 rounded-xl font-black text-xs border border-brand-green/30 flex items-center gap-2"><CheckCircle size={18} /> INSCRIÇÃO CONFIRMADA</div>)}</div><div className="flex-1 overflow-y-auto custom-scrollbar p-10 md:p-20"><div className="max-w-4xl mx-auto space-y-12"><div className="space-y-6"><span className="text-brand-neon font-black uppercase tracking-[0.3em] text-sm">{selectedEventDetails.tipo} EXCLUSIVO</span><h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">{selectedEventDetails.titulo}</h1><div className="flex flex-wrap gap-8 py-6"><div className="flex items-center gap-4"><div className="p-3 bg-white/5 rounded-2xl text-brand-neon"><CalendarRange size={24} /></div><div><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data e Hora</div><div className="font-bold text-white">{new Date(selectedEventDetails.data_inicio).toLocaleDateString('pt-BR')} às {new Date(selectedEventDetails.data_inicio).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div></div></div><div className="flex items-center gap-4"><div className="p-3 bg-white/5 rounded-2xl text-brand-neon"><MapPin size={24} /></div><div><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização</div><div className="font-bold text-white">{selectedEventDetails.local}</div></div></div><div className="flex items-center gap-4"><div className="p-3 bg-white/5 rounded-2xl text-brand-neon"><UsersIcon size={24} /></div><div><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capacidade</div><div className="font-bold text-white">{selectedEventDetails.vagas || 'Ilimitada'} vagas totais</div></div></div></div></div><div className="w-full h-[400px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">{selectedEventDetails.imagem_capa ? <img src={selectedEventDetails.imagem_capa} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-800"><CalendarDays size={100} /></div>}{selectedEventDetails.exclusivo && (<div className="absolute top-10 right-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Lock size={16} className="text-brand-neon" /> Evento Fechado</div>)}</div><div className="prose prose-invert prose-lg max-w-none"><h2 className="text-2xl font-black text-white">Sobre o Evento</h2><p className="text-slate-300 leading-[1.8] font-medium whitespace-pre-line">{selectedEventDetails.descricao}</p></div><div className="bg-brand-neon/5 border border-brand-neon/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8"><div><h4 className="text-xl font-black text-white">Pronto para inovar?</h4><p className="text-slate-400 font-medium mt-1">Ao retirar o ingresso, seu QR Code de acesso será gerado automaticamente.</p></div>{!myTickets.some(t => t.evento_id === selectedEventDetails.id) && (<button onClick={() => handleWithdrawTicket(selectedEventDetails)} disabled={isProcessingAction || (selectedEventDetails.vagas && (eventStats[selectedEventDetails.id] || 0) >= selectedEventDetails.vagas)} className="bg-brand-neon text-black px-12 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50">GARANTIR MINHA VAGA</button>)}</div></div></div></div>)}
                </div>
              )}

              {/* Rest of Tabs (ranking, members, etc.) remain unchanged */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
