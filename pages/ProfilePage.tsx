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

  // Lógica de restrição
  const isRestricted = !user.governanca && (!user.gts || user.gts.length === 0);

  useEffect(() => {
    fetchOptions();
    if (!isRestricted) {
        fetchEmpresa();
    }
  }, [isRestricted]);

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
          
          if (error && error.code !== 'PGRST116') throw error; 

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
        showNotification('success', 'Foto carregada!');

    } catch (error: any) {
        showNotification('error', `Erro upload: ${error.message || 'Falha na conexão'}`);
    } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveUser = async () => {
    setLoading(true);
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
      
      const currentPayload = {
          nome: formData.nome,
          cargo: formData.cargo || null,
          avatar: formData.avatar || user.avatar
      };

      const { error } = await supabase.from('users').update(currentPayload).eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, ...formData };
      onUpdateUser(updatedUser);
      showNotification('success', 'Perfil atualizado com sucesso!');
    } catch (error: any) {
      showNotification('error', error.message || 'Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

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
      }
  };

  const handleSaveEmpresa = async () => {
      if (!empresaForm.nome || !empresaForm.cnpj) {
          showNotification('error', 'Nome e CNPJ são obrigatórios.');
          return;
      }
      setLoadingEmpresa(true);
      try {
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
              result = await supabase.from('empresas').update(payload).eq('id', empresa.id).select();
          } else {
              result = await supabase.from('empresas').insert([payload]).select();
          }

          if (result.error) throw result.error;
          
          if (result.data && result.data[0]) {
              setEmpresa(result.data[0] as Empresa);
              showNotification('success', 'Página da empresa atualizada!');
          }

      } catch (e: any) {
          showNotification('error', e.message || 'Erro ao salvar empresa.');
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

        <div className="flex justify-center mb-8">
            <div className="bg-white/5 p-1 rounded-2xl flex border border-white/10">
                <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-brand-neon text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    <UserIcon size={18} /> Dados Pessoais
                </button>
                {!isRestricted && (
                    <button onClick={() => setActiveTab('company')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'company' ? 'bg-brand-neon text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Building2 size={18} /> Minha Empresa
                    </button>
                )}
            </div>
        </div>

        {activeTab === 'profile' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
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
                            <div onClick={handleAvatarClick} className="absolute bottom-0 right-0 translate-x-1 translate-y-1 p-2 bg-brand-neon text-black rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg z-30 border-4 border-black">
                                <Camera size={18} />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                        <h2 className="text-xl font-bold text-white relative z-10">{user.nome}</h2>
                        <p className="text-sm text-slate-500 mb-4 relative z-10">{user.email}</p>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                            <span className="text-xs font-medium text-brand-green">Ativo</span>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                            <UserIcon className="text-brand-neon" size={24} />
                            <h2 className="text-2xl font-bold text-white">Dados Pessoais</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
                                <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-neon transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                                <input type="email" value={formData.email} disabled className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleSaveUser} disabled={loading} className="bg-brand-neon text-black px-10 py-4 rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 flex items-center gap-3 text-lg">
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            !isRestricted && (
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
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleSaveEmpresa} disabled={loadingEmpresa} className="bg-brand-neon text-black px-10 py-4 rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 flex items-center gap-3 text-lg">
                            {loadingEmpresa ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            Salvar Página
                        </button>
                    </div>
                </div>
            </div>
            )
        )}
      </div>
    </div>
  );
};