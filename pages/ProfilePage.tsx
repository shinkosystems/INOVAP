import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { User, GT, Cargo, Empresa } from '../types';
import { Save, ArrowLeft, User as UserIcon, Briefcase, Layers, Shield, Loader2, CheckCircle, AlertCircle, Camera, Building2, Globe, MapPin, Hash, Link as LinkIcon, Eye, Image as ImageIcon, LayoutTemplate, Phone } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onViewCompany: (empresa: Empresa) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onUpdateUser, onLogout, onViewCompany }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'company'>('profile');
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCompanyImg, setIsUploadingCompanyImg] = useState(false);

  // Form State User
  const [formData, setFormData] = useState({
    nome: user.nome || '',
    email: user.email || '',
    cargo: user.cargo || 0,
    gts: user.gts || [] as number[],
    governanca: user.governanca || false,
    avatar: user.avatar || ''
  });

  // Form State Empresa
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [empresaForm, setEmpresaForm] = useState<Partial<Empresa>>({
      nome: '', cnpj: '', cidade: '', uf: '', 
      slogan: '', descricao: '', site: '', instagram: '', linkedin: '', whatsapp: '', cor_primaria: '#10b981',
      logo: '', banner: ''
  });
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);

  // Options State
  const [gtsOptions, setGtsOptions] = useState<GT[]>([]);
  const [cargosOptions, setCargosOptions] = useState<Cargo[]>([]);

  useEffect(() => {
    fetchOptions();
    fetchEmpresa();
  }, []);

  const fetchOptions = async () => {
    try {
      const [gtsRes, cargosRes] = await Promise.all([
        supabase.from('gts').select('*').order('gt'),
        supabase.from('cargos').select('*').order('cargo')
      ]);

      if (gtsRes.error) throw gtsRes.error;
      if (cargosRes.error) throw cargosRes.error;

      setGtsOptions(gtsRes.data || []);
      setCargosOptions(cargosRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
    } finally {
      setFetchingOptions(false);
    }
  };

  const fetchEmpresa = async () => {
      setLoadingEmpresa(true);
      try {
          const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('responsavel', user.uuid)
            .single();
          
          if (error && error.code !== 'PGRST116') throw error; // PGRST116 é "não encontrado", o que é ok

          if (data) {
              setEmpresa(data);
              setEmpresaForm(data);
          }
      } catch (e) {
          console.error("Erro ao buscar empresa", e);
      } finally {
          setLoadingEmpresa(false);
      }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // --- Handlers User ---

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'A imagem deve ter no máximo 5MB.');
        return;
    }

    setIsUploadingAvatar(true);

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `imagensBlog/${fileName}`; 

        const { error: uploadError } = await supabase.storage
            .from('imagensBlog')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('imagensBlog').getPublicUrl(filePath);
        if (!data.publicUrl) throw new Error('Erro ao obter URL pública.');

        setFormData(prev => ({ ...prev, avatar: data.publicUrl }));
        showNotification('success', 'Foto carregada! Clique em Salvar para persistir.');

    } catch (error: any) {
        console.error('Erro upload avatar:', error);
        showNotification('error', `Erro upload: ${error.message || 'Falha na conexão'}`);
    } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveUser = async () => {
    setLoading(true);
    let currentPayload: any = {};
    
    try {
      if (user.id === 999) {
          setTimeout(() => {
              const updatedUser = { ...user, ...formData };
              onUpdateUser(updatedUser);
              showNotification('success', 'Perfil atualizado (Modo Demo)!');
              setLoading(false);
          }, 1000);
          return;
      }
      
      currentPayload = {
          nome: formData.nome,
          cargo: formData.cargo || null,
      };

      if (formData.avatar) {
          currentPayload.avatar = formData.avatar;
      }

      const { error } = await supabase.from('users').update(currentPayload).eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, ...formData };
      onUpdateUser(updatedUser);
      showNotification('success', 'Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      
      if (error?.code === '42703') {
          console.warn('Coluna ausente, tentando salvar sem avatar.');
          try {
             const safePayload = { nome: formData.nome, cargo: formData.cargo || null };
             const { error: retryError } = await supabase.from('users').update(safePayload).eq('id', user.id);
             if (!retryError) {
                 const updatedUser = { ...user, ...formData };
                 onUpdateUser(updatedUser); 
                 showNotification('success', 'Dados salvos! (Nota: Foto não salva pois banco não suporta)');
                 setLoading(false);
                 return;
             }
          } catch (retryErr) {}
      }

      let errorMessage = 'Erro ao salvar alterações.';
      if (error?.message) errorMessage = `Erro: ${error.message}`;
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers Empresa ---

  const handleCompanyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
          showNotification('error', 'A imagem deve ter no máximo 5MB.');
          return;
      }
      setIsUploadingCompanyImg(true);

      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `empresa_${field}_${user.id}_${Date.now()}.${fileExt}`;
          const filePath = `imagensBlog/${fileName}`;

          const { error: uploadError } = await supabase.storage.from('imagensBlog').upload(filePath, file);
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('imagensBlog').getPublicUrl(filePath);
          
          setEmpresaForm(prev => ({ ...prev, [field]: data.publicUrl }));
          showNotification('success', `${field === 'logo' ? 'Logo' : 'Banner'} carregado!`);
      } catch (e: any) {
          showNotification('error', 'Erro no upload da imagem.');
      } finally {
          setIsUploadingCompanyImg(false);
          if (field === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
          if (field === 'banner' && bannerInputRef.current) bannerInputRef.current.value = '';
      }
  };

  const handleSaveEmpresa = async () => {
      if (!empresaForm.nome || !empresaForm.cnpj) {
          showNotification('error', 'Nome e CNPJ são obrigatórios.');
          return;
      }
      setLoadingEmpresa(true);
      try {
          // Demo
          if (user.id === 999) {
             const newEmpresa = { ...empresaForm, id: 123, responsavel: user.uuid } as Empresa;
             setEmpresa(newEmpresa);
             showNotification('success', 'Empresa salva (Demo)!');
             setLoadingEmpresa(false);
             return;
          }

          const payload = {
              ...empresaForm,
              responsavel: user.uuid
          };

          let result;
          if (empresa?.id) {
              // Update
              result = await supabase.from('empresas').update(payload).eq('id', empresa.id).select();
          } else {
              // Insert
              result = await supabase.from('empresas').insert([payload]).select();
          }

          if (result.error) throw result.error;
          
          if (result.data && result.data[0]) {
              setEmpresa(result.data[0] as Empresa);
              showNotification('success', 'Página da empresa atualizada com sucesso!');
          }

      } catch (e: any) {
          console.error("Erro salvar empresa", e);
          let msg = e.message || 'Erro ao salvar empresa.';
          if (e.code === '42703') msg = "Erro: Colunas novas (slogan, logo, whatsapp, etc) ainda não criadas no banco.";
          showNotification('error', msg);
      } finally {
          setLoadingEmpresa(false);
      }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-neon selection:text-black flex flex-col">
      <div className="h-20 border-b border-white/10 flex items-center px-8 justify-between bg-black/50 backdrop-blur-xl fixed top-0 w-full z-40">
        <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
                 <ArrowLeft size={20} />
             </button>
             <h1 className="text-xl font-bold">Meu Perfil</h1>
        </div>
        <button onClick={onLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Sair da conta
        </button>
      </div>

      <div className="flex-1 pt-32 pb-20 px-4 sm:px-6 max-w-6xl mx-auto w-full relative z-10">
        
        {notification && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up w-full max-w-md px-4 pointer-events-none">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto ${notification.type === 'success' ? 'bg-brand-green/20 border-brand-green text-brand-neon' : 'bg-red-500/20 border-red-500 text-red-200'}`}>
              {notification.type === 'success' ? <CheckCircle size={20} className="flex-shrink-0" /> : <AlertCircle size={20} className="flex-shrink-0" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
            <div className="bg-white/5 p-1 rounded-2xl flex border border-white/10">
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-brand-neon text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <UserIcon size={18} /> Dados Pessoais
                </button>
                <button 
                    onClick={() => setActiveTab('company')}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'company' ? 'bg-brand-neon text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Building2 size={18} /> Minha Empresa
                </button>
            </div>
        </div>

        {activeTab === 'profile' ? (
            // --- TAB PERFIL PESSOAL ---
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
                
                {/* Left Column: Avatar & Basic Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-brand-green/5 to-transparent"></div>
                        
                        <div className="relative mb-4">
                            <div className="w-32 h-32 rounded-full bg-black border-4 border-white/5 flex items-center justify-center relative group-hover:border-brand-neon/30 transition-colors overflow-hidden">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-5xl font-bold text-slate-700 group-hover:text-brand-neon transition-colors">
                                        {user.nome.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                        <Loader2 className="animate-spin text-brand-neon" />
                                    </div>
                                )}
                            </div>

                            <div 
                                onClick={handleAvatarClick}
                                className="absolute bottom-0 right-0 translate-x-1 translate-y-1 p-2 bg-brand-neon text-black rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg z-30 border-4 border-black"
                                title="Alterar foto"
                            >
                                <Camera size={18} />
                            </div>
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={isUploadingAvatar}
                        />
                        
                        <h2 className="text-xl font-bold text-white relative z-10">{user.nome}</h2>
                        <p className="text-sm text-slate-500 mb-4 relative z-10">{user.email}</p>
                        
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                            <span className="text-xs font-medium text-brand-green">Ativo</span>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Estatísticas</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Artigos</span>
                                <span className="text-white font-mono">{user.artigos}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Pontos</span>
                                <span className="text-brand-neon font-mono font-bold">{(user.pontos || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Desde</span>
                                <span className="text-white text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                            <UserIcon className="text-brand-neon" size={24} />
                            <h2 className="text-2xl font-bold text-white">Dados Pessoais</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
                                <input 
                                    type="text" 
                                    value={formData.nome}
                                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">E-mail (Não editável)</label>
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    disabled
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Briefcase size={16} /> Cargo / Função
                                </label>
                                <select
                                    value={formData.cargo}
                                    disabled
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-slate-400 focus:outline-none cursor-not-allowed appearance-none opacity-70"
                                >
                                    <option value={0}>Selecione um cargo...</option>
                                    {cargosOptions.map(c => (
                                        <option key={c.id} value={c.id}>{c.cargo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md opacity-80">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                            <Layers className="text-brand-neon" size={24} />
                            <h2 className="text-2xl font-bold text-white">Envolvimento (Visualização)</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">Grupos de Trabalho</label>
                                {fetchingOptions ? (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="animate-spin" size={16}/> Carregando grupos...</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                        {gtsOptions.map((gt) => {
                                            const isSelected = formData.gts.includes(gt.id);
                                            return (
                                                <div 
                                                    key={gt.id}
                                                    className={`p-4 rounded-xl border text-sm font-medium text-left flex justify-between items-center cursor-default ${
                                                        isSelected 
                                                        ? 'bg-brand-neon/5 border-brand-neon/30 text-brand-neon' 
                                                        : 'bg-black/20 border-white/5 text-slate-600 opacity-50'
                                                    }`}
                                                >
                                                    <span className="truncate">{gt.gt}</span>
                                                    {isSelected && <CheckCircle size={16} />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between bg-black/20 border border-white/5 p-5 rounded-2xl select-none mt-6 cursor-default opacity-80">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-colors ${formData.governanca ? 'bg-brand-neon/10 text-brand-neon' : 'bg-slate-800 text-slate-600'}`}>
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <div className={`font-bold text-lg transition-colors ${formData.governanca ? 'text-white' : 'text-slate-500'}`}>Membro da Governança</div>
                                        <div className="text-xs text-slate-600">Nível de acesso do sistema</div>
                                    </div>
                                </div>
                                <div className={`w-14 h-8 rounded-full transition-colors relative ${formData.governanca ? 'bg-brand-neon/50' : 'bg-slate-800'}`}>
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white/50 shadow-sm transition-all duration-300 ${formData.governanca ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={handleSaveUser}
                            disabled={loading}
                            className="bg-brand-neon text-black px-10 py-4 rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 flex items-center gap-3 text-lg"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            // --- TAB EMPRESA (LANDING PAGE BUILDER) ---
            <div className="animate-fade-in-up">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md mb-8">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-brand-neon/20 rounded-xl text-brand-neon">
                                <LayoutTemplate size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Página da Empresa</h2>
                                <p className="text-sm text-slate-400">Configure sua Landing Page pública.</p>
                            </div>
                        </div>
                        {empresa?.id && (
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => onViewCompany(empresa)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors text-sm font-medium"
                                >
                                    <Eye size={16} /> Visualizar
                                </button>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/?page=empresa&id=${empresa.id}`);
                                        showNotification('success', 'Link copiado!');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-green/20 hover:bg-brand-green/30 text-brand-green rounded-xl transition-colors text-sm font-medium"
                                >
                                    <LinkIcon size={16} /> Copiar Link
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Coluna 1: Identidade Visual */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><ImageIcon size={18} /> Identidade Visual</h3>
                            
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Logotipo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                                        {empresaForm.logo ? (
                                            <img src={empresaForm.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <Building2 className="text-slate-700" size={32} />
                                        )}
                                    </div>
                                    <div>
                                        <button 
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={isUploadingCompanyImg}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                                        >
                                            {isUploadingCompanyImg ? 'Enviando...' : 'Alterar Logo'}
                                        </button>
                                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleCompanyImageUpload(e, 'logo')} />
                                        <p className="text-xs text-slate-500 mt-2">Recomendado: 200x200px (PNG Transparente)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Banner Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Banner de Capa</label>
                                <div className="w-full h-32 rounded-xl bg-black border border-white/10 overflow-hidden relative group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                                    {empresaForm.banner ? (
                                        <img src={empresaForm.banner} alt="Banner" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <span className="text-sm">Clique para adicionar banner</span>
                                        </div>
                                    )}
                                    {isUploadingCompanyImg && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-brand-neon" /></div>
                                    )}
                                </div>
                                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleCompanyImageUpload(e, 'banner')} />
                            </div>

                            {/* Cor Primária */}
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Cor do Tema</label>
                                <div className="flex gap-3">
                                    {['#10b981', '#00ff9d', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEmpresaForm({...empresaForm, cor_primaria: color})}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${empresaForm.cor_primaria === color ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Coluna 2: Informações */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Building2 size={18} /> Dados da Empresa</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Empresa *</label>
                                    <input 
                                        type="text" 
                                        value={empresaForm.nome}
                                        onChange={(e) => setEmpresaForm({...empresaForm, nome: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
                                        placeholder="Ex: Tech Solutions"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">CNPJ *</label>
                                    <input 
                                        type="text" 
                                        value={empresaForm.cnpj}
                                        onChange={(e) => setEmpresaForm({...empresaForm, cnpj: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
                                        placeholder="00.000.000/0001-00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Slogan (Frase Curta)</label>
                                <input 
                                    type="text" 
                                    value={empresaForm.slogan || ''}
                                    onChange={(e) => setEmpresaForm({...empresaForm, slogan: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all"
                                    placeholder="Ex: Inovando o futuro hoje."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Descrição (Sobre Nós)</label>
                                <textarea 
                                    value={empresaForm.descricao || ''}
                                    onChange={(e) => setEmpresaForm({...empresaForm, descricao: e.target.value})}
                                    rows={4}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all resize-none"
                                    placeholder="Conte um pouco sobre sua empresa..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Cidade</label>
                                    <input type="text" value={empresaForm.cidade} onChange={(e) => setEmpresaForm({...empresaForm, cidade: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">UF</label>
                                    <input type="text" value={empresaForm.uf} onChange={(e) => setEmpresaForm({...empresaForm, uf: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white" maxLength={2} />
                                </div>
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Links & Contato</label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-slate-500" />
                                        <input 
                                            type="text" 
                                            placeholder="WhatsApp (com DDD, apenas números)" 
                                            value={empresaForm.whatsapp || ''} 
                                            onChange={(e) => setEmpresaForm({...empresaForm, whatsapp: e.target.value})} 
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe size={16} className="text-slate-500" />
                                        <input type="text" placeholder="Site (https://...)" value={empresaForm.site || ''} onChange={(e) => setEmpresaForm({...empresaForm, site: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash size={16} className="text-slate-500" />
                                        <input type="text" placeholder="Instagram (@usuario)" value={empresaForm.instagram || ''} onChange={(e) => setEmpresaForm({...empresaForm, instagram: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={handleSaveEmpresa}
                            disabled={loadingEmpresa}
                            className="bg-brand-neon text-black px-10 py-4 rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 flex items-center gap-3 text-lg"
                        >
                            {loadingEmpresa ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            Salvar Página
                        </button>
                    </div>

                </div>
            </div>
        )}

      </div>
    </div>
  );
};