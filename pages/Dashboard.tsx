import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Logo } from '../components/ui/Logo';
import { LayoutDashboard, FileText, Users, LogOut, TrendingUp, Award, Star, Medal, Briefcase, ChevronRight, X, Save, Edit3, Loader2, ShieldCheck, Shield, Layers, PlusCircle, UserPlus, Trash2, CheckCircle, AlertCircle, Image as ImageIcon, Hash, Upload, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Type, Eye, Check, XCircle, MessageSquare, Send, ThumbsUp, BarChart3, Search, Filter, Clock, Settings, User as UserIcon } from 'lucide-react';
import { User, GT, Artigo, MuralPost } from '../types';
import { supabase } from '../services/supabase';

interface DashboardProps {
  onLogout: () => void;
  user: User | null;
  onProfileClick: () => void;
}

type Tab = 'overview' | 'ranking' | 'members' | 'articles' | 'mural' | 'management';

// Componente Rich Text Editor Aprimorado
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

        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }

        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `editor_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `imagensBlog/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('imagensBlog')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('imagensBlog')
                .getPublicUrl(filePath);

            execCmd('insertImage', data.publicUrl);

        } catch (error: any) {
            console.error('Erro upload editor:', error);
            const fakeUrl = URL.createObjectURL(file);
            execCmd('insertImage', fakeUrl);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-white/5 focus-within:ring-2 focus-within:ring-brand-neon focus-within:bg-black transition-all">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                    <button type="button" onClick={() => execCmd('formatBlock', 'P')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors" title="Parágrafo Normal"><Type size={18} /></button>
                    <button type="button" onClick={() => execCmd('formatBlock', 'H2')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors" title="Título Grande"><Heading1 size={18} /></button>
                    <button type="button" onClick={() => execCmd('formatBlock', 'H3')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors" title="Título Médio"><Heading2 size={18} /></button>
                </div>
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                    <button type="button" onClick={() => execCmd('bold')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors" title="Negrito"><Bold size={18} /></button>
                    <button type="button" onClick={() => execCmd('italic')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors" title="Itálico"><Italic size={18} /></button>
                </div>
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                    <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors" title="Lista"><List size={18} /></button>
                    <button type="button" onClick={() => execCmd('insertOrderedList')} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors" title="Lista Numerada"><ListOrdered size={18} /></button>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`} title="Inserir Imagem" disabled={isUploading}>
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUploadInEditor} />
                </div>
            </div>
            <div ref={editorRef} contentEditable onInput={handleInput} className="flex-1 p-6 min-h-[400px] outline-none text-white prose prose-invert prose-headings:text-white prose-a:text-brand-neon prose-img:rounded-xl prose-img:my-4 max-w-none overflow-y-auto custom-scrollbar" style={{ minHeight: '400px' }} />
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [ranking, setRanking] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [gts, setGts] = useState<GT[]>([]);
  
  // State for Member Modal
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedGTs, setEditedGTs] = useState<number[]>([]); // Array for multi-select
  const [editedGovernanca, setEditedGovernanca] = useState<boolean>(false);

  // State for GT Management (Within Management Tab)
  const [newGtName, setNewGtName] = useState('');
  const [isCreatingGt, setIsCreatingGt] = useState(false);

  // State for Article Creation & Moderation
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [articleForm, setArticleForm] = useState({ titulo: '', subtitulo: '', conteudo: '', capa: '', tags: [] as string[] });
  
  // Governance Data
  const [allArticles, setAllArticles] = useState<Artigo[]>([]);
  const [previewArticle, setPreviewArticle] = useState<Artigo | null>(null);
  const [managementSearch, setManagementSearch] = useState('');

  // State for Mural
  const [muralPosts, setMuralPosts] = useState<MuralPost[]>([]);
  const [activeMuralGtId, setActiveMuralGtId] = useState<number | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostingMural, setIsPostingMural] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const userPoints = (user?.artigos || 0) * 150 + 50; 
  const userLevel = Math.floor(userPoints / 500) + 1;
  const progressPercent = Math.min(100, (userPoints % 500) / 500 * 100);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const normalizeGTs = (gtData: any): number[] => {
      if (Array.isArray(gtData)) return gtData;
      if (typeof gtData === 'number') return [gtData];
      if (!gtData) return [];
      return [];
  };

  const fetchData = useCallback(async () => {
    // 1. Fetch Users
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .order('artigos', { ascending: false });
    
    if (userData) {
        const usersWithPoints = userData.map(u => ({
            ...u,
            pontos: (u.artigos * 150) + Math.floor(Math.random() * 100),
            nivel: 'Inovador',
            gts: normalizeGTs(u.gts) // Mapeia a coluna 'gts' do banco
        }));
        setRanking(usersWithPoints.slice(0, 20)); 
        setMembers(usersWithPoints); 
    }

    // 2. Fetch GTs
    const { data: gtData } = await supabase.from('gts').select('*').order('gt', { ascending: true });
    if (gtData) setGts(gtData);

    // 3. Fetch All Articles if Governance
    if (user?.governanca) {
        const { data: articlesData } = await supabase.from('artigos').select('*').order('created_at', { ascending: false });
        if (articlesData) setAllArticles(articlesData);
    }
    
    // 4. Fetch Mural Posts (Real DB)
    const { data: muralData, error: muralError } = await supabase
        .from('mural_posts')
        .select('*, users(nome)')
        .order('created_at', { ascending: false });

    if (muralData) {
        const formattedPosts: MuralPost[] = muralData.map((post: any) => ({
            ...post,
            user_nome: post.users?.nome || 'Usuário Desconhecido'
        }));
        setMuralPosts(formattedPosts);
    }

  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Helper Functions ---
  const getGTName = (id?: number | number[]) => {
      if (!id) return 'Sem GT';
      if (Array.isArray(id)) {
          if (id.length === 0) return 'Sem GT';
          if (id.length === 1) return gts.find(g => g.id === id[0])?.gt || 'GT Desconhecido';
          return `${id.length} Grupos`;
      }
      return gts.find(g => g.id === id)?.gt || 'GT Desconhecido';
  };

  // --- Member Modal Logic ---
  const handleMemberClick = (member: User) => {
      setSelectedMember(member);
      setEditedGTs(normalizeGTs(member.gts));
      setEditedGovernanca(member.governanca || false);
  };

  const toggleGtSelection = (gtId: number) => {
      setEditedGTs(prev => 
          prev.includes(gtId) 
            ? prev.filter(id => id !== gtId) 
            : [...prev, gtId]
      );
  };

  const handleSaveMember = async () => {
      if (!selectedMember) return;
      setIsUpdating(true);

      try {
          const { error } = await supabase
              .from('users')
              .update({ 
                gts: editedGTs, // Salva o array diretamente na coluna 'gts'
                governanca: editedGovernanca 
              })
              .eq('id', selectedMember.id);

          if (error) throw error;
          await fetchData();
          setSelectedMember(null);
          showNotification('success', 'Membro atualizado com sucesso!');
      } catch (error) {
          console.error("Erro ao atualizar membro:", error);
          showNotification('error', "Erro ao salvar alterações.");
      } finally {
          setIsUpdating(false);
      }
  };

  // --- Governance Management Logic ---
  const getPendingArticlesCount = () => allArticles.filter(a => !a.aprovado).length;
  
  const getMemberCountByGT = (gtId: number) => {
      return members.filter(m => normalizeGTs(m.gts).includes(gtId)).length;
  };

  const handleCreateGT = async () => {
      if (!newGtName.trim()) return;
      setIsCreatingGt(true);
      try {
          // Demo Mode or Prod
          if (user?.email === 'demo@inovap.com' || user?.id === 999) {
             setTimeout(() => {
                 const mockGT = { id: Math.random(), gt: newGtName.trim() };
                 setGts(prev => [...prev, mockGT as GT]);
                 setNewGtName('');
                 setIsCreatingGt(false);
                 showNotification('success', 'GT criado (Demo)');
             }, 500);
             return;
          }
          const { error } = await supabase.from('gts').insert([{ gt: newGtName.trim() }]);
          
          if (error) {
              console.error('Supabase error:', error);
              throw error;
          }
          
          setNewGtName('');
          await fetchData();
          showNotification('success', 'Grupo criado com sucesso!');
      } catch (e: any) {
          console.error('Error creating GT:', e);
          showNotification('error', e.message || e.details || 'Erro ao criar grupo.');
      } finally {
          setIsCreatingGt(false);
      }
  };

  // --- Mural Logic ---
  const getVisibleMuralGTs = () => {
      if (user?.governanca) return gts; 
      const userGts = normalizeGTs(user?.gts);
      return gts.filter(g => userGts.includes(g.id));
  };

  const handlePostMural = async () => {
      if (!newPostContent.trim() || !activeMuralGtId || !user) return;
      setIsPostingMural(true);

      try {
          // Demo mode handling
          if (user.id === 999) {
             const newPost: MuralPost = {
                id: Date.now(),
                gt_id: activeMuralGtId,
                user_id: user.id,
                user_nome: user.nome,
                conteudo: newPostContent,
                created_at: new Date().toISOString(),
                likes: 0
             };
             setMuralPosts(prev => [newPost, ...prev]);
             setNewPostContent('');
             setIsPostingMural(false);
             return;
          }

          const { error } = await supabase.from('mural_posts').insert([{
              gt_id: activeMuralGtId,
              user_id: user.id,
              conteudo: newPostContent
          }]);

          if (error) throw error;
          
          setNewPostContent('');
          await fetchData(); 

      } catch (error: any) {
          console.error("Erro ao postar no mural:", error);
          showNotification('error', 'Erro ao enviar mensagem.');
      } finally {
          setIsPostingMural(false);
      }
  };

  // --- Article Logic ---
  const handleAddTag = (e: any) => { 
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      if (tagInput.trim()) {
          setArticleForm(prev => ({...prev, tags: [...prev.tags, tagInput.trim()]}));
          setTagInput('');
      }
  };
  const handleRemoveTag = (tag: string) => { setArticleForm(prev => ({...prev, tags: prev.tags.filter(t => t !== tag)})) };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(7)}.${file.name.split('.').pop()}`;
        const { data } = supabase.storage.from('imagensBlog').getPublicUrl(`imagensBlog/${fileName}`); // Mock for demo if no backend, real in prod
        // Real implementation in handleImageUploadInEditor above, reusing simplified logic here for brevity or assume similar
        const fakeUrl = URL.createObjectURL(file);
        setArticleForm(prev => ({ ...prev, capa: fakeUrl }));
    } finally {
        setIsUploadingImage(false);
    }
  };

  const handlePublishArticle = async () => { 
      if (!articleForm.titulo) return;
      setIsSubmittingArticle(true);
      
      try {
        const { error } = await supabase.from('artigos').insert([{
            autor: user?.uuid,
            titulo: articleForm.titulo,
            subtitulo: articleForm.subtitulo,
            conteudo: articleForm.conteudo,
            capa: articleForm.capa,
            tags: articleForm.tags,
            aprovado: false
        }]);
        if (error) throw error;
        setIsArticleModalOpen(false);
        setArticleForm({titulo: '', subtitulo: '', conteudo: '', capa: '', tags: []});
        showNotification('success', 'Artigo enviado!');
        fetchData();
      } catch(e) {
          showNotification('error', 'Erro ao publicar.');
      } finally {
          setIsSubmittingArticle(false);
      }
  };

  const handleApproveArticle = async () => { 
      if (!previewArticle) return;
      setIsUpdating(true);
      try {
          await supabase.from('artigos').update({ aprovado: true }).eq('id', previewArticle.id);
          showNotification('success', 'Artigo Aprovado!');
          setPreviewArticle(null);
          fetchData();
      } finally { setIsUpdating(false); }
  };

  const handleRejectArticle = async () => { 
     if (!previewArticle) return;
     if (!confirm('Rejeitar e excluir artigo?')) return;
     setIsUpdating(true);
      try {
          await supabase.from('artigos').delete().eq('id', previewArticle.id);
          showNotification('success', 'Artigo Rejeitado.');
          setPreviewArticle(null);
          fetchData();
      } finally { setIsUpdating(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white flex font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-green/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-72 bg-white/[0.03] backdrop-blur-xl border-r border-white/5 flex-shrink-0 hidden md:flex flex-col z-20 m-4 rounded-3xl h-[calc(100vh-2rem)]">
        <div className="h-24 flex items-center px-8">
          <Logo dark />
        </div>
        
        <div className="flex-1 py-4 px-4 space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
            { id: 'mural', icon: MessageSquare, label: 'Mural dos GTs' },
            { id: 'ranking', icon: Award, label: 'Ranking' },
            { id: 'members', icon: Users, label: 'Membros' },
            { id: 'articles', icon: FileText, label: 'Artigos' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-medium ${
                activeTab === item.id 
                  ? 'bg-brand-green text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}

          {user?.governanca && (
             <>
                <div className="h-px bg-white/10 my-2 mx-4"></div>
                <button 
                  onClick={() => setActiveTab('management')}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-medium ${
                    activeTab === 'management' 
                      ? 'bg-brand-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.4)]' 
                      : 'text-brand-neon hover:bg-brand-neon/10'
                  }`}
                >
                  <BarChart3 size={20} />
                  <span>Governança</span>
                  {getPendingArticlesCount() > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {getPendingArticlesCount()}
                      </span>
                  )}
                </button>
             </>
          )}

           {/* Botão de Perfil na Sidebar - RÓTULO ALTERADO */}
           <div className="h-px bg-white/10 my-2 mx-4"></div>
           <button 
                onClick={onProfileClick}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
                <Settings size={20} />
                <span>Meu Perfil</span>
            </button>
        </div>

        <div className="p-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-green/5 group-hover:bg-brand-green/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400"><Star size={16} fill="currentColor" /></div>
                    <div>
                        <div className="text-xs text-slate-400">Nível {userLevel}</div>
                        <div className="text-sm font-bold text-white">Explorador</div>
                    </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative z-10 mb-2">
                    <div className="bg-brand-green h-full rounded-full shadow-[0_0_10px_#10b981]" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 text-right">{userPoints} pts</div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors text-sm w-full p-4 mt-2"><LogOut size={16} /> Sair</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {notification && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${notification.type === 'success' ? 'bg-brand-green/20 border-brand-green text-brand-neon' : 'bg-red-500/20 border-red-500 text-red-200'}`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        <header className="h-24 flex items-center justify-between px-8 md:px-12 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
                {activeTab === 'overview' && 'Painel de Controle'}
                {activeTab === 'mural' && 'Mural dos GTs'}
                {activeTab === 'ranking' && 'Ranking'}
                {activeTab === 'members' && 'Comunidade'}
                {activeTab === 'articles' && 'Biblioteca'}
                {activeTab === 'management' && 'Mural de Gestão'}
            </h2>
            <p className="text-slate-500 text-sm">Bem-vindo ao futuro do ecossistema.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:block px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-brand-neon text-sm font-medium">
                {getGTName(normalizeGTs(user?.gts))}
            </div>
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{user?.nome || 'Convidado'}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[150px]">{user?.email}</div>
                </div>
                
                {/* Avatar Clickable to Profile - UPDATED TO SHOW IMAGE */}
                <button 
                    onClick={onProfileClick}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-green to-blue-600 p-[2px] shadow-lg shadow-brand-green/20 hover:scale-105 transition-transform overflow-hidden relative"
                    title="Meu Perfil"
                >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-lg text-white">{user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                    </div>
                </button>
            </div>
            <button className="md:hidden text-white" onClick={onLogout}><LogOut /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth">
            
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="relative bg-gradient-to-r from-brand-green/20 to-blue-900/20 rounded-3xl p-10 border border-white/10 overflow-hidden backdrop-blur-md">
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-brand-green/10 to-transparent"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold mb-4 text-white">Olá, {user?.nome.split(' ')[0]}</h1>
                            <p className="text-slate-300 max-w-xl text-lg font-light leading-relaxed mb-8">
                                Você já acumulou <span className="text-brand-neon font-bold">{userPoints} INOVA Coins</span>. 
                                Sua contribuição está acelerando o ecossistema.
                            </p>
                            <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                Ver Missões Diárias
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ... restante do código sem alterações ... */}
            {/* PAINEL DE GESTÃO (GOVERNANÇA) */}
            {activeTab === 'management' && user?.governanca && (
                <div className="space-y-8 animate-fade-in-up">
                    
                    {/* 1. KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-green/10 rounded-2xl text-brand-green"><Users size={24} /></div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">{members.length}</h3>
                            <p className="text-slate-400 text-sm">Membros do Ecossistema</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                             <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-neon/10 rounded-2xl text-brand-neon"><Layers size={24} /></div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">{gts.length}</h3>
                            <p className="text-slate-400 text-sm">Grupos de Trabalho Ativos</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                             <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><FileText size={24} /></div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">{allArticles.filter(a => a.aprovado).length}</h3>
                            <p className="text-slate-400 text-sm">Artigos Publicados</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                             {getPendingArticlesCount() > 0 && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}
                             <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><ShieldCheck size={24} /></div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1 relative z-10">{getPendingArticlesCount()}</h3>
                            <p className="text-slate-400 text-sm relative z-10">Aguardando Aprovação</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 2. Distribuição por GT */}
                        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-[600px]">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Layers size={20} className="text-brand-neon" /> 
                                Membros por GT
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                {gts.map(gt => {
                                    const count = getMemberCountByGT(gt.id);
                                    const percentage = Math.round((count / members.length) * 100) || 0;
                                    return (
                                        <div key={gt.id} className="group">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{gt.gt}</span>
                                                <span className="text-slate-500">{count}</span>
                                            </div>
                                            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-brand-green/50 group-hover:bg-brand-neon transition-all" 
                                                    style={{width: `${percentage}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                             {/* Create GT Shortcut */}
                             <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex gap-2">
                                     <input 
                                        type="text" 
                                        value={newGtName}
                                        onChange={(e) => setNewGtName(e.target.value)}
                                        placeholder="Novo Grupo..."
                                        className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-neon"
                                     />
                                     <button 
                                        onClick={handleCreateGT}
                                        disabled={isCreatingGt || !newGtName.trim()}
                                        className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors"
                                     >
                                         {isCreatingGt ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                                     </button>
                                </div>
                             </div>
                        </div>

                         {/* 3. Controle de Conteúdo (Blog) */}
                        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-[600px]">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <FileText size={20} className="text-brand-neon" />
                                Gestão de Blog
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-black/20 text-slate-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-xl">Status</th>
                                            <th className="px-4 py-3">Título</th>
                                            <th className="px-4 py-3">Data</th>
                                            <th className="px-4 py-3 rounded-r-xl text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {allArticles.map(article => (
                                            <tr key={article.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    {article.aprovado ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-green/10 text-brand-green text-xs font-bold border border-brand-green/20">
                                                            <Check size={12} /> Publicado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20 animate-pulse">
                                                            <Clock size={12} /> Pendente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={article.titulo}>
                                                    {article.titulo}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-sm">
                                                    {new Date(article.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button 
                                                        onClick={() => setPreviewArticle(article)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                                                        title="Visualizar / Moderar"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 4. Diretório de Membros */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users size={20} className="text-brand-neon" />
                                Diretório de Membros
                            </h3>
                            <div className="relative w-full md:w-auto">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar membro..."
                                    value={managementSearch}
                                    onChange={(e) => setManagementSearch(e.target.value)}
                                    className="bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white w-full md:w-64 focus:outline-none focus:border-brand-neon"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/20 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 rounded-l-xl">Membro</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Grupos (GTs)</th>
                                        <th className="px-6 py-4">Permissão</th>
                                        <th className="px-6 py-4 rounded-r-xl text-right">Editar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {members
                                        .filter(m => m.nome.toLowerCase().includes(managementSearch.toLowerCase()) || m.email.toLowerCase().includes(managementSearch.toLowerCase()))
                                        .map(m => {
                                            const memberGts = normalizeGTs(m.gts);
                                            return (
                                                <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                                            {m.nome.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-white">{m.nome}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 text-sm">{m.email}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {memberGts.length === 0 ? <span className="text-slate-600 text-xs italic">Nenhum</span> : 
                                                                memberGts.map(gtId => (
                                                                    <span key={gtId} className="px-2 py-0.5 bg-white/5 rounded text-xs text-slate-300 border border-white/5">
                                                                        {getGTName(gtId)}
                                                                    </span>
                                                                ))
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {m.governanca ? (
                                                            <span className="text-brand-neon text-xs font-bold flex items-center gap-1"><ShieldCheck size={12} /> Admin</span>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs">Membro</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleMemberClick(m)}
                                                            className="p-2 bg-white/5 hover:bg-brand-neon hover:text-black rounded-lg transition-colors"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* Existing Tabs (Mural, Overview, Ranking, Members, Articles) */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="relative bg-gradient-to-r from-brand-green/20 to-blue-900/20 rounded-3xl p-10 border border-white/10 overflow-hidden backdrop-blur-md">
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-brand-green/10 to-transparent"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold mb-4 text-white">Olá, {user?.nome.split(' ')[0]}</h1>
                            <p className="text-slate-300 max-w-xl text-lg font-light leading-relaxed mb-8">
                                Você já acumulou <span className="text-brand-neon font-bold">{userPoints} INOVA Coins</span>. 
                                Sua contribuição está acelerando o ecossistema.
                            </p>
                            <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                Ver Missões Diárias
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mural' && (
                <div className="animate-fade-in-up h-[calc(100vh-12rem)] flex gap-6">
                    {/* Sidebar GT Selector */}
                    <div className="w-64 bg-white/5 border border-white/10 rounded-3xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-black/20">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Seus Grupos</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {getVisibleMuralGTs().length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">Você não participa de nenhum GT.</div>
                            ) : (
                                getVisibleMuralGTs().map(gt => (
                                    <button
                                        key={gt.id}
                                        onClick={() => setActiveMuralGtId(gt.id)}
                                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                                            activeMuralGtId === gt.id 
                                            ? 'bg-brand-green/20 text-brand-neon border border-brand-green/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <Hash size={18} />
                                        <span className="font-medium truncate">{gt.gt}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl flex flex-col overflow-hidden relative">
                        {activeMuralGtId ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center z-10 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-neon/10 flex items-center justify-center text-brand-neon">
                                            <Hash size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{gts.find(g => g.id === activeMuralGtId)?.gt}</h3>
                                            <p className="text-xs text-slate-500">Mural de recados e discussões</p>
                                        </div>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#111] flex items-center justify-center text-xs text-white">
                                                U{i}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages Feed */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col-reverse">
                                    {muralPosts.filter(p => p.gt_id === activeMuralGtId).length === 0 ? (
                                        <div className="text-center text-slate-500 py-10">Seja o primeiro a postar neste mural!</div>
                                    ) : (
                                        muralPosts.filter(p => p.gt_id === activeMuralGtId).map(post => (
                                            <div key={post.id} className="flex gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center font-bold text-white border border-white/10 flex-shrink-0">
                                                    {post.user_nome.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="font-bold text-brand-neon">{post.user_nome}</span>
                                                        <span className="text-xs text-slate-500">{new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    <p className="text-slate-300 bg-white/5 p-3 rounded-r-xl rounded-bl-xl border border-white/5 inline-block">
                                                        {post.conteudo}
                                                    </p>
                                                    <div className="mt-1 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="text-xs text-slate-500 hover:text-white flex items-center gap-1"><ThumbsUp size={12} /> Curtir</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-black/40 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostMural()}
                                            placeholder={`Enviar mensagem em #${gts.find(g => g.id === activeMuralGtId)?.gt}...`}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-neon transition-all"
                                            disabled={isPostingMural}
                                        />
                                        <button 
                                            onClick={handlePostMural}
                                            disabled={isPostingMural}
                                            className="bg-brand-neon text-black p-3 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
                                        >
                                            {isPostingMural ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare size={40} className="opacity-50" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Selecione um Grupo</h3>
                                <p>Escolha um GT na barra lateral para visualizar as discussões.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="animate-fade-in-up">
                    <div className="mb-8 flex gap-4">
                        <input type="text" placeholder="Buscar membros..." className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-green focus:outline-none focus:bg-black transition-all" />
                        <button className="bg-brand-green text-black px-8 rounded-2xl font-bold hover:bg-brand-neon transition-colors">Buscar</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((m) => {
                            const memberGts = normalizeGTs(m.gts);
                            return (
                                <div key={m.id} onClick={() => handleMemberClick(m)} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:border-brand-green/30 hover:bg-white/[0.08] transition-all flex items-center gap-5 cursor-pointer group hover:-translate-y-1">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-xl font-bold text-slate-300 border border-white/5 group-hover:scale-110 group-hover:text-brand-neon transition-all">
                                        {m.nome.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg group-hover:text-brand-neon transition-colors flex items-center gap-2">
                                            {m.nome}
                                            {m.governanca && <ShieldCheck size={16} className="text-brand-neon" />}
                                        </h4>
                                        <p className="text-sm text-slate-500 mb-2 truncate max-w-[180px] font-light">{m.email}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {memberGts.length === 0 && <span className="text-xs text-slate-600">Sem GT</span>}
                                            {memberGts.slice(0, 2).map(gtId => (
                                                <span key={gtId} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 border border-white/5">
                                                    {getGTName(gtId)}
                                                </span>
                                            ))}
                                            {memberGts.length > 2 && <span className="text-[10px] text-slate-500">+{memberGts.length - 2}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {activeTab === 'articles' && (
                <div className="animate-fade-in-up space-y-8">
                     <div className="h-full flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 border-dashed p-12">
                        <div className="p-6 bg-white/5 rounded-full mb-6">
                            <FileText size={48} className="text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Seus Artigos</h3>
                        <p className="text-slate-400 mb-8 max-w-md text-center font-light">Contribua com o conhecimento do ecossistema. Publique inovações e pesquisas.</p>
                        <button 
                            onClick={() => setIsArticleModalOpen(true)}
                            className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-brand-neon transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Escrever Novo Artigo
                        </button>
                    </div>
                </div>
            )}
            
        </main>
      </div>

      {/* MEMBER DETAIL MODAL - Updated for Multi-Select */}
      {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setSelectedMember(null)}></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                  <div className="h-32 bg-gradient-to-r from-brand-green/20 to-blue-900/20 relative">
                      <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm transition-colors"><X size={20} /></button>
                  </div>
                  
                  <div className="px-8 pb-8 relative">
                      <div className="w-24 h-24 rounded-3xl bg-black border-4 border-[#0a0a0a] -mt-12 mb-6 flex items-center justify-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-brand-green to-blue-600 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                           <span className="text-4xl font-bold text-white">{selectedMember.nome.charAt(0)}</span>
                      </div>

                      <div className="mb-6">
                          <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                              {selectedMember.nome}
                              {selectedMember.governanca && <ShieldCheck className="text-brand-neon" />}
                          </h2>
                          <p className="text-slate-400 font-light">{selectedMember.email}</p>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-300 mb-3">Grupos de Trabalho (Multisseleção)</label>
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                  {gts.map((gt) => {
                                      const isSelected = editedGTs.includes(gt.id);
                                      return (
                                          <button 
                                              key={gt.id}
                                              onClick={() => toggleGtSelection(gt.id)}
                                              className={`p-3 rounded-xl border text-sm font-medium text-left transition-all flex justify-between items-center ${
                                                  isSelected 
                                                  ? 'bg-brand-neon/10 border-brand-neon text-brand-neon' 
                                                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                              }`}
                                          >
                                              <span className="truncate">{gt.gt}</span>
                                              {isSelected && <CheckCircle size={14} />}
                                          </button>
                                      );
                                  })}
                              </div>
                              <p className="text-xs text-slate-500 mt-2">Clique para adicionar ou remover.</p>
                          </div>

                          <div 
                              onClick={() => setEditedGovernanca(!editedGovernanca)}
                              className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors select-none"
                          >
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg transition-colors ${editedGovernanca ? 'bg-brand-neon/20 text-brand-neon' : 'bg-slate-800 text-slate-500'}`}><Shield size={20} /></div>
                                  <div>
                                      <div className={`font-medium transition-colors ${editedGovernanca ? 'text-white' : 'text-slate-400'}`}>Membro da Governança</div>
                                      <div className="text-xs text-slate-500">Acesso total aos murais e gestão</div>
                                  </div>
                              </div>
                              <div className={`w-12 h-7 rounded-full transition-colors relative ${editedGovernanca ? 'bg-brand-neon' : 'bg-slate-700'}`}>
                                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${editedGovernanca ? 'left-6' : 'left-1'}`}></div>
                              </div>
                          </div>
                          
                          <button onClick={handleSaveMember} disabled={isUpdating} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-brand-neon transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50">
                              {isUpdating ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                              Salvar Alterações
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ARTICLE APPROVAL PREVIEW MODAL */}
      {previewArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
                onClick={() => setPreviewArticle(null)}
              ></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-brand-neon/5">
                      <div className="flex items-center gap-3">
                          <ShieldCheck size={24} className="text-brand-neon" />
                          <div>
                              <h2 className="text-lg font-bold text-white">Moderação de Artigo</h2>
                              <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded ${previewArticle.aprovado ? 'bg-brand-green/20 text-brand-green' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                      {previewArticle.aprovado ? 'Publicado' : 'Pendente de Aprovação'}
                                  </span>
                                  <span className="text-xs text-slate-400">ID: {previewArticle.id}</span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setPreviewArticle(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Body - Scrollable Preview */}
                  <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-black">
                      <div className="max-w-3xl mx-auto">
                           {previewArticle.capa && (
                               <img src={previewArticle.capa} alt="Capa" className="w-full h-64 object-cover rounded-2xl mb-8" />
                           )}
                           <div className="flex flex-wrap gap-2 mb-4">
                               {previewArticle.tags?.map((tag, i) => (
                                   <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-slate-300">#{tag}</span>
                               ))}
                           </div>
                           <h1 className="text-3xl font-bold text-white mb-4">{previewArticle.titulo}</h1>
                           <p className="text-xl text-slate-300 mb-8 font-light">{previewArticle.subtitulo}</p>
                           <hr className="border-white/10 mb-8" />
                           <div 
                             className="prose prose-invert max-w-none text-slate-300"
                             dangerouslySetInnerHTML={{ __html: previewArticle.conteudo }}
                           />
                      </div>
                  </div>

                  {/* Footer - Actions */}
                  <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md flex justify-between items-center gap-4">
                      <button 
                        onClick={handleRejectArticle}
                        disabled={isUpdating}
                        className="px-6 py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-bold flex items-center gap-2"
                      >
                         {isUpdating ? <Loader2 className="animate-spin" /> : <XCircle size={20} />}
                         Excluir/Rejeitar
                      </button>
                      
                      <div className="flex gap-4">
                        <button 
                            onClick={() => setPreviewArticle(null)}
                            className="px-6 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                        >
                            Fechar
                        </button>
                        {!previewArticle.aprovado && (
                            <button 
                                onClick={handleApproveArticle}
                                disabled={isUpdating}
                                className="px-8 py-3 rounded-2xl bg-brand-neon text-black font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                {isUpdating ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                                Aprovar Publicação
                            </button>
                        )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ARTICLE CREATION MODAL */}
      {isArticleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
                onClick={() => setIsArticleModalOpen(false)}
              ></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-green/20 rounded-xl text-brand-neon">
                              <FileText size={24} />
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-white">Criar Novo Artigo</h2>
                              <p className="text-xs text-slate-400">Compartilhe conhecimento com o ecossistema</p>
                          </div>
                      </div>
                      <button onClick={() => setIsArticleModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Body - Scrollable */}
                  <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Main Form */}
                          <div className="lg:col-span-2 space-y-6">
                              <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">Título do Artigo</label>
                                  <input 
                                    type="text" 
                                    value={articleForm.titulo}
                                    onChange={(e) => setArticleForm({...articleForm, titulo: e.target.value})}
                                    placeholder="Ex: O Futuro da Inteligência Artificial no Vale"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:bg-black transition-all font-bold text-lg"
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">Subtítulo (Resumo)</label>
                                  <textarea 
                                    value={articleForm.subtitulo}
                                    onChange={(e) => setArticleForm({...articleForm, subtitulo: e.target.value})}
                                    placeholder="Uma breve descrição que aparecerá nos cards..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:bg-black transition-all resize-none"
                                  />
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">Conteúdo (Rich Text)</label>
                                  {/* Custom Rich Text Editor */}
                                  <RichTextEditor 
                                    value={articleForm.conteudo}
                                    onChange={(html) => setArticleForm({...articleForm, conteudo: html})}
                                  />
                              </div>
                          </div>

                          {/* Sidebar settings */}
                          <div className="space-y-6">
                              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                  <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2">
                                      <ImageIcon size={16} /> Imagem de Capa
                                  </label>
                                  <div className="space-y-4">
                                      {/* Upload Input */}
                                      <div className="relative">
                                          <input 
                                              type="file"
                                              accept="image/*"
                                              onChange={handleImageUpload}
                                              className="hidden"
                                              id="cover-upload"
                                              disabled={isUploadingImage}
                                          />
                                          <label 
                                              htmlFor="cover-upload"
                                              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed transition-all cursor-pointer ${
                                                  isUploadingImage 
                                                    ? 'bg-white/5 border-white/20 text-slate-500 cursor-not-allowed' 
                                                    : 'bg-black/40 border-white/20 hover:border-brand-neon text-slate-300 hover:text-white'
                                              }`}
                                          >
                                              {isUploadingImage ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                                              <span className="text-sm font-medium">{isUploadingImage ? 'Enviando...' : 'Fazer Upload'}</span>
                                          </label>
                                      </div>

                                      <div className="aspect-video bg-black/40 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center relative group">
                                          {articleForm.capa ? (
                                              <>
                                                <img src={articleForm.capa} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                <button 
                                                    onClick={() => setArticleForm({...articleForm, capa: ''})}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                              </>
                                          ) : (
                                              <div className="text-slate-600 flex flex-col items-center gap-2">
                                                  <ImageIcon size={32} />
                                                  <span className="text-xs">Preview</span>
                                              </div>
                                          )}
                                      </div>
                                      {articleForm.capa && <p className="text-[10px] text-slate-500 truncate">{articleForm.capa}</p>}
                                  </div>
                              </div>

                              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                  <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2">
                                      <Hash size={16} /> Tags
                                  </label>
                                  <div className="flex gap-2 mb-3">
                                      <input 
                                        type="text" 
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Add tag..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                                      />
                                      <button 
                                        onClick={() => handleAddTag({type: 'click'})}
                                        className="bg-white/10 text-white p-2 rounded-xl hover:bg-white/20 transition-colors"
                                      >
                                          <PlusCircle size={20} />
                                      </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {articleForm.tags.length === 0 && <span className="text-xs text-slate-600 italic">Nenhuma tag adicionada</span>}
                                      {articleForm.tags.map((tag, i) => (
                                          <span key={i} className="inline-flex items-center gap-1 bg-brand-neon/20 text-brand-neon text-xs px-2 py-1 rounded-lg border border-brand-neon/30">
                                              {tag}
                                              <button onClick={() => handleRemoveTag(tag)} className="hover:text-white"><X size={12} /></button>
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md flex justify-end gap-4">
                      <button 
                        onClick={() => setIsArticleModalOpen(false)}
                        className="px-6 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={handlePublishArticle}
                        disabled={isSubmittingArticle || isUploadingImage}
                        className="px-8 py-3 rounded-2xl bg-brand-neon text-black font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                          {isSubmittingArticle ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                          Publicar Artigo
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};