import React, { useState, useEffect } from 'react';
import { Logo } from '../components/ui/Logo';
import { supabase } from '../services/supabase';
import { ArrowLeft, Loader2, UserPlus, LogIn, Shield, Users } from 'lucide-react';
import { GT, User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [isGovernanca, setIsGovernanca] = useState(false);
  const [selectedGts, setSelectedGts] = useState<number[]>([]);
  
  const [availableGts, setAvailableGts] = useState<GT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGts = async () => {
      const { data } = await supabase.from('gts').select('*').order('gt');
      if (data) setAvailableGts(data);
    };
    fetchGts();
  }, []);

  const handleGtToggle = (id: number) => {
      if (selectedGts.includes(id)) {
          setSelectedGts(selectedGts.filter(g => g !== id));
      } else {
          setSelectedGts([...selectedGts, id]);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!name) throw new Error("Por favor, informe seu nome.");

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
           const { error: profileError } = await supabase.from('users').insert([{
              uuid: authData.user.id,
              email: email,
              nome: name,
              cargo: 3, 
              gts: selectedGts, 
              governanca: isGovernanca,
              artigos: 0,
              last_login: new Date().toISOString()
           }]);

           if (profileError) {
               console.error("Erro ao criar perfil", profileError);
               throw new Error("Conta criada, mas houve um erro ao salvar o perfil. Entre em contato.");
           }

           handleLoginSuccessLogic(authData.user.id, email);
        }

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.user) {
            await handleLoginSuccessLogic(data.user.id, data.user.email);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar operação.');
      
      if (!isSignUp && email === 'demo@inovap.com') {
          onLoginSuccess({
              id: 999,
              nome: "Usuário Demo",
              email: "demo@inovap.com",
              artigos: 5,
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
              uuid: "demo-uuid",
              governanca: true
          });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccessLogic = async (uuid: string, userEmail?: string) => {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', uuid)
        .single();
      
      let combinedUser: User = {
          ...profile,
          email: userEmail || '',
          uuid: uuid,
          nome: profile?.nome || userEmail?.split('@')[0] || 'Usuário',
          artigos: profile?.artigos || 0
      };

      // ADMIN OVERRIDE
      if (userEmail === 'peboorba@gmail.com') {
          combinedUser.governanca = true;
          combinedUser.gts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          combinedUser.cargo = 1; 
      }

      onLoginSuccess(combinedUser);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[1000px] h-[1000px] bg-brand-green/20 rounded-full blur-[150px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[150px]"></div>

      <div className="absolute top-8 left-8 z-20">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors font-medium">
            <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
            <Logo dark className="scale-125" />
        </div>
        <h2 className="text-center text-3xl font-bold text-white mb-2">
          {isSignUp ? 'Crie sua conta' : 'Acesse o Portal'}
        </h2>
        <p className="text-center text-sm text-slate-400">
          {isSignUp ? 'Junte-se ao ecossistema de inovação.' : 'Entre no futuro da inovação.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-black/50 rounded-3xl border border-white/10 sm:px-10 transition-all duration-500">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {isSignUp && (
                <div className="animate-fade-in-up">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300">Nome Completo</label>
                    <div className="mt-2">
                        <input id="name" type="text" required={isSignUp} value={name} onChange={(e) => setName(e.target.value)} className="appearance-none block w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-transparent transition-all" />
                    </div>
                </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
              <div className="mt-2">
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-transparent transition-all" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">Senha</label>
              <div className="mt-2">
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-transparent transition-all" />
              </div>
            </div>

            {isSignUp && (
                <div className="space-y-5 pt-2 animate-fade-in-up">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="text-sm font-medium text-brand-neon block mb-3 flex items-center gap-2">
                            <Users size={16} /> Grupos de Trabalho (GTs)
                            <span className="text-xs text-slate-500 font-normal ml-auto">(Opcional)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                            {availableGts.map(gt => (
                                <button
                                    type="button"
                                    key={gt.id}
                                    onClick={() => handleGtToggle(gt.id)}
                                    className={`text-xs p-2 rounded-lg border transition-all ${selectedGts.includes(gt.id) ? 'bg-brand-neon text-black border-brand-neon font-bold' : 'bg-black/40 text-slate-400 border-white/5 hover:bg-white/10'}`}
                                >
                                    {gt.gt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsGovernanca(!isGovernanca)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isGovernanca ? 'bg-brand-neon border-brand-neon' : 'border-slate-500'}`}>
                            {isGovernanca && <Shield size={12} className="text-black" />}
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-medium text-white block">Sou da Governança</span>
                            <span className="text-xs text-slate-500">Marque se você faz parte do comitê gestor.</span>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center animate-pulse">
                    {error}
                </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-green/20 text-sm font-bold text-black bg-brand-neon hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-neon disabled:opacity-50 transition-all transform hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                        {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                        {isSignUp ? 'Criar Conta' : 'Entrar'}
                    </>
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
                 <button 
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                    className="text-sm text-slate-400 hover:text-brand-neon transition-colors"
                 >
                     {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Crie agora'}
                 </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};