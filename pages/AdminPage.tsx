import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User, GT, Artigo, Evento, Empresa, PontuacaoRegra, AcademyVideo, Tarefa } from '../types';
import { 
  LayoutDashboard, Users, GitBranch, FileText, Calendar, Building2, 
  Trophy, Settings, LogOut, ArrowLeft, Plus, Edit, Trash2, Check, X, 
  Search, Shield, Info, Loader2, Sparkles, PlusCircle, CheckCircle2,
  CalendarDays, Tag, ShieldAlert, Youtube, Zap, CheckSquare
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';

interface AdminPageProps {
  user: User | null;
  onNavigate: (target: string) => void;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'gts' | 'users' | 'articles' | 'events' | 'companies' | 'gamification' | 'settings' | 'academy' | 'governance' | 'tasks';

export const AdminPage: React.FC<AdminPageProps> = ({ user, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data States
  const [gts, setGts] = useState<GT[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Artigo[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [rules, setRules] = useState<PontuacaoRegra[]>([]);
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [academyVideos, setAcademyVideos] = useState<AcademyVideo[]>([]);
  const [tasks, setTasks] = useState<Tarefa[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');

  // Modal / Form States
  const [isGtModalOpen, setIsGtModalOpen] = useState(false);
  const [selectedGt, setSelectedGt] = useState<GT | null>(null);
  const [gtFormData, setGtFormData] = useState({ 
    gt: '', 
    descricao: '', 
    coordenador_id: '' as string | number,
    diretrizes: '',
    info_institucional: ''
  });
  const [coordenadorSearch, setCoordenadorSearch] = useState('');
  const [showCoordenadorDropdown, setShowCoordenadorDropdown] = useState(false);
  const [gtMembers, setGtMembers] = useState<Array<User & { cargo_gt?: number }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberCargos, setMemberCargos] = useState<Record<number, number>>({});

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [eventFormData, setEventFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    local: '',
    tipo: 'Workshop',
    vagas: 50,
    exclusivo: false
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    nome: '',
    cargo: 3,
    governanca: false,
    is_admin: false,
    gts: [] as number[]
  });

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PontuacaoRegra | null>(null);
  const [ruleFormData, setRuleFormData] = useState({ acao: '', valor: 0 });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<AcademyVideo | null>(null);
  const [videoFormData, setVideoFormData] = useState({ titulo: '', subtitulo: '', conteudo: '', youtube_url: '', capa: '', ordem: 0 });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    titulo: '',
    descricao: '',
    prazo: '',
    status: 'Pendente' as 'Pendente' | 'Em Andamento' | 'Concluído',
    responsavel_id: '' as string | number,
    gt_id: '' as string | number
  });
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterGt, setTaskFilterGt] = useState<string>('all');
  const [taskFilterUser, setTaskFilterUser] = useState<string>('all');


  useEffect(() => {
    if (!user || !user.is_admin) {
      onNavigate('inicio');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gtsRes, usersRes, articlesRes, eventsRes, companiesRes, rulesRes, tasksRes] = await Promise.all([
        supabase.from('gts').select('*').order('gt'),
        supabase.from('users').select('*').order('nome'),
        supabase.from('artigos').select('*').order('created_at', { ascending: false }),
        supabase.from('eventos').select('*').order('data_inicio', { ascending: false }),
        supabase.from('empresas').select('*').order('nome'),
        supabase.from('pontuacao_regras').select('*').order('valor', { ascending: false }),
        supabase.from('tarefas').select('*, responsavel:users(id, nome, avatar), gt:gts(id, gt)').order('prazo', { ascending: true })
      ]);

      if (gtsRes.data) setGts(gtsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (articlesRes.data) setArticles(articlesRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (companiesRes.data) setCompanies(companiesRes.data);
      if (rulesRes.data) setRules(rulesRes.data);
      if (tasksRes.data) setTasks(tasksRes.data as Tarefa[]);

      // Carregar canal do youtube de forma isolada
      try {
        const { data: configData } = await supabase.from('configuracoes').select('*');
        if (configData) {
          const youtubeUrlObj = configData.find((c: any) => c.key === 'youtube_channel_url');
          setYoutubeChannelUrl(youtubeUrlObj ? youtubeUrlObj.value : '');
        }
      } catch (err) {
        console.warn("Tabela 'configuracoes' não encontrada ou vazia. Rode o script SQL create_academy_tables.sql", err);
      }

      // Carregar vídeos da academy de forma isolada
      try {
        const { data: videosData } = await supabase.from('academy_videos').select('*').order('ordem', { ascending: true });
        if (videosData) {
          setAcademyVideos(videosData);
        }
      } catch (err) {
        console.warn("Tabela 'academy_videos' não encontrada ou vazia. Rode o script SQL create_academy_tables.sql", err);
      }

    } catch (e) {
      showToast('error', 'Erro ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- GT CRUD ---
  const handleOpenGtModal = async (gt: GT | null = null) => {
    setSelectedGt(gt);
    setGtFormData({
      gt: gt ? gt.gt : '',
      descricao: gt ? (gt.descricao || '') : '',
      coordenador_id: gt ? (gt.coordenador_id || '') : '',
      diretrizes: gt ? (gt.diretrizes || '') : '',
      info_institucional: gt ? (gt.info_institucional || '') : ''
    });

    // Populate coordenadorSearch with coordinator name if editing
    if (gt && gt.coordenador_id) {
      const coordenador = users.find(u => u.id === gt.coordenador_id);
      setCoordenadorSearch(coordenador ? coordenador.nome : '');
    } else {
      setCoordenadorSearch('');
    }
    setShowCoordenadorDropdown(false);
    setIsGtModalOpen(true);

    // Fetch members if editing existing GT
    if (gt) {
      setLoadingMembers(true);
      try {
        const { data: membersData, error } = await supabase
          .from('users')
          .select('*')
          .contains('gts', [gt.id])
          .order('nome');

        if (error) throw error;

        // Fetch current cargos for these members in this GT
        // We need to check if there's a GT-specific cargo stored
        // For now, use their global cargo as default
        const membersWithCargo = (membersData || []).map(m => ({
          ...m,
          cargo_gt: m.cargo || 3
        }));
        setGtMembers(membersWithCargo);
        
        // Initialize memberCargos with current values
        const initialCargos: Record<number, number> = {};
        membersWithCargo.forEach(m => {
          initialCargos[m.id] = m.cargo_gt || 3;
        });
        setMemberCargos(initialCargos);
      } catch (e) {
        console.error('Erro ao carregar membros do GT:', e);
        setGtMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    } else {
      setGtMembers([]);
      setMemberCargos({});
    }
  };

  const handleSaveGt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gtFormData.gt.trim()) return;

    try {
      const payload = {
        gt: gtFormData.gt,
        descricao: gtFormData.descricao,
        coordenador_id: gtFormData.coordenador_id || null,
        diretrizes: gtFormData.diretrizes,
        info_institucional: gtFormData.info_institucional
      };

      if (selectedGt) {
        const { error } = await supabase
          .from('gts')
          .update(payload)
          .eq('id', selectedGt.id);

        if (error) throw error;
        showToast('success', 'Grupo de Trabalho atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('gts')
          .insert([payload]);

        if (error) throw error;
        showToast('success', 'Grupo de Trabalho criado com sucesso!');
      }
      
      // Save member cargos to users table (global cargo update)
      if (selectedGt) {
        for (const member of gtMembers) {
          const newCargo = memberCargos[member.id];
          if (newCargo && newCargo !== member.cargo) {
            await supabase
              .from('users')
              .update({ cargo: newCargo })
              .eq('id', member.id);
          }
        }
      }
      
      setIsGtModalOpen(false);
      loadData();
    } catch (error) {
      showToast('error', 'Erro ao salvar o Grupo de Trabalho.');
    }
  };

  const handleMemberCargoChange = (memberId: number, newCargo: number) => {
    setMemberCargos(prev => ({ ...prev, [memberId]: newCargo }));
  };

  const handleDeleteGt = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este GT? Isso pode afetar a associação de usuários e tarefas.')) return;
    try {
      // 1. Desvincular tarefas associadas a este GT para não violar restrição de chave estrangeira (FK)
      const { error: errorTarefas } = await supabase
        .from('tarefas')
        .update({ gt_id: null })
        .eq('gt_id', id);
      
      if (errorTarefas) throw errorTarefas;

      // 2. Desvincular usuários associados a este GT no array gts
      const usersToUpdate = users.filter(u => u.gts?.includes(id));
      for (const u of usersToUpdate) {
        const updatedGts = u.gts ? u.gts.filter(gId => gId !== id) : [];
        const { error: errorUser } = await supabase
          .from('users')
          .update({ gts: updatedGts })
          .eq('id', u.id);
        
        if (errorUser) throw errorUser;
      }

      // 3. Excluir o GT do banco de dados
      const { data, error } = await supabase
        .from('gts')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Falha na exclusão. Verifique as permissões de RLS no banco de dados.');
      }

      showToast('success', 'Grupo de Trabalho excluído com sucesso.');
      loadData();
    } catch (e: any) {
      console.error(e);
      showToast('error', e.message || 'Erro ao excluir o Grupo de Trabalho.');
    }
  };

  // --- USER Edit ---
  const handleOpenUserModal = (u: User) => {
    setSelectedUser(u);
    setUserFormData({
      nome: u.nome,
      cargo: u.cargo || 3,
      governanca: !!u.governanca,
      is_admin: !!u.is_admin,
      gts: u.gts || []
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          cargo: userFormData.cargo,
          governanca: userFormData.governanca,
          is_admin: userFormData.is_admin,
          gts: userFormData.gts
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      showToast('success', 'Usuário atualizado com sucesso!');
      setIsUserModalOpen(false);
      loadData();
    } catch (e) {
      showToast('error', 'Erro ao atualizar o usuário.');
    }
  };

  // --- ARTICLE Approval ---
  const handleApproveArticle = async (id: number, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('artigos')
        .update({ aprovado: approve })
        .eq('id', id);

      if (error) throw error;
      showToast('success', approve ? 'Artigo aprovado e publicado!' : 'Artigo rejeitado.');
      loadData();
    } catch (e) {
      showToast('error', 'Erro ao alterar o status do artigo.');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('Excluir este artigo permanentemente?')) return;
    try {
      const { error } = await supabase.from('artigos').delete().eq('id', id);
      if (error) throw error;
      showToast('success', 'Artigo excluído.');
      loadData();
    } catch (e) {
      showToast('error', 'Erro ao excluir artigo.');
    }
  };

  // --- EVENT CRUD ---
  const handleOpenEventModal = (event: Evento | null = null) => {
    setSelectedEvent(event);
    if (event) {
      setEventFormData({
        titulo: event.titulo,
        descricao: event.descricao || '',
        data_inicio: event.data_inicio ? new Date(event.data_inicio).toISOString().slice(0, 16) : '',
        local: event.local,
        tipo: event.tipo,
        vagas: event.vagas || 50,
        exclusivo: !!event.exclusivo
      });
    } else {
      setEventFormData({
        titulo: '',
        descricao: '',
        data_inicio: '',
        local: '',
        tipo: 'Workshop',
        vagas: 50,
        exclusivo: false
      });
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.titulo.trim() || !eventFormData.data_inicio) return;

    try {
      const payload = {
        ...eventFormData,
        data_inicio: new Date(eventFormData.data_inicio).toISOString(),
        criado_por: user?.uuid
      };

      if (selectedEvent) {
        const { error } = await supabase
          .from('eventos')
          .update(payload)
          .eq('id', selectedEvent.id);
        if (error) throw error;
        showToast('success', 'Evento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('eventos')
          .insert([payload]);
        if (error) throw error;
        showToast('success', 'Evento criado com sucesso!');
      }
      setIsEventModalOpen(false);
      loadData();
    } catch (error) {
      showToast('error', 'Erro ao salvar o evento.');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Excluir este evento permanentemente? Isso também removerá todas as inscrições dele.')) return;
    try {
      // 1. Deletar inscrições associadas a este evento para não violar restrição de chave estrangeira (FK)
      const { error: errorInscricoes } = await supabase
        .from('inscricoes')
        .delete()
        .eq('evento_id', id);
      
      if (errorInscricoes) throw errorInscricoes;

      // 2. Excluir o evento do banco de dados
      const { data, error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Falha na exclusão. Verifique as permissões de RLS no banco de dados.');
      }

      showToast('success', 'Evento excluído com sucesso.');
      loadData();
    } catch (e: any) {
      console.error(e);
      showToast('error', e.message || 'Erro ao excluir o evento.');
    }
  };

  // --- GAMIFICATION RULE CRUD ---
  const handleOpenRuleModal = (rule: PontuacaoRegra | null = null) => {
    setSelectedRule(rule);
    setRuleFormData({
      acao: rule ? rule.acao : '',
      valor: rule ? rule.valor : 0
    });
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleFormData.acao.trim()) return;

    try {
      if (selectedRule) {
        const { error } = await supabase
          .from('pontuacao_regras')
          .update({ acao: ruleFormData.acao, valor: ruleFormData.valor })
          .eq('id', selectedRule.id);
        if (error) throw error;
        showToast('success', 'Regra de pontuação atualizada!');
      } else {
        const { error } = await supabase
          .from('pontuacao_regras')
          .insert([ruleFormData]);
        if (error) throw error;
        showToast('success', 'Nova regra criada!');
      }
      setIsRuleModalOpen(false);
      loadData();
    } catch (e) {
      showToast('error', 'Erro ao salvar a regra.');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm('Excluir esta regra de pontuação?')) return;
    try {
      const { error } = await supabase.from('pontuacao_regras').delete().eq('id', id);
      if (error) throw error;
      showToast('success', 'Regra excluída.');
      loadData();
    } catch (e) {
      showToast('error', 'Erro ao excluir regra.');
    }
  };

  // --- ACADEMY CRUD ---
  const handleOpenVideoModal = (video: AcademyVideo | null = null) => {
    setSelectedVideo(video);
    setVideoFormData({
      titulo: video ? video.titulo : '',
      subtitulo: video ? (video.subtitulo || '') : '',
      conteudo: video ? (video.conteudo || '') : '',
      youtube_url: video ? video.youtube_url : '',
      capa: video ? (video.capa || '') : '',
      ordem: video ? (video.ordem || 0) : 0
    });
    setIsVideoModalOpen(true);
  };

  const handleVideoCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data, error } = await supabase.storage.from('imagensBlog').upload(`academy/${Date.now()}_${file.name}`, file);
      if (error) throw error;
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('imagensBlog').getPublicUrl(data.path);
        setVideoFormData(prev => ({ ...prev, capa: publicUrl }));
        showToast('success', 'Imagem de capa carregada!');
      }
    } catch (err) {
      showToast('error', 'Erro ao enviar a imagem de capa.');
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFormData.titulo.trim() || !videoFormData.youtube_url.trim()) return;

    try {
      const payload = {
        titulo: videoFormData.titulo,
        subtitulo: videoFormData.subtitulo,
        conteudo: videoFormData.conteudo,
        youtube_url: videoFormData.youtube_url,
        capa: videoFormData.capa,
        ordem: videoFormData.ordem,
        autor: user?.uuid
      };

      if (selectedVideo) {
        const { error } = await supabase
          .from('academy_videos')
          .update(payload)
          .eq('id', selectedVideo.id);

        if (error) throw error;
        showToast('success', 'Artigo da Academy atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('academy_videos')
          .insert([payload]);

        if (error) throw error;
        showToast('success', 'Artigo da Academy cadastrado com sucesso!');
      }
      setIsVideoModalOpen(false);
      loadData();
    } catch (error) {
      showToast('error', 'Erro ao salvar o artigo da Academy.');
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este artigo da Academy?')) return;
    try {
      const { error } = await supabase
        .from('academy_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('success', 'Artigo da Academy removido com sucesso!');
      loadData();
    } catch (error) {
      showToast('error', 'Erro ao excluir o artigo.');
    }
  };

  // --- TAREFAS CRUD ---
  const handleOpenTaskModal = (task: Tarefa | null = null) => {
    setSelectedTask(task);
    setTaskFormData({
      titulo: task ? task.titulo : '',
      descricao: task ? (task.descricao || '') : '',
      prazo: task ? (task.prazo || '') : '',
      status: task ? task.status : 'Pendente',
      responsavel_id: task ? (task.responsavel_id || '') : '',
      gt_id: task ? (task.gt_id || '') : ''
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormData.titulo.trim()) {
      showToast('error', 'O título da tarefa é obrigatório.');
      return;
    }

    try {
      const payload = {
        titulo: taskFormData.titulo,
        descricao: taskFormData.descricao || null,
        prazo: taskFormData.prazo || null,
        status: taskFormData.status,
        responsavel_id: taskFormData.responsavel_id ? Number(taskFormData.responsavel_id) : null,
        gt_id: taskFormData.gt_id ? Number(taskFormData.gt_id) : null
      };

      if (selectedTask) {
        const { error } = await supabase
          .from('tarefas')
          .update(payload)
          .eq('id', selectedTask.id);

        if (error) throw error;
        showToast('success', 'Tarefa atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('tarefas')
          .insert([{ ...payload, criado_por: user?.uuid }]);

        if (error) throw error;
        showToast('success', 'Tarefa criada com sucesso!');
      }
      setIsTaskModalOpen(false);
      loadData();
    } catch (error) {
      showToast('error', 'Erro ao salvar a tarefa.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('success', 'Tarefa removida com sucesso!');
      loadData();
    } catch (error) {
      showToast('error', 'Erro ao excluir a tarefa.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase.from('configuracoes').upsert({
        key: 'youtube_channel_url',
        value: youtubeChannelUrl
      });
      if (error) throw error;
      showToast('success', 'Configurações salvas!');
    } catch (err) {
      showToast('error', 'Erro ao salvar configurações.');
    }
  };

  // Helper getters
  const getCargoLabel = (cargoId?: number) => {
    switch (cargoId) {
      case 1: return 'Gestor';
      case 2: return 'Representante';
      default: return 'Membro';
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArticles = articles.filter(art => {
    if (filterOption === 'pending') return !art.aprovado;
    if (filterOption === 'approved') return art.aprovado;
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 z-20 overflow-y-auto">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Logo dark={true} />
            <span className="text-[10px] font-black tracking-widest bg-brand-green/20 text-brand-neon px-2.5 py-1 rounded-full border border-brand-green/30">
              PANEL
            </span>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
              <Shield size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.nome}</p>
              <p className="text-[10px] text-slate-400 truncate">Administrador Geral</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'gts', label: 'Grupos de Trabalho', icon: GitBranch },
              { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'articles', label: 'Artigos', icon: FileText },
              { id: 'events', label: 'Eventos', icon: Calendar },
              { id: 'companies', label: 'Empresas', icon: Building2 },
              { id: 'gamification', label: 'Gamificação', icon: Trophy },
              { id: 'academy', label: 'Academy', icon: Youtube },
              { id: 'governance', label: 'Governança', icon: Shield },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setSearchTerm('');
                  }}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/10 scale-[1.02]' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => onNavigate('inicio')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 border border-slate-700/50 hover:bg-slate-750 rounded-xl text-xs font-bold transition-all text-slate-350"
          >
            <ArrowLeft size={14} /> Voltar ao Site
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-xs font-bold transition-all text-rose-400"
          >
            <LogOut size={14} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
        
        {/* Toast Notification */}
        {notification && (
          <div className={`absolute top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-fade-in-up ${
            notification.type === 'success' 
              ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/70 border-rose-500/30 text-rose-300'
          }`}>
            <Info size={18} />
            <p className="text-xs font-bold">{notification.message}</p>
          </div>
        )}

        {/* Top Header */}
        <header className="h-20 bg-slate-900/40 border-b border-slate-900 flex items-center justify-between px-8 z-10">
          <div>
            <h1 className="text-lg font-black tracking-tight capitalize">{activeTab}</h1>
            <p className="text-[10px] text-slate-400">Gerencie a plataforma INOVAP Alto Paraopeba</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl hover:bg-slate-700 text-xs font-bold transition-all"
            >
              Recarregar Painel
            </button>
          </div>
        </header>

        {/* Dynamic Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <Loader2 className="animate-spin text-brand-neon" size={40} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando Módulo</span>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
              
              {/* --- TAB: DASHBOARD --- */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  {/* Indicators Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total de Usuários', count: users.length, detail: 'Cadastrados na rede', icon: Users, color: 'text-cyan-400 bg-cyan-500/10' },
                      { label: 'Grupos de Trabalho', count: gts.length, detail: 'Verticais operacionais', icon: GitBranch, color: 'text-brand-green bg-brand-green/10' },
                      { label: 'Artigos no Blog', count: articles.length, detail: `${articles.filter(a => !a.aprovado).length} pendentes`, icon: FileText, color: 'text-amber-400 bg-amber-500/10' },
                      { label: 'Eventos Realizados', count: events.length, detail: 'Registrados na agenda', icon: Calendar, color: 'text-purple-400 bg-purple-500/10' }
                    ].map((card, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-slate-700 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{card.label}</span>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                            <card.icon size={18} />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-3xl font-black">{card.count}</h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{card.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Overview Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                      <h4 className="font-extrabold text-sm border-b border-slate-800 pb-3">Artigos Pendentes de Moderação</h4>
                      
                      {articles.filter(a => !a.aprovado).length === 0 ? (
                        <p className="text-xs text-slate-450 italic py-4">Nenhum artigo aguardando aprovação no momento.</p>
                      ) : (
                        <div className="space-y-3">
                          {articles.filter(a => !a.aprovado).slice(0, 5).map(art => (
                            <div key={art.id} className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex justify-between items-center">
                              <div>
                                <h5 className="text-xs font-bold">{art.titulo}</h5>
                                <p className="text-[10px] text-slate-400 mt-1">Autor UUID: {art.autor}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleApproveArticle(art.id, true)}
                                  className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-all"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteArticle(art.id)}
                                  className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/20 flex items-center justify-center transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                      <h4 className="font-extrabold text-sm border-b border-slate-800 pb-3">Resumo do Ecossistema</h4>
                      <div className="space-y-4">
                        {[
                          { label: 'Empresas no Mapa', value: companies.length, labelColor: 'bg-emerald-500/20 text-emerald-450' },
                          { label: 'Membros com Governança', value: users.filter(u => u.governanca).length, labelColor: 'bg-purple-500/20 text-purple-400' },
                          { label: 'Administradores', value: users.filter(u => u.is_admin).length, labelColor: 'bg-amber-500/20 text-amber-450' }
                        ].map((stat, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-xs text-slate-300 font-medium">{stat.label}</span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${stat.labelColor}`}>
                              {stat.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: GTS --- */}
              {activeTab === 'gts' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Gerenciar Grupos de Trabalho</h2>
                    <button 
                      onClick={() => handleOpenGtModal()}
                      className="px-4 py-2.5 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Plus size={16} /> Novo GT
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gts.map(gt => {
                      const coordenador = users.find(u => u.id === gt.coordenador_id);
                      return (
                        <div key={gt.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="text-base font-black">{gt.gt}</h3>
                              <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2 py-0.5 rounded border border-slate-700/50">
                                ID: {gt.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                              {gt.descricao || 'Nenhuma descrição inserida para esta vertical institucional.'}
                            </p>
                            {coordenador && (
                              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                  {coordenador.avatar ? <img src={coordenador.avatar} className="w-full h-full object-cover" /> : coordenador.nome[0].toUpperCase()}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordenador:</span>
                                <span className="text-xs font-bold text-slate-200">{coordenador.nome}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {users.filter(u => u.gts?.includes(gt.id)).length} membros vinculados
                            </span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleOpenGtModal(gt)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                              >
                                <Edit size={12} /> Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteGt(gt.id)}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 text-xs font-bold rounded-lg transition-all flex items-center gap-1 border border-rose-500/20"
                              >
                                <Trash2 size={12} /> Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- TAB: USERS --- */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <h2 className="text-lg font-bold">Listagem de Usuários</h2>
                    <div className="relative max-w-sm w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome ou e-mail..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-brand-neon transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-850 bg-slate-900/50">
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">E-mail</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cargo</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Acessos</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <tr key={u.id} className="border-b border-slate-850 hover:bg-slate-800/10 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold overflow-hidden">
                                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.nome[0].toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold text-slate-200">{u.nome}</span>
                                </div>
                              </td>
                              <td className="p-4 text-xs text-slate-355">{u.email}</td>
                              <td className="p-4 text-xs">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.cargo === 1 ? 'bg-brand-green/20 text-brand-neon border border-brand-green/30' : 'bg-slate-800 text-slate-305'
                                }`}>
                                  {getCargoLabel(u.cargo)}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1.5 flex-wrap">
                                  {u.is_admin && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">Admin</span>}
                                  {u.governanca && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Governanca</span>}
                                  {!u.is_admin && !u.governanca && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-850 text-slate-450">Comum</span>}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleOpenUserModal(u)}
                                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all text-slate-300 border border-slate-800"
                                >
                                  Gerenciar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: ARTICLES --- */}
              {activeTab === 'articles' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h2 className="text-lg font-bold">Moderação de Artigos</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setFilterOption('pending')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          filterOption === 'pending' ? 'bg-amber-500 text-black' : 'bg-slate-905 border border-slate-800'
                        }`}
                      >
                        Pendentes
                      </button>
                      <button 
                        onClick={() => setFilterOption('approved')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          filterOption === 'approved' ? 'bg-brand-green text-black' : 'bg-slate-905 border border-slate-800'
                        }`}
                      >
                        Aprovados
                      </button>
                      <button 
                        onClick={() => setFilterOption('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          filterOption === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-905 border border-slate-800'
                        }`}
                      >
                        Todos
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredArticles.length === 0 ? (
                      <p className="text-xs text-slate-450 italic py-6 text-center">Nenhum artigo encontrado com este filtro.</p>
                    ) : (
                      filteredArticles.map(art => (
                        <div key={art.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-100">{art.titulo}</h3>
                              {art.aprovado ? (
                                <span className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded border border-emerald-500/20">Aprovado</span>
                              ) : (
                                <span className="text-[8px] font-black uppercase bg-amber-500/10 text-amber-450 px-2 py-0.5 rounded border border-amber-500/20">Pendente</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{art.subtitulo}</p>
                            <div className="flex gap-3 text-[10px] text-slate-450 mt-3 font-semibold">
                              <span>Data: {new Date(art.created_at).toLocaleDateString('pt-BR')}</span>
                              <span>Autor UUID: {art.autor}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!art.aprovado && (
                              <button 
                                onClick={() => handleApproveArticle(art.id, true)}
                                className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold rounded-xl transition-all border border-emerald-500/20"
                              >
                                Aprovar Artigo
                              </button>
                            )}
                            {art.aprovado && (
                              <button 
                                onClick={() => handleApproveArticle(art.id, false)}
                                className="px-4 py-2 bg-amber-550/15 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition-all border border-amber-500/20"
                              >
                                Despublicar
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteArticle(art.id)}
                              className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-450 text-xs font-bold rounded-xl transition-all border border-rose-500/20"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB: EVENTS --- */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Listagem de Eventos</h2>
                    <button 
                      onClick={() => handleOpenEventModal()}
                      className="px-4 py-2.5 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Plus size={16} /> Novo Evento
                    </button>
                  </div>

                  <div className="space-y-4">
                    {events.map(ev => (
                      <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all">
                        <div className="flex gap-4 items-start">
                          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-750 flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {ev.imagem_capa ? <img src={ev.imagem_capa} className="w-full h-full object-cover" /> : <CalendarDays className="text-slate-450" size={24} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-100">{ev.titulo}</h3>
                              <span className="text-[8px] font-black uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-750">{ev.tipo}</span>
                              {ev.exclusivo && <span className="text-[8px] font-black uppercase bg-brand-green/20 text-brand-neon px-2 py-0.5 rounded border border-brand-green/30">Exclusivo</span>}
                            </div>
                            <p className="text-xs text-slate-450 mt-1">{ev.local}</p>
                            <p className="text-[10px] text-slate-405 mt-2 font-medium">
                              Data: {new Date(ev.data_inicio).toLocaleString('pt-BR')} • {ev.vagas} Vagas
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenEventModal(ev)}
                            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-800"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all border border-rose-500/20"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB: COMPANIES --- */}
              {activeTab === 'companies' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Empresas Apoiadoras</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {companies.map(c => (
                      <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                        <div className="flex gap-4 items-start">
                          <div className="w-12 h-12 bg-slate-850 border border-slate-850 rounded-2xl flex items-center justify-center text-xs overflow-hidden shrink-0 font-black">
                            {c.logo ? <img src={c.logo} className="w-full h-full object-cover" /> : c.nome[0]}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">{c.nome}</h3>
                            <p className="text-[10px] text-slate-400 mt-1">{c.cidade} - {c.uf} • CNPJ: {c.cnpj}</p>
                            {c.slogan && <p className="text-xs text-slate-350 italic mt-2">"{c.slogan}"</p>}
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-850 text-right">
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                            Projetos: {c.numero_projetos || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB: GAMIFICATION --- */}
              {activeTab === 'gamification' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Regras de Pontuação (Gamificação)</h2>
                    <button 
                      onClick={() => handleOpenRuleModal()}
                      className="px-4 py-2.5 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Plus size={16} /> Nova Regra
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 bg-slate-900/50">
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ação / Gatilho</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Pontos Gerados</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map(rule => (
                          <tr key={rule.id} className="border-b border-slate-850 hover:bg-slate-800/10 transition-colors">
                            <td className="p-4 text-xs font-bold text-slate-200">{rule.acao}</td>
                            <td className="p-4 text-xs">
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-brand-green/20 text-brand-neon">
                                +{rule.valor} pts
                              </span>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                              <button 
                                onClick={() => handleOpenRuleModal(rule)}
                                className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-350 border border-slate-800"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-455 border border-rose-500/20"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- TAB: GOVERNANCE --- */}
              {activeTab === 'governance' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 animate-fade-in-up animate-duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Shield size={20} className="text-brand-neon" />
                        Governança do Ecossistema
                      </h2>
                      <p className="text-xs text-slate-450 mt-1">Gerencie membros com acesso à governança, coordenadores de GTs e estrutura organizacional</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Membros da Governança */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} className="text-purple-400" />
                        Membros com Acesso à Governança
                      </h3>
                      <div className="space-y-2">
                        {users.filter(u => u.governanca).length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum membro com acesso à governança</p>
                        ) : (
                          users.filter(u => u.governanca).map(member => (
                            <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                  {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : member.nome[0].toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-200 text-xs block">{member.nome}</span>
                                  <span className="text-[10px] text-slate-400 truncate block max-w-xs">{member.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">Governança</span>
                                {member.is_admin && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Admin</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Coordenadores de GTs */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <GitBranch size={14} className="text-brand-green" />
                        Coordenadores de Grupos de Trabalho
                      </h3>
                      <div className="space-y-2">
                        {gts.filter(gt => gt.coordenador_id).length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum coordenador definido</p>
                        ) : (
                          gts.filter(gt => gt.coordenador_id).map(gt => {
                            const coord = users.find(u => u.id === gt.coordenador_id);
                            return (
                              <div key={gt.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center">
                                      <GitBranch size={14} className="text-brand-neon" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-200 text-xs block">{gt.gt}</span>
                                    </div>
                                  </div>
                                  {coord && (
                                    <div className="flex items-center gap-2 text-right">
                                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                        {coord.avatar ? <img src={coord.avatar} className="w-full h-full object-cover" /> : coord.nome[0].toUpperCase()}
                                      </div>
                                      <span className="font-bold text-slate-200 text-xs">{coord.nome}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }))}
                      </div>
                    </div>

                    {/* Estrutura Organizacional */}
                    <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={14} className="text-cyan-400" />
                        Visão Geral da Estrutura
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                          <div className="text-2xl font-black text-brand-neon">{users.filter(u => u.governanca).length}</div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Membros Governança</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                          <div className="text-2xl font-black text-brand-green">{gts.filter(gt => gt.coordenador_id).length}</div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">GTs com Coordenador</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                          <div className="text-2xl font-black text-purple-400">{gts.length - gts.filter(gt => gt.coordenador_id).length}</div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">GTs sem Coordenador</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                          <div className="text-2xl font-black text-cyan-400">{users.filter(u => u.cargo === 1).length}</div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Gestores Globais</div>
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Zap size={14} className="text-amber-400" />
                        Ações Rápidas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button 
                          onClick={() => setActiveTab('users')}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-brand-neon/50 hover:bg-slate-850 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-brand-neon" />
                            <span className="font-bold text-xs">Gerenciar Usuários</span>
                          </div>
                          <p className="text-[10px] text-slate-400">Adicionar/remover acesso à governança, alterar cargos</p>
                        </button>
                        <button 
                          onClick={() => setActiveTab('gts')}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-brand-neon/50 hover:bg-slate-850 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <GitBranch size={16} className="text-brand-green" />
                            <span className="font-bold text-xs">Gerenciar GTs</span>
                          </div>
                          <p className="text-[10px] text-slate-400">Definir coordenadores, diretrizes, info institucional</p>
                        </button>
                        <button 
                          onClick={() => setActiveTab('gamification')}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-brand-neon/50 hover:bg-slate-850 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy size={16} className="text-amber-400" />
                            <span className="font-bold text-xs">Gamificação</span>
                          </div>
                          <p className="text-[10px] text-slate-400">Configurar regras de pontuação e recompensas</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: SETTINGS --- */}
              {activeTab === 'settings' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 animate-fade-in-up animate-duration-500">
                  <div>
                    <h2 className="text-base font-bold text-white">Configurações Gerais do INOVAP</h2>
                    <p className="text-xs text-slate-450 mt-1">Configure parâmetros macro do ecossistema</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-850">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">Nome Oficial do Ecossistema</label>
                      <input 
                        type="text" 
                        defaultValue="INOVAP Alto Paraopeba"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">E-mail de Contato Principal</label>
                      <input 
                        type="email" 
                        defaultValue="ecossistemainovap@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">Link do Canal do YouTube</label>
                      <input 
                        type="text" 
                        value={youtubeChannelUrl}
                        onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                        placeholder="https://www.youtube.com/@CanalInovap"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleSaveSettings}
                      className="px-6 py-2.5 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl transition-all"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}

              {/* --- TAB: ACADEMY --- */}
              {activeTab === 'academy' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 animate-fade-in-up animate-duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Youtube size={20} className="text-red-500" />
                        Gerenciamento da Academy
                      </h2>
                      <p className="text-xs text-slate-450 mt-1">Crie e edite artigos explicativos integrados com vídeos do YouTube</p>
                    </div>
                    <button
                      onClick={() => handleOpenVideoModal(null)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition-all shadow-lg"
                    >
                      <Plus size={16} />
                      Novo Artigo / Vídeo
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-850">
                    {academyVideos.length === 0 ? (
                      <div className="bg-slate-950/50 border border-slate-850 p-8 rounded-2xl text-center">
                        <p className="text-xs text-slate-500 font-medium">Nenhum artigo cadastrado na Academy. Crie artigos para ativar a seção no portal.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold">
                              <th className="pb-3 text-center w-12">Ordem</th>
                              <th className="pb-3 pl-4">Título</th>
                              <th className="pb-3 pl-4 hidden md:table-cell">Subtítulo</th>
                              <th className="pb-3 pl-4 hidden lg:table-cell">Link do Vídeo</th>
                              <th className="pb-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {academyVideos.map((video) => (
                              <tr key={video.id} className="hover:bg-slate-850/20 transition-colors">
                                <td className="py-4 text-center font-bold text-slate-500">{video.ordem}</td>
                                <td className="py-4 pl-4 font-bold text-white max-w-xs truncate">{video.titulo}</td>
                                <td className="py-4 pl-4 text-slate-400 hidden md:table-cell max-w-xs truncate">{video.subtitulo || '-'}</td>
                                <td className="py-4 pl-4 text-slate-500 hidden lg:table-cell max-w-xs truncate">{video.youtube_url}</td>
                                <td className="py-4 text-right space-x-2">
                                  <button onClick={() => handleOpenVideoModal(video)} className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-all inline-flex items-center"><Edit size={14} /></button>
                                  <button onClick={() => handleDeleteVideo(video.id)} className="p-2 bg-slate-800/50 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl transition-all inline-flex items-center"><Trash2 size={14} /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB: TASKS --- */}
              {activeTab === 'tasks' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 animate-fade-in-up animate-duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <CheckSquare size={20} className="text-brand-neon" />
                        Gerenciamento de Tarefas
                      </h2>
                      <p className="text-xs text-slate-450 mt-1">Gerencie as diretrizes estratégicas e atividades operacionais de todas as células</p>
                    </div>
                    <button
                      onClick={() => handleOpenTaskModal(null)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition-all shadow-lg"
                    >
                      <Plus size={16} />
                      Nova Tarefa
                    </button>
                  </div>

                  {/* Filtros e Busca */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-850">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        type="text"
                        placeholder="Buscar tarefas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-brand-neon transition-colors"
                      />
                    </div>

                    <div>
                      <select 
                        value={taskFilterGt} 
                        onChange={(e) => setTaskFilterGt(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-355 focus:outline-none focus:border-brand-neon transition-colors"
                      >
                        <option value="all">Todas as Células (GTs)</option>
                        {gts.map(gt => (
                          <option key={gt.id} value={gt.id}>{gt.gt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select 
                        value={taskFilterUser} 
                        onChange={(e) => setTaskFilterUser(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-355 focus:outline-none focus:border-brand-neon transition-colors"
                      >
                        <option value="all">Todos os Responsáveis</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select 
                        value={taskFilterStatus} 
                        onChange={(e) => setTaskFilterStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-355 focus:outline-none focus:border-brand-neon transition-colors"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                    </div>
                  </div>

                  {/* Listagem */}
                  <div className="pt-4">
                    {tasks.filter(task => {
                      const matchesSearch = searchTerm.trim() === '' || 
                        task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (task.descricao && task.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesStatus = taskFilterStatus === 'all' || task.status === taskFilterStatus;
                      const matchesGt = taskFilterGt === 'all' || String(task.gt_id) === taskFilterGt;
                      const matchesUser = taskFilterUser === 'all' || String(task.responsavel_id) === taskFilterUser;
                      return matchesSearch && matchesStatus && matchesGt && matchesUser;
                    }).length === 0 ? (
                      <div className="bg-slate-950/50 border border-slate-850 p-8 rounded-2xl text-center">
                        <p className="text-xs text-slate-500 font-medium">Nenhuma tarefa encontrada com os filtros selecionados.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold">
                              <th className="pb-3 pl-4">Tarefa / Descrição</th>
                              <th className="pb-3 pl-4">GT / Célula</th>
                              <th className="pb-3 pl-4">Responsável</th>
                              <th className="pb-3 pl-4">Prazo</th>
                              <th className="pb-3 pl-4">Status</th>
                              <th className="pb-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {tasks.filter(task => {
                              const matchesSearch = searchTerm.trim() === '' || 
                                task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (task.descricao && task.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
                              const matchesStatus = taskFilterStatus === 'all' || task.status === taskFilterStatus;
                              const matchesGt = taskFilterGt === 'all' || String(task.gt_id) === taskFilterGt;
                              const matchesUser = taskFilterUser === 'all' || String(task.responsavel_id) === taskFilterUser;
                              return matchesSearch && matchesStatus && matchesGt && matchesUser;
                            }).map((task) => {
                              const taskGt = gts.find(g => g.id === task.gt_id);
                              const taskResp = users.find(u => u.id === task.responsavel_id);
                              
                              let statusBadge = '';
                              if (task.status === 'Pendente') {
                                statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                              } else if (task.status === 'Em Andamento') {
                                statusBadge = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                              } else {
                                statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                              }

                              return (
                                <tr key={task.id} className="hover:bg-slate-850/20 transition-colors">
                                  <td className="py-4 pl-4 max-w-xs">
                                    <div className="font-bold text-white truncate">{task.titulo}</div>
                                    {task.descricao && (
                                      <div className="text-[10px] text-slate-450 truncate mt-0.5 font-medium">{task.descricao}</div>
                                    )}
                                  </td>
                                  <td className="py-4 pl-4">
                                    <span className="font-semibold text-slate-350">{taskGt ? taskGt.gt : <em className="text-slate-500 text-[10px]">Sem Célula</em>}</span>
                                  </td>
                                  <td className="py-4 pl-4">
                                    {taskResp ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold overflow-hidden text-white border border-slate-700">
                                          {taskResp.avatar ? (
                                            <img src={taskResp.avatar} className="w-full h-full object-cover" />
                                          ) : (
                                            taskResp.nome[0].toUpperCase()
                                          )}
                                        </div>
                                        <span className="text-slate-300 font-medium">{taskResp.nome}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 text-[10px] italic">Não designado</span>
                                    )}
                                  </td>
                                  <td className="py-4 pl-4 font-semibold text-slate-350">
                                    {task.prazo ? new Date(task.prazo).toLocaleDateString('pt-BR') : '-'}
                                  </td>
                                  <td className="py-4 pl-4">
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${statusBadge}`}>
                                      {task.status}
                                    </span>
                                  </td>
                                  <td className="py-4 text-right space-x-2">
                                    <button 
                                      onClick={() => handleOpenTaskModal(task)} 
                                      className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-all inline-flex items-center"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTask(task.id)} 
                                      className="p-2 bg-slate-800/50 hover:bg-red-950/45 text-slate-400 hover:text-red-400 rounded-xl transition-all inline-flex items-center"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* --- MODAL: GT --- */}
      {isGtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black tracking-tight">{selectedGt ? 'Editar GT' : 'Novo Grupo de Trabalho'}</h3>
              <button onClick={() => setIsGtModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveGt} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: GT Info (2/3 width) */}
              <div className="lg:col-span-2 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Nome do GT</label>
                  <input 
                    type="text" 
                    value={gtFormData.gt}
                    onChange={(e) => setGtFormData(prev => ({ ...prev, gt: e.target.value }))}
                    placeholder="Ex: Cidades Inteligentes"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Descrição / Atuação</label>
                  <textarea 
                    value={gtFormData.descricao}
                    onChange={(e) => setGtFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Escreva a atuação e objetivo dessa vertical..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>

                {/* Coordenador - Searchable Dropdown */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase text-slate-450">Coordenador</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={coordenadorSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCoordenadorSearch(value);
                        setShowCoordenadorDropdown(true);
                      }}
                      onFocus={() => setShowCoordenadorDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCoordenadorDropdown(false), 200)}
                      placeholder="Digite para buscar usuário..."
                      className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white ${gtFormData.coordenador_id ? 'pl-12' : ''}`}
                    />
                    {gtFormData.coordenador_id && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold overflow-hidden border border-slate-700">
                          {(() => {
                            const coord = users.find(u => u.id === gtFormData.coordenador_id);
                            return coord ? (coord.avatar ? <img src={coord.avatar} className="w-full h-full object-cover" /> : coord.nome[0].toUpperCase()) : '?';
                          })()}
                        </div>
                      </div>
                    )}
                    {showCoordenadorDropdown && coordenadorSearch.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {users
                          .filter(u => 
                            u.nome.toLowerCase().includes(coordenadorSearch.toLowerCase()) ||
                            u.email.toLowerCase().includes(coordenadorSearch.toLowerCase())
                          )
                          .slice(0, 10)
                          .map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setGtFormData(prev => ({ ...prev, coordenador_id: u.id }));
                                setCoordenadorSearch(u.nome);
                                setShowCoordenadorDropdown(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-800 flex items-center gap-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.nome[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-200 truncate block">{u.nome}</span>
                                <span className="text-[10px] text-slate-400 truncate block">{u.email}</span>
                              </div>
                              {gtFormData.coordenador_id === u.id && <span className="text-brand-neon text-xs">✓</span>}
                            </button>
                          ))}
                        {users.filter(u => 
                          u.nome.toLowerCase().includes(coordenadorSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(coordenadorSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-2.5 text-xs text-slate-400 text-center">Nenhum usuário encontrado</div>
                        )}
                      </div>
                    )}
                    {showCoordenadorDropdown && coordenadorSearch.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {users.slice(0, 10).map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setGtFormData(prev => ({ ...prev, coordenador_id: u.id }));
                              setCoordenadorSearch(u.nome);
                              setShowCoordenadorDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-800 flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.nome[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-200 truncate block">{u.nome}</span>
                              <span className="text-[10px] text-slate-400 truncate block">{u.email}</span>
                            </div>
                            {gtFormData.coordenador_id === u.id && <span className="text-brand-neon text-xs">✓</span>}
                          </button>
                        ))}
                        <div className="px-4 py-2 text-xs text-slate-500 text-center border-t border-slate-800">
                          Digite para buscar mais usuários...
                        </div>
                      </div>
                    )}
                  </div>
                  {gtFormData.coordenador_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setGtFormData(prev => ({ ...prev, coordenador_id: '' }));
                        setCoordenadorSearch('');
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <X size={10} /> Remover coordenador
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Diretrizes / Mandato</label>
                  <textarea 
                    value={gtFormData.diretrizes}
                    onChange={(e) => setGtFormData(prev => ({ ...prev, diretrizes: e.target.value }))}
                    placeholder="Objetivos, escopo, metas e regras de atuação do GT..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Informações Institucionais</label>
                  <textarea 
                    value={gtFormData.info_institucional}
                    onChange={(e) => setGtFormData(prev => ({ ...prev, info_institucional: e.target.value }))}
                    placeholder="Histórico, regulamento interno, composição, parcerias..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>
              </div>

              {/* Right Column: Members (1/3 width) */}
              <div className="lg:col-span-1 border-l border-slate-800 pl-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Users size={14} className="text-brand-neon" />
                    Membros ({gtMembers.length})
                  </h4>
                  {selectedGt && gtMembers.length === 0 && (
                    <span className="text-[10px] text-slate-400">Nenhum membro vinculado</span>
                  )}
                </div>

                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-brand-neon" size={24} />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {gtMembers.map(member => {
                      const currentCargo = memberCargos[member.id] || member.cargo_gt || 3;
                      const cargoLabels = { 1: 'Gestor', 2: 'Representante', 3: 'Membro' };
                      const cargoColors = {
                        1: 'bg-brand-green/20 text-brand-neon border-brand-green/30',
                        2: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                        3: 'bg-slate-800 text-slate-300 border-slate-700/30'
                      };
                      
                      return (
                        <div key={member.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                              {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : member.nome[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-200 truncate block">{member.nome}</span>
                              <span className="text-[10px] text-slate-400 truncate block">{member.email}</span>
                            </div>
                            {member.id === gtFormData.coordenador_id && (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-neon/20 text-brand-neon border border-brand-neon/30">Coord</span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-450">Cargo no GT</label>
                            <select
                              value={currentCargo}
                              onChange={(e) => handleMemberCargoChange(member.id, parseInt(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-neon text-white appearance-none"
                            >
                              <option value={1}>Gestor</option>
                              <option value={2}>Representante</option>
                              <option value={3}>Membro</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Submit button at bottom of right column */}
                <button 
                  type="submit"
                  className="w-full mt-6 py-3 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl transition-all"
                >
                  Salvar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EVENT --- */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black tracking-tight">{selectedEvent ? 'Editar Evento' : 'Criar Evento'}</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-450">Título do Evento</label>
                <input 
                  type="text" 
                  value={eventFormData.titulo}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Nome do Evento"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-450">Descrição</label>
                <textarea 
                  value={eventFormData.descricao}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Fale sobre o evento, palestrantes, etc..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Data/Hora Início</label>
                  <input 
                    type="datetime-local" 
                    value={eventFormData.data_inicio}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Local</label>
                  <input 
                    type="text" 
                    value={eventFormData.local}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, local: e.target.value }))}
                    placeholder="Auditório Gerdau, Online..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Tipo</label>
                  <select 
                    value={eventFormData.tipo}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  >
                    <option>Workshop</option>
                    <option>Palestra</option>
                    <option>Meetup</option>
                    <option>Hackathon</option>
                    <option>Assembleia</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Vagas</label>
                  <input 
                    type="number" 
                    value={eventFormData.vagas}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, vagas: parseInt(e.target.value) || 50 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-end pb-3">
                  <label className="text-[10px] font-black uppercase text-slate-450 mb-2">Exclusivo Membros</label>
                  <input 
                    type="checkbox" 
                    checked={eventFormData.exclusivo}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, exclusivo: e.target.checked }))}
                    className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-brand-neon focus:ring-0"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl transition-all"
              >
                Salvar Evento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: USER --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black tracking-tight">Gerenciar Permissões: {selectedUser?.nome}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Cargo Principal</label>
                  <select 
                    value={userFormData.cargo}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, cargo: parseInt(e.target.value) || 3 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  >
                    <option value={1}>Gestor</option>
                    <option value={2}>Representante</option>
                    <option value={3}>Membro</option>
                  </select>
                </div>
                
                <div className="space-y-4 pt-6 flex flex-col justify-start">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="governanca_check"
                      checked={userFormData.governanca}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, governanca: e.target.checked }))}
                      className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-brand-neon focus:ring-0"
                    />
                    <label htmlFor="governanca_check" className="text-xs font-bold text-slate-350 cursor-pointer">Conselho de Governança</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="is_admin_check"
                      checked={userFormData.is_admin}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, is_admin: e.target.checked }))}
                      className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-brand-neon focus:ring-0"
                    />
                    <label htmlFor="is_admin_check" className="text-xs font-bold text-slate-350 cursor-pointer">Acesso Super Admin</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-450">Participação em Grupos de Trabalho</label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 p-3 rounded-2xl">
                  {gts.map(gt => {
                    const isChecked = userFormData.gts.includes(gt.id);
                    return (
                      <div key={gt.id} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`gt_user_${gt.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            const val = gt.id;
                            setUserFormData(prev => ({
                              ...prev,
                              gts: e.target.checked 
                                ? [...prev.gts, val] 
                                : prev.gts.filter(x => x !== val)
                            }));
                          }}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-brand-neon focus:ring-0"
                        />
                        <label htmlFor={`gt_user_${gt.id}`} className="text-xs text-slate-300 truncate cursor-pointer">{gt.gt}</label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl transition-all"
              >
                Salvar Configurações do Usuário
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: GAMIFICATION RULE --- */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black tracking-tight">{selectedRule ? 'Editar Regra' : 'Nova Regra de Gamificação'}</h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveRule} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-440">Ação / Gatilho</label>
                <input 
                  type="text" 
                  value={ruleFormData.acao}
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, acao: e.target.value }))}
                  placeholder="Ex: Criar artigo técnico"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-440">Pontos a Atribuir</label>
                <input 
                  type="number" 
                  value={ruleFormData.valor}
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, valor: parseInt(e.target.value) || 0 }))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl transition-all"
              >
                Salvar Regra
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ACADEMY VIDEO --- */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 animate-fade-in-up max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black tracking-tight">{selectedVideo ? 'Editar Artigo da Academy' : 'Novo Artigo da Academy'}</h3>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Título do Artigo</label>
                  <input 
                    type="text" 
                    value={videoFormData.titulo}
                    onChange={(e) => setVideoFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Introdução ao INOVAP"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Subtítulo (Opcional)</label>
                  <input 
                    type="text" 
                    value={videoFormData.subtitulo}
                    onChange={(e) => setVideoFormData(prev => ({ ...prev, subtitulo: e.target.value }))}
                    placeholder="Ex: Entenda o funcionamento do ecossistema"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">URL do Vídeo no YouTube</label>
                  <input 
                    type="url" 
                    value={videoFormData.youtube_url}
                    onChange={(e) => setVideoFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                    placeholder="Ex: https://www.youtube.com/watch?v=..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Ordem de Exibição</label>
                  <input 
                    type="number" 
                    value={videoFormData.ordem}
                    onChange={(e) => setVideoFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                    placeholder="Ex: 0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                  />
                </div>
              </div>

              {/* Upload de Imagem de Capa */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-450">Imagem de Capa (Opcional - Usará thumbnail do YT como padrão)</label>
                <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <div className="flex-1 space-y-3 w-full">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleVideoCoverUpload}
                      className="w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-brand-green/20 file:text-brand-neon hover:file:bg-brand-neon hover:file:text-black file:transition-all cursor-pointer text-slate-400"
                    />
                    <input 
                      type="text" 
                      placeholder="Ou cole a URL direta de uma imagem..."
                      value={videoFormData.capa}
                      onChange={(e) => setVideoFormData(prev => ({ ...prev, capa: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-neon text-white"
                    />
                  </div>
                  {videoFormData.capa && (
                    <div className="w-full md:w-32 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 flex items-center justify-center">
                      <img src={videoFormData.capa} alt="Preview da Capa" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Conteúdo Explicativo */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-450">Conteúdo do Artigo / Texto Explicativo</label>
                <textarea 
                  value={videoFormData.conteudo}
                  onChange={(e) => setVideoFormData(prev => ({ ...prev, conteudo: e.target.value }))}
                  placeholder="Escreva a aula ou explicação deste vídeo em formato de texto. Você pode usar formatação em parágrafos para organizar a leitura."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-800 hover:bg-slate-850 text-white text-xs font-black rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl transition-all"
                >
                  {selectedVideo ? 'Salvar Alterações' : 'Criar Artigo da Academy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TASK --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 animate-fade-in-up max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black tracking-tight">{selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-450">Título da Tarefa</label>
                <input 
                  type="text" 
                  value={taskFormData.titulo}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Desenvolver a nova seção do site..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-450">Descrição / Documentação</label>
                <textarea 
                  value={taskFormData.descricao}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva detalhadamente os objetivos e requisitos desta tarefa..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">GT / Célula Associada</label>
                  <select 
                    value={taskFormData.gt_id} 
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, gt_id: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white cursor-pointer"
                  >
                    <option value="">Sem Célula</option>
                    {gts.map(g => (
                      <option key={g.id} value={g.id}>{g.gt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Líder / Responsável</label>
                  <select 
                    value={taskFormData.responsavel_id} 
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, responsavel_id: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white cursor-pointer"
                  >
                    <option value="">Não Designado</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Prazo de Entrega</label>
                  <input 
                    type="date" 
                    value={taskFormData.prazo}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, prazo: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-450">Status da Atividade</label>
                  <select 
                    value={taskFormData.status} 
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-neon text-white cursor-pointer"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-800 hover:bg-slate-850 text-white text-xs font-black rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-brand-neon hover:bg-brand-neon/90 text-black text-xs font-black rounded-xl transition-all"
                >
                  {selectedTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
