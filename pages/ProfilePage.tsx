
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../services/supabase';
import { User, GT, Cargo, Empresa } from '../types';
import { Save, ArrowLeft, User as UserIcon, Briefcase, Layers, Shield, Loader2, CheckCircle, AlertCircle, Camera, Building2, Globe, MapPin, Hash, Link as LinkIcon, Eye, Image as ImageIcon, LayoutTemplate, Phone, Instagram, Linkedin, MessageCircle, Type, Palette, AlignLeft, Quote, Plus, Trash2, MessageSquareQuote, TrendingUp, Users } from 'lucide-react';

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
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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
        slogan: '', descricao: '', site: '', instagram: '', linkedin: '', whatsapp: '', cor_primaria: '#00ff9d',
        logo: '', banner: '', feedbacks: [], numero_projetos: 0, impacto_gerado: ''
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

    const handleAddFeedback = () => {
        const currentFeedbacks = empresaForm.feedbacks || [];
        if (currentFeedbacks.length >= 3) {
            showNotification('error', 'Limite de 3 feedbacks atingido.');
            return;
        }
        setEmpresaForm({
            ...empresaForm,
            feedbacks: [...currentFeedbacks, { author: '', role: '', text: '' }]
        });
    };

    const handleUpdateFeedback = (index: number, field: string, value: string) => {
        const currentFeedbacks = [...(empresaForm.feedbacks || [])];
        currentFeedbacks[index] = { ...currentFeedbacks[index], [field]: value };
        setEmpresaForm({ ...empresaForm, feedbacks: currentFeedbacks });
    };

    const handleRemoveFeedback = (index: number) => {
        const currentFeedbacks = (empresaForm.feedbacks || []).filter((_, i) => i !== index);
        setEmpresaForm({ ...empresaForm, feedbacks: currentFeedbacks });
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
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-brand-neon selection:text-black flex flex-col transition-colors duration-300">
            <div className="h-20 border-b border-slate-200 dark:border-white/10 flex items-center px-8 justify-between bg-white/50 dark:bg-black/50 backdrop-blur-xl fixed top-0 w-full z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold">Configurações</h1>
                </div>
                <button onClick={onLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    Sair da conta
                </button>
            </div>

            <div className="flex-1 pt-32 pb-20 px-4 sm:px-6 max-w-6xl mx-auto w-full relative z-10">

                {notification && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up w-full max-w-md px-4 pointer-events-none">
                        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto ${notification.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green dark:text-brand-neon' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-200'}`}>
                            {notification.type === 'success' ? <CheckCircle size={20} className="flex-shrink-0" /> : <AlertCircle size={20} className="flex-shrink-0" />}
                            <span className="font-medium text-sm">{notification.message}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-center mb-8">
                    <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl flex border border-slate-200 dark:border-white/10">
                        <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            <UserIcon size={18} /> Perfil do Membro
                        </button>
                        {!isRestricted && (
                            <button onClick={() => setActiveTab('company')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'company' ? 'bg-brand-neon text-black shadow-lg shadow-brand-neon/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                                <Building2 size={18} /> Minha Empresa
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'profile' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-brand-green/5 to-transparent"></div>
                                <div className="relative mb-4">
                                    <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-black border-4 border-white/10 dark:border-white/5 flex items-center justify-center relative group-hover:border-brand-neon/30 transition-colors overflow-hidden">
                                        {formData.avatar ? (
                                            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-5xl font-bold text-slate-700 group-hover:text-brand-neon transition-colors">
                                                {user.nome.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        {isUploadingAvatar && (
                                            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 flex items-center justify-center z-20">
                                                <Loader2 className="animate-spin text-brand-neon" />
                                            </div>
                                        )}
                                    </div>
                                    <div onClick={handleAvatarClick} className="absolute bottom-0 right-0 translate-x-1 translate-y-1 p-2 bg-brand-neon text-black rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg z-30 border-4 border-white dark:border-black">
                                        <Camera size={18} />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white relative z-10">{user.nome}</h2>
                                <p className="text-sm text-slate-500 mb-4 relative z-10">{user.email}</p>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5">
                                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                                    <span className="text-xs font-medium text-brand-green">Ativo no Ecossistema</span>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-8">
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                                    <UserIcon className="text-brand-neon" size={24} />
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dados Pessoais</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2">Nome Completo</label>
                                        <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-neon transition-all" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2">E-mail (Não editável)</label>
                                        <input type="email" value={formData.email} disabled className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-slate-400 dark:text-slate-500 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleSaveUser} disabled={loading} className="bg-brand-neon text-black px-10 py-4 rounded-2xl font-bold hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 flex items-center gap-3 text-lg">
                                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                    Salvar Perfil
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    !isRestricted && (
                        <div className="animate-fade-in-up space-y-10">
                            {/* Cabeçalho da Empresa */}
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-brand-neon/20 rounded-2xl text-brand-neon">
                                            <Building2 size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Minha Empresa</h2>
                                            <p className="text-slate-500 dark:text-slate-400">Configure sua identidade e landing page no INOVAP.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        {empresa?.id && (
                                            <button onClick={() => onViewCompany(empresa)} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center gap-2">
                                                <Eye size={18} /> Visualizar Página
                                            </button>
                                        )}
                                        <button onClick={handleSaveEmpresa} disabled={loadingEmpresa} className="bg-brand-neon text-black px-8 py-3 rounded-xl font-bold hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[0_10px_20px_rgba(0,255,157,0.2)] flex items-center gap-2 disabled:opacity-50">
                                            {loadingEmpresa ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            Salvar Tudo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Coluna de Identidade Visual */}
                                <div className="space-y-8">
                                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white"><Palette className="text-brand-neon" size={20} /> Identidade Visual</h3>

                                        <div className="space-y-6">
                                            {/* Logo */}
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Logotipo da Empresa</label>
                                                <div className="relative group">
                                                    <div className="w-32 h-32 bg-slate-200 dark:bg-black border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-neon/50">
                                                        {empresaForm.logo ? (
                                                            <img src={empresaForm.logo} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <Building2 size={32} className="text-slate-400 dark:text-slate-800" />
                                                        )}
                                                        {isUploadingCompanyImg && <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-brand-neon" /></div>}
                                                    </div>
                                                    <button onClick={() => logoInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-2 bg-brand-neon text-black rounded-full shadow-lg hover:scale-110 transition-transform">
                                                        <Camera size={16} />
                                                    </button>
                                                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleCompanyImageUpload(e, 'logo')} />
                                                </div>
                                            </div>

                                            {/* Banner */}
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Banner de Capa</label>
                                                <div className="relative group w-full h-32 bg-slate-200 dark:bg-black border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-neon/50">
                                                    {empresaForm.banner ? (
                                                        <img src={empresaForm.banner} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon size={32} className="text-slate-400 dark:text-slate-800" />
                                                    )}
                                                    <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-slate-900/40 dark:bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Camera size={24} className="text-white" />
                                                    </button>
                                                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleCompanyImageUpload(e, 'banner')} />
                                                </div>
                                            </div>

                                            {/* Cor Primária */}
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Cor Primária da Marca</label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="color"
                                                        value={empresaForm.cor_primaria}
                                                        onChange={(e) => setEmpresaForm({ ...empresaForm, cor_primaria: e.target.value })}
                                                        className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={empresaForm.cor_primaria}
                                                        onChange={(e) => setEmpresaForm({ ...empresaForm, cor_primaria: e.target.value })}
                                                        className="flex-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 font-mono text-sm text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna de Conteúdo */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8">
                                        <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-white"><AlignLeft className="text-brand-neon" size={20} /> Conteúdo & Storytelling</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><Type size={16} /> Nome da Empresa</label>
                                                <input
                                                    type="text"
                                                    value={empresaForm.nome}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, nome: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all"
                                                    placeholder="Ex: INOVAP Tech"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2">Slogan Curto (Landing Page)</label>
                                                <input
                                                    type="text"
                                                    value={empresaForm.slogan}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, slogan: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all"
                                                    placeholder="Ex: O futuro da tecnologia no Alto Paraopeba"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2">Descrição Completa / Sobre</label>
                                                <textarea
                                                    value={empresaForm.descricao}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, descricao: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all h-40 resize-none"
                                                    placeholder="Conte a história da sua empresa, valores e o que vocês oferecem ao ecossistema..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><Hash size={16} /> CNPJ</label>
                                                <input
                                                    type="text"
                                                    value={empresaForm.cnpj}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, cnpj: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all"
                                                    placeholder="00.000.000/0000-00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><TrendingUp size={16} /> Número de Projetos</label>
                                                <input
                                                    type="number"
                                                    value={empresaForm.numero_projetos}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, numero_projetos: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all"
                                                    placeholder="Ex: 120"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><Users size={16} /> Impacto Gerado</label>
                                                <input
                                                    type="text"
                                                    value={empresaForm.impacto_gerado}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, impacto_gerado: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all"
                                                    placeholder="Ex: 2k+ registros"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><MapPin size={16} /> Cidade</label>
                                                    <input type="text" value={empresaForm.cidade} onChange={(e) => setEmpresaForm({ ...empresaForm, cidade: e.target.value })} className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2">UF</label>
                                                    <input type="text" maxLength={2} value={empresaForm.uf} onChange={(e) => setEmpresaForm({ ...empresaForm, uf: e.target.value.toUpperCase() })} className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all text-center" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Canais de Conexão */}
                                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8">
                                        <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-white"><Globe className="text-brand-neon" size={20} /> Canais de Conexão</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><LinkIcon size={16} /> Site Oficial</label>
                                                <input
                                                    type="url"
                                                    value={empresaForm.site}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, site: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon transition-all"
                                                    placeholder="https://suaempresa.com.br"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><Phone size={16} /> WhatsApp Comercial</label>
                                                <input
                                                    type="text"
                                                    value={empresaForm.whatsapp}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, whatsapp: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon transition-all"
                                                    placeholder="(31) 90000-0000"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><Instagram size={16} /> Instagram</label>
                                                <input
                                                    type="text"
                                                    value={empresaForm.instagram}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, instagram: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon transition-all"
                                                    placeholder="@suaempresa"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><Linkedin size={16} /> LinkedIn</label>
                                                <input
                                                    type="text"
                                                    value={empresaForm.linkedin}
                                                    onChange={(e) => setEmpresaForm({ ...empresaForm, linkedin: e.target.value })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:border-brand-neon transition-all"
                                                    placeholder="URL do LinkedIn"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção de Feedbacks */}
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 backdrop-blur-md">
                                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                                        <MessageSquareQuote className="text-brand-neon" size={24} /> Depoimentos & Feedbacks
                                    </h3>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Até 3 depoimentos</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    {(empresaForm.feedbacks || []).map((fb, idx) => (
                                        <div key={idx} className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6 relative group/fb transition-all hover:border-brand-neon/30">
                                            <button
                                                onClick={() => handleRemoveFeedback(idx)}
                                                className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover/fb:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Autor</label>
                                                    <input
                                                        type="text"
                                                        value={fb.author}
                                                        onChange={(e) => handleUpdateFeedback(idx, 'author', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all"
                                                        placeholder="Ex: Carlos Silva"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargo / Empresa</label>
                                                    <input
                                                        type="text"
                                                        value={fb.role}
                                                        onChange={(e) => handleUpdateFeedback(idx, 'role', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all"
                                                        placeholder="Ex: CEO, TechStart"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Depoimento</label>
                                                    <textarea
                                                        value={fb.text}
                                                        onChange={(e) => handleUpdateFeedback(idx, 'text', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-brand-neon outline-none transition-all h-24 resize-none italic"
                                                        placeholder="O que esta pessoa diz sobre sua empresa..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(empresaForm.feedbacks || []).length < 3 && (
                                        <button
                                            onClick={handleAddFeedback}
                                            className="h-full min-h-[200px] bg-slate-50/50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-brand-neon hover:border-brand-neon/50 hover:bg-brand-neon/5 transition-all group"
                                        >
                                            <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                                <Plus size={32} />
                                            </div>
                                            <span className="font-black uppercase text-[10px] tracking-widest">Adicionar Depoimento</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
