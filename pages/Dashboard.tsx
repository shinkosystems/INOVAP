import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Logo } from '../components/ui/Logo';
import { 
  LayoutDashboard, FileText, Users, LogOut, Award, ShieldCheck, Shield, Layers, PlusCircle, 
  UserPlus, Trash2, CheckCircle, AlertCircle, ImageIcon, Hash, Upload, 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Eye, Check, 
  XCircle, MessageSquare, Send, ThumbsUp, BarChart3, Search, Filter, Clock, Settings, 
  User as UserIcon, Calendar, MapPin, Ticket, QrCode, ScanLine, CalendarRange, 
  ArrowRight, Sun, Moon, Plus, Camera, Search as SearchIcon, Users2, CheckSquare,
  Info, Crown, Boxes, UserMinus, ArrowLeft, ChevronDown, UserCheck, ShieldAlert,
  UserCog, ClipboardCheck, BookOpen, Trash, PenTool, ImageOff, Link as LinkIcon, Type, X, Loader2,
  TrendingUp, Star, Globe, Zap, MoreHorizontal, UserPlus2, UserPlus as UserPlusIcon,
  Menu as MenuIcon, Trophy, History, Coins, Edit3, Save as SaveIcon, Building2, ExternalLink,
  Unlock, Lock, ToggleLeft, ToggleRight, Image as ImageIconLucide, Download, Scan
} from 'lucide-react';
import { User, GT, Artigo, Evento, Inscricao, Cargo, PontuacaoRegra, PontuacaoLog, Empresa } from '../types';
import { supabase } from '../services/supabase';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
  onProfileClick: () => void;
  onViewCompany: (empresa: Empresa) => void;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'agenda' | 'my_events' | 'articles_manage' | 'users_manage' | 'gts_manage' | 'gamification' | 'checkin';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, onProfileClick, onViewCompany }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [gts, setGts] = useState<GT[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [myArticles, setMyArticles] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // States abas membros
  const [memberSearch, setMemberSearch] = useState('');
  const [availableEvents, setAvailableEvents] = useState<Evento[]>([]);
  const [myTickets, setMyTickets] = useState<Inscricao[]>([]);
  const [selectedTicketForView, setSelectedTicketForView] = useState<Inscricao | null>(null);
  
  // Evento Detalhes
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<Evento | null>(null);
  const [isRegisteringEvent, setIsRegisteringEvent] = useState(false);

  // Check-in Scanner
  const [scannerActive, setScannerActive] = useState(false);
  const [isProcessingCheckin, setIsProcessingCheckin] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Gestão de Eventos (Governança)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isUploadingEventCover, setIsUploadingEventCover] = useState(false);
  const eventCoverInputRef = useRef<HTMLInputElement>(null);
  const [eventForm, setEventForm] = useState<Partial<Evento>>({
      titulo: '',
      descricao: '',
      data_inicio: '',
      local: '',
      tipo: 'Workshop',
      vagas: 100,
      exclusivo: true,
      imagem_capa: ''
  });

  // Detalhes do Membro
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [viewingMemberCompany, setViewingMemberCompany] = useState<Empresa | null>(null);
  const [isLoadingMemberDetails, setIsLoadingMemberDetails] = useState(false);

  // Governança States
  const [pendingArticles, setPendingArticles] = useState<(Artigo & { author_name?: string })[]>([]);
  const [selectedArticlePreview, setSelectedArticlePreview] = useState<(Artigo & { author_name?: string }) | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState<number | null>(null);
  const [selectedGtForManagement, setSelectedGtForManagement] = useState<GT | null>(null);
  const [gtMemberSearch, setGtMemberSearch] = useState('');

  // Gamification States
  const [rules, setRules] = useState<PontuacaoRegra[]>([]);
  const [logs, setLogs] = useState<PontuacaoLog[]>([]);
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<User | null>(null);
  const [isAwardingPoints, setIsAwardingPoints] = useState(false);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [editingRule, setEditingRule] = useState<PontuacaoRegra | null>(null);

  // Editor State
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [articleForm, setArticleForm] = useState({ titulo: '', subtitulo: '', conteudo: '', capa: '', gt_id: 0, tags: [] as string[] });
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  const currentUserData = useMemo(() => {
    return members.find(m => m.uuid === user?.uuid) || user;
  }, [members, user]);

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
      const [gtsRes, cargosRes, rulesRes] = await Promise.all([
        supabase.from('gts').select('*').order('gt'),
        supabase.from('cargos').select('*'),
        supabase.from('pontuacao_regras').select('*').order('valor', { ascending: false })
      ]);
      if (gtsRes.data) setGts(gtsRes.data);
      if (cargosRes.data) setCargos(cargosRes.data);
      if (rulesRes.data) setRules(rulesRes.data);

      const { data: userData } = await supabase.from('users').select('*').order('pontos', { ascending: false });
      let currentMembers: User[] = [];
      if (userData) {
        currentMembers = userData;
        setMembers(userData);
        setRanking(userData.slice(0, 10));
      }

      const { data: articles } = await supabase.from('artigos').select('*').eq('autor', user.uuid).order('created_at', { ascending: false });
      if (articles) setMyArticles(articles);

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

        const { data: logData } = await supabase
          .from('pontuacao_logs')
          .select('*, user:users(nome), regra:pontuacao_regras(acao)')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (logData) {
          setLogs(logData.map(l => ({
            ...l,
            user_nome: l.user?.nome,
            regra_acao: l.regra?.acao
          })));
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // QR Code Scanner Logic
  useEffect(() => {
    if (activeTab === 'checkin' && scannerActive && !scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
        scannerRef.current.render(onScanSuccess, onScanError);
    }

    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.error("Scanner clear error", e));
            scannerRef.current = null;
        }
    };
  }, [activeTab, scannerActive]);

  const onScanSuccess = async (decodedText: string) => {
      if (isProcessingCheckin) return;
      setIsProcessingCheckin(true);
      
      try {
          // O QR Code deve conter o ID da inscrição (uuid)
          const { data: inscricao, error: fetchError } = await supabase
            .from('inscricoes')
            .select('*, user:users(*), evento:eventos(*)')
            .eq('id', decodedText)
            .single();

          if (fetchError || !inscricao) {
              showNotification('error', 'Inscrição não encontrada ou inválida.');
              setIsProcessingCheckin(false);
              return;
          }

          if (inscricao.status === 'checkin_realizado') {
              showNotification('error', `Check-in já realizado para ${inscricao.user?.nome}`);
              setIsProcessingCheckin(false);
              return;
          }

          // Realiza o Check-in
          const { error: updateError } = await supabase
            .from('inscricoes')
            .update({ status: 'checkin_realizado', checkin_at: new Date().toISOString() })
            .eq('id', decodedText);

          if (updateError) throw updateError;

          // Atribui pontos
          const regraCheckin = rules.find(r => r.acao.toLowerCase().includes('check-in')) || rules[0];
          const newTotal = (inscricao.user?.pontos || 0) + regraCheckin.valor;

          await supabase.from('users').update({ pontos: newTotal }).eq('id', inscricao.user_id);
          await supabase.from('pontuacao_logs').insert([{
              user_id: inscricao.user_id,
              regra_id: regraCheckin.id,
              pontos_atribuidos: regraCheckin.valor,
              atribuido_por: user?.uuid
          }]);

          showNotification('success', `Check-in de ${inscricao.user?.nome} realizado! +${regraCheckin.valor} Coins`);
          fetchData();
          
      } catch (e) {
          showNotification('error', 'Erro ao processar validação.');
      } finally {
          // Delay para evitar scans múltiplos imediatos
          setTimeout(() => setIsProcessingCheckin(false), 2000);
      }
  };

  const onScanError = (err: any) => {
      // Ignora erros de "nenhum qr encontrado no frame"
  };

  const handleDownloadTicket = () => {
    if (!selectedTicketForView) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative gradient circle
    const grad = ctx.createRadialGradient(400, 200, 0, 400, 200, 600);
    grad.addColorStop(0, '#10b98133');
    grad.addColorStop(1, '#00000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, 720, 1120);

    // Text Content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Montserrat';
    ctx.textAlign = 'center';
    ctx.fillText('CONVITE INOVAP', 400, 150);

    ctx.font = 'bold 80px Montserrat';
    const titleLines = wrapText(ctx, selectedTicketForView.evento?.titulo || '', 600);
    titleLines.forEach((line, i) => {
        ctx.fillText(line, 400, 300 + (i * 90));
    });

    const startY = 300 + (titleLines.length * 90);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 30px Montserrat';
    ctx.fillText('INFORMAÇÕES DO EVENTO', 400, startY + 50);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 40px Montserrat';
    ctx.fillText(`Data: ${new Date(selectedTicketForView.evento?.data_inicio || '').toLocaleDateString('pt-BR')}`, 400, startY + 120);
    ctx.fillText(`Local: ${selectedTicketForView.evento?.local}`, 400, startY + 180);
    ctx.fillText(`Tipo: ${selectedTicketForView.evento?.tipo}`, 400, startY + 240);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 45px Montserrat';
    ctx.fillText(user?.nome || '', 400, startY + 340);

    // QR Code rendering
    const qrSvg = document.getElementById('qr-code-svg');
    if (qrSvg) {
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 200, startY + 400, 400, 400);
            
            const link = document.createElement('a');
            link.download = `ticket-${selectedTicketForView.evento?.titulo}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
  };

  const handleRegisterEvent = async (evento: Evento) => {
      if (!user) return;
      setIsRegisteringEvent(true);
      try {
          const { error } = await supabase.from('inscricoes').insert([{
              evento_id: evento.id,
              user_id: user.id,
              status: 'confirmado'
          }]);

          if (error) {
              if (error.code === '23505') {
                  showNotification('error', 'Você já está inscrito neste evento!');
              } else {
                  throw error;
              }
          } else {
              showNotification('success', `Inscrição confirmada para ${evento.titulo}!`);
              setSelectedEventForDetail(null);
              fetchData();
          }
      } catch (e: any) {
          showNotification('error', 'Erro ao realizar inscrição.');
      } finally {
          setIsRegisteringEvent(false);
      }
  };

  const handleEventCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploadingEventCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `evento_capa_${Date.now()}.${fileExt}`;
      const filePath = `eventos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imagensBlog')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('imagensBlog').getPublicUrl(filePath);
      if (!data.publicUrl) throw new Error('Erro ao obter URL pública.');

      setEventForm(prev => ({ ...prev, imagem_capa: data.publicUrl }));
      showNotification('success', 'Imagem carregada com sucesso!');
    } catch (error: any) {
      showNotification('error', `Erro upload: ${error.message || 'Falha na conexão'}`);
    } finally {
      setIsUploadingEventCover(false);
      if (eventCoverInputRef.current) eventCoverInputRef.current.value = '';
    }
  };

  const handleSubmitEvent = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      if (!eventForm.titulo || !eventForm.data_inicio || !eventForm.local) {
          showNotification('error', 'Preencha os campos obrigatórios (Título, Data e Local)');
          return;
      }

      setIsSubmittingEvent(true);
      try {
          if (!user) {
              showNotification('error', 'Usuário não autenticado.');
              return;
          }

          const eventPayload = {
              titulo: eventForm.titulo,
              descricao: eventForm.descricao || 'Sem descrição.', 
              data_inicio: eventForm.data_inicio,
              local: eventForm.local,
              tipo: eventForm.tipo,
              vagas: eventForm.vagas || 100,
              imagem_capa: eventForm.imagem_capa || null,
              exclusivo: !!eventForm.exclusivo, 
              criado_por: user.uuid
          };

          const { error } = await supabase.from('eventos').insert([eventPayload]);

          if (error) throw error;

          showNotification('success', 'Evento publicado com sucesso!');
          setIsCreatingEvent(false);
          setEventForm({
              titulo: '',
              descricao: '',
              data_inicio: '',
              local: '',
              tipo: 'Workshop',
              vagas: 100,
              exclusivo: true,
              imagem_capa: ''
          });
          await fetchData();
      } catch (err: any) {
          const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
          showNotification('error', `Erro ao criar evento: ${errorMessage}`);
      } finally {
          setIsSubmittingEvent(false);
      }
  };

  const handleAwardPoints = async (regra: PontuacaoRegra) => {
    if (!selectedUserForPoints || !user) {
      showNotification('error', 'Selecione um membro primeiro!');
      return;
    }
    setIsAwardingPoints(true);
    try {
      const newTotal = (selectedUserForPoints.pontos || 0) + regra.valor;
      const { error: userError } = await supabase
        .from('users')
        .update({ pontos: newTotal })
        .eq('id', selectedUserForPoints.id);
      
      if (userError) throw userError;

      const { error: logError } = await supabase
        .from('pontuacao_logs')
        .insert([{
          user_id: selectedUserForPoints.id,
          regra_id: regra.id,
          pontos_atribuidos: regra.valor,
          atribuido_por: user.uuid
        }]);
      
      if (logError) throw logError;

      showNotification('success', `${regra.valor} Inovacoins para ${selectedUserForPoints.nome}!`);
      setSelectedUserForPoints(null);
      await fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao atribuir pontos.');
    } finally {
      setIsAwardingPoints(false);
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      const { error } = await supabase
        .from('pontuacao_regras')
        .update({ acao: editingRule.acao, valor: editingRule.valor })
        .eq('id', editingRule.id);
      
      if (error) throw error;
      showNotification('success', 'Regra atualizada!');
      setIsEditingRules(false);
      setEditingRule(null);
      fetchData();
    } catch (e) {
      showNotification('error', 'Erro ao atualizar regra.');
    }
  };

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

  const handleDeleteUser = async (userId: number, userName: string) => {
      if (!window.confirm(`Tem certeza que deseja remover permanentemente o inovador ${userName}? Esta ação é irreversível.`)) return;
      
      setIsUpdatingUser(userId);
      try {
          const { error } = await supabase.from('users').delete().eq('id', userId);
          if (error) throw error;
          
          showNotification('success', `Inovador ${userName} removido com sucesso.`);
          fetchData();
      } catch (e: any) {
          showNotification('error', `Erro ao remover usuário: ${e.message}`);
      } finally {
          setIsUpdatingUser(null);
      }
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
          const { data: author } = await supabase.from('users').select('artigos, pontos').eq('uuid', article.autor).single();
          if (author) {
            const pontosArtigo = rules.find(r => r.acao.includes('Artigo'))?.valor || 50;
            await supabase.from('users').update({ 
              artigos: (author.artigos || 0) + 1,
              pontos: (author.pontos || 0) + pontosArtigo
            }).eq('uuid', article.autor);
          }
      }
      showNotification('success', 'Artigo aprovado e publicado!');
      setSelectedArticlePreview(null);
      fetchData();
    } catch (e) { showNotification('error', 'Erro ao aprovar.'); }
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

  const handleViewMember = async (member: User) => {
    setIsLoadingMemberDetails(true);
    setViewingMember(member);
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('responsavel', member.uuid)
        .single();
      
      if (!error && data) {
        setViewingMemberCompany(data);
      } else {
        setViewingMemberCompany(null);
      }
    } catch (e) {
      setViewingMemberCompany(null);
    } finally {
      setIsLoadingMemberDetails(false);
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
    { id: 'ranking', icon: Award, label: 'Ranking' },
    { id: 'members', icon: Users, label: 'Usuários' },
    { id: 'articles', icon: FileText, label: 'Meus Artigos' },
    { id: 'agenda', icon: CalendarRange, label: 'Agenda' },
    { id: 'my_events', icon: Ticket, label: 'Meus Tickets' },
  ];

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    setSelectedGtForManagement(null);
    setIsDrawerOpen(false);
  };

  const filteredSearchMembers = members.filter(m => m.nome.toLowerCase().includes(memberSearch.toLowerCase()));

  return (
    <div className="h-screen w-full bg-white dark:bg-black text-slate-900 dark:text-white flex font-sans overflow-hidden relative transition-colors duration-300">
      
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in-up px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border bg-brand-green/20 border-brand-green text-brand-neon font-bold flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {notification.message}
        </div>
      )}

      {/* Mobile Drawer Panel */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-brand-black z-[101] md:hidden transform transition-transform duration-500 ease-out border-r border-slate-200 dark:border-white/5 shadow-2xl flex flex-col
        ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-24 flex items-center justify-between px-8 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
          <Logo />
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => handleTabChange(item.id as Tab)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <item.icon size={22} /> <span>{item.label}</span>
            </button>
          ))}
          {user?.governanca && (
             <>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-6 mx-4"></div>
                <div className="px-5 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Governança</div>
                <button onClick={() => handleTabChange('gamification')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'gamification' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <Trophy size={22} /> <span>Gamificação</span>
                </button>
                <button onClick={() => handleTabChange('checkin')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'checkin' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <ScanLine size={22} /> <span>Validar Check-in</span>
                </button>
                <button onClick={() => handleTabChange('articles_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'articles_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <ClipboardCheck size={22} /> <span>Aprovação Artigos</span>
                </button>
                <button onClick={() => handleTabChange('users_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'users_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <UserCog size={22} /> <span>Gestão Acessos</span>
                </button>
                <button onClick={() => handleTabChange('gts_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'gts_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <Boxes size={22} /> <span>Gestão de GTs</span>
                </button>
             </>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-white/5 flex-shrink-0">
            <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors font-bold">
                <LogOut size={22} /> Sair
            </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="w-72 bg-slate-50 dark:bg-white/[0.03] backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-shrink-0 hidden md:flex flex-col m-4 rounded-[2.5rem] h-[calc(100vh-2rem)] shadow-sm">
        <div className="h-24 flex items-center px-8 cursor-pointer flex-shrink-0" onClick={() => handleTabChange('overview')}><Logo /></div>
        <div className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => handleTabChange(item.id as Tab)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <item.icon size={22} /> <span>{item.label}</span>
            </button>
          ))}
          {user?.governanca && (
             <>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-6 mx-4"></div>
                <div className="px-5 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Governança</div>
                <button onClick={() => handleTabChange('gamification')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'gamification' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <Trophy size={22} /> <span>Gamificação</span>
                </button>
                <button onClick={() => handleTabChange('checkin')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'checkin' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <ScanLine size={22} /> <span>Validar Check-in</span>
                </button>
                <button onClick={() => handleTabChange('articles_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'articles_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <ClipboardCheck size={22} /> <span>Aprovação Artigos</span>
                </button>
                <button onClick={() => handleTabChange('users_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'users_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <UserCog size={22} /> <span>Gestão Acessos</span>
                </button>
                <button onClick={() => handleTabChange('gts_manage')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${activeTab === 'gts_manage' ? 'bg-brand-neon text-black' : 'text-slate-500 hover:text-white'}`}>
                  <Boxes size={22} /> <span>Gestão de GTs</span>
                </button>
             </>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-white/5 flex-shrink-0">
            <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors font-bold">
                <LogOut size={22} /> Sair
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-24 flex items-center justify-between px-6 md:px-10 flex-shrink-0 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-brand-neon hover:text-black transition-all"
            >
              <MenuIcon size={24} />
            </button>
            <h2 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white capitalize">
              {activeTab === 'gamification' ? 'Gamificação' : activeTab === 'articles_manage' ? 'Fila de Curadoria' : activeTab === 'users_manage' ? 'Controle de Acessos' : activeTab === 'gts_manage' ? (selectedGtForManagement ? `Membros: ${selectedGtForManagement.gt}` : 'Grupos de Trabalho') : activeTab === 'my_events' ? 'Meus Tickets' : activeTab === 'checkin' ? 'Check-in de Eventos' : activeTab.replace('_', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
               <button onClick={onProfileClick} className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-neon/50 transition-all">
                    <div className="w-10 h-10 rounded-full bg-brand-green overflow-hidden flex items-center justify-center">
                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-black" size={20}/>}
                    </div>
                    <span className="hidden sm:inline text-sm font-bold text-slate-700 dark:text-slate-300">{user?.nome.split(' ')[0]}</span>
               </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
            
            {/* ABA: VISÃO GERAL */}
            {activeTab === 'overview' && (
                <div className="animate-fade-in-up space-y-12 pb-12">
                    <div className="bg-gradient-to-br from-brand-green/20 to-brand-neon/5 dark:from-brand-green/30 dark:to-emerald-900/10 rounded-[3rem] p-8 md:p-12 border border-slate-200 dark:border-white/10 relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl md:text-5xl font-black mb-4">Olá, {user?.nome.split(' ')[0]}!</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-xl font-medium leading-relaxed">Continue conectando peças e construindo o futuro do Alto Paraopeba.</p>
                        </div>
                        <Zap size={200} className="absolute -right-20 -bottom-20 text-brand-neon/10 -rotate-12 hidden md:block" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                            <Award className="text-brand-neon mb-6" size={32} />
                            <div className="text-4xl font-black mb-2 animate-[pulse_2s_ease-in-out_infinite]">{currentUserData?.pontos || 0}</div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Seus Pontos</div>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                            <TrendingUp className="text-brand-green mb-6" size={32} />
                            <div className="text-4xl font-black mb-2">
                                #{members.findIndex(m => m.uuid === user?.uuid) + 1 || '-'}
                            </div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No Ranking</div>
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
                <div className="animate-fade-in-up space-y-8 pb-12">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden">
                        {ranking.map((member, i) => (
                            <div key={member.id} className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl ${i < 3 ? 'bg-brand-neon text-black' : 'bg-white/5 text-slate-500'}`}>{i + 1}</div>
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-brand-green/20">
                                        {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-3 md:mt-4 text-black" />}
                                    </div>
                                    <div><div className="font-bold text-base md:text-lg">{member.nome}</div><div className="text-xs text-slate-500">{cargos.find(c => c.id === member.cargo)?.cargo}</div></div>
                                </div>
                                <div className="text-right"><div className="text-xl md:text-2xl font-black text-brand-neon">{member.pontos || 0}</div><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inovacoins</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABA: CHECK-IN (GOVERNANÇA) */}
            {activeTab === 'checkin' && (
                <div className="animate-fade-in-up space-y-8 pb-12 flex flex-col items-center max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] w-full text-center">
                        <div className="p-4 bg-brand-neon/10 rounded-full w-20 h-20 flex items-center justify-center text-brand-neon mx-auto mb-6">
                            <Scan size={40} />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Validador de Convites</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Escaneie o QR Code do inovador para validar a participação e atribuir pontos.</p>
                        
                        <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-200 dark:border-white/10 bg-black aspect-square max-w-[400px] mx-auto">
                            {!scannerActive ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-6">
                                    <Camera size={48} className="text-slate-700" />
                                    <button 
                                        onClick={() => setScannerActive(true)}
                                        className="bg-brand-neon text-black px-10 py-4 rounded-2xl font-black shadow-lg shadow-brand-neon/20 hover:scale-105 transition-all"
                                    >
                                        Abrir Câmera
                                    </button>
                                </div>
                            ) : (
                                <div id="reader" className="w-full h-full"></div>
                            )}
                            
                            {isProcessingCheckin && (
                                <div className="absolute inset-0 bg-brand-neon/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-pulse">
                                    <Loader2 size={48} className="animate-spin text-black mb-4" />
                                    <span className="text-black font-black uppercase tracking-widest">Validando...</span>
                                </div>
                            )}
                        </div>

                        {scannerActive && (
                            <button 
                                onClick={() => setScannerActive(false)}
                                className="mt-8 text-red-500 font-bold hover:underline"
                            >
                                Desativar Câmera
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ABA: MEUS TICKETS */}
            {activeTab === 'my_events' && (
                <div className="animate-fade-in-up space-y-8 pb-12">
                    {myTickets.length === 0 ? <div className="py-32 text-center opacity-50 font-bold">Você não possui tickets ainda.</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {myTickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    onClick={() => setSelectedTicketForView(ticket)}
                                    className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex gap-8 relative overflow-hidden group cursor-pointer hover:border-brand-neon/50 transition-all hover:shadow-2xl hover:shadow-brand-neon/5"
                                >
                                    <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center flex-shrink-0 border-4 border-slate-100">
                                        <QrCode size={80} className="text-black opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-2">
                                            {ticket.status === 'checkin_realizado' ? (
                                                <span className="bg-brand-green/20 text-brand-green text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle size={10} /> Validado
                                                </span>
                                            ) : (
                                                <span className="bg-brand-neon text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Confirmado</span>
                                            )}
                                        </div>
                                        <h4 className="text-xl md:text-2xl font-black mb-2 line-clamp-1">{ticket.evento?.titulo}</h4>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Calendar size={14} className="text-brand-green" /> 
                                            {new Date(ticket.evento?.data_inicio || '').toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-brand-neon transition-colors">
                                            Clique para ver convite →
                                        </div>
                                    </div>
                                    
                                    {/* Decorative element */}
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-neon/5 rounded-full blur-2xl group-hover:bg-brand-neon/20 transition-colors"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ABA: GAMIFICATION (CENTRO DE PONTUAÇÃO) */}
            {activeTab === 'gamification' && (
              <div className="animate-fade-in-up space-y-12 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* SEÇÃO ATRIBUIR PONTOS */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-brand-neon/10 rounded-2xl text-brand-neon"><Coins size={24} /></div>
                      <h3 className="text-2xl font-black">Atribuição Manual</h3>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] space-y-6 relative">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">1. Encontre o Membro</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input 
                            type="text" 
                            placeholder="Nome do inovador..." 
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-brand-neon outline-none transition-all"
                          />
                          {memberSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                              {filteredSearchMembers.length > 0 ? (
                                filteredSearchMembers.map(m => (
                                  <button 
                                    key={m.id} 
                                    onClick={() => { setSelectedUserForPoints(m); setMemberSearch(''); }} 
                                    className="w-full flex items-center justify-between p-4 hover:bg-brand-neon/10 text-left border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-brand-green/20 overflow-hidden border border-white/5">
                                        {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto mt-3 text-slate-500" />}
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-neon transition-colors">{m.nome}</div>
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{cargos.find(c => c.id === m.cargo)?.cargo}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs font-black text-brand-neon">{m.pontos}</div>
                                      <div className="text-[9px] text-slate-500 font-bold uppercase">Coins</div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-slate-500 text-xs">Ninguém encontrado.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedUserForPoints ? (
                        <div className="animate-fade-in-up p-5 bg-brand-neon/5 border border-brand-neon/30 rounded-2xl flex items-center justify-between shadow-lg shadow-brand-neon/5 ring-1 ring-brand-neon/20">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-brand-neon text-black flex items-center justify-center font-black text-xl shadow-lg shadow-brand-neon/20 ring-4 ring-black/20">
                              {selectedUserForPoints.nome.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-lg text-slate-900 dark:text-white leading-tight">{selectedUserForPoints.nome}</div>
                              <div className="text-[10px] font-black text-brand-neon uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                                <Crown size={10} /> Membro Selecionado
                              </div>
                            </div>
                          </div>
                          <button onClick={() => setSelectedUserForPoints(null)} className="p-2 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all">
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl opacity-50">
                          <UserPlusIcon className="mx-auto mb-2 text-slate-400" size={32} />
                          <p className="text-xs font-bold text-slate-500">Selecione um membro para atribuir pontos</p>
                        </div>
                      )}

                      {selectedUserForPoints && (
                        <div className="animate-fade-in-up space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">2. Selecione a Realização</label>
                          <div className="grid grid-cols-1 gap-2">
                            {rules.map(rule => (
                              <button 
                                key={rule.id} 
                                onClick={() => handleAwardPoints(rule)}
                                disabled={isAwardingPoints}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-brand-neon hover:bg-brand-neon/10 transition-all group disabled:opacity-50 text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white/5 dark:bg-black/20 rounded-lg group-hover:bg-brand-neon group-hover:text-black transition-all">
                                    <Plus size={16} />
                                  </div>
                                  <div>
                                    <span className="font-bold text-sm block">{rule.acao}</span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Categoria: Membro</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-brand-neon font-black text-base">+{rule.valor}</span>
                                  {isAwardingPoints && <Loader2 size={14} className="animate-spin text-brand-neon" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO HISTÓRICO */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-brand-green/10 rounded-2xl text-brand-green"><History size={24} /></div>
                      <h3 className="text-2xl font-black">Histórico Recente</h3>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[600px]">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {logs.map(log => (
                          <div key={log.id} className="p-6 border-b border-slate-100 dark:border-white/5 last:border-0 flex items-center justify-between group hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-brand-neon group-hover:text-black transition-all shadow-sm">
                                <Award size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">{log.user_nome}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{log.regra_acao}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-brand-neon font-black text-lg">+{log.pontos_atribuidos}</div>
                              <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{new Date(log.created_at).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </div>
                        ))}
                        {logs.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                            <History size={64} />
                            <p className="font-black uppercase tracking-widest text-xs">Nenhuma movimentação</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: AGENDA & TICKETS */}
            {activeTab === 'agenda' && (
                <div className="animate-fade-in-up pb-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                        <div>
                            <h3 className="text-2xl font-black">Próximos Eventos</h3>
                            <p className="text-sm text-slate-500">Participe e ganhe pontos de engajamento.</p>
                        </div>
                        {user?.governanca && (
                            <button 
                                onClick={() => setIsCreatingEvent(true)}
                                className="bg-brand-neon text-black px-8 py-3 rounded-xl font-black flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg shadow-brand-neon/20 hover:scale-105 transition-all"
                            >
                                <Plus size={20} /> Novo Evento
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {availableEvents.map(event => (
                            <div key={event.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden group flex flex-col h-full shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <div className="h-44 bg-slate-900 relative">
                                    {event.imagem_capa ? <img src={event.imagem_capa} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" /> : <div className="w-full h-full flex items-center justify-center bg-brand-green/10 text-brand-neon"><CalendarRange size={40} /></div>}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="bg-brand-neon text-black text-[10px] font-black px-3 py-1 rounded-full uppercase">{event.tipo}</div>
                                    {event.exclusivo && <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 border border-white/20"><Lock size={10} /> Exclusivo</div>}
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <h4 className="font-black text-lg mb-4 line-clamp-2">{event.titulo}</h4>
                                    <div className="flex items-center gap-3 text-slate-500 text-sm mb-8 mt-auto">
                                        <Calendar size={14} className="text-brand-green" /> 
                                        {new Date(event.data_inicio).toLocaleDateString('pt-BR')}
                                    </div>
                                    <button 
                                    onClick={() => setSelectedEventForDetail(event)}
                                    className="w-full bg-brand-neon text-black py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-lg shadow-brand-neon/10"
                                    >
                                    Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABA: MEUS ARTIGOS */}
            {activeTab === 'articles' && (
                <div className="animate-fade-in-up space-y-8 pb-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><h3 className="text-2xl font-black flex items-center gap-3"><PenTool className="text-brand-neon" /> Suas Publicações</h3><button onClick={() => setIsCreatingArticle(true)} className="w-full sm:w-auto bg-brand-neon text-black px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-brand-neon/20 flex items-center justify-center gap-2"><Plus size={20} /> Novo Artigo</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myArticles.map(artigo => (
                            <div key={artigo.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden group">
                                <div className="h-44 bg-slate-900 relative">{artigo.capa ? <img src={artigo.capa} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" /> : <div className="w-full h-full flex items-center justify-center bg-brand-green/10"><ImageIcon className="text-brand-green/30" /></div>}<div className="absolute top-4 right-4">{artigo.aprovado ? <span className="bg-brand-neon text-black text-[10px] font-black px-3 py-1 rounded-full">PUBLICADO</span> : <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full">EM REVISÃO</span>}</div></div>
                                <div className="p-6"><h4 className="font-bold text-lg mb-4 line-clamp-2">{artigo.titulo}</h4><button className="w-full bg-slate-50 dark:bg-white/5 py-3 rounded-xl text-xs font-bold hover:bg-brand-neon hover:text-black transition-all">Editar Artigo</button></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABA: MEMBROS */}
            {activeTab === 'members' && (
                <div className="animate-fade-in-up space-y-8 pb-12">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                        <input type="text" placeholder="Buscar inovadores..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl py-6 pl-16 pr-6 focus:border-brand-neon outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {members.filter(m => m.nome.toLowerCase().includes(memberSearch.toLowerCase())).map(member => (
                            <div key={member.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-green/10 mb-6">{member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={32} className="m-auto mt-5 text-slate-400" />}</div>
                                <h4 className="font-bold mb-2">{member.nome}</h4>
                                <span className="text-[10px] font-black uppercase text-brand-neon bg-brand-neon/10 px-3 py-1 rounded-full mb-6">{cargos.find(c => c.id === member.cargo)?.cargo}</span>
                                <div className="text-brand-neon text-sm font-black mb-6">{member.pontos || 0} Inovacoins</div>
                                <button 
                                  onClick={() => handleViewMember(member)}
                                  className="w-full bg-slate-50 dark:bg-white/5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-neon hover:text-black transition-all"
                                >
                                  Ver Perfil
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABAS GOVERNANÇA (RESTANTES) */}
            {activeTab === 'articles_manage' && (
                <div className="animate-fade-in-up space-y-8 pb-12">
                    {!selectedArticlePreview ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {pendingArticles.map(artigo => (
                                <div key={artigo.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col group">
                                    <div className="text-[10px] font-black text-brand-neon uppercase tracking-widest mb-2">{artigo.author_name}</div>
                                    <h4 className="font-bold text-lg mb-6 flex-1 line-clamp-2">{artigo.titulo}</h4>
                                    <button onClick={() => setSelectedArticlePreview(artigo)} className="w-full bg-brand-neon text-black py-3 rounded-xl font-black flex items-center justify-center gap-2"><Eye size={18} /> Revisar</button>
                                </div>
                            ))}
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
                <div className="animate-fade-in-up space-y-8 pb-12">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
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
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleDeleteUser(member.id, member.nome)} disabled={isUpdatingUser === member.id || member.uuid === user?.uuid} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30"><Trash2 size={18} /></button>
                                                <button className="p-2 text-slate-500 hover:text-white"><MoreHorizontal size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'gts_manage' && (
                <div className="animate-fade-in-up space-y-8 pb-12">
                    {!selectedGtForManagement ? (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                <div><h3 className="text-xl font-bold">Grupos de Trabalho Ativos</h3><p className="text-sm text-slate-500">Gerencie a estrutura e contagem de cada GT.</p></div>
                                <button className="bg-brand-neon text-black px-8 py-3 rounded-xl font-black flex items-center gap-2 w-full sm:w-auto justify-center"><Plus size={18} /> Novo GT</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {gts.map(gt => (
                                    <div key={gt.id} onClick={() => setSelectedGtForManagement(gt)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:border-brand-neon/50 transition-all">
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
                        <div className="space-y-12 pb-12">
                            <button onClick={() => setSelectedGtForManagement(null)} className="flex items-center gap-2 text-slate-500 hover:text-brand-neon font-bold transition-all"><ArrowLeft size={18} /> Voltar para lista de GTs</button>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <h3 className="text-xl font-black flex items-center gap-2"><CheckCircle className="text-brand-neon" /> Membros Atuais</h3>
                                        <span className="bg-brand-neon text-black text-[10px] font-black px-2 py-1 rounded-full">{members.filter(m => m.gts?.includes(selectedGtForManagement.id)).length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {members.filter(m => m.gts?.includes(selectedGtForManagement.id)).map(member => (
                                            <div key={member.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-green/10">{member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-2" />}</div>
                                                    <div><div className="font-bold text-sm">{member.nome}</div><div className="text-[10px] text-slate-500">{cargos.find(c => c.id === member.cargo)?.cargo}</div></div>
                                                </div>
                                                <button onClick={() => handleToggleMemberInGt(member, selectedGtForManagement.id, false)} disabled={isUpdatingUser === member.id} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><UserMinus size={18} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
      </div>

      {/* MODAL VISUALIZAÇÃO DE TICKET */}
      {selectedTicketForView && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedTicketForView(null)}></div>
              <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-lg border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col">
                  
                  <div className="absolute top-6 right-6 z-10">
                      <button onClick={() => setSelectedTicketForView(null)} className="p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="bg-brand-neon p-10 flex flex-col items-center">
                       <Logo dark />
                       <div className="mt-8 bg-white p-4 rounded-[2.5rem] shadow-2xl border-4 border-black/5">
                            <QRCode 
                                id="qr-code-svg"
                                value={selectedTicketForView.id} 
                                size={220}
                                level="H"
                            />
                       </div>
                  </div>

                  <div className="p-10 text-center">
                        <div className="text-[10px] font-black text-brand-neon uppercase tracking-[0.3em] mb-4">Convite Oficial</div>
                        <h3 className="text-3xl font-black mb-2">{selectedTicketForView.evento?.titulo}</h3>
                        <p className="text-slate-500 mb-8 text-sm">{selectedTicketForView.evento?.local}</p>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-8 mb-10 text-left">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Data</div>
                                <div className="font-bold text-slate-900 dark:text-white">{new Date(selectedTicketForView.evento?.data_inicio || '').toLocaleDateString('pt-BR')}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Portador</div>
                                <div className="font-bold text-slate-900 dark:text-white truncate">{user?.nome}</div>
                            </div>
                        </div>

                        <button 
                            onClick={handleDownloadTicket}
                            className="w-full bg-brand-neon text-black py-5 rounded-[2rem] font-black text-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-neon/20"
                        >
                            <Download size={24} /> Salvar Imagem do Ticket
                        </button>
                        <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apresente este QR Code na entrada do evento</p>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL CRIAR EVENTO */}
      {isCreatingEvent && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsCreatingEvent(false)}></div>
              <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-2xl border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col">
                  <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-brand-neon/10 rounded-2xl text-brand-neon"><Plus size={24} /></div>
                          <h3 className="text-2xl font-black">Novo Evento</h3>
                      </div>
                      <button onClick={() => setIsCreatingEvent(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                  </div>
                  <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="col-span-full">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Título</label>
                              <input type="text" value={eventForm.titulo} onChange={(e) => setEventForm({...eventForm, titulo: e.target.value})} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-neon outline-none" />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Data e Hora</label>
                              <input type="datetime-local" value={eventForm.data_inicio} onChange={(e) => setEventForm({...eventForm, data_inicio: e.target.value})} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-neon outline-none" />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Local</label>
                              <input type="text" value={eventForm.local} onChange={(e) => setEventForm({...eventForm, local: e.target.value})} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-neon outline-none" />
                          </div>
                      </div>
                  </div>
                  <div className="px-10 py-8 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex gap-4">
                      <button onClick={() => setIsCreatingEvent(false)} className="flex-1 py-4 font-black text-slate-500">Cancelar</button>
                      <button onClick={handleSubmitEvent} disabled={isSubmittingEvent} className="flex-[2] bg-brand-neon text-black py-4 rounded-2xl font-black shadow-lg shadow-brand-neon/20 hover:scale-105 transition-all">Publicar Evento</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DETALHES DO EVENTO */}
      {selectedEventForDetail && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedEventForDetail(null)}></div>
              <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-2xl border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col">
                  <div className="h-56 md:h-64 bg-slate-900 relative flex-shrink-0">
                      {selectedEventForDetail.imagem_capa ? <img src={selectedEventForDetail.imagem_capa} className="w-full h-full object-cover opacity-70" alt="Capa" /> : <div className="w-full h-full flex items-center justify-center bg-brand-green/10"><CalendarRange size={64} className="text-brand-neon opacity-20" /></div>}
                      <button onClick={() => setSelectedEventForDetail(null)} className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black"><X size={20} /></button>
                  </div>
                  <div className="p-10 md:p-12 overflow-y-auto max-h-[60vh] custom-scrollbar">
                      <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 leading-tight">{selectedEventForDetail.titulo}</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{selectedEventForDetail.descricao || 'Conectando atores do ecossistema de inovação.'}</p>
                  </div>
                  <div className="p-10 md:px-12 md:pb-12 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex-shrink-0">
                      <button onClick={() => handleRegisterEvent(selectedEventForDetail)} disabled={isRegisteringEvent} className="w-full bg-brand-neon text-black py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-brand-neon/20 flex items-center justify-center gap-3">
                          {isRegisteringEvent ? <Loader2 size={24} className="animate-spin" /> : <Ticket size={24} />} Garantir Ingresso Gratuito
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DETALHES DO MEMBRO (VER PERFIL) */}
      {viewingMember && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setViewingMember(null)}></div>
              <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-2xl border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                  <div className="h-40 bg-gradient-to-br from-brand-green/30 to-brand-neon/10 relative">
                      <button onClick={() => setViewingMember(null)} className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full"><X size={20} /></button>
                  </div>
                  <div className="px-10 pb-10 relative">
                      <div className="absolute -top-16 left-10">
                          <div className="w-32 h-32 rounded-[2rem] border-8 border-white dark:border-[#0a0a0a] overflow-hidden bg-brand-green shadow-xl">{viewingMember.avatar ? <img src={viewingMember.avatar} className="w-full h-full object-cover" /> : <UserIcon size={48} className="m-auto mt-8 text-black" />}</div>
                      </div>
                      <div className="pt-20 flex justify-between items-start">
                          <div><h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{viewingMember.nome}</h3></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL EDITOR DE ARTIGO */}
      {isCreatingArticle && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsCreatingArticle(false)}></div>
              <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-6xl h-full md:h-[95vh] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-fade-in-up">
                  <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-4"><div className="p-3 bg-brand-neon/10 rounded-2xl text-brand-neon"><PenTool size={24} /></div><h3 className="text-xl font-black">Editor de Conhecimento</h3></div>
                      <button onClick={() => setIsCreatingArticle(false)} className="text-slate-500 hover:text-white p-2"><X size={28} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
                      <div className="w-full md:w-80 border-r border-white/10 p-8 space-y-8 overflow-y-auto">
                          <div><label className="text-[10px] font-black text-brand-neon uppercase mb-4 block">Categoria</label><select value={articleForm.gt_id} onChange={(e) => setArticleForm(prev => ({ ...prev, gt_id: Number(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-neon outline-none">{<option value={0}>GT...</option>}{gts.map(gt => <option key={gt.id} value={gt.id} className="bg-black">{gt.gt}</option>)}</select></div>
                      </div>
                      <div className="flex-1 flex flex-col">
                          <div className="flex-1 p-6 md:p-14 overflow-y-auto bg-black/20">
                            <input type="text" value={articleForm.titulo} onChange={(e) => setArticleForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Título do Artigo" className="w-full bg-transparent border-none focus:ring-0 text-2xl md:text-4xl font-black mb-4"/>
                            <div ref={editorRef} contentEditable suppressContentEditableWarning={true} className="prose prose-invert max-w-none focus:outline-none min-h-[300px] text-base md:text-lg leading-relaxed text-slate-300"></div>
                          </div>
                      </div>
                  </div>
                  <div className="px-8 py-6 border-t border-white/10 flex justify-end gap-4 flex-shrink-0">
                      <button onClick={submitArticle} disabled={isSubmittingArticle} className="w-full sm:w-auto bg-brand-neon text-black px-12 py-3 rounded-xl font-black hover:scale-105 transition-all flex items-center justify-center gap-2">{isSubmittingArticle ? <Loader2 className="animate-spin" /> : <Send size={20} />} Enviar para Curadoria</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};