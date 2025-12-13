import React, { useState } from 'react';
import { Logo } from '../components/ui/Logo';
import { supabase } from '../services/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('uuid', data.user.id)
          .single();
        
        const combinedUser = {
            ...profile,
            email: data.user.email,
            uuid: data.user.id,
            nome: profile?.nome || data.user.email?.split('@')[0] || 'Usuário',
        };

        onLoginSuccess(combinedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
      if (email === 'demo@inovap.com') {
          onLoginSuccess({
              id: 999,
              nome: "Usuário Demo",
              email: "demo@inovap.com",
              artigos: 5,
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
              uuid: "demo-uuid"
          });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute top-[-20%] left-[-20%] w-[1000px] h-[1000px] bg-brand-green/20 rounded-full blur-[150px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[150px]"></div>

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
          Acesse o Portal
        </h2>
        <p className="text-center text-sm text-slate-400">
          Entre no futuro da inovação.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-black/50 rounded-3xl border border-white/10 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Senha
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
                    {error}
                </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-green/20 text-sm font-bold text-black bg-brand-neon hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-neon disabled:opacity-50 transition-all transform hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
              </button>
            </div>
            
            <div className="mt-6 text-center">
                 <p className="text-xs text-slate-600 font-mono">Demo: demo@inovap.com</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};